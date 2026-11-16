// Artblad: Exports, picture-slot icons, completeness and gaps, links, near matches, renames, plant sources.
// Part 15 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- exports ---------- */
function saveFile(filename,data){
  const type=/\.txt$/.test(filename)?'text/plain;charset=utf-8':/\.csv$/.test(filename)?'text/csv;charset=utf-8':/\.json$/.test(filename)?'application/json':'text/html;charset=utf-8';
  const url=URL.createObjectURL(new Blob([data],{type}));
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}
async function sheetPages(list){
  const out=[];
  for(const s of list){
    const ids=[...new Set([s.cover].concat(s.obs.map(o=>o.photo)).filter(Boolean))].slice(0,40),map=new Map();
    await Promise.all(ids.map(async id=>{const u=await dataUrl(id);if(u)map.set(id,u)}));
    const src=id=>map.get(id)||'';
    out.push(sheetFor(s,state.lang,src)+(wantBack(s)?sheetBacks(s,state.lang,src):'')+(state.withCv?sheetCv(s,state.lang):'')+(state.withGenus?sheetGenus(s,state.lang):''));
  }
  return out.join('');
}
function listInView(){return $$('#ovList .sp').map(el=>bySid.get(el.dataset.sid)).filter(Boolean)}
async function printSheets(list){
  if(!list.length){toast(tr('No species to print.','Inga arter att skriva ut.'),'err');return}
  toast(tr('Preparing sheets…','Förbereder blad…'));
  const html=docShell('Skogsträdgårdens artblad',await sheetPages(list));
  const f=document.createElement('iframe');f.style.cssText='position:fixed;width:0;height:0;border:0;left:-9999px';document.body.appendChild(f);
  f.onload=()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(e){toast(tr('Printing is blocked here. Use Download instead.','Utskrift blockeras här. Använd Ladda ner i stället.'),'err')}setTimeout(()=>f.remove(),60000)};
  f.srcdoc=html;
}
async function exportSheets(list,name){
  if(!list.length){toast('No species to export yet.','err');return}
  toast('Preparing sheets…');
  const html=docShell('Skogsträdgårdens artblad · '+name,await sheetPages(list));
  await saveFile('artblad_'+name+'.html',html);
}
function valText(d,v,form){
  if(Array.isArray(v)){if(d.t==='cal')return v.map(n=>MONTH_NAMES[n-1]).join(' ');const o=optsOf(d,form);return v.map(k=>(o.find(x=>x.k===k)||{en:k}).en).join('; ')}
  if(d.t==='single'){const o=optsOf(d,form).find(x=>x.k===v);return o?o.en:v}
  return v;
}
function exportCsv(){
  if(!species.length){toast('No species to export yet.','err');return}
  const keys=Object.keys(DEF).filter(k=>k!=='photo');
  const q=v=>{v=v==null?'':String(v);return /[",\n;]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  const head=['no','latin','form'].concat(keys,['entries','observations']);
  const rows=[].concat(...species.map(s=>[s].concat(s.cvs))).map(s=>[s.no,s.latin,s.form==='w'?'woody':'herbaceous'].concat(keys.map(k=>{const v=s.m[k];return isEmpty(v)?'':valText(DEF[k],v,s.form)}),[s.entries.length,s.obs.length]));
  saveFile('artblad_species_'+today()+'.csv','﻿'+[head].concat(rows).map(r=>r.map(q).join(',')).join('\n'));
}
function exportJson(){
  const strip=a=>a.map(x=>{const c=Object.assign({},x);return c});
  saveFile('artblad_data_'+today()+'.json',JSON.stringify({app:'artblad',exported:new Date().toISOString(),entries:strip(state.entries),obs:strip(state.obs),plantings:strip(state.plantings||[]),lists:strip(state.lists||[]),comments:strip(state.comments||[])},null,2));
}

/* ---------- picture-slot icons (no photo) ---------- */
const PH_ICONS={
  tree:'<circle cx="12" cy="9" r="6"/><path d="M12 15v7M9 22h6"/>',
  smalltree:'<circle cx="12" cy="11" r="4.5"/><path d="M12 15.5v6.5M9.5 22h5"/>',
  shrub:'<path d="M4 18c0-4 2.5-7 5-7 1-3 5-3 6 0 2.5 0 5 3 5 7z"/><path d="M3 21h18"/>',
  herb:'<path d="M12 21V9"/><path d="M12 13c-4 0-6-2.5-6-6 4 0 6 2.5 6 6zM12 11c0-3.5 2-6 6-6 0 3.5-2 6-6 6z"/>',
  ground:'<path d="M3 18c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M7 14c0-2 1-4 3-4M15 14c0-2 1-3.5 3-3.5"/><path d="M3 21h18"/>',
  vine:'<path d="M8 21V3"/><path d="M8 9c3 0 5-1.5 6-4M8 15c3 0 6 1 7 4"/><circle cx="16" cy="6" r="1.8"/>',
  bulb:'<path d="M12 3c0 3-6 6-6 11a6 6 0 0 0 12 0c0-5-6-8-6-11z"/><path d="M9 21.5l3-1 3 1"/>',
  root:'<path d="M10 3l2 3 2-3"/><path d="M8 7h8l-3 14h-2z"/><path d="M9.5 11h3M10.5 15h2"/>',
  sprout:'<path d="M12 21v-8"/><path d="M12 13c-3 0-5-2-5-5 3 0 5 2 5 5zM12 13c3 0 5-2 5-5-3 0-5 2-5 5z"/><path d="M7 21h10"/>'
};
const TYPE_ICON={tree:'tree',shrub:'shrub',subshrub:'shrub',climber:'vine',perennial:'herb',biennial:'herb',annual:'sprout',bulb:'bulb',rootcrop:'root',groundcover:'ground'};
const LAYER_ICON={canopy:'tree',sub:'smalltree',shrub:'shrub',herb:'herb',ground:'ground',root:'root',vert:'vine'};
function phIcon(s){
  const m=s.m,lay=(m.layer||[])[0];
  let k=TYPE_ICON[m.type];
  if(k==='tree'&&(m.layer||[]).indexOf('sub')>=0&&(m.layer||[]).indexOf('canopy')<0)k='smalltree';
  if(!k)k=LAYER_ICON[lay]||(s.form==='w'?'tree':'herb');
  return '<svg class="phi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+PH_ICONS[k]+'</svg>';
}
const phInner=(s,lazy)=>s.cover?thumbImg(s.cover,lazy):phIcon(s);

/* ---------- completeness and gaps ---------- */
const has=(m,k)=>!isEmpty(m[k]);
const GAPS=[
  {k:'en',en:'English name',sv:'Engelskt namn',ok:s=>has(s.m,'en')},
  {k:'sv',en:'Swedish name',sv:'Svenskt namn',ok:s=>has(s.m,'sv')},
  {k:'family',en:'Family',sv:'Familj',ok:s=>has(s.m,'family')},
  {k:'type',en:'Plant type / life cycle',sv:'Växttyp / livscykel',ok:s=>has(s.m,'type')},
  {k:'photo',en:'Photo',sv:'Foto',ok:s=>!!s.cover},
  {k:'region',en:'Origin',sv:'Ursprung',ok:s=>has(s.m,'region')},
  {k:'height',en:'Height',sv:'Höjd',ok:s=>has(s.m,'height')},
  {k:'light',en:'Light',sv:'Ljus',ok:s=>has(s.m,'light')},
  {k:'moist',en:'Moisture',sv:'Fukt',ok:s=>has(s.m,'moist')},
  {k:'soil',en:'Soil',sv:'Jord',ok:s=>has(s.m,'soil')},
  {k:'months',en:'Calendar months',sv:'Kalendermånader',ok:s=>['cal1','cal2','cal3','cal4'].some(k=>has(s.m,k))},
  {k:'uses',en:'Uses',sv:'Användning',ok:s=>has(s.m,'uses')},
  {k:'eco',en:'Ecosystem functions',sv:'Ekosystemfunktioner',ok:s=>has(s.m,'eco')},
  {k:'layer',en:'Layer',sv:'Skikt',ok:s=>has(s.m,'layer')},
  {k:'struct',en:'Structure',sv:'Struktur',ok:s=>has(s.m,'struct')},
  {k:'edibility',en:'Edibility',sv:'Ätlighet',ok:s=>has(s.m,'edibility')},
  {k:'hardy',en:'Hardiness zone',sv:'Härdighetszon',ok:s=>['szone','usda','rhs'].some(k=>has(s.m,k))},
  {k:'verdict',en:'Verdict',sv:'Omdöme',ok:s=>has(s.m,'verdict')},
  // Not part of the percentage: cultivars without their own hardiness zone look the same as the species in Pick a plant.
  {k:'cvzone',en:'Cultivar zones',sv:'Sorternas zoner',np:1,ok:s=>!(s.cvs||[]).some(c=>isEmpty(c.own.szone))}
];
const missingOf=s=>GAPS.filter(g=>!g.ok(s));
// Which form section holds each gap (names, type and photo sit at the top of the form).
const GAP_SEC={region:'origin',height:'size',light:'site',moist:'site',soil:'site',hardy:'site',months:'cal',uses:'uses',edibility:'uses',eco:'eco',layer:'place',struct:'place',verdict:'verdict'};
const GAPS_PCT=GAPS.filter(g=>!g.np);
/* Completeness, section by section: each section of the sheet counts equally, and within a section each field
   (that applies to the plant's form) counts equally. Free-text notes and cautions do not count; the three hardiness
   fields count as one. So one filled field in a large section adds little. */
const CMP_SECS=[{id:'ident',en:'Names & photo',sv:'Namn & foto',f:['en','sv','nl','family','type','photo']}].concat(SEC.map(x=>({id:x.id,en:x.en,sv:x.sv,
  f:[...new Set(x.f.filter(d=>!d.cat&&!d.hide&&d.k!=='caut'&&d.k!=='asAnnual').map(d=>d.k==='usda'||d.k==='szone'||d.k==='rhs'?'hardy':d.k))]})));
function secFill(m,form,hasPhoto){
  return CMP_SECS.map(c=>{const ks=c.f.filter(k=>{const d=DEF[k];return !d||!d.only||d.only===form});
    const ok=ks.filter(k=>k==='photo'?hasPhoto:k==='hardy'?['szone','usda','rhs'].some(z=>has(m,z)):has(m,k)).length;
    return{id:c.id,en:c.en,sv:c.sv,n:ks.length,ok,p:ks.length?ok/ks.length:1}});
}
const complOf=(m,form,hasPhoto)=>{const f=secFill(m,form,hasPhoto);return Math.round(100*f.reduce((t,x)=>t+x.p,0)/f.length)};
const completeness=s=>complOf(s.m,s.form,!!s.cover);
const complTitle=s=>secFill(s.m,s.form,!!s.cover).map(x=>trs(x.en,x.sv)+' '+Math.round(100*x.p)+'%').join(' · ');
const cbar=(s,wide)=>{const c=completeness(s);return '<span class="cbar'+(wide?' wide':'')+'" title="'+esc(tr(c+'% complete',c+' % ifyllt',c+'% ingevuld')+' · '+complTitle(s))+'"><i style="width:'+c+'%"></i></span><span class="cpct">'+c+'%</span>'};
const gapState={only:''};
let gapLast='';
function updateGaps(){
  if(gapState.only!==gapLast){gapLast=gapState.only;bulkState.sel.clear();bulkState.val=null}
  const list=species.filter(s=>!gapState.only||!GAPS.find(g=>g.k===gapState.only).ok(s)).sort(store.get('ab.gapsort')==='latin'?(a,b)=>a.latin.localeCompare(b.latin,'en'):(a,b)=>completeness(a)-completeness(b)||byName(a,b));
  $$('#gapSort [data-gapsort]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.gapsort===(store.get('ab.gapsort')==='latin'?'latin':'least')));
  const avg=species.length?Math.round(species.reduce((t,s)=>t+completeness(s),0)/species.length):0;
  $('#gapStats').textContent=tr(species.length+' species, on average '+avg+'% complete. Least complete first.',species.length+' arter, i snitt '+avg+' % ifyllda. Minst ifyllda först.',species.length+' soorten, gemiddeld '+avg+'% ingevuld. Minst ingevulde eerst.');
  $('#gapChips').innerHTML='<button type="button" class="chip sm" data-gap="" aria-pressed="'+(!gapState.only)+'"><i></i><span>'+trh('All species','Alla arter')+'</span></button>'+
    GAPS.map(g=>{const n=species.filter(s=>!g.ok(s)).length;return n?'<button type="button" class="chip sm" data-gap="'+g.k+'" aria-pressed="'+(gapState.only===g.k)+'"><i></i><span>'+esc(tr('No '+(g.k==='en'||g.k==='sv'?g.en:g.en.toLowerCase()),'Saknar '+g.sv.toLowerCase(),'Ontbreekt: '+nl(g.en).toLowerCase()))+' <b class="gn">'+n+'</b></span></button>':''}).join('');
  $('#gapSel').innerHTML='<option value="">'+esc(tr('All species','Alla arter'))+'</option>'+GAPS.map(g=>{const n=species.filter(s=>!g.ok(s)).length;return n?'<option value="'+g.k+'"'+(gapState.only===g.k?' selected':'')+'>'+esc(tr('No '+(g.k==='en'||g.k==='sv'?g.en:g.en.toLowerCase()),'Saknar '+g.sv.toLowerCase(),'Ontbreekt: '+nl(g.en).toLowerCase()))+' ('+n+')</option>':''}).join('');
  const bk=!!bulkBarHTML();$('#bulkBox').innerHTML=bulkBarHTML();
  $('#gapList').innerHTML=list.length?list.map(s=>{const miss=missingOf(s),nm=names(s);
    return '<div class="gaprow'+(bk?' bk':'')+'">'+(bk?'<label class="bksel"><input type="checkbox" data-bulksel="'+esc(s.sid)+'"'+(bulkState.sel.has(s.sid)?' checked':'')+' aria-label="'+esc(tr('Tick','Kryssa','Aanvinken')+' '+dispName(s))+'"></label>':'')+'<button type="button" class="gapmain" data-open="'+esc(s.sid)+'"><span class="ph" style="--c:'+FCOL[s.form]+'">'+phInner(s,1)+'</span><span style="min-width:0"><span class="lat">'+nm.main+'</span><span class="nm">'+nm.sub+'</span><span class="cline">'+cbar(s,1)+'</span></span></button>'+
      '<div class="gapmiss">'+(miss.length?miss.map(g=>'<span class="pill miss">'+esc(trs(g.en,g.sv))+'</span>').join(''):'<span class="pill">'+tr('Complete','Komplett')+'</span>')+'</div>'+
      '<button type="button" class="btn sm w-only" data-act="gap-add" data-sid="'+esc(s.sid)+'">'+tr('Add info','Lägg till info')+'</button></div>'}).join(''):'<div class="empty"><p>'+tr('No species are missing this.','Inga arter saknar detta.')+'</p></div>';
}

/* ---------- external links ---------- */
function lookupName(latin){
  const w=String(latin||'').replace(/['‘’"].*$/,'').trim().split(/\s+/);
  if(w.length>1&&/^sp{1,2}\.?$/i.test(w[1]))return w[0];
  return w[0]==null?'':(w[1]==='x'||w[1]==='×')?w.slice(0,3).join(' '):w.slice(0,2).join(' ');
}
function extLinks(s){
  const n=lookupName(s.latin);if(!n)return '';
  const wiki='https://'+(state.lang==='sv'?'sv':state.lang==='nl'?'nl':'en')+'.wikipedia.org/wiki/'+encodeURIComponent(n.replace(/ /g,'_'));
  const a=(href,t)=>'<a href="'+esc(href)+'" target="_blank" rel="noopener">'+t+'</a>';
  return '<div class="xlinks"><span>'+tr('Look up','Slå upp')+'</span>'+a('https://pfaf.org/user/Plant.aspx?LatinName='+encodeURIComponent(n).replace(/%20/g,'+'),'PFAF')+a(wiki,'Wikipedia')+a('https://www.gbif.org/species/search?q='+encodeURIComponent(n),'GBIF')+'</div>';
}

/* ---------- near matches ---------- */
const nearMatch=sid=>{const r=species.map(x=>[x,lev(sid,x.sid)]).filter(a=>a[1]>0&&a[1]<=2).sort((a,b)=>a[1]-b[1])[0];return r?r[0]:null};

/* ---------- rename a species ---------- */
function openRename(){const s=selected&&bySid.get(selected);if(!s)return;$('#renBox').hidden=false;$('#renInput').value=s.latin;renHint();$('#renInput').focus()}
function renHint(){
  const s=selected&&bySid.get(selected);if(!s)return;const v=canon($('#renInput').value),sid=slug(v),t=bySid.get(sid),b=$('#renGo');
  let h;
  if(v.split(' ').length<2)h=tr('Enter genus and species.','Ange släkte och art.');
  else if(sid===s.sid&&v===s.latin)h=tr('This is the current name.','Detta är det nuvarande namnet.');
  else if(t&&t!==s)h=tr('“'+t.latin+'” already exists. Renaming merges the two species into one sheet.','”'+t.latin+'” finns redan. Namnbytet slår ihop de två arterna till ett blad.','“'+t.latin+'” bestaat al. Hernoemen voegt de twee soorten samen tot één blad.');
  else h=tr('Moves '+s.entries.length+' entries and '+s.obs.length+' observations to the new name.','Flyttar '+s.entries.length+' poster och '+s.obs.length+' observationer till det nya namnet.','Verplaatst '+s.entries.length+' invoeren en '+s.obs.length+' waarnemingen naar de nieuwe naam.');
  $('#renHint').textContent=h;b.disabled=v.split(' ').length<2||(sid===s.sid&&v===s.latin);
}
async function doRename(){
  const s=selected&&bySid.get(selected);if(!s)return;const v=canon($('#renInput').value),sid=slug(v);
  if(v.split(' ').length<2)return;
  const now=Date.now(),strip=x=>{const o=Object.assign({},x);delete o.id;return o};
  const ents=s.entries.map(e=>({id:e.id,data:Object.assign(strip(e),{sid,latin:v,updatedAt:now})}));
  const obs=s.obs.map(o=>({id:o.id,data:Object.assign(strip(o),{sid,latin:v})}));
  const b=$('#renGo');b.disabled=true;
  try{
    if(SB)await Data.rename(s.sid,sid,v);
    else{await Data.saveMany(ents,obs);if(Fav.has(s.sid)&&s.sid!==sid){Fav.toggle(s.sid);if(!Fav.has(sid))Fav.toggle(sid)}}
    selected=sid;$('#renBox').hidden=true;toast(tr('Renamed to ','Bytt namn till ')+v);updateSheet();
  }catch(e){toast(errMsg(e),'err')}finally{b.disabled=false}
}

/* ---------- rename a cultivar (admins): changes the name on every entry, observation, source, planting and comment ---------- */
function cvItems(c){const s=c.parent,mine=x=>cvKey(x.cultivar)===c.ck;return{obs:s.obs.concat(s.src).filter(mine),pl:s.plantings.filter(mine),cm:(state.comments||[]).filter(x=>x.sid===s.sid&&mine(x))}}
function openCvRename(c){$('#cvRenBox').hidden=false;$('#cvRenInput').value=c.cv;cvRenHint();$('#cvRenInput').focus()}
function cvRenHint(){
  const c=cur();if(!c||!c.isCv)return;const n=cvNorm($('#cvRenInput').value),ex=c.parent.cvs.find(x=>x.ck===cvKey(n)&&x!==c),it=cvItems(c),k=it.obs.length+it.pl.length+it.cm.length;
  $('#cvRenHint').textContent=!n?tr('Type the new name.','Skriv det nya namnet.','Typ de nieuwe naam.'):ex?tr(cvQ(ex.cv)+' already exists. Renaming merges the two cultivars.',cvQ(ex.cv)+' finns redan. Namnbytet slår ihop de två sorterna.',cvQ(ex.cv)+' bestaat al. Hernoemen voegt de twee cultivars samen.'):tr('Changes the name on '+c.entries.length+' entries and '+k+' other records.','Ändrar namnet på '+c.entries.length+' poster och '+k+' andra uppgifter.','Wijzigt de naam bij '+c.entries.length+' invoeren en '+k+' andere gegevens.');
  $('#cvRenGo').disabled=!n||n===c.cv;
}
async function doCvRename(c,n){
  if(!n||n===c.cv)return;
  const ex=c.parent.cvs.find(x=>x.ck===cvKey(n)&&x!==c);if(ex)n=ex.cv;
  const now=Date.now(),strip=x=>{const o=Object.assign({},x);delete o.id;return o},it=cvItems(c);
  const ents=c.entries.map(e=>({id:e.id,data:Object.assign(strip(e),{fields:Object.assign({},e.fields,{cultivar:n}),updatedAt:now})}));
  const re=x=>({id:x.id,data:Object.assign(strip(x),{cultivar:n})});
  const b=$('#cvRenGo');b.disabled=true;
  try{
    await Data.saveRows('plantings',it.pl.map(re));await Data.saveRows('comments',it.cm.map(re));
    await Data.saveMany(ents,it.obs.map(re));
    selCv=cvKey(n);$('#cvRenBox').hidden=true;toast(tr('Renamed to ','Bytt namn till ','Hernoemd naar ')+cvQ(n));updateSheet();
  }catch(e){toast(errMsg(e),'err')}finally{b.disabled=false}
}

/* ---------- where to get seed and plants (stored with the observations, kind:'source') ---------- */
const MATERIAL=O('seed:Seed:Frö|plant:Plants:Plantor|cutting:Cuttings:Sticklingar|scion:Scions:Ympris|division:Divisions:Delningar|other:Other:Annat');
const safeUrl=u=>{u=String(u||'').trim();if(!u)return '';if(!/^https?:\/\//i.test(u))u='https://'+u;try{const x=new URL(u);return /^https?:$/.test(x.protocol)?x.href:''}catch(e){return ''}};
function srcHTML(s){
  if(!s.src.length)return '<p class="muted" style="margin:0">'+(s.isCv?tr('No sources for this cultivar yet.','Inga källor för den här sorten ännu.','Nog geen bronnen voor deze cultivar.'):tr('No sources yet. Add where seed or plants can be found.','Inga källor ännu. Lägg till var man kan få tag på frö eller plantor.'))+'</p>';
  return s.src.map(o=>{const mo=MATERIAL.find(x=>x.k===o.material),u=safeUrl(o.url);
    return '<div class="ent"><span style="min-width:0"><b>'+(u?'<a href="'+esc(u)+'" target="_blank" rel="noopener">'+esc(o.supplier||u)+'</a>':esc(o.supplier||''))+'</b>'+(mo?' <span class="pill">'+trh(mo.en,mo.sv)+'</span>':'')+(s.isCv?'':cvPill(o))+
      (o.text?'<br>'+esc(o.text):'')+'<br><small class="muted">'+esc(o.date||'')+(SB?rowStamp(o.id):'')+'</small></span>'+
      (canEdit(o.id)?'<button class="btn sm danger w-only" data-act="del-obs" data-id="'+esc(o.id)+'">'+tr('Delete','Radera')+'</button>':'')+'</div>'}).join('');
}
