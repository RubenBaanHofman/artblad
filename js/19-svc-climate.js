// Artblad: SERVICE: winter climate of a map position (Open-Meteo archive, ERA5-Land).
// Part 19 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- winter climate of a map position (Open-Meteo historical weather, ERA5-Land, CC BY 4.0, no key) ----------
   The average of each winter's lowest temperature over the 30 winters 1995/96–2024/25 (the USDA zone definition), plus the coldest. */
/* Open-Meteo's free service counts every 2 weeks of data as one "call": 600 a minute, 5 000 an hour, 10 000 a day per connection.
   So: only the cold season (15 Nov–15 Mar) of 20 winters (2005/06–2024/25), about 173 calls per place; a budget kept on this
   device that waits (calibration) or explains (single look-ups); and a cache of looked-up places. */
const CLIM_Y0=2005,CLIM_Y1=2024,CLIM_SEASON=['-11-15','-03-15'];
const omLimits=()=>Object.assign({min:540,hour:4800,day:9500},window.__omLimits||{});
const omWeight=(a,b)=>Math.max(0.1,((new Date(b)-new Date(a))/864e5+1)/14);
function omLog(){let l=[];try{l=JSON.parse(store.get('ab.omlog')||'[]')}catch(e){}const now=Date.now();return l.filter(x=>Array.isArray(x)&&now-x[0]<864e5)}
function omWait(w){
  const L=omLimits(),l=omLog(),now=Date.now(),sum=ms=>l.filter(x=>now-x[0]<ms).reduce((t,x)=>t+x[1],0);
  const need=(ms,lim)=>{let u=sum(ms);if(u+w<=lim)return 0;const old=l.filter(x=>now-x[0]<ms).sort((a,b)=>a[0]-b[0]);for(const x of old){u-=x[1];if(u+w<=lim)return x[0]+ms-now+500}return ms};
  return{min:need(6e4,L.min),hour:need(36e5,L.hour),day:need(864e5,L.day)};
}
function omNote(w){const l=omLog();l.push([Date.now(),Math.round(w*100)/100]);try{store.set('ab.omlog',JSON.stringify(l.slice(-3000)))}catch(e){}}
const omErr=(kind,ms)=>Object.assign(new Error('limit'),{limit:kind,ms});
let OM_LAST_ERR=null;
// One request for one stretch of days; returns the daily minimums. wait: true = wait for the budget (calibration), else throw.
async function omFetch(lat,lng,a,b,wait,onWait){
  if(!svcOn('climate'))throw Object.assign(new Error('service off'),{why:'off'});
  const w=omWeight(a,b);
  for(let tries=0;;tries++){
    const q=omWait(w);
    if(q.day){throw omErr('day',q.day)}
    const ms=Math.max(q.min,q.hour);
    if(ms){if(!wait)throw omErr(q.hour?'hour':'min',ms);if(onWait)onWait(ms);await new Promise(r=>setTimeout(r,Math.min(ms,15000)));continue}
    omNote(w);
    const u=svcUrl('climate')+'?latitude='+lat.toFixed(4)+'&longitude='+lng.toFixed(4)+'&start_date='+a+'&end_date='+b+'&daily=temperature_2m_min&models=era5_land&timezone=GMT';
    const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),20000);let r=null,net='';
    try{r=await svcFetch('climate',u,{signal:ctl.signal})}catch(e){net=e&&e.name==='AbortError'?'timeout':'connection'}finally{clearTimeout(to)}
    // Connection problems, time-outs and server errors are retried after a pause (refused limit answers can also look like a lost connection).
    if(net||r.status>=500){const bf=window.__omBackoff||1,back0=wait?[1e4,3e4,6e4,12e4][tries]:(tries<1?2000:null),back=back0==null?null:back0*bf;
      if(back==null)throw Object.assign(new Error(net||'HTTP '+r.status),{why:net||'server'});
      if(onWait)onWait(back);await new Promise(ok=>setTimeout(ok,back));continue}
    if(r.ok){const j=await r.json();return{v:((j.daily||{}).temperature_2m_min||[]).filter(x=>x!=null&&isFinite(x)),elev:j.elevation}}
    let reason='';try{reason=(await r.json()).reason||''}catch(e){}
    if(r.status===429||/limit/i.test(reason)){
      const kind=/daily|day/i.test(reason)?'day':/hour/i.test(reason)?'hour':'min';
      if(!wait||kind==='day'||tries>=5)throw omErr(kind,kind==='day'?864e5:kind==='hour'?36e5:6e4);
      if(onWait)onWait(6e4);await new Promise(r=>setTimeout(r,6e4));continue}
    throw new Error('HTTP '+r.status+(reason?': '+reason:''));
  }
}
function omErrMsg(e){
  if(e&&e.why==='off')return tr('The climate service is switched off in config.js.','Klimattjänsten är avstängd i config.js.','De klimaatdienst staat uit in config.js.');
  if(!e||!e.limit)return tr('The look-up did not work. Try again later.','Uppslaget fungerade inte. Försök igen senare.','Het opzoeken lukte niet. Probeer het later opnieuw.');
  if(e.limit==='day')return tr('Open-Meteo’s free daily limit is used up on this connection. Try again tomorrow.','Open-Meteos fria dagsgräns är förbrukad på den här anslutningen. Försök igen i morgon.','De gratis daglimiet van Open-Meteo is op voor deze verbinding. Probeer het morgen opnieuw.');
  const m=Math.max(1,Math.ceil((e.ms||6e4)/6e4));
  return tr('Open-Meteo’s free limit is reached for now. Try again in about ','Open-Meteos fria gräns är nådd just nu. Försök igen om ungefär ','De gratis limiet van Open-Meteo is nu bereikt. Probeer het over ongeveer ')+m+' '+tr('min.','min.','min.');
}
function climCacheGet(k){try{return (JSON.parse(store.get('ab.climcache')||'{}'))[k]||null}catch(e){return null}}
function climCacheSet(k,v){try{const c=JSON.parse(store.get('ab.climcache')||'{}');c[k]=v;const ks=Object.keys(c);if(ks.length>300)delete c[ks[0]];store.set('ab.climcache',JSON.stringify(c))}catch(e){}}
// The typical winter low of a spot: the mean of the 20 winter minimums (USDA definition), plus the coldest.
// Each winter's answer is kept on the device too, so a look-up that stops halfway does not fetch the finished winters again.
function omWinGet(k){try{return (JSON.parse(store.get('ab.omwin')||'{}'))[k]}catch(e){return undefined}}
function omWinSet(k,v){try{const c=JSON.parse(store.get('ab.omwin')||'{}');c[k]=v;const ks=Object.keys(c);if(ks.length>2500)delete c[ks[0]];store.set('ab.omwin',JSON.stringify(c))}catch(e){}}
async function climLookup(lat,lng,wait,onWait){
  const k=lat.toFixed(3)+','+lng.toFixed(3),c=climCacheGet(k);if(c)return c;
  const mins=[];let elev=null;
  for(let y=CLIM_Y0;y<=CLIM_Y1;y++){
    const wk=lat.toFixed(4)+','+lng.toFixed(4)+','+y;let got=omWinGet(wk);
    if(got===undefined){const r=await omFetch(lat,lng,y+CLIM_SEASON[0],(y+1)+CLIM_SEASON[1],wait,onWait);got={m:r.v.length>=100?Math.min.apply(null,r.v):null,e:r.elev!=null?r.elev:null};omWinSet(wk,got)}
    if(got.e!=null)elev=got.e;if(got.m!=null)mins.push(got.m)}
  if(mins.length<15)throw Object.assign(new Error('too little data'),{why:'nodata'});
  const mean=mins.reduce((a,b)=>a+b,0)/mins.length;
  const out={t:Math.round(mean*10)/10,lo:Math.round(Math.min.apply(null,mins)*10)/10,n:mins.length,elev:elev!=null?Math.round(elev):null,src:'Open-Meteo ERA5-Land, '+CLIM_Y0+'/'+String(CLIM_Y0+1).slice(2)+'–'+CLIM_Y1+'/'+String(CLIM_Y1+1).slice(2)+', 15 Nov–15 Mar',at:today()};
  climCacheSet(k,out);return out;
}
// "2025/26", "2025-26", "2025/2026" or "2025" → 2025 (the winter that starts in the autumn of that year).
function winterStart(w){const m=/^\s*(\d{4})(?:\s*[\/–-]\s*(\d{2}|\d{4}))?\s*$/.exec(String(w||''));if(!m)return null;const y=+m[1];if(y<1950||y>new Date().getFullYear())return null;return y}
// The lowest daily minimum at a spot from 1 October of year y to 30 April the year after (up to a few days ago for the current winter).
async function winterMin(lat,lng,y){
  const lag=new Date(Date.now()-6*864e5).toISOString().slice(0,10),end=String(y+1)+'-04-30',to=end<lag?end:lag,partial=end>=lag;
  const r=await omFetch(lat,lng,y+'-10-01',to,false);if(r.v.length<30)throw new Error('too little data');
  return{t:Math.round(Math.min.apply(null,r.v)*10)/10,partial};
}
const usdaOfT=t=>{const f=t*1.8+32;if(f<-60)return '1a';const k=Math.floor((f+60)/5),n=Math.min(13,Math.floor(k/2)+1);return n+(k%2?'b':'a')};
function climTxt(c){
  return tr('Winter low here ≈ ','Vinterlägsta här ≈ ','Winterminimum hier ≈ ')+fmtC(c.t)+' '+tr('on average (coldest ','i snitt (kallast ','gemiddeld (koudst ')+fmtC(c.lo)+', '+c.n+' '+tr('winters','vintrar','winters')+')'+
    ' · ≈ USDA '+usdaOfT(c.t);
}
const CLIM_CREDIT='<a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> (ERA5-Land, CC BY 4.0)';
async function plClimFor(doc){
  if(!(isEnc(doc)&&doc.established&&isFinite(doc.lat)&&isFinite(doc.lng)))return false;
  try{doc.clim=await climLookup(Number(doc.lat),Number(doc.lng));OM_LAST_ERR=null;return true}catch(e){OM_LAST_ERR=e;return null}
}
async function plClimRetry(id){
  const p=(state.plantings||[]).find(x=>x.id===id);if(!p)return;const doc=Object.assign({},p);delete doc.id;
  toast(tr('Looking up the winter climate…','Hämtar vinterklimatet…','Winterklimaat opzoeken…'));
  const ok=await plClimFor(doc);if(!ok){toast(omErrMsg(OM_LAST_ERR),'err');return}
  try{await Data.saveRow('plantings',id,doc);toast(tr('Winter climate added','Vinterklimat tillagt','Winterklimaat toegevoegd'))}catch(e){toast(errMsg(e),'err')}
}
function encInfo(p){
  if(!isEnc(p))return '';
  if(!p.established)return '<br><small class="muted">'+esc(tr('Not marked as established: does not count as proven hardy.','Inte markerad som etablerad: räknas inte som bevisat härdig.','Niet als gevestigd gemarkeerd: telt niet als bewezen winterhard.'))+'</small>';
  if(p.clim)return '<br><small>'+esc(tr('Established. ','Etablerad. ','Gevestigd. ')+climTxt(p.clim))+'. <span class="muted">'+esc(tr('Climate: ','Klimat: ','Klimaat: '))+CLIM_CREDIT+'</span></small>';
  if(!isFinite(p.lat)||p.lat===''||p.lat==null)return '<br><small class="muted">'+esc(tr('Established. Add a map position to look up its winter climate.','Etablerad. Lägg till en kartposition för att hämta vinterklimatet.','Gevestigd. Voeg een kaartpositie toe om het winterklimaat op te zoeken.'))+'</small>';
  return '<br><small class="muted">'+esc(tr('Established. Winter climate not looked up yet.','Etablerad. Vinterklimatet är inte hämtat än.','Gevestigd. Winterklimaat nog niet opgezocht.'))+'</small>'+(canEdit(p.id)?' <button type="button" class="btn sm w-only" data-act="pl-clim" data-id="'+esc(p.id)+'">'+esc(tr('Look up climate','Hämta klimat','Klimaat opzoeken'))+'</button>':'');
}
function plRow(p,showSpecies){
  const x=bySid.get(p.sid),last=(p.checks||[]).slice(-1)[0];
  return '<div class="ent plrow"><span style="min-width:0">'+(showSpecies?'<button type="button" class="lnk" data-open="'+esc(p.sid+(p.cultivar?'--'+cvKey(p.cultivar):''))+'"><b>'+esc(x?dispName(x):p.latin||p.sid)+(p.cultivar?' '+cvQ(cvNorm(p.cultivar)):'')+'</b></button> · ':(p.cultivar&&!(cur()||{}).isCv?cvPill(p)+' · ':''))+
    (isEnc(p)?'<span class="pill enc">'+esc(tr('Encounter','Fynd','Vondst'))+'</span> ':'')+'<b>'+esc(plPlaceName(p)||tr('No place given','Ingen plats angiven'))+'</b>'+(p.project&&plState.proj!==p.project?' '+pjPill(p.project):'')+(p.count&&!isEnc(p)?' · '+esc(p.count)+' '+tr('plants','plantor'):'')+' · '+esc(p.date||'')+' '+pstatPill(p.status)+
    (p.source?'<br><small class="muted">'+tr('Source','Källa')+': '+esc(p.source)+'</small>':'')+(p.notes?'<br>'+esc(p.notes):'')+encInfo(p)+
    (last?'<br><small class="muted">'+tr('Last check','Senaste kontroll')+' '+esc(last.date)+(last.note?': '+esc(last.note):'')+'</small>':'')+
    (SB?'<br><small class="muted">'+rowStamp(p.id).slice(3)+'</small>':'')+((p.winters||[]).length?'<br>'+winterRows(p):'')+(canEdit(p.id)?winterForm(p):'')+'</span>'+
    (canEdit(p.id)?'<span class="acts w-only"><button class="btn sm" data-act="pl-winter" data-id="'+esc(p.id)+'">'+tr('Log a winter','Notera en vinter','Winter noteren')+'</button><select data-plstat="'+esc(p.id)+'" aria-label="'+esc(tr('Update status','Uppdatera status'))+'"><option value="">'+esc(tr('Update status…','Uppdatera status…'))+'</option>'+PSTAT.map(o=>'<option value="'+o.k+'">'+esc(trs(o.en,o.sv))+'</option>').join('')+'</select><button class="btn sm" data-act="pl-edit" data-id="'+esc(p.id)+'">'+tr('Edit','Redigera')+'</button><button class="btn sm danger" data-act="pl-del" data-id="'+esc(p.id)+'">'+tr('Delete','Radera')+'</button></span>':'')+'</div>';
}
// The place of a record: a named place of its project (2.7.0), else the free text typed before.
function plPlaceName(p){if(p.placeId&&p.project){const q=pjById(p.project),x=q&&(q.places||[]).find(y=>y.id===p.placeId);if(x)return x.name}return p.place||''}
function plProjToggle(){const s=$('#plProj'),nn=$('#plProjNew');if(!s||!nn)return;const show=!s.closest('.f').hidden&&s.value==='__new';nn.hidden=!show;if(show&&!nn.value)nn.focus()}
function plPlaceFill(pid,sel){
  const q=pid&&pjById(pid),ps=q?(q.places||[]).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name))):[];
  const s=$('#plPlaceId');if(!s)return;const w=s.closest('.f');if(w)w.hidden=!ps.length;
  s.innerHTML='<option value="">'+esc(tr('– none –','– ingen –','– geen –'))+'</option>'+ps.map(x=>'<option value="'+esc(x.id)+'"'+(x.id===sel?' selected':'')+'>'+esc(x.name)+'</option>').join('');
}
function plCvFill(ck){const s=bySid.get($('#plSp').value);$('#plCv').innerHTML=cvOptions(s,ck,tr('Species / unknown cultivar','Arten / okänd sort','Soort / onbekende cultivar'));$('#plCv').value=ck&&s&&s.cvs.some(c=>c.ck===ck)?ck:'';$('#plCvNew').hidden=true;$('#plCvNew').value=''}
function plFormOpen(p,sid,cv,kind){
  plState.edit=p?p.id:null;plState.kind=p?(isEnc(p)?'encounter':''):(kind||'');const f=$('#plForm');f.hidden=false;f.classList.toggle('enc',plState.kind==='encounter');
  $('#plSp').innerHTML=species.slice().sort(byName).map(x=>'<option value="'+esc(x.sid)+'">'+esc(dispName(x))+(commonName(x)?' ('+esc(x.latin)+')':'')+'</option>').join('');
  $('#plSp').value=p?p.sid:(sid||selected||'');$('#plSp').disabled=!!p;
  plCvFill(p?cvKey(p.cultivar):(cv!=null?cv:((sid||selected)===selected?selCv:'')));
  $('#plPlace').value=p?p.place||'':'';
  // Since 2.7.0 every planting record belongs to a project (Ruben, 17 Nov). Encounters (plants seen elsewhere) stay shared.
  // No project yet, or a new one wanted: "New project…" with a name field; the project is made when the record is saved.
  {const s=$('#plProj');if(s){const enc=plState.kind==='encounter',show=PROJ_ON&&!enc,w=s.closest('.f');if(w)w.hidden=!show;
    const eds=pjEditable(),okp=id=>id&&eds.some(q=>q.id===id);
    const def=p&&okp(p.project)?p.project:okp(plState.proj)?plState.proj:okp(PJ)?PJ:eds[0]?eds[0].id:'__new';
    s.innerHTML=eds.map(q=>'<option value="'+esc(q.id)+'">'+esc(pjName(q.id))+'</option>').join('')+'<option value="__new">'+esc(tr('New project…','Nytt projekt…','Nieuw project…'))+'</option>';
    s.value=def;const nn=$('#plProjNew');if(nn)nn.value=eds.length?'':tr('My garden','Min trädgård','Mijn tuin');plProjToggle();plPlaceFill(def==='__new'?'':def,p&&p.placeId)}}$('#plDate').value=p?p.date||today():today();$('#plCount').value=p&&p.count?p.count:'';
  $('#plSource').value=p?p.source||'':'';$('#plStatus').value=p?p.status||'alive':'alive';$('#plNotes').value=p?p.notes||'':'';
  $('#plGeo').value=p&&p.lat!=null?p.lat+', '+p.lng:'';{const c=$('#plEstab');if(c)c.checked=!!(p&&p.established)}
  $('#plTitle').textContent=plState.kind==='encounter'?(p?tr('Edit encounter','Redigera fynd','Vondst bewerken'):tr('New encounter','Nytt fynd','Nieuwe vondst')):(p?tr('Edit planting','Redigera plantering'):tr('New planting','Ny plantering'));
  const places=[...new Set((state.plantings||[]).map(x=>x.place).filter(Boolean))].sort();
  $('#plPlaces').innerHTML=places.map(x=>'<option value="'+esc(x)+'"></option>').join('');
  const srcs=[...new Set(state.obs.filter(o=>o.kind==='source').map(o=>o.supplier).filter(Boolean))].sort();
  $('#plSources').innerHTML=srcs.map(x=>'<option value="'+esc(x)+'"></option>').join('');
  f.scrollIntoView({block:'nearest'});$('#plPlace').focus();
}
async function plSave(){
  const sid=$('#plSp').value,x=bySid.get(sid);if(!x){toast(tr('Choose a species.','Välj en art.'),'err');return}
  const enc=plState.kind==='encounter';
  const cv=enc?'':cvRead('#plCv','#plCvNew',x);if(cv===null){toast(tr('Type the cultivar name.','Skriv sortnamnet.','Typ de cultivarnaam.'),'err');return}
  const old=plState.edit&&(state.plantings||[]).find(p=>p.id===plState.edit);
  const geo=$('#plGeo').value.split(',').map(v=>parseFloat(v));
  const st=$('#plStatus').value;
  const doc=enc?{kind:'encounter',sid,latin:x.latin,place:$('#plPlace').value.trim(),date:$('#plDate').value||today(),status:st,established:!!($('#plEstab')||{}).checked,checks:old&&old.checks?old.checks.slice():[],createdAt:old?old.createdAt:Date.now()}
    :{sid,latin:x.latin,place:$('#plPlace').value.trim(),date:$('#plDate').value||today(),count:$('#plCount').value?Number($('#plCount').value):null,
    source:$('#plSource').value.trim(),status:st,notes:$('#plNotes').value.trim(),checks:old&&old.checks?old.checks.slice():[],createdAt:old?old.createdAt:Date.now()};
  if(old&&old.winters)doc.winters=old.winters;
  // Project and named place (2.7.0). The project decides who sees the record (D7).
  {const s=$('#plProj');if(s&&PROJ_ON&&!enc){
    let pid=s.value||'';
    if(pid==='__new'){const n=String(($('#plProjNew')||{}).value||'').trim();if(!n){toast(tr('Give the new project a name.','Ge det nya projektet ett namn.','Geef het nieuwe project een naam.'),'err');const i=$('#plProjNew');if(i)i.focus();return}
      try{pid=await Data.saveRow('projects',null,{name:n.slice(0,80),description:'',country:'',szone:'',usda:'',places:[],createdAt:Date.now()});pjSet(pid);toast(tr('Project created: ','Projekt skapat: ','Project aangemaakt: ')+n)}catch(e){toast(errMsg(e),'err');return}}
    if(!pid){toast(tr('Choose a project.','Välj ett projekt.','Kies een project.'),'err');return}
    doc.project=pid;const pi=($('#plPlaceId')||{}).value||'';if(pi){doc.placeId=pi;if(!doc.place)doc.place=plPlaceName(Object.assign({},doc))}}}
  if(geo.length===2&&geo.every(isFinite)){doc.lat=geo[0];doc.lng=geo[1]}
  if(old&&old.fromV1)doc.fromV1=true;
  if(cv)doc.cultivar=cv;
  if(old&&old.status!==st)doc.checks.push({date:today(),status:st,note:''});
  if(enc&&old&&old.clim&&old.lat===doc.lat&&old.lng===doc.lng)doc.clim=old.clim;
let climFail=false;if(enc&&doc.established&&!doc.clim&&isFinite(doc.lat)){toast(tr('Looking up the winter climate…','Hämtar vinterklimatet…','Winterklimaat opzoeken…'));if(await plClimFor(doc)===null)climFail=true}
  try{await Data.saveRow('plantings',plState.edit,doc);$('#plForm').hidden=true;plState.edit=null;toast(climFail?tr('Encounter saved. Winter climate: ','Fyndet sparat. Vinterklimat: ','Vondst opgeslagen. Winterklimaat: ')+omErrMsg(OM_LAST_ERR)+' '+tr('Use “Look up climate” later.','Använd ”Hämta klimat” senare.','Gebruik later “Klimaat opzoeken”.'):enc?(doc.clim?tr('Encounter saved: ','Fyndet sparat: ','Vondst opgeslagen: ')+climTxt(doc.clim):tr('Encounter saved','Fyndet sparat','Vondst opgeslagen')):tr('Planting saved','Plantering sparad'),climFail?'err':'');updatePlantings()}catch(e){toast(errMsg(e),'err')}
}
async function plSetStatus(id,st,note){
  const p=(state.plantings||[]).find(x=>x.id===id);if(!p||!st)return;
  const doc=Object.assign({},p);delete doc.id;doc.checks=(p.checks||[]).concat([{date:today(),status:st,note:note||''}]);doc.status=st;
  try{await Data.saveRow('plantings',id,doc);toast(tr('Status updated','Status uppdaterad'))}catch(e){toast(errMsg(e),'err')}
}
function updatePlantings(){
  {const s=$('#plProjSel');if(s){const ps=state.projects||[];s.hidden=!PROJ_ON||!ps.length;if(plState.proj&&plState.proj!=='__none'&&!pjById(plState.proj))plState.proj='';
    s.innerHTML='<option value="">'+esc(tr('All projects','Alla projekt','Alle projecten'))+'</option>'+ps.map(q=>'<option value="'+esc(q.id)+'"'+(q.id===plState.proj?' selected':'')+'>'+esc(pjName(q.id))+'</option>').join('')+'<option value="__none"'+(plState.proj==='__none'?' selected':'')+'>'+esc(tr('Without a project','Utan projekt','Zonder project'))+'</option>'}}
  const all=(state.plantings||[]).filter(p=>!plState.proj||(plState.proj==='__none'?!p.project:p.project===plState.proj)).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const places=[...new Set(all.map(plPlaceName).filter(Boolean))].sort();
  $('#plPlaceSel').innerHTML='<option value="">'+esc(tr('All places','Alla platser'))+'</option>'+places.map(x=>'<option'+(x===plState.place?' selected':'')+'>'+esc(x)+'</option>').join('');
  $$('#plStatSeg [data-plst]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.plst===plState.status));
  const se=plShowEnc();{const c=$('#plShowEnc');if(c)c.checked=se;const lb=c&&c.closest('label');if(lb)lb.style.display=all.some(isEnc)?'':'none'}
  const list=all.filter(p=>(!plState.status||p.status===plState.status)&&(!plState.place||plPlaceName(p)===plState.place)&&(se||!isEnc(p)));
  $('#plStats').textContent=plSummary(all)||tr('No planting records yet.','Inga planteringar ännu.');
  $('#plList').innerHTML=list.length?list.map(p=>plRow(p,true)).join(''):'<div class="empty"><p>'+tr('No planting records match.','Inga planteringar matchar.')+'</p></div>';
  updatePlMap(list);
}
