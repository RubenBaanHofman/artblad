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
    sec(esc(tr('Possible problems','Möjliga problem','Mogelijke problemen')),problemsHTML())+sec(esc(tr('Charts','Diagram','Grafieken')),chartsHTML())+sec(esc(tr('Storage and traffic','Lagring och trafik','Opslag en verkeer')),usageHTML())+
    (REV.on?sec(esc(tr('Flagged for review','Flaggade för granskning','Gemeld voor controle'))+(REV.flags.length?' <span class="admcount">'+REV.flags.length+'</span>':''),flags)+sec(esc(tr('Review register','Granskningsregister','Controleregister')),reg):'');
}
