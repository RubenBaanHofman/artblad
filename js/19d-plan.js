// Artblad: Garden plan in metres (2.8.0, batch 5: queue rows 70 steps 2–4, 20, 21, 22; decisions D13, D14).
// Part 19d; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* A project's plan is drawn in metres from its top-left corner (x to the right, y down), so a balcony or a small garden
   can be laid out to scale without GPS (row 70). Stored in the project document, so only members see it:
     plan:{w, h, outline:[[x,y]…] | null, refs:[{id,name,x,y}], bg:{photo,x,y,wpx,hpx,scale,op} | null,
           anchor:{x,y,rot} | null}      anchor = where the site point lies on the plan, rot = compass bearing of "up"
     places[].shape:{x,y,w,h}            beds, zones and guilds as rectangles
     planting.pos:{x,y}                  a plant on the plan (planting records keep their own document)
   With an anchor, plants on the plan also get a derived map position (for the climate look-ups and the map), while the
   plan itself carries no coordinates (privacy). Mature-size circles come from the species' spread (row 22); planned
   plants are drawn hollow next to what is planted (design layer, row 21). The photo background (D14: the user's own
   photo or sketch first) is uploaded like a field photo (folder pl/, database update v10). */
const GP={mode:'view',sel:'',vb:null,drag:null,tmp:[],pend:'',mature:true,planned:true,labels:true,cal:[],busy:false};
const GP_MODES=O3('view:Look and move:Titta och flytta:Bekijken en verplaatsen|plant:Place a plant:Placera en planta:Plant plaatsen|bed:Draw a bed:Rita en bädd:Bed tekenen|design:Plan a new plant:Planera en ny planta:Nieuwe plant plannen|outline:Outline:Kontur:Omtrek|refs:Reference points:Referenspunkter:Referentiepunten|bg:Background:Bakgrund:Achtergrond');
const gpProj=()=>pjActive();
const gpPlan=p=>p&&p.plan&&isFinite(p.plan.w)&&p.plan.w>0?p.plan:null;
const gpPlants=p=>pjPlantings(p.id).filter(x=>!isEnc(x));
const gpOn=x=>x&&x.pos&&isFinite(x.pos.x)&&isFinite(x.pos.y);
const r2=v=>Math.round(v*100)/100;
// The values of a planting's species or cultivar (cultivars inherit from the species).
function plValues(p){const x=bySid.get(p.sid);if(!x)return{};const c=p.cultivar&&x.cvs.find(c=>c.ck===cvKey(p.cultivar));return (c||x).m||{}}
const matureR=p=>{const s=Number(plValues(p).spread);return isFinite(s)&&s>0?s/200:null};
/* ---------- plan positions ↔ map positions (anchor: the site point on the plan and the bearing of "up") ---------- */
function gpToLatLng(p,x,y){
  const pl=gpPlan(p),a=pl&&pl.anchor;if(!a||!hasPt(p))return null;
  const t=(Number(a.rot)||0)*Math.PI/180,dx=x-a.x,dy=a.y-y,e=dx*Math.cos(t)+dy*Math.sin(t),n=-dx*Math.sin(t)+dy*Math.cos(t);
  const lat=Number(p.lat)+n/111320,lng=Number(p.lng)+e/(111320*Math.cos(Number(p.lat)*Math.PI/180));
  return{lat:Math.round(lat*1e6)/1e6,lng:Math.round(lng*1e6)/1e6};
}
// A plant's map position from the plan, when it has none of its own (used by plPoint and the map).
function plPlanPt(p){if(!p||!gpOn(p)||!p.project)return null;const q=pjById(p.project);return q?gpToLatLng(q,p.pos.x,p.pos.y):null}
/* ---------- the view box (metres) ---------- */
function gpFit(pl){const m=Math.max(1,Math.max(pl.w,pl.h)*0.06);GP.vb={x:-m,y:-m,w:pl.w+2*m,h:pl.h+2*m}}
function gpZoom(f,cx,cy){const v=GP.vb;if(!v)return;const nw=Math.min(2000,Math.max(0.5,v.w*f)),k=nw/v.w;cx=cx==null?v.x+v.w/2:cx;cy=cy==null?v.y+v.h/2:cy;GP.vb={x:cx-(cx-v.x)*k,y:cy-(cy-v.y)*k,w:nw,h:v.h*k}}
/* ---------- drawing ---------- */
function gpSVG(p,pl){
  const v=GP.vb,u=v.w/100,ln=Math.max(v.w,v.h),fs=Math.max(0.12,u*2.8),dotR=Math.max(0.08,u*1.3);
  let g='';
  // grid: 1 m lines (only when they are not too dense), 5 m lines stronger
  const step=ln>120?10:ln>40?5:1;
  for(let x=Math.ceil(v.x/step)*step;x<=v.x+v.w;x+=step)g+='<line x1="'+x+'" y1="'+v.y+'" x2="'+x+'" y2="'+(v.y+v.h)+'" class="gl'+(x%5===0?' g5':'')+'"/>';
  for(let y=Math.ceil(v.y/step)*step;y<=v.y+v.h;y+=step)g+='<line x1="'+v.x+'" y1="'+y+'" x2="'+(v.x+v.w)+'" y2="'+y+'" class="gl'+(y%5===0?' g5':'')+'"/>';
  let s='<g class="gpgrid" style="stroke-width:'+(u*0.12)+'">'+g+'</g>';
  if(pl.bg&&pl.bg.photo)s+='<image href="'+esc(blobSrc(pl.bg.photo))+'" x="'+pl.bg.x+'" y="'+pl.bg.y+'" width="'+r2(pl.bg.wpx*pl.bg.scale)+'" height="'+r2(pl.bg.hpx*pl.bg.scale)+'" opacity="'+(pl.bg.op!=null?pl.bg.op:0.6)+'" preserveAspectRatio="none"/>';
  const ol=pl.outline&&pl.outline.length>2?pl.outline:[[0,0],[pl.w,0],[pl.w,pl.h],[0,pl.h]];
  s+='<polygon class="gpout" points="'+ol.map(q=>q.join(',')).join(' ')+'" style="stroke-width:'+(u*0.35)+'"/>';
  (p.places||[]).filter(x=>x.shape).forEach(x=>{const b=x.shape;s+='<g class="gpbed'+(GP.sel==='b:'+x.id?' sel':'')+'" data-gb="'+esc(x.id)+'"><rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" style="stroke-width:'+(u*0.25)+'"/><text x="'+(b.x+b.w/2)+'" y="'+(b.y+b.h/2)+'" style="font-size:'+fs+'px">'+esc(x.name)+'</text></g>'});
  const list=gpPlants(p).filter(gpOn).filter(x=>GP.planned||x.status!=='planned');
  if(GP.mature)list.forEach(x=>{const r=matureR(x);if(r)s+='<circle class="gpmat'+(x.status==='planned'?' pln':'')+'" cx="'+x.pos.x+'" cy="'+x.pos.y+'" r="'+r+'" style="stroke-width:'+(u*0.15)+'"/>'});
  list.forEach(x=>{const st=x.status==='planned'?'pln':x.status==='dead'||x.status==='removed'?'dead':x.status==='struggling'?'str':'ok';
    s+='<g class="gppl '+st+(GP.sel==='p:'+x.id?' sel':'')+'" data-gp="'+esc(x.id)+'"><circle cx="'+x.pos.x+'" cy="'+x.pos.y+'" r="'+dotR+'" style="stroke-width:'+(u*0.3)+'"/>'+
      (GP.labels?'<text x="'+(x.pos.x+dotR*1.4)+'" y="'+(x.pos.y+fs*0.35)+'" style="font-size:'+fs+'px">'+esc(gpShort(x))+'</text>':'')+'</g>'});
  (pl.refs||[]).forEach(r=>{s+='<g class="gpref"><path d="M'+r.x+' '+(r.y-dotR*1.6)+'L'+(r.x+dotR*1.4)+' '+(r.y+dotR)+'L'+(r.x-dotR*1.4)+' '+(r.y+dotR)+'Z"/><text x="'+(r.x+dotR*1.8)+'" y="'+(r.y+fs*0.35)+'" style="font-size:'+fs+'px">'+esc(r.name)+'</text></g>'});
  if(pl.anchor)s+='<g class="gpanc"><circle cx="'+pl.anchor.x+'" cy="'+pl.anchor.y+'" r="'+dotR*1.2+'" style="stroke-width:'+(u*0.3)+'"/></g>';
  GP.tmp.forEach(q=>{s+='<circle class="gptmp" cx="'+q[0]+'" cy="'+q[1]+'" r="'+dotR+'"/>'});
  if(GP.mode==='outline'&&GP.tmp.length>1)s+='<polyline class="gptmpl" points="'+GP.tmp.map(q=>q.join(',')).join(' ')+'" style="stroke-width:'+(u*0.3)+'"/>';
  if(GP.drag&&GP.drag.kind==='rect'){const d=GP.drag,x=Math.min(d.x0,d.x1),y=Math.min(d.y0,d.y1);s+='<rect class="gptmpr" x="'+x+'" y="'+y+'" width="'+Math.abs(d.x1-d.x0)+'" height="'+Math.abs(d.y1-d.y0)+'" style="stroke-width:'+(u*0.25)+'"/>'}
  // north arrow (from the anchor's bearing) and scale bar
  const rot=pl.anchor?-(Number(pl.anchor.rot)||0):null,sb=[1,2,5,10,20,50,100].find(n=>n>=v.w/6)||100;
  s+='<g class="gpsb" style="font-size:'+fs+'px"><line x1="'+(v.x+u*4)+'" y1="'+(v.y+v.h-u*4)+'" x2="'+(v.x+u*4+sb)+'" y2="'+(v.y+v.h-u*4)+'" style="stroke-width:'+(u*0.5)+'"/><text x="'+(v.x+u*4)+'" y="'+(v.y+v.h-u*5.5)+'">'+sb+' m</text></g>';
  if(rot!=null)s+='<g class="gpnorth" transform="translate('+(v.x+v.w-u*6)+','+(v.y+u*7)+') rotate('+rot+')"><path d="M0 '+(-u*4)+'L'+(u*1.6)+' '+(u*2)+'L0 '+(u*0.8)+'L'+(-u*1.6)+' '+(u*2)+'Z"/><text y="'+(-u*4.6)+'" style="font-size:'+fs+'px">N</text></g>';
  return '<svg id="gpSvg" class="gpsvg gm-'+GP.mode+'" style="aspect-ratio:'+r2(v.w)+'/'+r2(v.h)+'" viewBox="'+[v.x,v.y,v.w,v.h].map(r2).join(' ')+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+esc(tr('Garden plan','Trädgårdsplan','Tuinplan'))+'">'+s+'</svg>';
}
function gpShort(x){const s=bySid.get(x.sid);let n=s?(commonName(s)||s.latin):x.latin||x.sid;if(x.cultivar)n+=' '+cvQ(cvNorm(x.cultivar));return n.length>28?n.slice(0,27)+'…':n}
/* ---------- the panel under the plan, per mode ---------- */
const gpNum=(id,lab,v,step)=>'<label class="f"><span class="fl">'+esc(lab)+'</span><input id="'+id+'" type="number" step="'+(step||'0.1')+'" inputmode="decimal" value="'+(v==null?'':esc(String(v)))+'"></label>';
const gpBtn=(act,lab,pri,extra)=>'<button type="button" class="btn sm'+(pri?' primary':'')+'" data-act="'+act+'"'+(extra||'')+'>'+esc(lab)+'</button>';
function gpPanel(p,pl,ed){
  const plants=gpPlants(p),sel=GP.sel;
  let h='';
  if(sel.indexOf('p:')===0){const x=plants.find(q=>q.id===sel.slice(2));if(x){const r=matureR(x),ll=!hasPt(x)&&plPlanPt(x);
    h+='<div class="gpsel"><b>'+esc(plTitle(x))+'</b> '+pstatPill(x.status)+'<br><small class="muted">'+esc('x '+numTxt(x.pos.x)+' m · y '+numTxt(x.pos.y)+' m'+(r?' · '+tr('mature width ','full bredd ','volwassen breedte ')+fmtLen(r*200):'')+(ll?' · '+tr('map position from the plan','kartposition från planen','kaartpositie uit het plan'):''))+'</small>'+
      '<div class="acts" style="margin-top:6px"><a class="btn sm" href="#p-'+esc(x.id)+'">'+esc(tr('History','Historik','Geschiedenis'))+'</a>'+(ed?gpBtn('gp-unplace',tr('Take off the plan','Ta bort från planen','Van het plan halen'))+(x.status==='planned'?gpBtn('gp-planted',tr('Planted now','Planterad nu','Nu geplant')):''):'')+'</div></div>'}}
  if(sel.indexOf('b:')===0){const x=(p.places||[]).find(q=>q.id===sel.slice(2));if(x&&x.shape){const b=x.shape;
    h+='<div class="gpsel"><b>'+esc(x.name)+'</b> <small class="muted">'+esc(numTxt(b.w)+' × '+numTxt(b.h)+' m = '+numTxt(b.w*b.h)+' m²')+'</small>'+(ed?'<form class="obsform" onsubmit="return false" style="margin-top:6px">'+gpNum('gbX','x (m)',b.x)+gpNum('gbY','y (m)',b.y)+gpNum('gbW',tr('Width (m)','Bredd (m)','Breedte (m)'),b.w)+gpNum('gbH',tr('Length (m)','Längd (m)','Lengte (m)'),b.h)+
      '<div class="acts" style="grid-column:1/-1">'+gpBtn('gp-bed-save',tr('Save','Spara','Opslaan'),1,' data-id="'+esc(x.id)+'"')+gpBtn('gp-bed-del',tr('Take off the plan','Ta bort från planen','Van het plan halen'),0,' data-id="'+esc(x.id)+'"')+'<button type="button" class="btn sm" data-act="pj-place-pick" data-id="'+esc(x.id)+'">'+esc(tr('Pick a plant here','Välj en växt här','Kies hier een plant'))+'</button></div></form>':'')+'</div>'}}
  if(!ed)return h;
  const m=GP.mode;
  if(m==='view')h+='<p class="muted gphint">'+esc(tr('Drag a plant to move it. Drag the background to pan; zoom with the buttons. Tap a plant or bed for details.','Dra en planta för att flytta den. Dra i bakgrunden för att panorera; zooma med knapparna. Tryck på en planta eller bädd för detaljer.','Sleep een plant om hem te verplaatsen. Sleep de achtergrond om te schuiven; zoom met de knoppen. Tik op een plant of bed voor details.'))+'</p>';
  if(m==='plant'){const off=plants.filter(x=>!gpOn(x)),on=plants.filter(gpOn),opt=x=>'<option value="'+esc(x.id)+'"'+(GP.pend===x.id?' selected':'')+'>'+esc(plTitle(x)+(plPlaceName(x)?' · '+plPlaceName(x):''))+'</option>';
    h+='<form class="obsform" onsubmit="return false"><label class="f wide"><span class="fl">'+esc(tr('Plant','Planta','Plant'))+'</span><select id="gpPend">'+(off.length?'<optgroup label="'+esc(tr('Not on the plan yet','Inte på planen än','Nog niet op het plan'))+'">'+off.map(opt).join('')+'</optgroup>':'')+(on.length?'<optgroup label="'+esc(tr('Already on the plan (move)','Redan på planen (flytta)','Al op het plan (verplaatsen)'))+'">'+on.map(opt).join('')+'</optgroup>':'')+'</select></label>'+
      '<p class="muted gphint" style="grid-column:1/-1">'+esc(tr('Tap the plan where it grows, or measure from two reference points:','Tryck på planen där den växer, eller mät från två referenspunkter:','Tik op het plan waar hij groeit, of meet vanaf twee referentiepunten:'))+'</p>'+gpTapeHTML(pl)+'</form>'}
  if(m==='design')h+='<form class="obsform" onsubmit="return false"><label class="f wide"><span class="fl">'+esc(tr('Species for a planned plant','Art för en planerad planta','Soort voor een geplande plant'))+'</span><select id="gpNewSp">'+species.slice().sort(byName).map(x=>'<option value="'+esc(x.sid)+'"'+(GP.newSp===x.sid?' selected':'')+'>'+esc(dispName(x))+'</option>').join('')+'</select></label><p class="muted gphint" style="grid-column:1/-1">'+esc(tr('Tap the plan to put it there. It is saved as a planned planting record (design layer); turn “Planted now” on when it goes in the ground.','Tryck på planen för att placera den. Den sparas som en planerad plantering (designlager); välj ”Planterad nu” när den kommer i jorden.','Tik op het plan om hem daar te zetten. Hij wordt opgeslagen als geplande aanplant (ontwerplaag); kies “Nu geplant” als hij de grond in gaat.'))+'</p></form>';
  if(m==='bed'){const pls=(p.places||[]);h+='<form class="obsform" onsubmit="return false"><label class="f wide"><span class="fl">'+esc(tr('Place to draw','Plats att rita','Plek om te tekenen'))+'</span><select id="gpBedFor">'+pls.map(x=>'<option value="'+esc(x.id)+'"'+(GP.bedFor===x.id?' selected':'')+'>'+esc(x.name+(x.shape?' ✓':''))+'</option>').join('')+'<option value="__new"'+(GP.bedFor==='__new'||!pls.length?' selected':'')+'>'+esc(tr('New place…','Ny plats…','Nieuwe plek…'))+'</option></select></label><label class="f"><span class="fl">'+esc(tr('Name of a new place','Namn på en ny plats','Naam van een nieuwe plek'))+'</span><input id="gpBedName" maxlength="60"></label><p class="muted gphint" style="grid-column:1/-1">'+esc(tr('Drag a rectangle on the plan. You can type exact sizes afterwards.','Dra en rektangel på planen. Exakta mått kan du skriva in efteråt.','Sleep een rechthoek op het plan. Exacte maten kun je daarna intypen.'))+'</p></form>'}
  if(m==='outline')h+='<p class="muted gphint">'+esc(tr('Tap the corners of the garden in order, then “Finish outline”. Or type a rectangle:','Tryck på trädgårdens hörn i tur och ordning, sedan ”Klar med konturen”. Eller skriv in en rektangel:','Tik de hoeken van de tuin op volgorde aan en kies dan “Omtrek klaar”. Of typ een rechthoek:'))+'</p><div class="acts">'+gpBtn('gp-out-done',tr('Finish outline','Klar med konturen','Omtrek klaar'),1,GP.tmp.length<3?' disabled':'')+gpBtn('gp-out-clear',tr('Start again','Börja om','Opnieuw'))+'</div><form class="obsform" onsubmit="return false" style="margin-top:8px">'+gpNum('gpW',tr('Width (m)','Bredd (m)','Breedte (m)'),pl.w)+gpNum('gpH',tr('Length (m)','Längd (m)','Lengte (m)'),pl.h)+'<div class="acts" style="align-self:end">'+gpBtn('gp-size',tr('Use this rectangle','Använd rektangeln','Deze rechthoek gebruiken'))+'</div></form>';
  if(m==='refs')h+='<form class="obsform" onsubmit="return false"><label class="f"><span class="fl">'+esc(tr('Name of a fixed point (house corner, gate post…)','Namn på en fast punkt (husknut, grindstolpe…)','Naam van een vast punt (hoek van het huis, hekpaal…)'))+'</span><input id="gpRefName" maxlength="40"></label><p class="muted gphint" style="grid-column:1/-1">'+esc(tr('Type a name, then tap the plan where that point is.','Skriv ett namn och tryck sedan på planen där punkten är.','Typ een naam en tik dan op het plan waar dat punt is.'))+'</p></form>'+
    ((pl.refs||[]).length?'<div class="stack">'+pl.refs.map(r=>'<div class="ent"><span><b>'+esc(r.name)+'</b> <small class="muted">x '+esc(numTxt(r.x))+' · y '+esc(numTxt(r.y))+'</small></span><span class="acts">'+gpBtn('gp-ref-del',tr('Remove','Ta bort','Verwijderen'),0,' data-id="'+esc(r.id)+'"')+'</span></div>').join('')+'</div>':'')+
    '<h3 class="gph3">'+esc(tr('Link the plan to the map (optional)','Koppla planen till kartan (valfritt)','Het plan aan de kaart koppelen (optioneel)'))+'</h3>'+
    (hasPt(p)?'<p class="muted gphint">'+esc(tr('Tap “Site point here”, then tap where the project’s site point is on the plan, and choose which way is north. Plants on the plan then get a map position for the climate look-ups; the plan itself stores no coordinates.','Tryck ”Platspunkten här” och sedan där projektets platspunkt ligger på planen, och välj vilket håll som är norr. Plantor på planen får då en kartposition för klimatuppslagen; själva planen lagrar inga koordinater.','Tik “Locatie hier” en daarna waar de locatie van het project op het plan ligt, en kies waar het noorden is. Planten op het plan krijgen dan een kaartpositie voor het klimaat; het plan zelf bewaart geen coördinaten.'))+'</p><div class="acts">'+gpBtn('gp-anchor',tr('Site point here','Platspunkten här','Locatie hier'),GP.pickAnchor)+'<label class="f" style="margin:0"><span class="fl">'+esc(tr('“Up” on the plan points to','”Upp” på planen pekar mot','“Boven” op het plan wijst naar'))+'</span><select id="gpRot">'+[0,45,90,135,180,225,270,315].map(d=>'<option value="'+d+'"'+((pl.anchor&&Number(pl.anchor.rot)===d)?' selected':'')+'>'+['N','NE/NO','E/Ö','SE/SO','S','SW/SV','W/V','NW/NV'][d/45]+' ('+d+'°)</option>').join('')+'</select></label></div>'
      :'<p class="muted gphint">'+esc(tr('Save a site point for the project first.','Spara först en platspunkt för projektet.','Sla eerst een locatie voor het project op.'))+'</p>');
  if(m==='bg'){const b=pl.bg;
    h+='<p class="muted gphint">'+esc(tr('A drone or phone photo, a hand drawing or a screenshot. Then mark two points on it and type the real distance between them, so it gets the right size.','Ett drönar- eller mobilfoto, en handritning eller en skärmbild. Markera sedan två punkter och skriv det verkliga avståndet mellan dem, så får den rätt storlek.','Een drone- of telefoonfoto, een tekening of een schermafbeelding. Markeer daarna twee punten en typ de echte afstand ertussen, zodat hij de juiste grootte krijgt.'))+'</p>'+
      '<form class="obsform" onsubmit="return false"><label class="f wide"><span class="fl">'+esc(b?tr('Replace the background','Byt bakgrund','Achtergrond vervangen'):tr('Background image','Bakgrundsbild','Achtergrondafbeelding'))+'</span><input id="gpBgFile" type="file" accept="image/*"></label>'+
      (b?gpNum('gpBgX',tr('Shift right (m)','Flytta höger (m)','Naar rechts (m)'),b.x)+gpNum('gpBgY',tr('Shift down (m)','Flytta ned (m)','Naar beneden (m)'),b.y)+'<label class="f"><span class="fl">'+esc(tr('Opacity','Täckning','Dekking'))+'</span><input id="gpBgOp" type="range" min="0.1" max="1" step="0.1" value="'+(b.op!=null?b.op:0.6)+'"></label>'+
        '<div class="acts" style="grid-column:1/-1">'+gpBtn('gp-bg-save',tr('Save position','Spara läget','Positie opslaan'))+gpBtn('gp-cal',GP.cal.length?tr('Tap the second point…','Tryck på andra punkten…','Tik het tweede punt aan…'):tr('Set the scale: mark two points','Ställ in skalan: markera två punkter','Schaal instellen: markeer twee punten'),GP.mode==='bg'&&GP.calOn)+gpBtn('gp-bg-del',tr('Remove','Ta bort','Verwijderen'))+'</div>':'')+'</form>'+
      (GP.cal.length===2?'<form class="obsform" onsubmit="return false">'+gpNum('gpCalD',tr('Real distance between the two points (m)','Verkligt avstånd mellan punkterna (m)','Echte afstand tussen de twee punten (m)'),'')+'<div class="acts" style="align-self:end">'+gpBtn('gp-cal-save',tr('Apply','Använd','Toepassen'),1)+'</div></form>':'')}
  return h;
}
// Tape-measure placement: distances from two reference points; the two possible spots are offered.
function gpTapeHTML(pl){
  const rs=pl.refs||[];if(rs.length<2)return '<p class="muted gphint" style="grid-column:1/-1">'+esc(tr('Add two reference points (tab “Reference points”) to place plants with a tape measure.','Lägg till två referenspunkter (fliken ”Referenspunkter”) för att placera plantor med måttband.','Voeg twee referentiepunten toe (tab “Referentiepunten”) om planten met een meetlint te plaatsen.'))+'</p>';
  const o=v=>rs.map(r=>'<option value="'+esc(r.id)+'"'+(r.id===v?' selected':'')+'>'+esc(r.name)+'</option>').join('');
  let h='<label class="f"><span class="fl">'+esc(tr('From','Från','Vanaf'))+'</span><select id="gpTa">'+o(GP.ta||rs[0].id)+'</select></label>'+gpNum('gpTda',tr('distance (m)','avstånd (m)','afstand (m)'),GP.tda)+
    '<label class="f"><span class="fl">'+esc(tr('and from','och från','en vanaf'))+'</span><select id="gpTb">'+o(GP.tb||rs[1].id)+'</select></label>'+gpNum('gpTdb',tr('distance (m)','avstånd (m)','afstand (m)'),GP.tdb)+
    '<div class="acts" style="grid-column:1/-1">'+gpBtn('gp-tape',tr('Find the spot','Hitta platsen','Plek zoeken'))+'</div>';
  if(GP.tape)h+='<div class="acts" style="grid-column:1/-1">'+(GP.tape.length?GP.tape.map((q,i)=>gpBtn('gp-tape-put',tr('Put it at ','Placera vid ','Zet hem op ')+'x '+numTxt(q[0])+', y '+numTxt(q[1]),i===0,' data-i="'+i+'"')).join(''):'<span class="admwarn">'+esc(tr('These distances do not meet: check the numbers.','Avstånden möts inte: kontrollera siffrorna.','Deze afstanden komen niet samen: controleer de getallen.'))+'</span>')+'</div>';
  return h;
}
function gpCircles(a,b,ra,rb){
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(!d||d>ra+rb+1e-9||d<Math.abs(ra-rb)-1e-9)return [];
  const k=(ra*ra-rb*rb+d*d)/(2*d),h=Math.sqrt(Math.max(0,ra*ra-k*k)),mx=a.x+k*dx/d,my=a.y+k*dy/d;
  const s=[[r2(mx+h*dy/d),r2(my-h*dx/d)],[r2(mx-h*dy/d),r2(my+h*dx/d)]];return h<1e-6?[s[0]]:s;
}
const gpInside=(pl,q)=>q[0]>=0&&q[1]>=0&&q[0]<=pl.w&&q[1]<=pl.h;
/* ---------- the page ---------- */
function updatePlan(){
  const box=$('#gpBody');if(!box)return;const p=gpProj();
  if(!PROJ_ON||!p){box.innerHTML='<div class="empty"><p>'+esc(tr('Choose a project first (Projects page).','Välj ett projekt först (sidan Projekt).','Kies eerst een project (pagina Projecten).'))+'</p></div>';return}
  const ed=projCanEdit(p.id),pl=gpPlan(p);
  const head='<div class="ovhead"><div><p style="margin:0"><a href="#projects" class="lnk">← '+esc(pjName(p.id))+'</a></p><h1 style="margin:4px 0">'+esc(tr('Garden plan','Trädgårdsplan','Tuinplan'))+'</h1>'+
    '<p class="muted" style="margin:0">'+esc(tr('Drawn in metres on your own plan: no GPS needed, and no coordinates stored in it.','Ritad i meter på din egen plan: ingen GPS behövs och inga koordinater lagras i den.','Getekend in meters op je eigen plan: geen GPS nodig en er worden geen coördinaten in opgeslagen.'))+'</p></div></div>';
  if(!pl){box.innerHTML=head+(ed?'<form class="obsform" onsubmit="return false" style="margin-top:12px">'+gpNum('gpW',tr('Width of the garden (m)','Trädgårdens bredd (m)','Breedte van de tuin (m)'),'')+gpNum('gpH',tr('Length (m)','Längd (m)','Lengte (m)'),'')+'<div class="acts" style="align-self:end">'+gpBtn('gp-create',tr('Start the plan','Börja planen','Plan beginnen'),1)+'</div><p class="muted gphint" style="grid-column:1/-1">'+esc(tr('Measure roughly with steps or a tape; you can draw the exact outline afterwards. A balcony works too (for example 3 × 1.5 m).','Mät ungefär med steg eller måttband; den exakta konturen kan du rita efteråt. En balkong går också (till exempel 3 × 1,5 m).','Meet ruwweg met passen of een meetlint; de precieze omtrek kun je daarna tekenen. Een balkon kan ook (bijvoorbeeld 3 × 1,5 m).'))+'</p></form>':'<div class="empty"><p>'+esc(tr('This project has no plan yet.','Projektet har ingen plan ännu.','Dit project heeft nog geen plan.'))+'</p></div>');return}
  if(!GP.vb||GP.vbFor!==p.id){gpFit(pl);GP.vbFor=p.id}
  const modes=ed?GP_MODES:GP_MODES.filter(o=>o.k==='view');
  box.innerHTML=head+
    '<div class="seg gpmodes" role="group" aria-label="'+esc(tr('Tool','Verktyg','Gereedschap'))+'">'+modes.map(o=>'<button type="button" data-act="gp-mode" data-k="'+o.k+'" aria-pressed="'+(GP.mode===o.k)+'">'+esc(t3(o))+'</button>').join('')+'</div>'+
    '<div class="gpbar"><label class="chk"><input type="checkbox" id="gpMature"'+(GP.mature?' checked':'')+'> '+esc(tr('Mature size','Fullvuxen storlek','Volwassen grootte'))+'</label><label class="chk"><input type="checkbox" id="gpPlanned"'+(GP.planned?' checked':'')+'> '+esc(tr('Planned plants','Planerade plantor','Geplande planten'))+'</label><label class="chk"><input type="checkbox" id="gpLabels"'+(GP.labels?' checked':'')+'> '+esc(tr('Names','Namn','Namen'))+'</label>'+
      '<span class="acts">'+gpBtn('gp-zoom',' + ',0,' data-f="0.7" aria-label="'+esc(tr('Zoom in','Zooma in','Inzoomen'))+'"')+gpBtn('gp-zoom',' − ',0,' data-f="1.4" aria-label="'+esc(tr('Zoom out','Zooma ut','Uitzoomen'))+'"')+gpBtn('gp-fit',tr('Whole plan','Hela planen','Hele plan'))+gpBtn('gp-print',tr('Print','Skriv ut','Afdrukken'))+'</span></div>'+
    '<div class="gpwrap">'+gpSVG(p,pl)+'</div>'+
    '<div class="gpkey"><span><i class="k ok"></i>'+esc(tr('planted','planterad','geplant'))+'</span><span><i class="k pln"></i>'+esc(tr('planned','planerad','gepland'))+'</span><span><i class="k dead"></i>'+esc(tr('dead or removed','död eller borttagen','dood of verwijderd'))+'</span><span><i class="k mat"></i>'+esc(tr('mature width (species spread)','full bredd (artens bredd)','volwassen breedte (breedte van de soort)'))+'</span>'+gpOverlapTxt(p)+'</div>'+
    '<div class="gppanel">'+gpPanel(p,pl,ed)+'</div>';
}
// Plants whose mature circles overlap a lot (closer than 60 % of the sum of their radii).
function gpOverlapTxt(p){
  if(!GP.mature)return '';const l=gpPlants(p).filter(gpOn).filter(x=>x.status!=='dead'&&x.status!=='removed').map(x=>({x,r:matureR(x)})).filter(o=>o.r);let n=0;
  for(let i=0;i<l.length;i++)for(let j=i+1;j<l.length;j++)if(Math.hypot(l[i].x.pos.x-l[j].x.pos.x,l[i].x.pos.y-l[j].x.pos.y)<0.6*(l[i].r+l[j].r))n++;
  return n?'<span class="admwarn">'+esc(n+' '+(n===1?tr('pair of plants will crowd each other when grown','par plantor kommer att tränga varandra fullvuxna','paar planten zal elkaar volgroeid verdringen'):tr('pairs of plants will crowd each other when grown','par plantor kommer att tränga varandra fullvuxna','paren planten zullen elkaar volgroeid verdringen')))+'</span>':'';
}
/* ---------- saving ---------- */
async function gpSave(patch,msg){const p=gpProj();if(!p)return;const pl=Object.assign({},gpPlan(p)||{},patch);await pjSaveDoc(pjById(p.id)||p,{plan:pl},msg)}
function gpSetPos(id,x,y,msg){return plPatch(id,d=>{d.pos={x:r2(x),y:r2(y)}},msg)}
/* ---------- pointer handling on the plan ---------- */
function gpPt(e){const s=$('#gpSvg');if(!s)return null;const pt=s.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const m=s.getScreenCTM();if(!m)return null;const q=pt.matrixTransform(m.inverse());return[r2(q.x),r2(q.y)]}
function gpDown(e){
  const s=e.target.closest('#gpSvg');if(!s)return;const p=gpProj(),pl=gpPlan(p);if(!p||!pl)return;const ed=projCanEdit(p.id),q=gpPt(e);if(!q)return;
  const pg=e.target.closest('[data-gp]'),bg=e.target.closest('[data-gb]');
  if(GP.mode==='view'){
    if(pg){GP.sel='p:'+pg.dataset.gp;GP.drag=ed?{kind:'plant',id:pg.dataset.gp,x0:q[0],y0:q[1],moved:false}:null}
    else if(bg){GP.sel='b:'+bg.dataset.gb;GP.drag={kind:'pan',cx:e.clientX,cy:e.clientY,vb:Object.assign({},GP.vb)}}
    else{GP.drag={kind:'pan',cx:e.clientX,cy:e.clientY,vb:Object.assign({},GP.vb),tap:true}}
    try{s.setPointerCapture(e.pointerId)}catch(x){}e.preventDefault();updatePlan();return}
  if(!ed)return;
  if(GP.mode==='bed'){GP.drag={kind:'rect',x0:q[0],y0:q[1],x1:q[0],y1:q[1]};try{s.setPointerCapture(e.pointerId)}catch(x){}e.preventDefault();return}
  e.preventDefault();gpTap(p,pl,q);
}
function gpMove(e){
  const d=GP.drag;if(!d)return;const s=$('#gpSvg');if(!s)return;
  if(d.kind==='pan'){const r=s.getBoundingClientRect(),k=d.vb.w/r.width,dx=(e.clientX-d.cx)*k,dy=(e.clientY-d.cy)*k;if(Math.abs(e.clientX-d.cx)+Math.abs(e.clientY-d.cy)>4)d.tap=false;GP.vb={x:d.vb.x-dx,y:d.vb.y-dy,w:d.vb.w,h:d.vb.h};s.setAttribute('viewBox',[GP.vb.x,GP.vb.y,GP.vb.w,GP.vb.h].map(r2).join(' '));return}
  const q=gpPt(e);if(!q)return;
  if(d.kind==='plant'){const g=s.querySelector('[data-gp="'+d.id+'"]');if(!g)return;d.moved=d.moved||Math.hypot(q[0]-d.x0,q[1]-d.y0)>0.05;d.x1=q[0];d.y1=q[1];g.setAttribute('transform','translate('+r2(q[0]-d.x0)+','+r2(q[1]-d.y0)+')');return}
  if(d.kind==='rect'){d.x1=q[0];d.y1=q[1];const p=gpProj();if(p&&gpPlan(p)){const w=$('.gpwrap');if(w)w.innerHTML=gpSVG(p,gpPlan(p))}}
}
async function gpUp(e){
  const d=GP.drag;if(!d)return;GP.drag=null;
  if(d.kind==='pan'){if(d.tap&&!e.target.closest('[data-gb]'))GP.sel='';updatePlan();return}
  if(d.kind==='plant'){if(d.moved){const x=(state.plantings||[]).find(q=>q.id===d.id);if(x&&gpOn(x)){await gpSetPos(d.id,x.pos.x+(d.x1-d.x0),x.pos.y+(d.y1-d.y0));return}}updatePlan();return}
  if(d.kind==='rect'){const p=gpProj();if(!p)return;const x=Math.min(d.x0,d.x1),y=Math.min(d.y0,d.y1),w=Math.abs(d.x1-d.x0),h=Math.abs(d.y1-d.y0);
    if(w<0.1||h<0.1){updatePlan();return}await gpBedSet(p,{x:r2(x),y:r2(y),w:r2(w),h:r2(h)})}
}
async function gpBedSet(p,shape){
  const sel=($('#gpBedFor')||{}).value||'__new';let places=(p.places||[]).slice(),id=sel;
  if(sel==='__new'){const n=String(($('#gpBedName')||{}).value||'').trim()||tr('Bed ','Bädd ','Bed ')+(places.length+1);id=newId();places.push({id,name:n.slice(0,60),kind:'bed',shape})}
  else places=places.map(x=>x.id===sel?Object.assign({},x,{shape}):x);
  GP.bedFor=id;GP.sel='b:'+id;await pjSaveDoc(pjById(p.id)||p,{places},tr('Bed drawn','Bädden ritad','Bed getekend'));
}
async function gpTap(p,pl,q){
  const m=GP.mode;
  if(m==='plant'){const id=($('#gpPend')||{}).value;if(!id)return;GP.sel='p:'+id;GP.pend='';await gpSetPos(id,q[0],q[1],tr('Placed on the plan','Placerad på planen','Op het plan gezet'));return}
  if(m==='design'){const sid=($('#gpNewSp')||{}).value,x=bySid.get(sid);if(!x)return;GP.newSp=sid;
    const doc={sid,latin:x.latin,place:'',date:today(),count:1,source:'',status:'planned',notes:'',checks:[],createdAt:Date.now(),project:p.id,pos:{x:q[0],y:q[1]}};
    const pi=(p.places||[]).find(b=>b.shape&&q[0]>=b.shape.x&&q[0]<=b.shape.x+b.shape.w&&q[1]>=b.shape.y&&q[1]<=b.shape.y+b.shape.h);if(pi){doc.placeId=pi.id;doc.place=pi.name}
    try{const id=await Data.saveRow('plantings',null,doc);GP.sel='p:'+id;toast(tr('Planned plant added','Planerad planta tillagd','Geplande plant toegevoegd'))}catch(e){toast(errMsg(e),'err')}return}
  if(m==='outline'){GP.tmp.push(q);updatePlan();return}
  if(m==='refs'){
    if(GP.pickAnchor){GP.pickAnchor=false;await gpSave({anchor:{x:q[0],y:q[1],rot:Number(($('#gpRot')||{}).value)||0}},tr('The plan is linked to the site point','Planen är kopplad till platspunkten','Het plan is aan de locatie gekoppeld'));return}
    const n=String(($('#gpRefName')||{}).value||'').trim();if(!n){toast(tr('Type a name for the point first.','Skriv ett namn för punkten först.','Typ eerst een naam voor het punt.'),'err');return}
    await gpSave({refs:(pl.refs||[]).concat([{id:recId(),name:n.slice(0,40),x:q[0],y:q[1]}])},tr('Reference point saved','Referenspunkten sparad','Referentiepunt opgeslagen'));return}
  if(m==='bg'&&GP.calOn){GP.cal.push(q);if(GP.cal.length>=2)GP.calOn=false;GP.tmp=GP.cal.slice();updatePlan();return}
}
/* ---------- background photo ---------- */
async function gpBgUpload(f){
  const p=gpProj(),pl=gpPlan(p);if(!p||!pl||!f)return;
  toast(tr('Uploading the background…','Laddar upp bakgrunden…','Achtergrond uploaden…'));
  try{let bm;try{bm=await createImageBitmap(f,{imageOrientation:'from-image'})}catch(e){bm=null}
    const w0=bm?bm.width:1600,h0=bm?bm.height:1200,k=Math.min(1,1600/Math.max(w0,h0)),wpx=Math.round(w0*k),hpx=Math.round(h0*k);
    const id=await uploadPlPhoto(f);
    await gpSave({bg:{photo:id,x:0,y:0,wpx,hpx,scale:r2(pl.w/wpx*1e4)/1e4,op:0.6}},tr('Background added. Now set its scale.','Bakgrund tillagd. Ställ nu in skalan.','Achtergrond toegevoegd. Stel nu de schaal in.'))}
  catch(e){toast(errMsg(e),'err')}
}
async function gpCalSave(){
  const p=gpProj(),pl=gpPlan(p);if(!pl||!pl.bg||GP.cal.length<2)return;const D=Number(($('#gpCalD')||{}).value);
  if(!(D>0)){toast(tr('Type the real distance in metres.','Skriv det verkliga avståndet i meter.','Typ de echte afstand in meters.'),'err');return}
  const a=GP.cal[0],b=GP.cal[1],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!d)return;const k=D/d,bg=pl.bg;
  // Scale the image around its own top-left corner.
  const nb=Object.assign({},bg,{scale:Math.round(bg.scale*k*1e6)/1e6});GP.cal=[];GP.tmp=[];
  await gpSave({bg:nb},tr('Scale set: ','Skala inställd: ','Schaal ingesteld: ')+'1 m = '+Math.round(1/nb.scale)+' px');
}
/* ---------- printing: the plan as a poster with a numbered plant list (print income line) ---------- */
function gpPrint(){
  const p=gpProj(),pl=gpPlan(p);if(!pl)return;const keep=Object.assign({},GP.vb),lab=GP.labels;gpFit(pl);GP.labels=false;
  const list=gpPlants(p).filter(gpOn).filter(x=>GP.planned||x.status!=='planned').sort((a,b)=>a.pos.y-b.pos.y||a.pos.x-b.pos.x);
  let svg=gpSVG(p,pl);GP.vb=keep;GP.labels=lab;
  // numbers next to the dots
  const u=(Math.max(pl.w,pl.h)*1.12)/100,fs=Math.max(0.12,u*2.1);
  svg=svg.replace('</svg>',list.map((x,i)=>'<text x="'+(x.pos.x+u*1.6)+'" y="'+(x.pos.y+fs*0.35)+'" style="font-size:'+fs+'px;font-family:sans-serif">'+(i+1)+'</text>').join('')+'</svg>');
  const css='body{font-family:system-ui,sans-serif;margin:12mm;color:#1f2a22}h1{font-size:20px;margin:0 0 6px}svg{width:100%;max-height:170mm;border:1px solid #ccc}.gl{stroke:#e3e6e0}.g5{stroke:#c9cfc6}.gpout{fill:none;stroke:#1f3a2c}.gpbed rect{fill:#e9efe4;stroke:#6b8f5e}.gpbed text{text-anchor:middle;fill:#2f5d3a}.gpmat{fill:rgba(47,93,58,.08);stroke:#6b8f5e;stroke-dasharray:.3 .2}.gpmat.pln{fill:none}.gppl circle{fill:#2f5d3a;stroke:#fff}.gppl.pln circle{fill:#fff;stroke:#2f5d3a;stroke-dasharray:.2 .1}.gppl.dead circle{fill:#999}.gpref path{fill:#b07a12}.gpref text,.gpsb text,.gpnorth text{fill:#333}.gpsb line{stroke:#333}.gpnorth path{fill:#333}.gpanc circle{fill:none;stroke:#2a6f9e}table{border-collapse:collapse;font-size:12px;margin-top:8px;width:100%}td,th{border-bottom:1px solid #ddd;padding:3px 6px;text-align:left}';
  const rows=list.map((x,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(plTitle(x))+'</td><td>'+esc(trs((PSTAT.find(o=>o.k===x.status)||{en:''}).en,(PSTAT.find(o=>o.k===x.status)||{sv:''}).sv))+'</td><td>'+esc(plPlaceName(x))+'</td><td>'+(matureR(x)?esc(fmtLen(matureR(x)*200)):'')+'</td></tr>').join('');
  const html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+esc(pjName(p.id))+'</title><style>'+css+'</style></head><body><h1>'+esc(pjName(p.id))+' · '+esc(tr('Garden plan','Trädgårdsplan','Tuinplan'))+'</h1><p style="margin:0 0 6px;font-size:12px">'+esc(numTxt(pl.w)+' × '+numTxt(pl.h)+' m · '+today())+'</p>'+svg+
    '<table><tr><th>#</th><th>'+esc(tr('Plant','Planta','Plant'))+'</th><th>'+esc(tr('Status','Status','Status'))+'</th><th>'+esc(tr('Place','Plats','Plek'))+'</th><th>'+esc(tr('Mature width','Full bredd','Volwassen breedte'))+'</th></tr>'+rows+'</table></body></html>';
  const f=document.createElement('iframe');f.style.cssText='position:fixed;width:0;height:0;border:0;left:-9999px';document.body.appendChild(f);
  f.onload=()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(e){toast(tr('Printing is blocked here.','Utskrift blockeras här.','Afdrukken is hier geblokkeerd.'),'err')}setTimeout(()=>f.remove(),60000)};
  f.srcdoc=html;
}
/* ---------- events (called from part 21) ---------- */
function gpClick(act,a){
  if(act==='gp-open'){GP.vbFor='';go('plan');return true}
  if(act==='gp-mode'){GP.mode=a.dataset.k;GP.tmp=[];GP.cal=[];GP.calOn=false;GP.pickAnchor=false;GP.tape=null;updatePlan();return true}
  if(act==='gp-create'){const w=Number(($('#gpW')||{}).value),h=Number(($('#gpH')||{}).value);if(!(w>0&&h>0)){toast(tr('Give the width and length in metres.','Ange bredd och längd i meter.','Geef breedte en lengte in meters.'),'err');return true}
    GP.vbFor='';gpSave({w:r2(w),h:r2(h),outline:null,refs:[],bg:null,anchor:null},tr('Plan started','Planen påbörjad','Plan begonnen'));return true}
  if(act==='gp-size'){const w=Number(($('#gpW')||{}).value),h=Number(($('#gpH')||{}).value);if(w>0&&h>0){GP.vbFor='';gpSave({w:r2(w),h:r2(h),outline:null},tr('Outline saved','Konturen sparad','Omtrek opgeslagen'))}return true}
  if(act==='gp-out-clear'){GP.tmp=[];updatePlan();return true}
  if(act==='gp-out-done'){if(GP.tmp.length<3)return true;const xs=GP.tmp.map(q=>q[0]),ys=GP.tmp.map(q=>q[1]),x0=Math.min.apply(null,xs),y0=Math.min.apply(null,ys);
    // The outline's corner nearest the top-left becomes 0,0; everything else keeps its place relative to it.
    const p=gpProj(),pl=gpPlan(p),ol=GP.tmp.map(q=>[r2(q[0]-x0),r2(q[1]-y0)]);GP.tmp=[];GP.vbFor='';
    const sh=(o)=>Object.assign({},o,{x:r2(o.x-x0),y:r2(o.y-y0)});
    gpSave({outline:ol,w:r2(Math.max.apply(null,xs)-x0),h:r2(Math.max.apply(null,ys)-y0),refs:(pl.refs||[]).map(sh),anchor:pl.anchor?Object.assign(sh(pl.anchor),{rot:pl.anchor.rot}):null,bg:pl.bg?sh(pl.bg):null},tr('Outline saved','Konturen sparad','Omtrek opgeslagen')).then(()=>gpShiftAll(p.id,x0,y0));return true}
  if(act==='gp-ref-del'){const p=gpProj(),pl=gpPlan(p);if(pl)gpSave({refs:(pl.refs||[]).filter(r=>r.id!==a.dataset.id)});return true}
  if(act==='gp-anchor'){GP.pickAnchor=!GP.pickAnchor;updatePlan();return true}
  if(act==='gp-zoom'){gpZoom(Number(a.dataset.f));updatePlan();return true}
  if(act==='gp-fit'){const p=gpProj(),pl=gpPlan(p);if(pl){gpFit(pl);updatePlan()}return true}
  if(act==='gp-print'){gpPrint();return true}
  if(act==='gp-unplace'){const id=GP.sel.slice(2);GP.sel='';plPatch(id,d=>{delete d.pos},tr('Taken off the plan','Borttagen från planen','Van het plan gehaald'));return true}
  if(act==='gp-planted'){const id=GP.sel.slice(2);plPatch(id,d=>{d.status='alive';d.date=today();d.checks=(d.checks||[]).concat([{date:today(),status:'alive',note:tr('Planted (from the plan)','Planterad (från planen)','Geplant (vanuit het plan)')}])},tr('Marked as planted today','Markerad som planterad i dag','Vandaag als geplant gemarkeerd'));return true}
  if(act==='gp-bed-save'){const p=gpProj(),v=k=>Number(($('#'+k)||{}).value);const s={x:v('gbX'),y:v('gbY'),w:v('gbW'),h:v('gbH')};if([s.x,s.y,s.w,s.h].every(isFinite)&&s.w>0&&s.h>0&&p)pjSaveDoc(pjById(p.id)||p,{places:(p.places||[]).map(x=>x.id===a.dataset.id?Object.assign({},x,{shape:{x:r2(s.x),y:r2(s.y),w:r2(s.w),h:r2(s.h)}}):x)},tr('Bed saved','Bädden sparad','Bed opgeslagen'));return true}
  if(act==='gp-bed-del'){const p=gpProj();GP.sel='';if(p)pjSaveDoc(pjById(p.id)||p,{places:(p.places||[]).map(x=>{if(x.id!==a.dataset.id)return x;const y=Object.assign({},x);delete y.shape;return y})});return true}
  if(act==='gp-tape'){const p=gpProj(),pl=gpPlan(p);if(!pl)return true;const A=(pl.refs||[]).find(r=>r.id===$('#gpTa').value),B=(pl.refs||[]).find(r=>r.id===$('#gpTb').value),da=Number($('#gpTda').value),db=Number($('#gpTdb').value);
    GP.ta=A&&A.id;GP.tb=B&&B.id;GP.tda=da;GP.tdb=db;GP.pend=($('#gpPend')||{}).value||'';
    if(!A||!B||A===B||!(da>=0)||!(db>=0)){toast(tr('Choose two different points and both distances.','Välj två olika punkter och båda avstånden.','Kies twee verschillende punten en beide afstanden.'),'err');return true}
    GP.tape=gpCircles(A,B,da,db).sort((q,r)=>(gpInside(pl,r)?1:0)-(gpInside(pl,q)?1:0));GP.tmp=GP.tape.slice();updatePlan();return true}
  if(act==='gp-tape-put'){const q=GP.tape&&GP.tape[Number(a.dataset.i)],id=GP.pend||($('#gpPend')||{}).value;if(q&&id){GP.tape=null;GP.tmp=[];GP.sel='p:'+id;GP.pend='';gpSetPos(id,q[0],q[1],tr('Placed by tape measure','Placerad med måttband','Met het meetlint geplaatst'))}return true}
  if(act==='gp-bg-save'){const p=gpProj(),pl=gpPlan(p);if(pl&&pl.bg){const x=Number($('#gpBgX').value),y=Number($('#gpBgY').value),op=Number($('#gpBgOp').value);gpSave({bg:Object.assign({},pl.bg,{x:isFinite(x)?r2(x):0,y:isFinite(y)?r2(y):0,op:isFinite(op)?op:0.6})},tr('Background saved','Bakgrunden sparad','Achtergrond opgeslagen'))}return true}
  if(act==='gp-bg-del'){arm(a,()=>gpSave({bg:null},tr('Background removed','Bakgrunden borttagen','Achtergrond verwijderd')));return true}
  if(act==='gp-cal'){GP.calOn=true;GP.cal=[];GP.tmp=[];updatePlan();toast(tr('Tap the first point on the background.','Tryck på första punkten på bakgrunden.','Tik het eerste punt op de achtergrond aan.'));return true}
  if(act==='gp-cal-save'){gpCalSave();return true}
  if(act==='ph-plan'){const p=(state.plantings||[]).find(x=>x.id===a.dataset.id);if(p&&p.project){pjSet(p.project);GP.sel=gpOn(p)?'p:'+p.id:'';GP.mode=gpOn(p)?'view':'plant';GP.pend=p.id;GP.vbFor='';go('plan')}return true}
  if(act==='pl-mapplace'){plState.mapPlace=a.dataset.id;if($('#v-plantings').hidden)go('plantings');else updatePlantings();return true}
  if(act==='pl-mapplace-stop'){plState.mapPlace='';updatePlantings();return true}
  return false;
}
// When the outline moved the plan's corner, plants keep their place on the ground.
async function gpShiftAll(pid,x0,y0){
  if(!x0&&!y0)return;const rows=(state.plantings||[]).filter(x=>x.project===pid&&gpOn(x)).map(x=>{const d=plDoc(x);d.pos={x:r2(x.pos.x-x0),y:r2(x.pos.y-y0)};return{id:x.id,data:d}});
  const p=pjById(pid);if(p&&(p.places||[]).some(b=>b.shape))await pjSaveDoc(p,{places:p.places.map(b=>b.shape?Object.assign({},b,{shape:Object.assign({},b.shape,{x:r2(b.shape.x-x0),y:r2(b.shape.y-y0)})}):b)});
  if(rows.length)try{await Data.saveRows('plantings',rows)}catch(e){toast(errMsg(e),'err')}
}
function gpChange(t){
  if(t.id==='gpMature'){GP.mature=t.checked;store.set('ab.gpmat',GP.mature?'1':'0');updatePlan();return true}
  if(t.id==='gpPlanned'){GP.planned=t.checked;updatePlan();return true}
  if(t.id==='gpLabels'){GP.labels=t.checked;store.set('ab.gplab',GP.labels?'1':'0');updatePlan();return true}
  if(t.id==='gpBgFile'){const f=(t.files||[])[0];if(f)gpBgUpload(f);return true}
  if(t.id==='gpRot'){const p=gpProj(),pl=gpPlan(p);if(pl&&pl.anchor)gpSave({anchor:Object.assign({},pl.anchor,{rot:Number(t.value)||0})},tr('North saved','Norr sparat','Noorden opgeslagen'));return true}
  if(t.id==='gpPend'){GP.pend=t.value;return true}
  if(t.id==='gpBedFor'){GP.bedFor=t.value;return true}
  if(t.id==='gpNewSp'){GP.newSp=t.value;return true}
  return false;
}
GP.mature=store.get('ab.gpmat')!=='0';GP.labels=store.get('ab.gplab')!=='0';
document.addEventListener('pointerdown',e=>{if(e.target.closest&&e.target.closest('#gpSvg'))gpDown(e)});
document.addEventListener('pointermove',e=>{if(GP.drag)gpMove(e)});
document.addEventListener('pointerup',e=>{if(GP.drag)gpUp(e)});
document.addEventListener('wheel',e=>{const s=e.target.closest&&e.target.closest('#gpSvg');if(!s||!GP.vb)return;e.preventDefault();const q=gpPt(e);gpZoom(e.deltaY>0?1.15:0.87,q&&q[0],q&&q[1]);s.setAttribute('viewBox',[GP.vb.x,GP.vb.y,GP.vb.w,GP.vb.h].map(r2).join(' '));clearTimeout(GP.wt);GP.wt=setTimeout(updatePlan,180)},{passive:false});
/* ---------- GPS for large sites (row 70): several readings averaged, the accuracy kept with the position ---------- */
function geoAvg(done,fail){
  if(!navigator.geolocation){fail();return}
  const rs=[];let id=null,end=null;
  const finish=()=>{if(id!=null)navigator.geolocation.clearWatch(id);clearTimeout(end);if(!rs.length){fail();return}
    const w=rs.map(r=>1/Math.max(1,r.acc*r.acc)),sw=w.reduce((a,b)=>a+b,0),lat=rs.reduce((a,r,i)=>a+r.lat*w[i],0)/sw,lng=rs.reduce((a,r,i)=>a+r.lng*w[i],0)/sw;
    done({lat:Math.round(lat*1e6)/1e6,lng:Math.round(lng*1e6)/1e6,acc:Math.max(1,Math.round(Math.min.apply(null,rs.map(r=>r.acc))/Math.sqrt(rs.length))),n:rs.length})};
  try{id=navigator.geolocation.watchPosition(g=>{rs.push({lat:g.coords.latitude,lng:g.coords.longitude,acc:g.coords.accuracy||50});if(rs.length>=6||(rs.length>=3&&g.coords.accuracy<=5))finish()},()=>{if(!rs.length){clearTimeout(end);if(id!=null)navigator.geolocation.clearWatch(id);fail()}},{enableHighAccuracy:true,maximumAge:0,timeout:15000})}catch(e){fail();return}
  end=setTimeout(finish,9000);
}
