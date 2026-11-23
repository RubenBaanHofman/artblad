// Artblad: Garden plan on the map (2.11.0, plan A of the spec "Garden plan on the map", 23 Nov 2026).
// Part 19e; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* One drawing surface in real-world coordinates (decision 2). A project has several named plans (table plans, database
   update v11); each holds its shapes as GeoJSON geometries in WGS84 [lng, lat]:
     plan doc: {project, name, year, season, status: active|archived, lock: {by, at}, shapes: [...], summary, from, approx}
     shape:    {id, kind, g: {type, coordinates}, name, sid, cultivar, spread (m), text}
   Kinds in plan A: bed, zone (polygons), plant, note (points), measure (line). Planting lines, structures, paths, water and
   the illustrated view follow in plan B; aerial photos and terrain in plan C; print and exports in plan D.
   Lengths and areas are worked out in metres on a flat projection centred on the project (true to well under 1 % over the
   300 × 300 m a plan may cover). Laptop first: mouse and keyboard (decision 4). */
const MP_MAX=300;
const MPK={
  bed:{g:'Polygon',c:'#8a5a2b',f:.28,en:'Bed',sv:'Bädd',nl:'Bed',key:'B'},
  pline:{g:'LineString',c:'#5d8a1f',en:'Planting line',sv:'Planteringsrad',nl:'Plantrij',key:'L'},
  plant:{g:'Point',c:'#2f7d32',en:'Plant',sv:'Planta',nl:'Plant',key:'P'},
  zone:{g:'Polygon',c:'#3a76c4',f:.08,d:'7 5',en:'Zone',sv:'Zon',nl:'Zone',key:'Z'},
  structure:{g:'Polygon',c:'#6b6b6b',f:.45,en:'Structure',sv:'Byggnad',nl:'Bouwwerk',key:'T'},
  support:{g:'LineString',c:'#7b5a3c',en:'Support (trellis, wires)',sv:'Stöd (spaljé, vajrar)',nl:'Steun (latwerk, draden)',key:'U'},
  path:{g:'LineString',c:'#b3a57c',en:'Path',sv:'Gång',nl:'Pad',key:'A'},
  water:{g:'Polygon',c:'#3d8fd1',f:.45,en:'Water',sv:'Vatten',nl:'Water',key:'W'},
  note:{g:'Point',c:'#555555',en:'Note',sv:'Anteckning',nl:'Notitie',key:'N'},
  measure:{g:'LineString',c:'#c0392b',d:'5 4',en:'Measure',sv:'Mått',nl:'Maat',key:'M'}
};
const MP_KINDS=Object.keys(MPK);
const MP_NUM=['spread','inrow','rowsp','rows','gap','width','height'];
const MP={pid:'',id:'',shapes:[],base:'',tool:'select',draft:[],sel:'',undo:[],redo:[],bg:store.get('ab.mpbg')||'auto',fade:Number(store.get('ab.mpfade')||100),
  hide:{},view:store.get('ab.mpview')||'ill',phone:false,gps:null,typed:'',map:null,lay:null,tiles:null,grid:null,o:null,saveT:null,saving:false,drag:null,clip:null,form:'',lastSid:'',live:null,ring:null,fitFor:''};
const mpK=k=>trs(MPK[k].en,MPK[k].sv,MPK[k].nl);
const mpPlans=pid=>(state.plans||[]).filter(x=>x.project===pid).sort((a,b)=>(a.status==='archived')-(b.status==='archived')||String(a.name).localeCompare(String(b.name)));
const mpPlan=()=>(state.plans||[]).find(x=>x.id===MP.id)||null;
const mpCanEdit=()=>{const q=mpPlan();return !!q&&projCanEdit(q.project)&&q.status!=='archived'&&!q.lock};
// 2.12.0: drawing needs a mouse and keyboard; on a phone the plan is shown with field actions only (decision 11).
const mpDrawOK=()=>mpCanEdit()&&!MP.phone;
const mpCanExport=pid=>projCanEdit(pid);
/* ---------- metres ↔ map ---------- */
function mpOrigin(p){if(hasPt(p))return{lat:Number(p.lat),lng:Number(p.lng)};const s=(MP.shapes||[])[0];if(s){const c=mpPts(s)[0];return{lat:c[1],lng:c[0]}}return{lat:62,lng:16}}
const mpKx=()=>111320*Math.cos(MP.o.lat*Math.PI/180),MP_KY=110574;
const mpXY=c=>({x:(c[0]-MP.o.lng)*mpKx(),y:(c[1]-MP.o.lat)*MP_KY});
const mpLL=(x,y)=>[Math.round((MP.o.lng+x/mpKx())*1e8)/1e8,Math.round((MP.o.lat+y/MP_KY)*1e8)/1e8];
const mpLat=c=>[c[1],c[0]];
function mpPts(s){const g=s.g||{};if(g.type==='Point')return [g.coordinates];if(g.type==='LineString')return g.coordinates.slice();if(g.type==='Polygon'){const r=g.coordinates[0].slice();if(r.length>1&&r[0][0]===r[r.length-1][0]&&r[0][1]===r[r.length-1][1])r.pop();return r}return []}
function mpSetPts(s,p){const t=MPK[s.kind].g;s.g=t==='Point'?{type:'Point',coordinates:p[0]}:t==='LineString'?{type:'LineString',coordinates:p}:{type:'Polygon',coordinates:[p.concat([p[0]])]}}
const mpDist=(a,b)=>{const p=mpXY(a),q=mpXY(b);return Math.hypot(q.x-p.x,q.y-p.y)};
function mpArea(pts){let a=0;const v=pts.map(mpXY);for(let i=0;i<v.length;i++){const j=(i+1)%v.length;a+=v[i].x*v[j].y-v[j].x*v[i].y}return Math.abs(a)/2}
const mpLen=(pts,closed)=>{let l=0;for(let i=0;i+1<pts.length;i++)l+=mpDist(pts[i],pts[i+1]);if(closed&&pts.length>2)l+=mpDist(pts[pts.length-1],pts[0]);return l};
const mpM=v=>numTxt(v<10?Math.round(v*100)/100:Math.round(v*10)/10)+' m';
const mpM2=v=>numTxt(v<100?Math.round(v*10)/10:Math.round(v))+' m²';
function mpBox(shapes){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;shapes.forEach(s=>mpPts(s).forEach(c=>{const p=mpXY(c);x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y)}));return x0===Infinity?null:{w:x1-x0,h:y1-y0}}
const mpTooBig=sh=>{const b=mpBox(sh);return b&&(b.w>MP_MAX+.01||b.h>MP_MAX+.01)};
const mpSpread=s=>{const v=Number(s.spread);if(isFinite(v)&&v>0)return v;const x=bySid.get(s.sid),m=x&&((x.m||{}).spread);return isFinite(Number(m))&&Number(m)>0?Number(m)/100:null};
const mpAbbr=s=>{const x=bySid.get(s.sid);if(!x)return s.name||'?';if(MP.view==='ill')return dispName(x)+(s.cultivar?' ‘'+s.cultivar+'’':'');const w=String(x.latin||'').split(/\s+/);return (w[0]||'').slice(0,3)+(w[1]?' '+w[1].slice(0,3):'')+(s.cultivar?' ‘'+s.cultivar+'’':'')};
/* ---------- the view ---------- */
function updateMPlan(){
  const box=$('#mpBody');if(!box)return;const p=pjActive();
  if(!PLANS_ON){box.innerHTML='<div class="ovhead"><h1>'+esc(tr('Garden plan on the map','Trädgårdsplan på kartan','Tuinplan op de kaart'))+'</h1></div><p class="admwarn">'+esc(tr('Database update v11 is not installed yet (setup/v11_plans.sql).','Databasuppdatering v11 är inte installerad än (setup/v11_plans.sql).','Database-update v11 is nog niet geïnstalleerd (setup/v11_plans.sql).'))+'</p>';return}
  if(!p){box.innerHTML='<p class="muted">'+esc(tr('Choose a project first (Projects).','Välj ett projekt först (Projekt).','Kies eerst een project (Projecten).'))+'</p>';return}
  MP.phone=!!(window.matchMedia&&(matchMedia('(pointer: coarse)').matches||innerWidth<760));
  if(MP.pid!==p.id){MP.pid=p.id;MP.id='';MP.sel='';MP.draft=[];MP.undo=[];MP.redo=[];MP.fitFor=''}
  const plans=mpPlans(p.id);if(!plans.some(x=>x.id===MP.id)){const a=plans.find(x=>x.status!=='archived')||plans[0];MP.id=a?a.id:'';MP.sel='';MP.undo=[];MP.redo=[];MP.base=''}
  const q=mpPlan();
  // Another member's change (live update) is taken over when there is no unsaved change of our own.
  if(q){const s=JSON.stringify(q.shapes||[]);if(s!==MP.base&&!MP.saveT&&!MP.saving&&!MP.drag){MP.shapes=JSON.parse(s);MP.base=s;if(MP.sel&&!MP.shapes.some(x=>x.id===MP.sel))MP.sel=''}}else{MP.shapes=[];MP.base='[]'}
  MP.o=mpOrigin(p);
  if(!$('#mpMap')){
    box.innerHTML='<div class="ovhead"><div><h1>'+esc(tr('Garden plan on the map','Trädgårdsplan på kartan','Tuinplan op de kaart'))+'</h1><p class="muted" style="margin:4px 0 0" id="mpSub"></p></div></div>'+
      '<div id="mpTop" class="mptop"></div><p class="muted mpphone">'+esc(tr('Drawing works with a mouse and keyboard; on a phone you can look at the plan.','Ritandet fungerar med mus och tangentbord; på en telefon kan du titta på planen.','Tekenen werkt met muis en toetsenbord; op een telefoon kun je het plan bekijken.'))+'</p>'+
      '<div class="mpwrap"><div id="mpTools" class="mptools"></div><div class="mpmapbox"><div id="mpMap" class="mpmap" tabindex="0"></div><div id="mpLive" class="mplive" hidden></div></div><div id="mpSide" class="mpside"></div></div>';
  }
  $('#mpSub').textContent=pjName(p.id)+(q?' · '+q.name+(q.year?' '+q.year:'')+(q.status==='archived'?' · '+tr('archived','arkiverad','gearchiveerd'):''):'');
  mpTop();mpTools();mpSide();mpEnsureMap().then(()=>{if(MP.map)MP.map.invalidateSize();mpDraw();if(MP.fitFor!==MP.id){MP.fitFor=MP.id;mpFit()}}).catch(()=>{const m=$('#mpMap');if(m)m.innerHTML='<p class="admwarn">'+esc(tr('The map could not be loaded.','Kartan kunde inte laddas.','De kaart kon niet worden geladen.'))+'</p>'});
}
function mpTop(){
  const el=$('#mpTop');if(!el)return;const p=pjActive(),plans=mpPlans(p.id),q=mpPlan(),ed=projCanEdit(p.id);
  let h='<label class="mpsel"><span class="fl">'+esc(tr('Plan','Plan','Plan'))+'</span><select id="mpPlanSel">'+(plans.length?'':'<option value="">'+esc(tr('– no plan yet –','– ingen plan än –','– nog geen plan –'))+'</option>')+
    plans.map(x=>'<option value="'+esc(x.id)+'"'+(x.id===MP.id?' selected':'')+'>'+esc(x.name+(x.year?' '+x.year:'')+(x.status==='archived'?' ('+tr('archived','arkiverad','gearchiveerd')+')':x.lock?' 🔒':''))+'</option>').join('')+'</select></label>';
  if(ed)h+='<button type="button" class="btn sm" data-act="mp-new">'+esc(tr('New plan','Ny plan','Nieuw plan'))+'</button>'+(q?'<button type="button" class="btn sm" data-act="mp-copy">'+esc(q.status==='archived'?tr('Copy to a new plan','Kopiera till en ny plan','Kopiëren naar een nieuw plan'):tr('Copy','Kopiera','Kopiëren'))+'</button>':'');
  if(ed&&q&&q.status!=='archived')h+='<button type="button" class="btn sm" data-act="mp-lock">'+esc(q.lock?tr('Unlock','Lås upp','Ontgrendelen'):tr('Lock','Lås','Vergrendelen'))+'</button><button type="button" class="btn sm" data-act="mp-archive">'+esc(tr('Archive','Arkivera','Archiveren'))+'</button>';
  if(ed&&q)h+='<button type="button" class="btn sm danger" data-act="mp-trash">'+esc(tr('Delete','Radera','Verwijderen'))+'</button>';
  if(ed&&gpPlan(p)&&!plans.some(x=>x.from==='batch5'))h+='<button type="button" class="btn sm" data-act="mp-convert">'+esc(tr('Bring in the 2.8 plan','Hämta in 2.8-planen','Het 2.8-plan overnemen'))+'</button>';
  h+='<span class="mpbg seg" role="group" aria-label="Background">'+[['auto',tr('Auto','Auto','Auto')],['aerial',tr('Aerial','Flygbild','Luchtfoto')],['map',tr('Map','Karta','Kaart')],['neutral',tr('Neutral','Neutral','Neutraal')]].map(b=>'<button type="button" data-act="mp-bg" data-k="'+b[0]+'" aria-pressed="'+(MP.bg===b[0])+'">'+esc(b[1])+'</button>').join('')+'</span>'+
    '<span class="seg" role="group" aria-label="View">'+[['ill',tr('Illustrated','Illustrerad','Geïllustreerd')],['tech',tr('Technical','Teknisk','Technisch')]].map(b=>'<button type="button" data-act="mp-view" data-k="'+b[0]+'" aria-pressed="'+(MP.view===b[0])+'">'+esc(b[1])+'</button>').join('')+'</span>'+
    '<label class="mpfade"><span class="fl">'+esc(tr('Background','Bakgrund','Achtergrond'))+'</span><input id="mpFade" type="range" min="0" max="100" step="10" value="'+MP.fade+'"></label>'+
    '<span class="mpundo"><button type="button" class="btn sm" data-act="mp-undo"'+(MP.undo.length&&mpCanEdit()?'':' disabled')+' title="Ctrl+Z">↶</button><button type="button" class="btn sm" data-act="mp-redo"'+(MP.redo.length&&mpCanEdit()?'':' disabled')+' title="Ctrl+Y">↷</button></span>';
  if(MP.form==='new')h+='<form class="obsform mpnew" onsubmit="return false"><label class="f"><span class="fl">'+esc(tr('Name','Namn','Naam'))+'</span><input id="mpNewName" type="text" maxlength="60" value="'+esc(plans.length?tr('Design','Design','Ontwerp'):tr('Now','Nu','Nu'))+'"></label>'+
    '<label class="f"><span class="fl">'+esc(tr('Year','År','Jaar'))+'</span><input id="mpNewYear" type="number" min="1990" max="2100" value="'+new Date().getFullYear()+'"></label>'+
    '<label class="f"><span class="fl">'+esc(tr('Season','Säsong','Seizoen'))+'</span><select id="mpNewSeason">'+mpSeasonOpts('')+'</select></label>'+
    '<div class="acts"><button type="button" class="btn sm primary" data-act="mp-create">'+esc(tr('Create','Skapa','Aanmaken'))+'</button><button type="button" class="btn sm" data-act="mp-new">'+esc(tr('Cancel','Avbryt','Annuleren'))+'</button></div></form>';
  if(q&&q.lock)h+='<p class="muted mpnote">'+esc(tr('Locked by ','Låst av ','Vergrendeld door ')+(who(q.lock.by)||'?')+' · '+fmtDate(q.lock.at)+'. '+tr('Unlock to change it.','Lås upp för att ändra.','Ontgrendel om te wijzigen.'))+'</p>';
  if(q&&q.status==='archived')h+='<p class="muted mpnote">'+esc(tr('Archived plan: read-only. “Copy to a new plan” brings it back to work on.','Arkiverad plan: skrivskyddad. ”Kopiera till en ny plan” tar fram den att arbeta med.','Gearchiveerd plan: alleen lezen. “Kopiëren naar een nieuw plan” haalt het terug om aan te werken.'))+'</p>';
  if(q&&q.approx)h+='<p class="admwarn mpnote">'+esc(tr('This plan came from the 2.8 plan without a link to the map, so it is centred on the project’s site point. Use “Move whole plan” to put it in place.','Den här planen kom från 2.8-planen utan koppling till kartan och är därför centrerad på projektets platspunkt. Använd ”Flytta hela planen” för att lägga den rätt.','Dit plan kwam uit het 2.8-plan zonder koppeling aan de kaart en staat daarom gecentreerd op de projectlocatie. Gebruik “Hele plan verplaatsen” om het goed te leggen.'))+'</p>';
  if(!plans.length)h+='<p class="muted mpnote">'+esc(ed?tr('No plan yet. “New plan” starts one at the project’s site point.','Ingen plan än. ”Ny plan” startar en vid projektets platspunkt.','Nog geen plan. “Nieuw plan” begint er een bij de projectlocatie.'):tr('No plan yet.','Ingen plan än.','Nog geen plan.'))+'</p>';
  el.innerHTML=h;
}
const mpSeasonOpts=v=>[['',tr('– any –','– valfri –','– geen –')],['spring',tr('Spring','Vår','Lente')],['summer',tr('Summer','Sommar','Zomer')],['autumn',tr('Autumn','Höst','Herfst')],['winter',tr('Winter','Vinter','Winter')]].map(o=>'<option value="'+o[0]+'"'+(o[0]===(v||'')?' selected':'')+'>'+esc(o[1])+'</option>').join('');
function mpTools(){
  const el=$('#mpTools');if(!el)return;const ed=mpDrawOK();if(MP.phone){el.innerHTML=mpPhoneTools();return}
  const t=(k,lab,key)=>'<button type="button" class="mptool'+(MP.tool===k?' on':'')+'" data-act="mp-tool" data-k="'+k+'"'+(ed||k==='select'?'':' disabled')+' title="'+esc(lab+(key?' ('+key+')':''))+'">'+esc(lab)+'</button>';
  el.innerHTML=t('select',tr('Select','Välj','Selecteren'),'S')+MP_KINDS.map(k=>t(k,mpK(k),MPK[k].key)).join('')+t('moveall',tr('Move whole plan','Flytta hela planen','Hele plan verplaatsen'),'')+
    '<p class="muted mphelp">'+esc(MP.tool==='select'?tr('Click a shape to select it. Drag corners; drag a side’s middle to add a corner; right-click a corner to remove it. Arrows nudge 10 cm (Shift 1 cm), R rotates 15°, Delete removes.','Klicka på en form för att välja den. Dra i hörn; dra i mitten av en sida för att lägga till ett hörn; högerklicka på ett hörn för att ta bort det. Pilar flyttar 10 cm (Skift 1 cm), R vrider 15°, Delete tar bort.','Klik op een vorm om hem te selecteren. Sleep hoeken; sleep het midden van een zijde om een hoek toe te voegen; rechtsklik op een hoek om hem te verwijderen. Pijlen verschuiven 10 cm (Shift 1 cm), R draait 15°, Delete verwijdert.'):
      MP.tool==='moveall'?tr('Drag the map to move every shape of this plan together.','Dra i kartan för att flytta alla former i planen tillsammans.','Sleep de kaart om alle vormen van dit plan samen te verplaatsen.'):
      MPK[MP.tool].g==='Point'?tr('Click where it goes.','Klicka där den ska vara.','Klik waar hij moet komen.'):
      tr('Click the corners. Enter or double-click finishes, Esc cancels, Backspace removes the last corner. Shift: right angles. Alt: no snapping.','Klicka på hörnen. Enter eller dubbelklick avslutar, Esc avbryter, Backsteg tar bort sista hörnet. Skift: räta vinklar. Alt: ingen fästning.','Klik de hoeken. Enter of dubbelklik rondt af, Esc annuleert, Backspace verwijdert de laatste hoek. Shift: rechte hoeken. Alt: niet uitlijnen.'))+'</p>';
}
function mpSide(){
  const el=$('#mpSide');if(!el)return;const q=mpPlan(),s=MP.shapes.find(x=>x.id===MP.sel),ed=mpDrawOK();
  if(!q){el.innerHTML='';return}
  if(s){
    const pts=mpPts(s),poly=MPK[s.kind].g==='Polygon',line=MPK[s.kind].g==='LineString',ro=ed?'':' disabled';
    let h='<h3 class="hsub">'+esc(mpK(s.kind))+'</h3>';
    h+='<label class="f"><span class="fl">'+esc(tr('Name','Namn','Naam'))+'</span><input data-mp="name" type="text" maxlength="60" value="'+esc(s.name||'')+'"'+ro+'></label>';
    if(s.kind==='plant'||s.kind==='pline'){
      h+='<label class="f"><span class="fl">'+esc(tr('Species','Art','Soort'))+'</span><select data-mp="sid"'+ro+'><option value="">–</option>'+species.slice().sort(byName).map(x=>'<option value="'+esc(x.sid)+'"'+(x.sid===s.sid?' selected':'')+'>'+esc(dispName(x))+'</option>').join('')+'</select></label>'+
        '<label class="f"><span class="fl">'+esc(tr('Cultivar','Sort','Cultivar'))+'</span><input data-mp="cultivar" type="text" maxlength="60" value="'+esc(s.cultivar||'')+'"'+ro+'></label>';
      if(s.kind==='plant'){const sp=mpSpread(Object.assign({},s,{spread:''}));
      h+='<label class="f"><span class="fl">'+esc(tr('Mature width (m)','Full bredd (m)','Volgroeide breedte (m)'))+'</span><input data-mp="spread" type="number" min="0.05" max="40" step="0.05" value="'+esc(s.spread||'')+'" placeholder="'+esc(sp?numTxt(sp):tr('unknown','okänd','onbekend'))+'"'+ro+'></label>'}
    }
    if(s.kind==='note')h+='<label class="f"><span class="fl">'+esc(tr('Text','Text','Tekst'))+'</span><textarea data-mp="text" rows="3" maxlength="400"'+ro+'>'+esc(s.text||'')+'</textarea></label>';
    h+=mpSideKind(s,ro);
    if(poly)h+='<p class="mpstat"><b>'+esc(mpM2(mpArea(pts)))+'</b> · '+esc(tr('perimeter ','omkrets ','omtrek ')+mpM(mpLen(pts,true)))+'</p>'+mpShapeTerrain(s);
    if(line)h+='<p class="mpstat"><b>'+esc(mpM(mpLen(pts,false)))+'</b></p>';
    if(poly||line){const n=poly?pts.length:pts.length-1;
      h+='<details class="mpsides"'+(n<=8?' open':'')+'><summary>'+esc(tr('Sides (type an exact length)','Sidor (skriv en exakt längd)','Zijden (typ een exacte lengte)'))+'</summary>'+
        Array.from({length:n},(_,i)=>'<label class="mpside1"><span>'+(i+1)+'–'+((i+1)%pts.length+1)+'</span><input data-mpside="'+i+'" type="number" min="0.01" step="0.01" value="'+(Math.round(mpDist(pts[i],pts[(i+1)%pts.length])*100)/100)+'"'+ro+'> m</label>').join('')+'</details>'}
    h+=mpPlantedHTML(s);if(MP.phone&&s.kind==='plant'&&mpCanEdit())h+='<div class="acts"><button type="button" class="btn sm" data-act="mp-here">'+esc(tr('Move it to where I stand','Flytta den dit jag står','Verplaats hem naar waar ik sta'))+'</button></div>';if(mpDrawOK())h+=mpRepeatHTML(s);
    if(mpDrawOK())h+='<div class="acts"><button type="button" class="btn sm danger" data-act="mp-del">'+esc(tr('Delete shape','Ta bort formen','Vorm verwijderen'))+'</button><button type="button" class="btn sm" data-act="mp-desel">'+esc(tr('Done','Klar','Klaar'))+'</button></div>';
    el.innerHTML=h;return;
  }
  let h='<h3 class="hsub">'+esc(tr('This plan','Den här planen','Dit plan'))+'</h3>';
  const ro=mpDrawOK()?'':' disabled';
  h+='<label class="f"><span class="fl">'+esc(tr('Name','Namn','Naam'))+'</span><input data-mpp="name" type="text" maxlength="60" value="'+esc(q.name||'')+'"'+ro+'></label>'+
    '<div class="mprow"><label class="f"><span class="fl">'+esc(tr('Year','År','Jaar'))+'</span><input data-mpp="year" type="number" min="1990" max="2100" value="'+esc(q.year||'')+'"'+ro+'></label>'+
    '<label class="f"><span class="fl">'+esc(tr('Season','Säsong','Seizoen'))+'</span><select data-mpp="season"'+ro+'>'+mpSeasonOpts(q.season)+'</select></label></div>';
  h+='<h3 class="hsub">'+esc(tr('Summary','Sammanfattning','Overzicht'))+'</h3>'+mpSummaryHTML(q.status==='archived'&&q.summary?q.summary:mpSummary(MP.shapes));
  h+=mpTerrainHTML(q);
  h+='<h3 class="hsub">'+esc(tr('Show','Visa','Tonen'))+'</h3><div class="mplayers">'+MP_KINDS.map(k=>'<label class="chk"><input type="checkbox" data-mphide="'+k+'"'+(MP.hide[k]?'':' checked')+'> <i class="mpsw" style="background:'+MPK[k].c+'"></i> '+esc(mpK(k))+'</label>').join('')+
    '<label class="chk"><input type="checkbox" data-mphide="others"'+(MP.hide.others?'':' checked')+'> '+esc(tr('Other plans of the project','Projektets andra planer','Andere plannen van het project'))+'</label>'+
    '<label class="chk"><input type="checkbox" data-mphide="records"'+(MP.hide.records?'':' checked')+'> '+esc(tr('Planting records with a position','Planteringar med position','Aanplantingen met een positie'))+'</label></div>';
  el.innerHTML=h;
}
// Areas per kind, line lengths and plant counts (also frozen into an archived plan).
function mpSummary(shapes){
  const o={n:shapes.length,bed:0,beds:0,zone:0,zones:0,measure:0,plants:{},notes:0};
  shapes.forEach(s=>{const p=mpPts(s);if(s.kind==='bed'){o.bed+=mpArea(p);o.beds++}else if(s.kind==='zone'){o.zone+=mpArea(p);o.zones++}else if(s.kind==='measure')o.measure+=mpLen(p,false);else if(s.kind==='note')o.notes++;
    else if(s.kind==='plant'||s.kind==='pline'){const k=(s.sid||'?')+'|'+(s.cultivar||''),n=s.kind==='plant'?1:mpLineCount(s);o.plants[k]=(o.plants[k]||0)+n;if(s.kind==='pline'){o.lines=(o.lines||0)+1;o.lineLen=(o.lineLen||0)+mpLen(p,false)}}
    else if(s.kind==='path')o.path=(o.path||0)+mpLen(p,false)*(Number(s.width)||1);else if(s.kind==='structure')o.struct=(o.struct||0)+mpArea(p);else if(s.kind==='water')o.water=(o.water||0)+mpArea(p)});
  ['path','struct','water'].forEach(k=>{if(o[k])o[k]=Math.round(o[k]*10)/10});if(o.lineLen)o.lineLen=Math.round(o.lineLen*10)/10;
  o.bed=Math.round(o.bed*10)/10;o.zone=Math.round(o.zone*10)/10;o.measure=Math.round(o.measure*100)/100;return o;
}
function mpSummaryHTML(o){
  const pl=Object.keys(o.plants||{}).sort().map(k=>{const [sid,cv]=k.split('|'),x=bySid.get(sid);return '<li>'+esc((x?dispName(x):sid==='?'?tr('species not chosen','art inte vald','soort niet gekozen'):sid)+(cv?' ‘'+cv+'’':''))+': '+o.plants[k]+'</li>'}).join('');
  return '<ul class="mpsum"><li>'+esc(tr('Beds: ','Bäddar: ','Bedden: ')+o.beds+' · '+mpM2(o.bed))+'</li><li>'+esc(tr('Zones: ','Zoner: ','Zones: ')+o.zones+' · '+mpM2(o.zone))+'</li>'+
    (o.lines?'<li>'+esc(tr('Planting lines: ','Planteringsrader: ','Plantrijen: ')+o.lines+' · '+mpM(o.lineLen))+'</li>':'')+(o.struct?'<li>'+esc(tr('Structures: ','Byggnader: ','Bouwwerken: ')+mpM2(o.struct))+'</li>':'')+(o.path?'<li>'+esc(tr('Paths: ','Gångar: ','Paden: ')+mpM2(o.path))+'</li>':'')+(o.water?'<li>'+esc(tr('Water: ','Vatten: ','Water: ')+mpM2(o.water))+'</li>':'')+
    (o.measure?'<li>'+esc(tr('Measured lines: ','Mätlinjer: ','Maatlijnen: ')+mpM(o.measure))+'</li>':'')+(o.notes?'<li>'+esc(tr('Notes: ','Anteckningar: ','Notities: ')+o.notes)+'</li>':'')+
    '<li>'+esc(tr('Plants (planned and planted): ','Plantor (planerade och planterade): ','Planten (gepland en geplant): ')+Object.values(o.plants||{}).reduce((a,b)=>a+b,0))+(pl?'<ul>'+pl+'</ul>':'')+'</li></ul>';
}
/* ---------- the map ---------- */
async function mpEnsureMap(){
  await loadLeaflet();const el=$('#mpMap');if(!el)return;
  if(MP.map&&MP.map.getContainer()===el)return;
  if(MP.map){try{MP.map.remove()}catch(e){}}
  const m=L.map(el,{maxZoom:24,zoomSnap:.25,zoomDelta:.5,wheelPxPerZoomLevel:90,doubleClickZoom:false,boxZoom:false,keyboard:false,attributionControl:true});
  MP.map=m;m.setView([MP.o.lat,MP.o.lng],19);
  if(svcOn('tiles')){MP.tiles=L.tileLayer(svcUrl('tiles'),{maxNativeZoom:19,maxZoom:24,attribution:SERVICES.tiles.attr||''});MP.tiles.on('tileerror',()=>svcNote('tiles',false,'tile error'));MP.tiles.addTo(m)}
  MP.grid=document.createElement('canvas');MP.grid.className='mpgrid';el.appendChild(MP.grid);
  MP.lay=L.layerGroup().addTo(m);
  m.on('move zoom resize viewreset',mpBack);m.on('zoomend',()=>{mpBack();mpDraw()});
  m.on('click',mpMapClick);m.on('dblclick',e=>{if(mpDrawing()){L.DomEvent.preventDefault(e.originalEvent);mpFinish()}});
  m.on('mousemove',mpMapMove);m.on('mousedown',mpMapDown);m.on('mouseout',()=>{const l=$('#mpLive');if(l)l.hidden=true});
  mpBack();
}
function mpFit(){
  if(!MP.map)return;const all=MP.shapes.flatMap(mpPts);
  if(all.length){const b=L.latLngBounds(all.map(mpLat));MP.map.fitBounds(b.pad(.15),{maxZoom:22})}else MP.map.setView([MP.o.lat,MP.o.lng],19);
}
// Background: the map up to its own detail, then the neutral grid (Auto); or one of them pinned. The slider fades the map.
const mpNeutralNow=()=>MP.bg==='neutral'||(MP.bg==='auto'&&MP.map&&MP.map.getZoom()>20.5);
function mpGridStep(){if(!MP.map)return 1;const mpp=mpMpp();return mpp<.02?.1:mpp<.25?1:mpp<2.5?10:100}
function mpMpp(){const m=MP.map,c=m.getSize().divideBy(2),a=m.containerPointToLatLng(c),b=m.containerPointToLatLng(c.add([100,0]));return mpDist([a.lng,a.lat],[b.lng,b.lat])/100}
function mpBack(){
  const m=MP.map;if(!m)return;const z=m.getZoom(),el=m.getContainer();
  const ops=mpBackOps(z),op=1-(1-ops.map)*(1-ops.aer);
  if(MP.tiles)MP.tiles.setOpacity(ops.map);if(MP.aer)MP.aer.setOpacity(ops.aer);el.classList.toggle('mpneutral',op<.999);
  const c=MP.grid;if(!c)return;const sz=m.getSize();if(c.width!==sz.x||c.height!==sz.y){c.width=sz.x;c.height=sz.y}
  const g=c.getContext('2d');g.clearRect(0,0,sz.x,sz.y);const show=1-op;if(show<=.02||!MP.o)return;
  const st=mpGridStep(),nw=m.containerPointToLatLng([0,0]),se=m.containerPointToLatLng([sz.x,sz.y]),a=mpXY([nw.lng,nw.lat]),b=mpXY([se.lng,se.lat]);
  const line=(x0,y0,x1,y1,maj)=>{g.strokeStyle=maj?'rgba(60,70,60,'+(.32*show)+')':'rgba(60,70,60,'+(.14*show)+')';g.lineWidth=1;g.beginPath();g.moveTo(Math.round(x0)+.5,Math.round(y0)+.5);g.lineTo(Math.round(x1)+.5,Math.round(y1)+.5);g.stroke()};
  const px=(x,y)=>{const ll=mpLL(x,y);return m.latLngToContainerPoint([ll[1],ll[0]])};
  for(let x=Math.floor(Math.min(a.x,b.x)/st)*st;x<=Math.max(a.x,b.x);x+=st){const p=px(x,a.y),q=px(x,b.y),maj=Math.abs(Math.round(x/st)%10)===0;line(p.x,p.y,q.x,q.y,maj)}
  for(let y=Math.floor(Math.min(a.y,b.y)/st)*st;y<=Math.max(a.y,b.y);y+=st){const p=px(a.x,y),q=px(b.x,y),maj=Math.abs(Math.round(y/st)%10)===0;line(p.x,p.y,q.x,q.y,maj)}
  g.fillStyle='rgba(40,50,40,'+(.7*show)+')';g.font='11px sans-serif';g.fillText(tr('grid ','rutnät ','raster ')+(st<1?'10 cm':st+' m'),8,sz.y-8);
}
function mpDraw(){
  const m=MP.map;if(!m||!MP.lay)return;MP.lay.clearLayers();mpDefs();const q=mpPlan();mpAerialLayer();mpDemLoad(q);mpBack();if(!q){mpDraftDraw();return}MP.ovl=mpOverlapSet();
  const vis=s=>!MP.hide[s.kind];
  if(!MP.hide.others)mpPlans(MP.pid).filter(x=>x.id!==MP.id&&x.status!=='archived').forEach(o=>(o.shapes||[]).filter(vis).forEach(s=>mpShapeLayer(s,false,true)));
  const linked=new Set(MP.shapes.map(x=>x.plantingId).filter(Boolean));
  if(!MP.hide.records)pjPlantings(MP.pid).filter(x=>!isEnc(x)&&!linked.has(x.id)).forEach(p=>{const pt=plPoint(p);if(!pt||!pt.own&&!pt.plan)return;
    L.circleMarker([pt.lat,pt.lng],{radius:4,color:'#1b5e20',weight:1.5,fillColor:'#fff',fillOpacity:1,interactive:true}).bindTooltip(plTitle(p)+' · '+tr('planted','planterad','geplant'),{direction:'top'}).addTo(MP.lay)});
  if(MP.view==='ill')mpShadows(MP.shapes.filter(vis));
  MP.shapes.filter(vis).forEach(s=>mpShapeLayer(s,s.id===MP.sel,false));
  const s=MP.shapes.find(x=>x.id===MP.sel);if(s&&vis(s))mpHandles(s);
  mpDraftDraw();mpGpsDraw();
}
// Corner handles, middle-of-side handles and side lengths of the selected shape.
function mpHandles(s){
  const pts=mpPts(s),k=MPK[s.kind];if(k.g==='Point')return;const ed=mpDrawOK(),closed=k.g==='Polygon';
  const n=closed?pts.length:pts.length-1;
  for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%pts.length],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    L.marker(mpLat(mid),{icon:L.divIcon({className:'mpsidel',html:'<span>'+esc(mpM(mpDist(a,b)))+'</span>',iconSize:null}),interactive:false}).addTo(MP.lay);
    if(ed){const h=L.circleMarker(mpLat(mid),{radius:4,color:k.c,weight:1.5,fillColor:'#fff',fillOpacity:.7,bubblingMouseEvents:false,className:'mpmid'});h.on('mousedown',e=>mpVertexDown(e,s.id,i+1,true));h.addTo(MP.lay)}}
  if(ed)pts.forEach((c,i)=>{const h=L.circleMarker(mpLat(c),{radius:6,color:'#222',weight:2,fillColor:'#fff',fillOpacity:1,bubblingMouseEvents:false,className:'mpvx'});
    h.on('mousedown',e=>mpVertexDown(e,s.id,i,false));h.on('contextmenu',e=>{L.DomEvent.preventDefault(e.originalEvent);mpVertexDel(s.id,i)});h.addTo(MP.lay)});
}
function mpDraftDraw(){
  if(!MP.map)return;if(MP.dl){MP.dl.remove();MP.dl=null}
  const d=MP.draft;if(!d.length)return;const k=MPK[MP.tool];if(!k)return;
  const pts=d.concat(MP.cur?[MP.cur]:[]);MP.dl=L.layerGroup().addTo(MP.map);
  if(k.g==='Polygon'&&pts.length>2)L.polygon(pts.map(mpLat),{color:k.c,weight:2,dashArray:'4 4',fillOpacity:.1,interactive:false}).addTo(MP.dl);
  else L.polyline(pts.map(mpLat),{color:k.c,weight:2,dashArray:'4 4',interactive:false}).addTo(MP.dl);
  d.forEach(c=>L.circleMarker(mpLat(c),{radius:4,color:k.c,weight:2,fillColor:'#fff',fillOpacity:1,interactive:false}).addTo(MP.dl));
}
/* ---------- snapping: corners, sides, the grid; Shift = right angles; Alt = off ---------- */
function mpSnap(ll,ev,skip){
  let c=[ll.lng,ll.lat];const m=MP.map;
  if(ev&&ev.shiftKey&&MP.draft.length){const last=MP.draft[MP.draft.length-1],L0=mpXY(last),P=mpXY(c),dx=P.x-L0.x,dy=P.y-L0.y,len=Math.hypot(dx,dy);
    let base=0;if(MP.draft.length>1){const pr=mpXY(MP.draft[MP.draft.length-2]);base=Math.atan2(L0.y-pr.y,L0.x-pr.x)}
    const ang=Math.atan2(dy,dx),st=MP.draft.length>1?Math.PI/2:Math.PI/4,a2=base+Math.round((ang-base)/st)*st,l2=len*Math.cos(ang-a2);
    c=mpLL(L0.x+Math.cos(a2)*l2,L0.y+Math.sin(a2)*l2);return{c,k:'a'}}
  if(ev&&ev.altKey)return{c,k:''};
  const P=m.latLngToContainerPoint(ll),px=x=>m.latLngToContainerPoint(mpLat(x));
  const pool=[];const add=s=>{if(!MP.hide[s.kind])pool.push(s)};MP.shapes.forEach(s=>{if(s.id!==(skip&&skip.id))add(s)});
  if(!MP.hide.others)mpPlans(MP.pid).filter(x=>x.id!==MP.id&&x.status!=='archived').forEach(o=>(o.shapes||[]).forEach(add));
  let best=null,bd=10;const vx=[];pool.forEach(s=>mpPts(s).forEach(x=>vx.push(x)));
  if(skip){mpPts(skip).forEach((x,i)=>{if(i!==skip.i)vx.push(x)})}
  if(MP.draft.length>2)vx.push(MP.draft[0]);
  vx.forEach(x=>{const d=px(x).distanceTo(P);if(d<bd){bd=d;best=x}});if(best)return{c:best.slice(),k:'v'};
  let be=null;bd=7;pool.forEach(s=>{const p=mpPts(s),g=MPK[s.kind].g;if(g==='Point')return;const n=g==='Polygon'?p.length:p.length-1;
    for(let i=0;i<n;i++){const A=px(p[i]),B=px(p[(i+1)%p.length]),dx=B.x-A.x,dy=B.y-A.y,L2=dx*dx+dy*dy;if(!L2)continue;const t=Math.max(0,Math.min(1,((P.x-A.x)*dx+(P.y-A.y)*dy)/L2)),Q=L.point(A.x+t*dx,A.y+t*dy),d=Q.distanceTo(P);if(d<bd){bd=d;be=Q}}});
  if(be){const r=m.containerPointToLatLng(be);return{c:[r.lng,r.lat],k:'e'}}
  if(mpNeutralNow()||m.getZoom()>=21){const st=mpGridStep(),X=mpXY(c),g=mpLL(Math.round(X.x/st)*st,Math.round(X.y/st)*st);if(px(g).distanceTo(P)<6)return{c:g,k:'g'}}
  return{c,k:''};
}
function mpRing(c,k){if(MP.ring){MP.ring.remove();MP.ring=null}if(c&&k&&MP.map)MP.ring=L.circleMarker(mpLat(c),{radius:8,color:k==='a'?'#7b1fa2':'#e65100',weight:2,fill:false,interactive:false}).addTo(MP.map)}
/* ---------- drawing ---------- */
const mpDrawing=()=>MPK[MP.tool]&&MPK[MP.tool].g!=='Point'&&MP.draft.length>0;
function mpMapClick(e){
  if(MP.drag&&MP.drag.moved)return;
  const t=MP.tool;
  if(t==='select'||t==='moveall'){if(MP.sel&&!MP.justSel){MP.sel='';mpDraw();mpSide()}MP.justSel=false;return}
  if(!mpDrawOK())return;const sn=mpSnap(e.latlng,e.originalEvent);
  if(MPK[t].g==='Point'){const s={id:randHex(6),kind:t,g:{type:'Point',coordinates:sn.c}};if(t==='plant'&&MP.lastSid)s.sid=MP.lastSid;mpAddShape(s);return}
  const last=MP.draft[MP.draft.length-1];if(last&&mpDist(last,sn.c)<.005)return;
  if(MPK[t].g==='Polygon'&&MP.draft.length>2&&mpDist(MP.draft[0],sn.c)<.005){mpFinish();return}
  MP.draft.push(sn.c);MP.cur=null;mpDraftDraw();mpLiveShow(e.containerPoint);
}
function mpMapMove(e){
  if(MP.drag){mpDragMove(e);return}
  if(!MPK[MP.tool]||!mpDrawOK()){mpRing();return}
  const sn=mpSnap(e.latlng,e.originalEvent);mpRing(sn.c,sn.k);
  if(MP.draft.length){MP.cur=sn.c;mpDraftDraw();mpLiveShow(e.containerPoint)}
}
function mpLiveShow(pt){
  const l=$('#mpLive');if(!l)return;const d=MP.draft,k=MPK[MP.tool];if(!d.length||!k){l.hidden=true;return}
  const pts=d.concat(MP.cur?[MP.cur]:[]),seg=pts.length>1?mpDist(pts[pts.length-2],pts[pts.length-1]):0;
  let t=mpM(seg);if(MP.typed)t=tr('typed: ','skrivet: ','getypt: ')+MP.typed+(MP.typed.indexOf('<')>=0?'°':' m')+' · Enter';if(k.g==='LineString'&&pts.length>2)t+=' · '+tr('total ','totalt ','totaal ')+mpM(mpLen(pts,false));if(k.g==='Polygon'&&pts.length>2)t+=' · '+mpM2(mpArea(pts));
  l.textContent=t;l.hidden=false;if(pt){l.style.left=(pt.x+16)+'px';l.style.top=(pt.y+14)+'px'}
}
function mpFinish(){
  const k=MPK[MP.tool];if(!k){return}const d=MP.draft.slice(),need=k.g==='Polygon'?3:2;
  if(d.length<need){toast(k.g==='Polygon'?tr('A shape needs at least three corners.','En form behöver minst tre hörn.','Een vorm heeft minstens drie hoeken nodig.'):tr('A line needs at least two points.','En linje behöver minst två punkter.','Een lijn heeft minstens twee punten nodig.'),'err');return}
  const s={id:randHex(6),kind:MP.tool};mpSetPts(s,d);if(s.kind==='pline'){if(MP.lastSid)s.sid=MP.lastSid;mpLineDefaults(s)}MP.draft=[];MP.cur=null;const l=$('#mpLive');if(l)l.hidden=true;mpAddShape(s);
}
function mpCancel(){MP.typed='';MP.draft=[];MP.cur=null;const l=$('#mpLive');if(l)l.hidden=true;mpDraftDraw();mpRing()}
function mpAddShape(s){
  if(mpTooBig(MP.shapes.concat([s]))){toast(tr('A plan may cover at most 300 × 300 m. Start another plan for the rest.','En plan får täcka högst 300 × 300 m. Starta en annan plan för resten.','Een plan mag hoogstens 300 × 300 m beslaan. Begin een ander plan voor de rest.'),'err');mpDraftDraw();return}
  mpPush();MP.shapes.push(s);MP.sel=s.id;if(MPK[s.kind].g!=='Point'){MP.tool='select';mpTools()}mpChanged();
}
/* ---------- selecting and editing ---------- */
function mpShapeDown(e,id){
  L.DomEvent.stopPropagation(e);
  if(MP.tool==='moveall'){mpMapDown(e);return}
  const was=MP.sel===id;MP.sel=id;MP.justSel=true;setTimeout(()=>{MP.justSel=false},400);
  if(!was){mpDraw();mpSide()}
  if(mpDrawOK()){const s=MP.shapes.find(x=>x.id===id);MP.drag={type:'shape',id,start:e.latlng,orig:JSON.stringify(s.g),moved:false};MP.map.dragging.disable()}
}
function mpVertexDown(e,id,i,mid){
  L.DomEvent.stopPropagation(e);if(!mpDrawOK())return;const s=MP.shapes.find(x=>x.id===id);if(!s)return;
  const before=JSON.stringify(MP.shapes);
  if(mid){const p=mpPts(s);const a=p[i-1],b=p[i%p.length];p.splice(i,0,[(a[0]+b[0])/2,(a[1]+b[1])/2]);mpSetPts(s,p)}
  MP.drag={type:'vx',id,i,moved:mid,before};MP.map.dragging.disable();
}
function mpMapDown(e){
  if(MP.tool!=='moveall'||!mpDrawOK()||!MP.shapes.length)return;
  MP.drag={type:'all',start:e.latlng,orig:JSON.stringify(MP.shapes),moved:false};MP.map.dragging.disable();
}
function mpDragMove(e){
  const d=MP.drag,oe=e.originalEvent;
  if(d.type==='vx'){const s=MP.shapes.find(x=>x.id===d.id);if(!s)return;const sn=mpSnap(e.latlng,oe,{id:s.id,i:d.i});const p=mpPts(s);p[d.i]=sn.c;mpSetPts(s,p);d.moved=true;mpRing(sn.c,sn.k);mpDraw();return}
  const dx=e.latlng.lng-d.start.lng,dy=e.latlng.lat-d.start.lat;if(!d.moved&&MP.map.latLngToContainerPoint(e.latlng).distanceTo(MP.map.latLngToContainerPoint(d.start))<3)return;d.moved=true;
  const mv=g=>{const t=JSON.parse(JSON.stringify(g)),f=c=>[Math.round((c[0]+dx)*1e8)/1e8,Math.round((c[1]+dy)*1e8)/1e8];
    if(t.type==='Point')t.coordinates=f(t.coordinates);else if(t.type==='LineString')t.coordinates=t.coordinates.map(f);else t.coordinates=t.coordinates.map(r=>r.map(f));return t};
  if(d.type==='shape'){const s=MP.shapes.find(x=>x.id===d.id);if(s)s.g=mv(JSON.parse(d.orig))}
  if(d.type==='all'){const o=JSON.parse(d.orig);MP.shapes.forEach((s,i)=>{s.g=mv(o[i].g)})}
  mpDraw();
}
function mpDragEnd(){
  const d=MP.drag;if(!d)return;MP.drag=null;if(MP.map)MP.map.dragging.enable();mpRing();
  if(!d.moved){if(d.type==='vx'&&d.before&&JSON.stringify(MP.shapes)!==d.before){MP.shapes=JSON.parse(d.before);mpDraw()}return}
  const before=d.type==='vx'?d.before:d.type==='all'?d.orig:(()=>{const c=JSON.parse(JSON.stringify(MP.shapes)),s=c.find(x=>x.id===d.id);if(s)s.g=JSON.parse(d.orig);return JSON.stringify(c)})();
  if(mpTooBig(MP.shapes)){MP.shapes=JSON.parse(before);toast(tr('A plan may cover at most 300 × 300 m.','En plan får täcka högst 300 × 300 m.','Een plan mag hoogstens 300 × 300 m beslaan.'),'err');mpDraw();return}
  MP.undo.push(before);if(MP.undo.length>60)MP.undo.shift();MP.redo=[];setTimeout(()=>{MP.justSel=false},0);mpChanged();
}
function mpVertexDel(id,i){
  if(!mpCanEdit())return;const s=MP.shapes.find(x=>x.id===id);if(!s)return;const p=mpPts(s),need=MPK[s.kind].g==='Polygon'?3:2;
  if(p.length<=need){toast(tr('That would leave too few corners.','Då blir det för få hörn.','Dan blijven er te weinig hoeken over.'),'err');return}
  mpPush();p.splice(i,1);mpSetPts(s,p);mpChanged();
}
function mpTransform(fn){const s=MP.shapes.find(x=>x.id===MP.sel);if(!s||!mpCanEdit())return;mpPush();const p=mpPts(s).map(mpXY),c=p.reduce((a,b)=>({x:a.x+b.x/p.length,y:a.y+b.y/p.length}),{x:0,y:0});mpSetPts(s,p.map(v=>{const r=fn(v,c);return mpLL(r.x,r.y)}));if(mpTooBig(MP.shapes)){mpUndo();return}mpChanged()}
const mpNudge=(dx,dy)=>mpTransform(v=>({x:v.x+dx,y:v.y+dy}));
const mpRotate=deg=>{const a=deg*Math.PI/180;mpTransform((v,c)=>({x:c.x+(v.x-c.x)*Math.cos(a)-(v.y-c.y)*Math.sin(a),y:c.y+(v.x-c.x)*Math.sin(a)+(v.y-c.y)*Math.cos(a)}))};
function mpSideLen(i,len){
  const s=MP.shapes.find(x=>x.id===MP.sel);if(!s||!(len>0))return;const p=mpPts(s),j=(i+1)%p.length,A=mpXY(p[i]),B=mpXY(p[j]),d=Math.hypot(B.x-A.x,B.y-A.y);if(!d)return;
  mpPush();p[j]=mpLL(A.x+(B.x-A.x)/d*len,A.y+(B.y-A.y)/d*len);mpSetPts(s,p);if(mpTooBig(MP.shapes)){mpUndo();return}mpChanged();
}
/* ---------- undo, saving ---------- */
function mpPush(){MP.undo.push(JSON.stringify(MP.shapes));if(MP.undo.length>60)MP.undo.shift();MP.redo=[]}
function mpUndo(){if(!MP.undo.length||!mpCanEdit())return;MP.redo.push(JSON.stringify(MP.shapes));MP.shapes=JSON.parse(MP.undo.pop());if(!MP.shapes.some(x=>x.id===MP.sel))MP.sel='';mpChanged(true)}
function mpRedo(){if(!MP.redo.length||!mpCanEdit())return;MP.undo.push(JSON.stringify(MP.shapes));MP.shapes=JSON.parse(MP.redo.pop());mpChanged(true)}
function mpChanged(){mpDraw();mpSide();mpTop();clearTimeout(MP.saveT);MP.saveT=setTimeout(mpSaveNow,700)}
// Plans are saved straight to their row (no full reload of all data after each edit); other members get them live.
async function mpSaveNow(){
  MP.saveT=null;const q=mpPlan();if(!q)return;const doc=plDoc(q);doc.shapes=JSON.parse(JSON.stringify(MP.shapes));doc.project=q.project;
  const s=JSON.stringify(doc.shapes);if(s===MP.base)return;MP.saving=true;
  try{await mpKeepAerial(q.id,doc);
    if(SB){const r=await SB.from('plans').upsert(projRow('plans',q.id,doc));if(r.error)throw r.error;const i=(state.plans||[]).findIndex(x=>x.id===q.id);if(i>=0)state.plans[i]=Object.assign({},state.plans[i],{shapes:doc.shapes})}
    else await Data.saveRow('plans',q.id,doc);
    MP.base=s;
  }catch(e){toast(tr('The plan could not be saved: ','Planen kunde inte sparas: ','Het plan kon niet worden opgeslagen: ')+errMsg(e),'err')}
  finally{MP.saving=false}
}
async function mpSaveMeta(patch,msg){const q=mpPlan();if(!q)return;if(MP.saveT){clearTimeout(MP.saveT);await mpSaveNow()}const doc=Object.assign(plDoc(q),{shapes:JSON.parse(JSON.stringify(MP.shapes))},patch);doc.project=q.project;
  Object.keys(doc).forEach(k=>{if(doc[k]===undefined)delete doc[k]});await mpKeepAerial(q.id,doc,patch);try{await Data.saveRow('plans',q.id,doc);MP.base=JSON.stringify(doc.shapes);if(msg)toast(msg)}catch(e){toast(errMsg(e),'err')}}
/* ---------- plans: new, copy, lock, archive, delete, the 2.8 plan ---------- */
async function mpCreate(name,year,season,shapes,extra){
  const p=pjActive();if(!p)return;
  const doc=Object.assign({project:p.id,name:String(name||'').trim().slice(0,60)||tr('Plan','Plan','Plan'),year:Number(year)||'',season:season||'',status:'active',shapes:shapes||[],createdAt:Date.now()},extra||{});
  try{const id=await Data.saveRow('plans',null,doc);MP.id=id;MP.sel='';MP.undo=[];MP.redo=[];MP.base='';MP.form='';MP.fitFor='';toast(tr('Plan created: ','Plan skapad: ','Plan aangemaakt: ')+doc.name);updateMPlan()}catch(e){toast(errMsg(e),'err')}
}
const mpFresh=sh=>JSON.parse(JSON.stringify(sh||[])).map(s=>Object.assign(s,{id:randHex(6)}));
function mpConvert(){
  const p=pjActive(),pl=gpPlan(p);if(!p||!pl)return;
  if(!hasPt(p)){toast(tr('Save a site point for the project first (Edit name and site).','Spara en platspunkt för projektet först (Redigera namn och plats).','Sla eerst een locatie voor het project op (Naam en locatie bewerken).'),'err');return}
  const a=pl.anchor||{x:pl.w/2,y:pl.h/2,rot:0},q=Object.assign({},p,{plan:Object.assign({},pl,{anchor:a})});
  const ll=(x,y)=>{const r=gpToLatLng(q,x,y);return [r.lng,r.lat]};const sh=[];
  const ol=pl.outline&&pl.outline.length>2?pl.outline:[[0,0],[pl.w,0],[pl.w,pl.h],[0,pl.h]];
  sh.push({id:randHex(6),kind:'zone',name:tr('Outline','Kontur','Omtrek'),g:{type:'Polygon',coordinates:[ol.map(v=>ll(v[0],v[1])).concat([ll(ol[0][0],ol[0][1])])]}});
  (p.places||[]).filter(x=>x.shape&&isFinite(x.shape.w)).forEach(x=>{const r=x.shape,c=[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]];
    sh.push({id:randHex(6),kind:'bed',name:x.name||'',placeId:x.id,g:{type:'Polygon',coordinates:[c.map(v=>ll(v[0],v[1])).concat([ll(r.x,r.y)])]}})});
  mpCreate(tr('Plan from 2.8','Plan från 2.8','Plan uit 2.8'),new Date().getFullYear(),'',sh,{from:'batch5',approx:!pl.anchor});
}
async function mpArchive(){
  const q=mpPlan();if(!q||!confirm(tr('Archive this plan? It becomes read-only; you can copy it to a new plan later.','Arkivera planen? Den blir skrivskyddad; du kan kopiera den till en ny plan senare.','Dit plan archiveren? Het wordt alleen-lezen; je kunt het later naar een nieuw plan kopiëren.')))return;
  await mpSaveMeta({status:'archived',lock:undefined,summary:mpSummary(MP.shapes),archivedAt:Date.now()},tr('Plan archived','Planen arkiverad','Plan gearchiveerd'));
}
async function mpTrash(){
  const q=mpPlan();if(!q||!confirm(tr('Move this plan to the trash?','Flytta planen till papperskorgen?','Dit plan naar de prullenbak verplaatsen?')))return;
  try{if(SB)await Data.trash('plans',q.id,true);else{state.plans=state.plans.filter(x=>x.id!==q.id);refresh()}MP.id='';toast(tr('Moved to the trash','Flyttad till papperskorgen','Naar de prullenbak verplaatst'))}catch(e){toast(errMsg(e),'err')}
}
/* ---------- events (hooked into the app's click, change and key handlers) ---------- */
function mpClick(act,a){
  if(act==='mp-open'){go('mplan');return true}
  if(act==='mp-tool'){MP.tool=a.dataset.k;mpCancel();if(MP.tool!=='select')MP.sel='';mpTools();mpDraw();mpSide();const m=$('#mpMap');if(m)m.classList.toggle('mpdrawc',MP.tool!=='select');return true}
  if(act==='mp-view'){MP.view=a.dataset.k;store.set('ab.mpview',MP.view);mpTop();mpDraw();return true}
  if(mpClick2(act,a))return true;
  if(act==='mp-bg'){MP.bg=a.dataset.k;store.set('ab.mpbg',MP.bg);mpTop();mpBack();return true}
  if(act==='mp-aerial'){mpAerialRequest();return true}
  if(act==='mp-undo'){mpUndo();return true}
  if(act==='mp-redo'){mpRedo();return true}
  if(act==='mp-new'){MP.form=MP.form==='new'?'':'new';mpTop();return true}
  if(act==='mp-create'){mpCreate(($('#mpNewName')||{}).value,($('#mpNewYear')||{}).value,($('#mpNewSeason')||{}).value);return true}
  if(act==='mp-copy'){const q=mpPlan();if(q)mpCreate(q.name+' '+tr('(copy)','(kopia)','(kopie)'),q.year,q.season,mpFresh(MP.shapes));return true}
  if(act==='mp-lock'){const q=mpPlan();if(q)mpSaveMeta({lock:q.lock?undefined:{by:meUid()||'',at:Date.now()}},q.lock?tr('Unlocked','Upplåst','Ontgrendeld'):tr('Locked','Låst','Vergrendeld'));return true}
  if(act==='mp-archive'){mpArchive();return true}
  if(act==='mp-trash'){mpTrash();return true}
  if(act==='mp-convert'){mpConvert();return true}
  if(act==='mp-del'){if(mpCanEdit()&&MP.sel){mpPush();MP.shapes=MP.shapes.filter(x=>x.id!==MP.sel);MP.sel='';mpChanged()}return true}
  if(act==='mp-desel'){MP.sel='';mpDraw();mpSide();return true}
  return false;
}
function mpChange(t){
  if(!t||!t.closest||!t.closest('#v-mplan'))return false;
  if(mpChange2(t))return true;
  if(t.id==='mpPlanSel'){if(MP.saveT){clearTimeout(MP.saveT);mpSaveNow()}MP.id=t.value;MP.sel='';MP.undo=[];MP.redo=[];MP.base='';MP.fitFor='';mpCancel();updateMPlan();return true}
  if(t.id==='mpFade'){MP.fade=Number(t.value);store.set('ab.mpfade',String(MP.fade));mpBack();return true}
  if(t.dataset.mphide){MP.hide[t.dataset.mphide]=!t.checked;mpDraw();return true}
  if(t.dataset.mpp){const k=t.dataset.mpp,v=k==='year'?(Number(t.value)||''):String(t.value||'').trim();if(k==='name'&&!v)return true;mpSaveMeta({[k]:v});return true}
  const s=MP.shapes.find(x=>x.id===MP.sel);if(!s||!mpCanEdit())return false;
  if(t.dataset.mpside!==undefined){mpSideLen(Number(t.dataset.mpside),Number(t.value));return true}
  if(t.dataset.mp){const k=t.dataset.mp;mpPush();let v=t.value;if(MP_NUM.indexOf(k)>=0){v=Number(v);if(!(v>0))v=''}else v=String(v).trim();if(v==='')delete s[k];else s[k]=v;if(k==='sid'&&v){MP.lastSid=v;if(s.kind==='pline'){delete s.inrow;delete s.rowsp;mpLineDefaults(s)}}if(t.tagName==='SELECT')t.blur();mpChanged();return true}
  return false;
}
function mpKey(e){
  if($('#v-mplan').hidden)return;const t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;
  const k=e.key,ctl=e.ctrlKey||e.metaKey;
  if(ctl&&(k==='z'||k==='Z')){e.preventDefault();if(e.shiftKey)mpRedo();else mpUndo();return}
  if(ctl&&(k==='y'||k==='Y')){e.preventDefault();mpRedo();return}
  if(ctl&&(k==='c'||k==='C')){const s=MP.shapes.find(x=>x.id===MP.sel);if(s){MP.clip=JSON.stringify(s);toast(tr('Copied','Kopierad','Gekopieerd'))}return}
  if(ctl&&(k==='v'||k==='V')){if(!MP.clip||!mpCanEdit())return;e.preventDefault();const s=JSON.parse(MP.clip);s.id=randHex(6);const p=mpPts(s).map(c=>{const v=mpXY(c);return mpLL(v.x+1,v.y-1)});mpSetPts(s,p);mpAddShape(s);MP.sel=s.id;mpDraw();mpSide();return}
  if(mpDrawing()&&mpTypedKey(e))return;
  if(mpDrawing()){if(k==='Enter'){e.preventDefault();mpFinish();return}if(k==='Backspace'){e.preventDefault();MP.draft.pop();mpDraftDraw();return}}
  if(k==='Escape'){if(MP.draft.length)mpCancel();else if(MP.sel){MP.sel='';mpDraw();mpSide()}else if(MP.tool!=='select'){MP.tool='select';mpTools()}return}
  if(ctl||e.altKey)return;
  if(MP.phone)return;
  if(MP.sel&&mpCanEdit()){const st=e.shiftKey?.01:.1;
    if(k==='ArrowLeft'){e.preventDefault();mpNudge(-st,0);return}if(k==='ArrowRight'){e.preventDefault();mpNudge(st,0);return}
    if(k==='ArrowUp'){e.preventDefault();mpNudge(0,st);return}if(k==='ArrowDown'){e.preventDefault();mpNudge(0,-st);return}
    if(k==='r'||k==='R'){e.preventDefault();mpRotate(e.shiftKey?15:-15);return}
    if(k==='Delete'||k==='Backspace'){e.preventDefault();mpClick('mp-del');return}}
  const tk={s:'select',S:'select'};MP_KINDS.forEach(x=>{tk[MPK[x].key.toLowerCase()]=x;tk[MPK[x].key]=x});
  if(tk[k]&&!MP.draft.length&&(mpDrawOK()||tk[k]==='select')){const a={dataset:{k:tk[k]}};mpClick('mp-tool',a)}
}
document.addEventListener('keydown',mpKey);
document.addEventListener('mouseup',()=>{if(MP.drag)mpDragEnd()});
