// Artblad: Verified marks, review flags and admin dashboard.
// Part 14 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- verified marks and review flags (setup/v4_review.sql). Marks, flags and the dashboard are for admins only. ---------- */
const REV={on:false,v5:false,marks:new Map(),flags:[],admins:new Set(),st:new Map(),smarks:new Map(),sec:new Map(),dis:new Map()};
const SVG_VMK='<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7.2"/><path d="M4.7 8.3l2.2 2.2 4.5-4.7"/></svg>';
function revSet(d){
  if(!d){REV.on=false;REV.v5=false;REV.marks=new Map();REV.flags=[];REV.admins=new Set();REV.smarks=new Map();REV.dis=new Map()}
  else{REV.on=true;REV.marks=new Map((d.reviews||[]).map(x=>[x.sid,{at:x.at,by:x.by}]));REV.flags=d.flags||[];REV.admins=new Set(d.admins||[]);
    REV.v5=Number(d.v)>=5;REV.smarks=new Map();(d.sections||[]).forEach(x=>{(REV.smarks.get(x.sid)||REV.smarks.set(x.sid,new Map()).get(x.sid)).set(x.s,{at:x.at,by:x.by})});
    REV.dis=new Map();(d.dismissed||[]).forEach(x=>{(REV.dis.get(x.sid)||REV.dis.set(x.sid,new Map()).get(x.sid)).set(x.k,{at:x.at,by:x.by})})}
  revCompute();
}
// A mark turns grey when someone who is not an admin (a contributor, or Artie) adds, changes or deletes an entry of the species after it.
// The full mark turns grey when 20 % or more of the sheet's information was changed after it by someone who is not an
// admin (a contributor, or Artie). Changed = a field whose value differs from what the sheet showed at verification.
const REV_LIMIT=0.2;
function revCompute(){
  REV.st=new Map();revSecCompute();if(!REV.on)return;
  const bySidE=new Map(),add=(e,live)=>{if(!REV.marks.has(e.sid))return;(bySidE.get(e.sid)||bySidE.set(e.sid,[]).get(e.sid)).push({e,live,m:META.get(e.id)||{}})};
  (state.entries||[]).forEach(e=>add(e,true));(state.trashE||[]).forEach(e=>add(e,false));
  const ord=(a,b)=>(a.date||'').localeCompare(b.date||'')||(a.createdAt||0)-(b.createdAt||0);
  REV.marks.forEach((r,sid)=>{
    const at=new Date(r.at),list=bySidE.get(sid)||[];let chg=null;
    const late=x=>{const t=new Date(x.m.updatedAt||x.m.createdAt||0);return t>at&&!(x.m.updatedBy&&REV.admins.has(x.m.updatedBy))};
    const gone=x=>!x.live&&x.m.deletedAt&&new Date(x.m.deletedAt)>at;
    list.forEach(x=>{if(late(x)||gone(x)){const t=x.m.updatedAt||x.m.createdAt;if(!chg||new Date(t)>new Date(chg.at))chg={at:t,by:x.m.updatedBy}}});
    if(!chg){REV.st.set(sid,Object.assign({},r,{pct:0}));return}
    const before=mergeEntries(list.filter(x=>(x.live&&!late(x))||gone(x)).map(x=>x.e).sort(ord)).m;
    const now=mergeEntries(list.filter(x=>x.live).map(x=>x.e).sort(ord)).m;
    const keys=[...new Set(Object.keys(before).concat(Object.keys(now)))].filter(k=>k!=='cultivar');
    const changed=keys.filter(k=>!sameVal(before[k],now[k])).length,pct=keys.length?changed/keys.length:0;
    REV.st.set(sid,Object.assign({},r,{pct,chg},pct>=REV_LIMIT?{stale:1}:{}));
  });
}
async function loadReview(){if(!SB||!isAdmin()){revSet(null);return}try{const r=await SB.rpc('review_state');if(r.error)throw r.error;revSet(r.data)}catch(e){revSet(null)}}
const revTitle=r=>tr('Verified ','Verifierad ','Geverifieerd ')+fmtDate(r.at)+(r.chg?' · '+Math.round(100*r.pct)+' % '+tr('changed since','ändrat sedan dess','sindsdien gewijzigd')+(r.stale?' ('+who(r.chg.by)+')':''):'');
function vmark(sid){const r=REV.st.get(sid);if(!r)return '';const t=revTitle(r);return ' <span class="vmk'+(r.stale?' stale':'')+'" role="img" title="'+esc(t)+'" aria-label="'+esc(t)+'">'+SVG_VMK+'</span>'}
const flagsFor=sid=>REV.flags.filter(f=>f.sid===sid);
function flagRow(f,withSp){
  const sp=withSp&&bySid.get(f.sid);
  return '<div class="ent flagrow"><span>'+(withSp?(sp?'<button type="button" class="lnk" data-open="'+esc(f.sid)+'">'+esc(dispName(sp))+'</button>':'<i>'+esc(f.latin)+'</i>')+' · ':'')+(f.reason?'“'+esc(f.reason)+'” · ':'')+esc(who(f.by))+' · '+esc(fmtDate(f.at))+'</span>'+
    '<button type="button" class="btn sm" data-act="flag-resolve" data-fid="'+esc(f.id)+'">'+esc(tr('Close flag','Stäng flaggan','Melding sluiten'))+'</button></div>';
}
function revBoxHTML(s){
  if(!isAdmin()||!SB)return '';
  if(!REV.on)return '<div class="revbox"><span class="muted">'+esc(tr('Verified marks need the database update v4_review.sql.','Verifieringsmarkeringar kräver databasuppdateringen v4_review.sql.','Verificatiemarkeringen vereisen de database-update v4_review.sql.'))+'</span></div>';
  const r=REV.st.get(s.sid),fl=flagsFor(s.sid);
  return '<div class="revbox'+(r?(r.stale?' stale':' ok'):'')+'"><span class="revst">'+
    (r?vmark(s.sid)+' '+esc(tr('Verified ','Verifierad ','Geverifieerd '))+esc(fmtDate(r.at))+' '+esc(tr('by ','av ','door '))+esc(who(r.by))+(r.chg?'. '+esc(tr('Changed since by ','Ändrad sedan dess av ','Sindsdien gewijzigd door '))+esc(who(r.chg.by))+' ('+esc(fmtDate(r.chg.at))+', '+Math.round(100*r.pct)+' % '+tr('of the information','av uppgifterna','van de gegevens')+(r.stale?'':'; '+tr('grey from 20 %','grå från 20 %','grijs vanaf 20 %'))+').':'.')
      :esc(tr('Not verified yet.','Inte verifierad än.','Nog niet geverifieerd.')))+
    ' <small class="muted">'+esc(tr('Only admins see this.','Bara admin ser detta.','Alleen beheerders zien dit.'))+'</small></span>'+
    '<span class="acts"><button type="button" class="btn sm primary" data-act="rev-mark">'+esc(r?tr('Verify again','Verifiera igen','Opnieuw verifiëren'):tr('Mark as verified','Markera som verifierad','Als geverifieerd markeren'))+'</button>'+
    (r?'<button type="button" class="btn sm" data-act="rev-unmark">'+esc(tr('Remove mark','Ta bort markeringen','Markering verwijderen'))+'</button>':'')+'</span>'+
    (REV.v5?secChipsHTML(s):'<div class="revflags"><small class="muted">'+esc(tr('Section marks and dismissing problems need the database update v5_live_sections.sql.','Avsnittsmarkeringar och att avfärda problem kräver databasuppdateringen v5_live_sections.sql.','Markeringen per onderdeel en problemen negeren vereisen de database-update v5_live_sections.sql.'))+'</small></div>')+
    probListHTML(s)+
    (fl.length?'<div class="revflags"><b>'+esc(tr('Flagged for review','Flaggad för granskning','Gemeld voor controle'))+' ('+fl.length+')</b>'+fl.map(f=>flagRow(f,false)).join('')+'<small class="muted">'+esc(tr('Marking the species as verified closes its flags.','Att markera arten som verifierad stänger flaggorna.','Als je de soort als geverifieerd markeert, worden de meldingen gesloten.'))+'</small></div>':'')+
    '</div>';
}
async function revCall(name,args,msg){try{const r=await SB.rpc(name,args);if(r.error)throw r.error;if(msg)toast(msg);await loadReview();refresh()}catch(e){toast(errMsg(e),'err')}}
async function flagSend(s){
  const reason=String($('#flagReason').value||'').trim().slice(0,500);
  try{const r=await SB.rpc('flag_species',{p_sid:s.sid,p_latin:s.latin,p_reason:reason});if(r.error)throw r.error;
    toast(r.data==='duplicate'?tr('Your earlier flag was updated. The admins will have a look.','Din tidigare flagga uppdaterades. Admin tittar på den.','Je eerdere melding is bijgewerkt. De beheerders kijken ernaar.'):tr('Thanks: the species is flagged for review.','Tack: arten är flaggad för granskning.','Bedankt: de soort is gemeld voor controle.'));
    $('#flagBox').hidden=true;$('#flagReason').value='';if(isAdmin()){await loadReview();refresh()}}
  catch(e){toast(errMsg(e),'err')}
}
/* admin dashboard */
const admState={tab:'never',n:40};
function admCounts(){let ok=0,st=0;species.forEach(s=>{const r=REV.st.get(s.sid);if(r){if(r.stale)st++;else ok++}});return{tot:species.length,ok,st,none:species.length-ok-st}}
function updateAdminBadge(){
  const f=isAdmin()?REV.flags.length:0,st=isAdmin()?species.filter(s=>{const r=REV.st.get(s.sid);return r&&r.stale}).length:0,a=isAdmin()?afRows.filter(r=>r.status==='open').length:0,n=f+st+a;
  $$('.admbadge').forEach(b=>{b.hidden=!n;b.textContent=n});
  const t=tr('Admin dashboard','Adminpanel','Beheerdersdashboard')+(n?': '+[f?f+' '+tr('flagged','flaggade','gemeld'):'',st?st+' '+tr('changed since verification','ändrade sedan verifieringen','gewijzigd sinds verificatie'):'',a?a+' '+tr('for Artie','till Artie','voor Artie'):''].filter(Boolean).join(', '):'');
  $$('.dkdot').forEach(d=>{d.hidden=!n});$$('#dock [data-dk=admin]').forEach(x=>{x.title=t;x.setAttribute('aria-label',t)});
}
// View-only accounts: what contributors can do, and how to get access. ADMIN_CONTACT in config.js (optional): an email address or a link.
function updateJoin(){
  const c=String(cfg.ADMIN_CONTACT||'').trim(),box=$('#joinContact');if(!box)return;
  const href=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)?'mailto:'+c+'?subject='+encodeURIComponent('Artblad: contributor access'):safeUrl(c);
  box.innerHTML=href?'<a class="btn primary" href="'+esc(href)+'">'+esc(tr('Contact the admin','Kontakta admin','Neem contact op met de beheerder'))+'</a>':'';
}
function updateAdmin(){
  const box=$('#admBody');if(!box)return;
  if(!isAdmin()){box.innerHTML='<p class="muted">'+esc(tr('Only admins can see this page.','Bara admin kan se den här sidan.','Alleen beheerders kunnen deze pagina zien.'))+'</p>';return}
  const c=admCounts(),pc=x=>c.tot?Math.round(1000*x/c.tot)/10:0,open=afRows.filter(r=>r.status==='open');
  const sec=(h,body)=>'<section class="admsec"><h2 class="hsec">'+h+'</h2>'+body+'</section>';
  const note=REV.on?(REV.v5?'':'<p class="admwarn">'+esc(tr('Live updates, section marks and dismissing problems need the database update v5_live_sections.sql.','Liveuppdateringar, avsnittsmarkeringar och att avfärda problem kräver databasuppdateringen v5_live_sections.sql.','Live-updates, markeringen per onderdeel en problemen negeren vereisen de database-update v5_live_sections.sql.'))+'</p>'):'<p class="admwarn">'+esc(tr('Verified marks and flags need the database update v4_review.sql. Until it has been run, this page shows only the Artie requests.','Verifieringar och flaggor kräver databasuppdateringen v4_review.sql. Tills den har körts visar sidan bara Artie-förfrågningarna.','Verificaties en meldingen vereisen de database-update v4_review.sql. Tot die is uitgevoerd, toont deze pagina alleen de Artie-aanvragen.'))+'</p>';
  const bar='<div class="vbar" role="img" aria-label="'+esc(pc(c.ok)+' % '+tr('verified','verifierade','geverifieerd'))+'"><span class="ok" style="width:'+pc(c.ok)+'%"></span><span class="st" style="width:'+pc(c.st)+'%"></span></div>'+
    (REV.v5?(()=>{const q=secCounts();return '<p class="vleg vsec"><span>'+esc(tr('Sections verified','Verifierade avsnitt','Geverifieerde onderdelen'))+': <b>'+q.ok+'</b> '+esc(tr('of','av','van'))+' '+q.tot+'</span><span>'+esc(tr('Partly verified species','Delvis verifierade arter','Gedeeltelijk geverifieerde soorten'))+': <b>'+q.part+'</b></span>'+(q.old?'<span>'+esc(tr('Sources verified more than two years ago','Källor verifierade för mer än två år sedan','Bronnen meer dan twee jaar geleden geverifieerd'))+': <b>'+q.old+'</b></span>':'')+'</p>'})():'')+
    '<p class="vleg"><span><i class="sw ok"></i>'+esc(tr('Verified','Verifierade','Geverifieerd'))+': <b>'+c.ok+'</b> '+esc(tr('of','av','van'))+' '+c.tot+' ('+pc(c.ok)+' %)</span><span><i class="sw st"></i>'+esc(tr('Changed since verification','Ändrade sedan verifieringen','Gewijzigd sinds verificatie'))+': <b>'+c.st+'</b></span><span><i class="sw no"></i>'+esc(tr('Not verified','Inte verifierade','Niet geverifieerd'))+': <b>'+c.none+'</b></span></p>';
  const artie=(open.length?'<p class="admnew">'+esc(open.length+' '+(open.length===1?tr('new species requested for Artie','ny art begärd till Artie','nieuwe soort aangevraagd voor Artie'):tr('new species requested for Artie','nya arter begärda till Artie','nieuwe soorten aangevraagd voor Artie')))+'</p><p class="muted" style="margin:4px 0 8px">'+open.slice(0,12).map(r=>'<i>'+esc(r.latin)+'</i>'+(r.n>1?' ('+r.n+'×)':'')).join(', ')+(open.length>12?' …':'')+'</p>':'<p class="muted">'+esc(tr('No new requests.','Inga nya förfrågningar.','Geen nieuwe aanvragen.'))+'</p>')+
    '<div class="acts"><button type="button" class="btn sm primary" data-act="af-download"'+(open.length?'':' disabled')+'>'+esc(tr('Download the list for Artie (.txt)','Ladda ner listan till Artie (.txt)','Lijst voor Artie downloaden (.txt)'))+'</button><button type="button" class="btn sm" data-act="af-sent"'+(open.length?'':' disabled')+'>'+esc(tr('Mark as sent','Markera som skickade','Als verstuurd markeren'))+'</button><a class="btn sm" href="#autofill">'+esc(tr('All requests','Alla förfrågningar','Alle aanvragen'))+'</a></div>';
  const flags=REV.flags.length?'<div class="stack">'+REV.flags.map(f=>flagRow(f,true)).join('')+'</div>':'<p class="muted">'+esc(tr('No open flags.','Inga öppna flaggor.','Geen open meldingen.'))+'</p>';
  const partOf=s=>{const m=REV.sec.get(s.sid),f=REV.st.get(s.sid);if(!m||(f&&!f.stale))return false;let g=0;m.forEach(r=>{if(!r.stale)g++});return g>0};
  const tabs=[['never',tr('Not verified','Inte verifierade','Niet geverifieerd'),c.none]].concat(REV.v5?[['part',tr('Partly verified','Delvis verifierade','Gedeeltelijk geverifieerd'),species.filter(partOf).length]]:[]).concat([['stale',tr('Changed since verification','Ändrade sedan verifieringen','Gewijzigd sinds verificatie'),c.st],['oldest',tr('Verified longest ago','Verifierade längst sedan','Langst geleden geverifieerd'),c.ok+c.st]]);
  let list=species.filter(s=>{const r=REV.st.get(s.sid);return admState.tab==='part'?partOf(s):admState.tab==='never'?!r:admState.tab==='stale'?r&&r.stale:!!r});
  if(admState.tab==='never'||admState.tab==='part')list.sort(byName);else list.sort((a,b)=>new Date(REV.st.get(a.sid).at)-new Date(REV.st.get(b.sid).at));
  const rows=list.slice(0,admState.n).map(s=>{const r=REV.st.get(s.sid),nm=names(s),m=META.get((s.entries[s.entries.length-1]||{}).id)||{};
    return '<div class="gaprow"><button type="button" class="gapmain" data-open="'+esc(s.sid)+'"><span class="ph" style="--c:'+FCOL[s.form]+'">'+phInner(s,1)+'</span><span style="min-width:0"><span class="lat">'+nm.main+'</span><span class="nm">'+nm.sub+'</span></span></button>'+
      '<span class="muted" style="font-size:13.5px">'+(admState.tab==='part'?esc(tr('Sections: ','Avsnitt: ','Onderdelen: ')+RSECS.filter(x=>{const v=secState(s.sid,x.id);return v&&!v.stale}).map(x=>secName(x.id)).join(', ')):r?esc(revTitle(r)):esc(tr('Last change ','Senast ändrad ','Laatst gewijzigd ')+(fmtDate(m.updatedAt||m.createdAt)||'–')))+(flagsFor(s.sid).length?' · <b>'+esc(tr('flagged','flaggad','gemeld'))+'</b>':'')+'</span>'+
      '<button type="button" class="btn sm" data-open="'+esc(s.sid)+'">'+esc(tr('Open','Öppna','Openen'))+'</button></div>'}).join('');
  const reg='<div class="seg admtabs" role="group">'+tabs.map(t=>'<button type="button" data-act="adm-tab" data-tab="'+t[0]+'" aria-pressed="'+(admState.tab===t[0])+'">'+esc(t[1])+' ('+t[2]+')</button>').join('')+'</div>'+
    '<div class="stack">'+(rows||'<p class="muted">'+esc(tr('Nothing here.','Inget här.','Niets hier.'))+'</p>')+'</div>'+(list.length>admState.n?'<div class="acts"><button type="button" class="btn sm" data-act="adm-more">'+esc(tr('Show more','Visa fler','Meer tonen'))+' ('+(list.length-admState.n)+')</button></div>':'');
  box.innerHTML=note+(REV.on?sec(esc(tr('Verified species','Verifierade arter','Geverifieerde soorten')),bar):'')+
    sec(esc(tr('Artie requests','Artie-förfrågningar','Artie-aanvragen'))+(open.length?' <span class="admcount">'+open.length+'</span>':''),artie)+
    sec(esc(tr('Possible problems','Möjliga problem','Mogelijke problemen')),problemsHTML())+sec(esc(tr('Charts','Diagram','Grafieken')),chartsHTML())+sec(esc(tr('Storage and traffic','Lagring och trafik','Opslag en verkeer')),usageHTML())+sec(esc(tr('Service check','Tjänstekontroll','Dienstencontrole')),chkHTML())+sec(esc(tr('Unused photo files','Oanvända fotofiler','Ongebruikte fotobestanden')),orphHTML())+
    (REV.on?sec(esc(tr('Flagged for review','Flaggade för granskning','Gemeld voor controle'))+(REV.flags.length?' <span class="admcount">'+REV.flags.length+'</span>':''),flags)+sec(esc(tr('Review register','Granskningsregister','Controleregister')),reg):'');
}

/* ---------- 2.6.0: service check (queue rows 72 and 3) ----------
   One button tests the app's own back end (read, save, live updates, photo storage, database functions) and every
   outside service in SERVICES (01-core.js). Nothing is changed: the save test writes your own display name back
   unchanged, the photo test uploads a 1-pixel image and removes it again. */
const CHK={busy:false,res:null,at:0};
const PIXEL_JPG='/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
async function chkRun(){
  if(CHK.busy)return;CHK.busy=true;updateAdmin();
  const out=[],T=async(id,label,fn)=>{const t0=Date.now();try{const msg=await fn();out.push({id,label,ok:true,msg:msg||'',ms:Date.now()-t0})}catch(e){out.push({id,label,ok:false,msg:(e&&(e.message||e.code))||String(e),ms:Date.now()-t0})}};
  const sbErr=r=>{if(r&&r.error)throw r.error;return r};
  await T('read',tr('Read species data','Läsa artdata','Soortgegevens lezen'),async()=>{const r=sbErr(await SB.from('entries').select('id',{count:'exact',head:true}));return (r.count!=null?r.count+' '+tr('entries','poster','invoeren'):'')});
  await T('rpc',tr('Database functions','Databasfunktioner','Databasefuncties'),async()=>{const r=sbErr(await SB.rpc('my_role'));return String(r.data||'')});
  await T('save',tr('Save (display name written back unchanged)','Spara (visningsnamnet skrivs tillbaka oförändrat)','Opslaan (weergavenaam ongewijzigd teruggeschreven)'),async()=>{const uid=meUid();const p=sbErr(await SB.from('profiles').select('display_name').eq('user_id',uid).maybeSingle());if(!p.data)return tr('no display name set: skipped','inget visningsnamn: hoppades över','geen weergavenaam: overgeslagen');sbErr(await SB.from('profiles').upsert({user_id:uid,display_name:p.data.display_name,updated_at:new Date().toISOString()}));return ''});
  await T('v9',tr('Projects (database update v9)','Projekt (databasuppdatering v9)','Projecten (database-update v9)'),async()=>{const r=await SB.from('projects').select('id',{count:'exact',head:true});if(r.error)throw new Error(tr('not installed: run v9_projects.sql','inte installerad: kör v9_projects.sql','niet geïnstalleerd: voer v9_projects.sql uit'));return ''});
  await T('v10',tr('Summer records (database update v10)','Sommarnoteringar (databasuppdatering v10)','Zomernotities (database-update v10)'),async()=>{const r=await SB.rpc('artblad_summer_evidence');if(r.error)throw new Error(tr('not installed: run v10_records.sql','inte installerad: kör v10_records.sql','niet geïnstalleerd: voer v10_records.sql uit'));return ''});
  await T('live',tr('Live updates','Liveuppdateringar','Live-updates'),async()=>{const st=RT&&RT.state;if(st==='joined')return '';throw new Error(st?'state: '+st:tr('not connected','inte ansluten','niet verbonden'))});
  await T('photo',tr('Photo storage (upload and remove a test image)','Fotolagring (ladda upp och ta bort en testbild)','Fotoopslag (testafbeelding uploaden en verwijderen)'),async()=>{
    const bin=atob(PIXEL_JPG),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
    const name='check-'+randHex(6)+'.jpg';sbErr(await SB.storage.from('photos').upload(name,new Blob([u8],{type:'image/jpeg'}),{contentType:'image/jpeg'}));sbErr(await SB.storage.from('photos').remove([name]));return ''});
  for(const id of Object.keys(SERVICES)){
    const s=SERVICES[id];
    await T('svc:'+id,s.name,async()=>{
      if(s.off)return tr('switched off in config.js','avstängd i config.js','uitgeschakeld in config.js');
      if(id==='knmi'&&!knmiKey())return tr('not set up: add KNMI_API_KEY to config.js (the Netherlands then uses the model)','inte inställd: lägg till KNMI_API_KEY i config.js (Nederländerna använder då modellen)','niet ingesteld: voeg KNMI_API_KEY toe aan config.js (Nederland gebruikt dan het model)');
      if(id==='frost'&&!frostKey())return tr('not set up: add FROST_CLIENT_ID to config.js (Norway then uses the model)','inte inställd: lägg till FROST_CLIENT_ID i config.js (Norge använder då modellen)','niet ingesteld: voeg FROST_CLIENT_ID toe aan config.js (Noorwegen gebruikt dan het model)');
      const url=id==='tiles'?s.url.replace('{s}','a').replace('{z}/{x}/{y}',s.test):s.url+(s.test||'');
      const c=new AbortController(),t=setTimeout(()=>c.abort(),15000);
      try{const r=await svcFetch(id,url,id==='tiles'?{signal:c.signal,mode:'no-cors'}:id==='frost'?Object.assign(frostOpts(),{signal:c.signal}):id==='knmi'?Object.assign(knmiOpts(),{signal:c.signal}):{signal:c.signal});if(r.type!=='opaque'&&!r.ok&&r.status!==429)throw new Error('HTTP '+r.status);return (r.status===429?tr('reachable, limit reached for now','nåbar, gränsen nådd just nu','bereikbaar, limiet nu bereikt'):'')+(s.custom?' · '+tr('own address from config.js','egen adress från config.js','eigen adres uit config.js'):'')}
      finally{clearTimeout(t)}});
  }
  CHK.res=out;CHK.at=Date.now();CHK.busy=false;updateAdmin();
}
function chkHTML(){
  const last=[...SVC_ST.entries()];
  const res=CHK.res?'<table class="cmpt chkt"><tbody>'+CHK.res.map(x=>'<tr class="'+(x.ok?'ok':'bad')+'"><td>'+(x.ok?'✓':'✗')+'</td><th scope="row">'+esc(x.label)+'</th><td>'+esc(x.msg)+'</td><td class="muted">'+x.ms+' ms</td></tr>').join('')+'</tbody></table><p class="muted" style="font-size:13px">'+esc(tr('Checked ','Kontrollerat ','Gecontroleerd '))+esc(new Date(CHK.at).toLocaleTimeString(LOC()))+'. '+esc(tr('Only Supabase is needed for reading and saving; the outside services add extras.','Bara Supabase behövs för att läsa och spara; de externa tjänsterna ger extra funktioner.','Alleen Supabase is nodig voor lezen en opslaan; de externe diensten voegen extra’s toe.'))+'</p>':'';
  const seen=last.length?'<p class="muted" style="font-size:13px">'+esc(tr('Used this session: ','Använt under sessionen: ','Gebruikt in deze sessie: '))+last.map(([id,v])=>esc((SERVICES[id]||{}).name||id)+' '+(v.ok?'✓':'✗'+(v.msg?' ('+esc(v.msg)+')':''))).join(' · ')+'</p>':'';
  return '<p class="muted">'+esc(tr('Tests the database, saving, live updates, photo storage and each outside service. Nothing is changed.','Testar databasen, sparande, liveuppdateringar, fotolagring och varje extern tjänst. Inget ändras.','Test de database, opslaan, live-updates, fotoopslag en elke externe dienst. Er verandert niets.'))+'</p>'+
    '<div class="acts"><button type="button" class="btn sm primary" data-act="chk-run"'+(CHK.busy?' disabled':'')+'>'+esc(CHK.busy?tr('Checking…','Kontrollerar…','Controleren…'):tr('Run the check','Kör kontrollen','Controle uitvoeren'))+'</button></div>'+res+seen;
}

/* ---------- 2.6.0: photo files that nothing uses any more (queue row 75) ----------
   Since 2.5.1 a replaced photo stays in storage until the trash is emptied (it could still be restored). This lists files
   that no entry or observation (live or in the trash) points to and that are older than a day, and can delete them. */
const ORPH={busy:false,list:null,err:''};
async function orphFind(){
  ORPH.busy=true;ORPH.err='';updateAdmin();
  try{
    let files=[],off=0;for(;;){const r=await SB.storage.from('photos').list('',{limit:1000,offset:off,sortBy:{column:'name',order:'asc'}});if(r.error)throw r.error;files=files.concat(r.data||[]);if(!r.data||r.data.length<1000)break;off+=1000}
    const day=Date.now()-864e5,ids=new Map();
    files.forEach(f=>{const m=/^([0-9a-f]+)(_t)?\.jpg$/.exec(f.name);if(!m)return;const o=ids.get(m[1])||{id:m[1],files:[],size:0,at:0};o.files.push(f.name);o.size+=((f.metadata||{}).size)||0;o.at=Math.max(o.at,new Date(f.created_at||f.updated_at||0).getTime());ids.set(m[1],o)});
    ORPH.list=[...ids.values()].filter(o=>!photoUsed(o.id)&&o.at&&o.at<day).sort((a,b)=>a.at-b.at);ORPH.total=ids.size;
  }catch(e){ORPH.err=errMsg(e)}
  ORPH.busy=false;updateAdmin();
}
async function orphDelete(){
  if(!ORPH.list||!ORPH.list.length)return;ORPH.busy=true;updateAdmin();
  try{const names=[].concat(...ORPH.list.filter(o=>!photoUsed(o.id)).map(o=>o.files));for(let i=0;i<names.length;i+=100){const r=await SB.storage.from('photos').remove(names.slice(i,i+100));if(r.error)throw r.error}
    toast(tr('Deleted ','Raderade ','Verwijderd: ')+ORPH.list.length+tr(' unused photos',' oanvända foton',' ongebruikte foto’s'));ORPH.list=[]}
  catch(e){ORPH.err=errMsg(e)}
  ORPH.busy=false;updateAdmin();
}
function orphHTML(){
  const kb=n=>n>1048576?(Math.round(n/104857.6)/10)+' MB':Math.max(1,Math.round(n/1024))+' kB';
  let body='<p class="muted">'+esc(tr('Photo files that no entry or observation uses any more (also not in the trash), older than a day.','Fotofiler som ingen post eller observation använder längre (inte heller i papperskorgen), äldre än ett dygn.','Fotobestanden die geen invoer of waarneming meer gebruikt (ook niet in de prullenbak), ouder dan een dag.'))+'</p>';
  body+='<div class="acts"><button type="button" class="btn sm" data-act="orph-find"'+(ORPH.busy?' disabled':'')+'>'+esc(ORPH.busy?tr('Working…','Arbetar…','Bezig…'):tr('Look for unused photos','Leta efter oanvända foton','Ongebruikte foto’s zoeken'))+'</button>'+
    (ORPH.list&&ORPH.list.length?'<button type="button" class="btn sm danger" data-act="orph-del"'+(ORPH.busy?' disabled':'')+'>'+esc(tr('Delete these ','Radera dessa ','Deze verwijderen: ')+ORPH.list.length)+'</button>':'')+'</div>';
  if(ORPH.err)body+='<p class="admwarn">'+esc(ORPH.err)+'</p>';
  if(ORPH.list)body+=ORPH.list.length?'<p>'+esc(ORPH.list.length+' '+tr('unused of','oanvända av','ongebruikt van')+' '+ORPH.total+' '+tr('photos','foton','foto’s')+' · '+kb(ORPH.list.reduce((a,o)=>a+o.size,0)))+'</p>':'<p class="muted">'+esc(tr('No unused photos.','Inga oanvända foton.','Geen ongebruikte foto’s.'))+'</p>';
  return body;
}
