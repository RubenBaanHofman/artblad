// Artblad: Shared lists, who and when, trash, display name, manual.
// Part 20 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- shared lists ---------- */
const listById=id=>(state.lists||[]).find(l=>l.id===id);
function addListSelect(sid){
  if(!SB||!CANW)return '';
  const mine=(state.lists||[]).filter(l=>canEdit(l.id));
  return '<select class="addlist" data-addlist="'+esc(sid)+'" aria-label="'+esc(tr('Add to a list','Lägg till i en lista'))+'"><option value="">'+esc(tr('Add to list…','Lägg till i lista…'))+'</option>'+
    mine.map(l=>'<option value="'+esc(l.id)+'"'+((l.sids||[]).indexOf(sid)>=0?' disabled':'')+'>'+esc(l.name)+((l.sids||[]).indexOf(sid)>=0?' ✓':'')+'</option>').join('')+'<option value="__new">'+esc(tr('New list…','Ny lista…'))+'</option></select>';
}
async function listAdd(lid,sid){
  if(lid==='__new'){const x=bySid.get(sid);const id=await Data.saveRow('lists',null,{name:tr('New list','Ny lista'),description:'',sids:[sid],createdAt:Date.now()});location.hash='l-'+id;return}
  const L=listById(lid);if(!L)return;const doc=Object.assign({},L);delete doc.id;doc.sids=[...new Set((L.sids||[]).concat([sid]))];
  try{await Data.saveRow('lists',lid,doc);toast(tr('Added to ','Tillagd i ')+L.name)}catch(e){toast(errMsg(e),'err')}
}
let openList='';
function updateLists(){
  const L=openList&&listById(openList);
  $('#listsAll').hidden=!!L;$('#listOne').hidden=!L;
  {const s=$('#newListProj');if(s){const ed=PROJ_ON&&pjEditable().length;const w=s.closest('.f');if(w)w.hidden=!ed;if(ed){const v=s.value||(pjActive()&&projCanEdit(PJ)?PJ:'');s.innerHTML=pjOptions(v,tr('Shared with everyone signed in','Delad med alla inloggade','Gedeeld met iedereen die is ingelogd'))}}}
  if(!L){
    const ls=(state.lists||[]).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name)));
    $('#listsGrid').innerHTML=ls.length?ls.map(l=>'<a class="htile" href="#l-'+esc(l.id)+'"><span class="hi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg></span><b>'+esc(l.name)+'</b><span>'+(l.project?pjPill(l.project)+' ':'')+esc(l.description||'')+(l.description?' · ':'')+(l.sids||[]).length+' '+tr('species','arter')+(SB?' · '+esc(trs('by ','av '))+esc(who((META.get(l.id)||{}).author)):'')+'</span></a>').join('')
      :'<div class="empty"><p>'+tr('No lists yet.','Inga listor ännu.')+'</p></div>';
    return;
  }
  const ed=canEdit(L.id),sp=(L.sids||[]).map(x=>bySid.get(x)).filter(Boolean).sort(byName);
  $('#listHead').innerHTML=ed?'<input id="listName" class="lname" value="'+esc(L.name)+'" aria-label="'+esc(tr('List name','Listans namn'))+'"><textarea id="listDesc" rows="2" placeholder="'+esc(tr('Description (optional)','Beskrivning (valfri)'))+'">'+esc(L.description||'')+'</textarea><div class="acts"><button class="btn sm primary" data-act="list-save">'+tr('Save name and description','Spara namn och beskrivning')+'</button><button class="btn sm danger" data-act="list-del">'+tr('Delete list','Radera lista')+'</button></div>'
    :'<h1>'+esc(L.name)+'</h1>'+(L.description?'<p>'+esc(L.description)+'</p>':'');
  $('#listInfo').innerHTML=(L.project?pjPill(L.project)+' ':'')+esc(sp.length+' '+tr('species','arter')+(SB?' · '+trs('by ','av ')+who((META.get(L.id)||{}).author):''));
  $('#listSp').innerHTML=sp.length?sp.map(x=>{const nm=names(x);return '<div class="gaprow"><button type="button" class="gapmain" data-open="'+esc(x.sid)+'"><span class="ph" style="--c:'+FCOL[x.form]+'">'+phInner(x,1)+'</span><span style="min-width:0"><span class="lat">'+nm.main+'</span><span class="nm">'+nm.sub+'</span></span></button><span></span>'+(ed?'<button class="btn sm" data-act="list-rm" data-sid="'+esc(x.sid)+'">'+tr('Remove','Ta bort')+'</button>':'<span></span>')+'</div>'}).join('')
    :'<div class="empty"><p>'+tr('This list is empty. Add species with “Add to list” on a species page or in Compare.','Listan är tom. Lägg till arter med ”Lägg till i lista” på en artsida eller i Jämför.')+'</p></div>';
}

/* ---------- who and when ---------- */
// Whole sentences: in EN+SV mode they stay in English rather than being glued together.
function who(uid){
  if(!uid)return trs('the first version','första versionen');
  const n=PROFILES.get(uid);if(n)return n;
  return uid===meUid()?trs('you','du'):trs('a user without a name','en användare utan namn');
}
const fmtDate=t=>{if(!t)return '';const d=new Date(t);return isNaN(d)?'':d.toLocaleDateString(state.lang==='sv'?'sv-SE':state.lang==='nl'?'nl-NL':'en-GB',{day:'numeric',month:'short',year:'numeric'})};
function speciesStamp(s){
  if(!SB||!s.entries.length)return '';
  const rows=s.entries.map(e=>META.get(e.id)).concat(s.obs.map(o=>META.get(o.id))).filter(Boolean);if(!rows.length)return '';
  const first=s.entries.map(e=>META.get(e.id)).filter(Boolean).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)))[0];
  const last=rows.slice().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];
  const added=first&&first.author?esc(trs('Added by ','Tillagd av '))+'<b>'+esc(who(first.author))+'</b>':esc(trs('Added in the first version','Tillagd i första versionen'));
  const changed=last.updatedBy?esc(trs(' by ',' av '))+'<b>'+esc(who(last.updatedBy))+'</b>':'';
  return '<p class="stamp">'+added+' · '+esc(trs('last changed ','senast ändrad '))+esc(fmtDate(last.updatedAt))+changed+'</p>';
}
function rowStamp(id){
  const m=META.get(id);if(!m)return '';
  const changed=m.updatedBy&&(m.updatedBy!==m.author||String(m.updatedAt).slice(0,16)!==String(m.createdAt).slice(0,16));
  return ' · '+(m.author?esc(trs('by ','av '))+esc(who(m.author)):esc(trs('from the first version','från första versionen')))+(changed?' · '+esc(trs('changed ','ändrad '))+esc(fmtDate(m.updatedAt))+esc(trs(' by ',' av '))+esc(who(m.updatedBy)):'');
}

/* ---------- trash ---------- */
const TRASH_DAYS=30;
function trashItems(){
  const rows=[];
  (state.trashE||[]).forEach(e=>rows.push({t:'entries',id:e.id,latin:e.latin+(entCv(e)?' '+cvQ(entCv(e)):''),what:trs('Entry from ','Post från ')+(e.date||'')+' · '+Object.keys(e.fields||{}).length+' '+(Object.keys(e.fields||{}).length===1?trs('field','fält'):trs('fields','fält')),m:META.get(e.id)}));
  (state.trashP||[]).forEach(p=>rows.push({t:'plantings',id:p.id,latin:p.latin,what:trs('Planting','Plantering')+': '+(p.place||'')+' '+(p.date||''),m:META.get(p.id)}));
  (state.trashC||[]).forEach(c=>rows.push({t:'comments',id:c.id,latin:(bySid.get(c.sid)||{}).latin||c.sid,what:trs('Comment','Kommentar')+': '+String(c.text||'').slice(0,80),m:META.get(c.id)}));
  (state.trashL||[]).forEach(l=>rows.push({t:'lists',id:l.id,latin:'',what:trs('List','Lista')+': '+(l.name||''),m:META.get(l.id)}));
  (state.trashPlan||[]).forEach(x=>rows.push({t:'plans',id:x.id,latin:'',what:trs('Garden plan','Trädgårdsplan')+': '+(x.name||''),m:META.get(x.id)}));
  (state.trashPj||[]).forEach(x=>rows.push({t:'projects',id:x.id,latin:'',what:trs('Project','Projekt')+': '+(x.name||''),m:META.get(x.id)}));
  (state.trashO||[]).forEach(o=>rows.push({t:'obs',id:o.id,latin:o.latin,what:(o.kind==='source'?trs('Source','Källa')+': '+(o.supplier||''):trs('Observation','Observation'))+' '+(o.date||'')+(o.text?': '+String(o.text).slice(0,80):''),m:META.get(o.id)}));
  return rows.sort((a,b)=>String(b.m.deletedAt).localeCompare(String(a.m.deletedAt)));
}
// Deleting for good: admins for shared records; the project's owner for a project and its records (v9).
const mayPurge=r=>r.t==='projects'?projRole(r.id)==='owner':(r.m&&r.m.project)?projRole(r.m.project)==='owner':isAdmin();
async function openTrash(){if(SB&&isAdmin()){try{const r=await SB.rpc('purge_trash');if(!r.error&&r.data)await loadAll()}catch(e){}}updateTrash()}
function updateTrash(){
  const rows=trashItems();
  $('#trashN').textContent=rows.length?' ('+rows.length+')':'';
  if($('#v-trash').hidden)return;
  $('#trashList').innerHTML=rows.length?rows.map(r=>{
    const left=Math.max(0,TRASH_DAYS-Math.floor((Date.now()-new Date(r.m.deletedAt))/864e5));
    return '<div class="ent trow2"><span style="min-width:0"><b><i>'+esc(r.latin||'')+'</i></b> · '+esc(r.what)+'<br><small class="muted">'+esc(trs('Deleted ','Raderad '))+esc(fmtDate(r.m.deletedAt))+esc(trs(' by ',' av '))+esc(who(r.m.deletedBy))+' · '+esc(trs(left+' days left',left+' dagar kvar',left+' dagen over'))+'</small></span>'+
      '<span class="acts">'+(canEdit(r.id)?'<button class="btn sm" data-act="restore" data-t2="'+r.t+'" data-id="'+esc(r.id)+'">'+trs('Restore','Återställ')+'</button>':'')+
      (mayPurge(r)?'<button class="btn sm danger" data-act="purge" data-t2="'+r.t+'" data-id="'+esc(r.id)+'">'+trs('Delete for good','Radera för gott')+'</button>':'')+'</span></div>'}).join('')
    :'<div class="empty"><p>'+trs('The trash is empty.','Papperskorgen är tom.')+'</p></div>';
}

/* ---------- display name ---------- */
function openName(hint){const b=$('#nameBox');b.hidden=false;$('#nameHint').hidden=!hint;$('#nameInput').value=PROFILES.get(meUid())||'';if(!hint)$('#nameInput').focus()}
async function saveName(){
  const v=$('#nameInput').value.trim();if(!v||v.length>40){toast(trs('Use 1 to 40 characters.','Använd 1 till 40 tecken.'),'err');return}if(v.indexOf('@')>=0){toast(trs('Use a name, not an email address.','Använd ett namn, inte en e-postadress.'),'err');return}
  try{await Data.setName(v);$('#nameBox').hidden=true;renderAcct();if(!$('#v-me').hidden)updateMe();toast(trs('Username saved','Användarnamn sparat'))}catch(e){toast(errMsg(e),'err')}
}

/* ---------- how to use this app: the manual, in the language of the app (site/manual.js, built from the manual doc) ---------- */
let manLoad=null;
function loadManual(){if(window.ARTBLAD_MANUAL)return Promise.resolve();if(!manLoad)manLoad=new Promise((res,rej)=>{const sc=document.createElement('script');sc.src='manual.js?v='+APP_VERSION;sc.onload=res;sc.onerror=()=>{manLoad=null;rej()};document.head.appendChild(sc)});return manLoad}
async function updateHelp(){
  const body=$('#helpBody');if(!body)return;
  if(!window.ARTBLAD_MANUAL){body.innerHTML='<p class="muted">'+esc(tr('Loading the manual…','Laddar manualen…','Handleiding laden…'))+'</p>';
    try{await loadManual()}catch(e){body.innerHTML='<p class="muted">'+esc(tr('The manual could not be loaded. Check your connection and try again.','Manualen kunde inte laddas. Kontrollera anslutningen och försök igen.','De handleiding kon niet worden geladen. Controleer je verbinding en probeer het opnieuw.'))+'</p>';return}}
  const M=window.ARTBLAD_MANUAL,l=LOC();
  if(body.dataset.lang===l)return;body.dataset.lang=l;
  body.innerHTML=M[l]||M.en;
  $('#helpMeta').textContent=tr('Manual for version 2','Manual för version 2','Handleiding voor versie 2')+(M.updated?' · '+tr('updated ','uppdaterad ','bijgewerkt ')+fmtDate(M.updated):'')+'. '+tr('If a button name differs, the app is right.','Om ett knappnamn skiljer sig gäller appen.','Als een knopnaam afwijkt, heeft de app gelijk.');
  const hs=$$('#helpBody h3');
  $('#helpToc').innerHTML='<p>'+esc(tr('Contents','Innehåll','Inhoud'))+'</p><ol>'+hs.map(h=>'<li><button type="button" data-hjump="'+esc(h.id)+'">'+esc(h.textContent)+'</button></li>').join('')+'</ol>';
}
