// Artblad: Projects (sites, members, places), planting records and comments.
// Part 18 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- planting records ---------- */
// 2.7.0: "planned" = not in the ground yet (row 17).
const PSTAT=O('planned:Planned:Planerad|alive:Alive:Lever|struggling:Struggling:Kämpar|dead:Dead:Död|removed:Removed:Borttagen|unknown:Unknown:Okänd');
const plState={status:'',place:'',edit:null,kind:'',proj:'',tab:store.get('ab.pltab')==='enc'?'enc':'rec'};
const isEnc=p=>p&&p.kind==='encounter';
const plShowEnc=()=>store.get('ab.plenc')!=='0';
const pstatPill=st=>{const o=PSTAT.find(x=>x.k===st)||PSTAT.find(x=>x.k==='unknown');return '<span class="pill pst '+esc(o.k)+'">'+esc(trs(o.en,o.sv))+'</span>'};
function plSummary(all){
  const enc=all.filter(isEnc).length,list=all.filter(p=>!isEnc(p));
  const e=enc?enc+' '+(enc===1?tr('encounter','fynd','vondst'):tr('encounters','fynd','vondsten')):'';
  const m=plSummary1(list);return [m,e].filter(Boolean).join(' · ');
}
function plSummary1(list){
  if(!list.length)return '';
  const n=k=>list.filter(p=>p.status===k).length,plants=list.reduce((t,p)=>t+(Number(p.count)||1),0);
  return (state.lang==='nl'?list.length+' aanplant'+(list.length===1?'':'en')+' ('+plants+' plant'+(plants===1?'':'en')+'): ':state.lang==='sv'?list.length+' plantering'+(list.length===1?'':'ar')+' ('+plants+' plant'+(plants===1?'a':'or')+'): ':list.length+' planting'+(list.length===1?'':'s')+' ('+plants+' plant'+(plants===1?'':'s')+'): ')+
    PSTAT.filter(o=>n(o.k)).map(o=>n(o.k)+' '+(trs(o.en,o.sv)).toLowerCase()).join(', ');
}
/* ---------- comments ---------- */
const cmtState={edit:null};
function updateComments(s){
  const el=$('#cmtList');if(!el)return;
  const list=(state.comments||[]).filter(c=>c.sid===s.sid).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
  // 2.7.0: a comment can be for one project only (its members see it).
  {const sel=$('#cmtProj');if(sel){const ed=PROJ_ON&&pjEditable().length;sel.hidden=!ed;if(ed){const v=sel.value;sel.innerHTML=pjOptions(v,tr('Everyone signed in sees it','Alla inloggade ser den','Iedereen die is ingelogd ziet het'));sel.value=v&&pjById(v)?v:''}}}
  el.innerHTML=list.length?list.map(c=>{
    const m=META.get(c.id)||{},who=m.author?(PROFILES.get(m.author)||tr('Someone','Någon')):tr('Someone','Någon'),ed=m.updatedAt&&m.createdAt&&new Date(m.updatedAt)-new Date(m.createdAt)>60000;
    const mine=canEdit(c.id);
    if(cmtState.edit===c.id)return '<div class="cmt" data-cmt="'+esc(c.id)+'"><div class="ch"><b>'+esc(who)+'</b></div><textarea id="cmtEdit" rows="3" maxlength="2000">'+esc(c.text||'')+'</textarea><div class="acts" style="margin-top:6px"><button type="button" class="btn sm primary" data-act="cmt-save" data-id="'+esc(c.id)+'">'+tr('Save','Spara')+'</button><button type="button" class="btn sm" data-act="cmt-cancel">'+tr('Cancel','Avbryt')+'</button></div></div>';
    return '<div class="cmt" data-cmt="'+esc(c.id)+'"><div class="ch"><span><b>'+esc(who)+'</b> · '+esc(fmtDate(c.createdAt||m.createdAt))+(ed?' · '+tr('edited','redigerad'):'')+cvPill(c)+(c.project?' '+pjPill(c.project):'')+'</span>'+
      (mine?'<span class="acts w-only"><button type="button" class="btn sm" data-act="cmt-edit" data-id="'+esc(c.id)+'">'+tr('Edit','Redigera')+'</button><button type="button" class="btn sm danger" data-act="cmt-del" data-id="'+esc(c.id)+'">'+tr('Delete','Radera')+'</button></span>':'')+
      '</div><p>'+esc(c.text||'')+'</p></div>'}).join(''):'<p class="muted" style="margin:0">'+tr('No comments yet.','Inga kommentarer ännu.')+'</p>';
}
async function cmtPost(s){
  const t=$('#cmtText').value.trim();if(!t){toast(tr('Write something first.','Skriv något först.'),'err');return}
  const p=cur(),doc={sid:s.sid,text:t,createdAt:Date.now()};if(p&&p.isCv&&p.sid===s.sid)doc.cultivar=p.cv;
  {const pj=($('#cmtProj')||{}).value||'';if(pj)doc.project=pj}
  try{await Data.saveRow('comments',null,doc);$('#cmtText').value='';toast(tr('Comment posted','Kommentar skickad'))}catch(e){toast(errMsg(e),'err')}
}
async function cmtSave(id){
  const c=(state.comments||[]).find(x=>x.id===id),t=($('#cmtEdit')||{}).value;if(!c||!t||!t.trim())return;
  try{cmtState.edit=null;await Data.saveRow('comments',id,Object.assign({},c,{id:undefined,text:t.trim()}));toast(tr('Comment saved','Kommentar sparad'))}catch(e){toast(errMsg(e),'err')}
}

/* ---------- projects (2.7.0, database update v9; decisions D7–D10) ----------
   A project is a growing site with members. Its planting records, places, lists and comments are seen only by its
   members; the creator (owner) decides who joins, admins included. Records without a project are shared as before. */
const PLACE_KIND=O('bed:Bed:Bädd|zone:Zone:Zon|guild:Guild:Gille|area:Area:Område|other:Other:Annat');
const pjById=id=>(state.projects||[]).find(p=>p.id===id);
let PJ=store.get('ab.proj')||''; // the active project ('' = none chosen)
function pjActive(){if(PJ&&!pjById(PJ))PJ='';if(!PJ&&(state.projects||[]).length===1)PJ=state.projects[0].id;return PJ?pjById(PJ):null}
function pjSet(id){PJ=id||'';try{store.set('ab.proj',PJ)}catch(e){}}
const pjName=id=>{const p=pjById(id);return p?p.name||tr('Unnamed project','Namnlöst projekt','Naamloos project'):''};
const pjMembers=id=>(state.members||[]).filter(m=>m.project_id===id);
const pjEditable=()=>(state.projects||[]).filter(p=>projCanEdit(p.id));
const pjPlantings=id=>(state.plantings||[]).filter(p=>p.project===id);
const pjPill=id=>id?'<span class="pill pjp" title="'+esc(tr('Only members of this project see it','Bara projektets medlemmar ser den','Alleen leden van dit project zien dit'))+'">'+esc(pjName(id)||tr('Project','Projekt','Project'))+'</span>':'';
const ROLE_LAB={owner:['Owner','Ägare','Eigenaar'],editor:['Editor','Redaktör','Bewerker'],viewer:['Viewer','Läsare','Lezer']};
const roleName=r=>tr.apply(null,ROLE_LAB[r]||[r,r,r]);
// A select of projects the user may add to; first option = shared (no project).
function pjOptions(sel,sharedLabel){
  return '<option value="">'+esc(sharedLabel||tr('No project (everyone signed in sees it)','Inget projekt (alla inloggade ser den)','Geen project (iedereen die is ingelogd ziet het)'))+'</option>'+
    pjEditable().map(p=>'<option value="'+esc(p.id)+'"'+(p.id===sel?' selected':'')+'>'+esc(pjName(p.id))+'</option>').join('');
}
const pjState={edit:false,addPlace:false};
function pjSummary(p){
  const pl=pjPlantings(p.id).filter(x=>!isEnc(x)),sp=new Set(pl.map(x=>x.sid)),last=pl.flatMap(x=>(x.checks||[]).map(c=>c.date)).concat(pl.map(x=>x.date)).filter(Boolean).sort().pop();
  const plants=pl.reduce((t,x)=>t+(Number(x.count)||1),0),n=k=>pl.filter(x=>x.status===k).length;
  const tiles=[[pl.length,tr('planting records','planteringar','aanplantingen')],[plants,tr('plants','plantor','planten')],[sp.size,tr('species','arter','soorten')],[n('planned'),tr('planned','planerade','gepland')],[n('alive'),tr('alive','lever','levend')],[n('dead'),tr('dead','döda','dood')]];
  const y=new Date().getFullYear(),hs=harvSum(pl,y),ht=harvSumTxt(hs);
  return '<div class="pjstats">'+tiles.map(t=>'<div class="stat"><b>'+t[0]+'</b><span>'+esc(t[1])+'</span></div>').join('')+'</div>'+(ht?'<p style="margin:6px 0 0;font-size:14px">'+esc(tr('Harvested in ','Skördat ','Geoogst in ')+y+': '+ht)+'</p>':'')+(last?'<p class="muted" style="margin:6px 0 0;font-size:13px">'+esc(tr('Last record or check: ','Senaste post eller kontroll: ','Laatste invoer of controle: ')+last)+'</p>':'');
}
function pjSiteHTML(p,ed){
  const site=[p.country||'',p.szone?tr('Swedish zone ','Svensk zon ','Zweedse zone ')+p.szone:'',p.usda?'USDA '+p.usda:''].filter(Boolean).join(' · ');
  const loc=isFinite(p.lat)&&p.lat!==''&&p.lat!=null?tr('Site point saved (only members see it)','Platspunkt sparad (bara medlemmar ser den)','Locatie opgeslagen (alleen leden zien die)'):tr('No site point','Ingen platspunkt','Geen locatie');
  if(!ed||!pjState.edit)return '<p style="margin:0">'+(p.description?esc(p.description)+'<br>':'')+'<span class="muted">'+esc(site||tr('No zone given','Ingen zon angiven','Geen zone opgegeven'))+' · '+esc(loc)+'</span></p>'+
    (ed?'<div class="acts" style="margin-top:8px"><button type="button" class="btn sm" data-act="pj-edit">'+esc(tr('Edit name and site','Redigera namn och plats','Naam en locatie bewerken'))+'</button></div>':'');
  return '<form class="obsform" onsubmit="return false" autocomplete="off">'+
    '<div class="f"><label class="fl" for="pjName">'+esc(tr('Name','Namn','Naam'))+'</label><input id="pjName" maxlength="80" value="'+esc(p.name||'')+'"></div>'+
    '<div class="f"><label class="fl" for="pjCountry">'+esc(tr('Country','Land','Land'))+'</label><input id="pjCountry" maxlength="40" value="'+esc(p.country||'')+'" placeholder="SE"></div>'+
    '<div class="f"><label class="fl" for="pjSzone">'+esc(tr('Swedish zone (1–8)','Svensk zon (1–8)','Zweedse zone (1–8)'))+'</label><input id="pjSzone" inputmode="numeric" maxlength="3" value="'+esc(p.szone||'')+'"></div>'+
    '<div class="f"><label class="fl" for="pjUsda">'+esc(tr('USDA zone','USDA-zon','USDA-zone'))+'</label><input id="pjUsda" maxlength="6" value="'+esc(p.usda||'')+'"></div>'+
    '<div class="f"><label class="fl" for="pjGeo">'+esc(tr('Site point (lat, long; only members see it)','Platspunkt (lat, long; bara medlemmar ser den)','Locatie (lat, long; alleen leden zien die)'))+'</label><span style="display:flex;gap:6px"><input id="pjGeo" inputmode="decimal" placeholder="63.82, 20.26" style="flex:1;min-width:0" value="'+esc(isFinite(p.lat)&&p.lat!==''&&p.lat!=null?p.lat+', '+p.lng:'')+'"><button type="button" class="btn sm" data-act="pj-geo">'+esc(tr('Here','Här','Hier'))+'</button></span></div>'+
    '<div class="f wide"><label class="fl" for="pjDesc">'+esc(tr('Description','Beskrivning','Beschrijving'))+'</label><textarea id="pjDesc" rows="2" maxlength="600">'+esc(p.description||'')+'</textarea></div>'+
    '<div class="acts" style="grid-column:1/-1"><button type="button" class="btn sm primary" data-act="pj-save">'+esc(tr('Save','Spara','Opslaan'))+'</button><button type="button" class="btn sm" data-act="pj-cancel">'+esc(tr('Cancel','Avbryt','Annuleren'))+'</button></div></form>';
}
function pjPlacesHTML(p,ed){
  const pl=pjPlantings(p.id),places=(p.places||[]).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  const rows=places.map(x=>{const n=pl.filter(y=>y.placeId===x.id).length,k=PLACE_KIND.find(o=>o.k===x.kind);
    const cond=[microTxt(x.micro),(x.soil||[]).map(k=>{const o=SOIL.find(z=>z.k===k);return o?trs(o.en,o.sv):k}).join(', ')].filter(Boolean).join(' · ');
    return '<div class="ent"><span><b>'+esc(x.name)+'</b> · '+esc(k?trs(k.en,k.sv):'')+' · '+n+' '+esc(tr('records','poster','records'))+(cond?'<br><small>'+esc(cond)+'</small>':'')+(x.notes?'<br><small class="muted">'+esc(x.notes)+'</small>':'')+'</span>'+
      '<span class="acts"><button type="button" class="btn sm" data-act="pj-place-pick" data-id="'+esc(x.id)+'">'+esc(tr('Pick a plant here','Välj en växt här','Kies hier een plant'))+'</button>'+(ed?'<button type="button" class="btn sm" data-act="pj-place-cond" data-id="'+esc(x.id)+'">'+esc(tr('Conditions','Förhållanden','Omstandigheden'))+'</button><button type="button" class="btn sm" data-act="pj-place-ren" data-id="'+esc(x.id)+'">'+esc(tr('Rename','Byt namn','Hernoemen'))+'</button><button type="button" class="btn sm danger" data-act="pj-place-del" data-id="'+esc(x.id)+'">'+esc(tr('Remove','Ta bort','Verwijderen'))+'</button>':'')+'</span></div>'+
      (ed&&pjPlState.edit===x.id?pjPlaceCondHTML(p,x):'')}).join('');
  return (rows||'<p class="muted" style="margin:0">'+esc(tr('No places yet. Places are beds, zones or guilds inside the site; planting records can be linked to them.','Inga platser ännu. Platser är bäddar, zoner eller gillen på platsen; planteringar kan kopplas till dem.','Nog geen plekken. Plekken zijn bedden, zones of gildes binnen de locatie; aanplantingen kunnen eraan gekoppeld worden.'))+'</p>')+
    (ed?'<form class="obsform" onsubmit="return false" style="margin-top:8px"><div class="f"><label class="fl" for="pjPlName">'+esc(tr('New place','Ny plats','Nieuwe plek'))+'</label><input id="pjPlName" maxlength="60"></div><div class="f"><label class="fl" for="pjPlKind">'+esc(tr('Kind','Typ','Soort'))+'</label><select id="pjPlKind">'+PLACE_KIND.map(o=>'<option value="'+o.k+'">'+esc(trs(o.en,o.sv))+'</option>').join('')+'</select></div><div class="acts" style="align-self:end"><button type="button" class="btn sm" data-act="pj-place-add">'+esc(tr('Add place','Lägg till plats','Plek toevoegen'))+'</button></div></form>':'');
}
function pjMembersHTML(p){
  const me=meUid(),own=projRole(p.id)==='owner',ms=pjMembers(p.id).slice().sort((a,b)=>(a.role==='owner'?-1:0)-(b.role==='owner'?-1:0));
  const rows=ms.map(m=>'<div class="ent"><span><b>'+esc(PROFILES.get(m.user_id)||tr('Someone','Någon','Iemand'))+'</b>'+(m.user_id===me?' ('+esc(tr('you','du','jij'))+')':'')+' · '+esc(roleName(m.role))+'</span>'+
    (own&&m.role!=='owner'?'<span class="acts"><select data-pjrole="'+esc(m.user_id)+'" aria-label="'+esc(tr('Role','Roll','Rol'))+'">'+['editor','viewer'].map(r=>'<option value="'+r+'"'+(m.role===r?' selected':'')+'>'+esc(roleName(r))+'</option>').join('')+'</select><button type="button" class="btn sm danger" data-act="pj-mem-del" data-uid="'+esc(m.user_id)+'">'+esc(tr('Remove','Ta bort','Verwijderen'))+'</button></span>':
     (!own&&m.user_id===me?'<span class="acts"><button type="button" class="btn sm" data-act="pj-leave">'+esc(tr('Leave project','Lämna projektet','Project verlaten'))+'</button></span>':''))+'</div>').join('');
  const others=[...PROFILES.entries()].filter(([u])=>!ms.some(m=>m.user_id===u)).sort((a,b)=>String(a[1]).localeCompare(String(b[1])));
  return rows+(own?'<p class="muted" style="font-size:13px;margin:8px 0 4px">'+esc(tr('You decide who sees this project. Admins only see it if you add them.','Du bestämmer vem som ser projektet. Admin ser det bara om du lägger till dem.','Jij bepaalt wie dit project ziet. Beheerders zien het alleen als jij ze toevoegt.'))+'</p>'+
    (others.length?'<form class="obsform" onsubmit="return false"><div class="f"><label class="fl" for="pjMemNew">'+esc(tr('Add a member (by username)','Lägg till en medlem (användarnamn)','Lid toevoegen (gebruikersnaam)'))+'</label><select id="pjMemNew">'+others.map(([u,n])=>'<option value="'+esc(u)+'">'+esc(n)+'</option>').join('')+'</select></div><div class="f"><label class="fl" for="pjMemRole">'+esc(tr('Role','Roll','Rol'))+'</label><select id="pjMemRole"><option value="viewer">'+esc(roleName('viewer'))+'</option><option value="editor">'+esc(roleName('editor'))+'</option></select></div><div class="acts" style="align-self:end"><button type="button" class="btn sm" data-act="pj-mem-add">'+esc(tr('Add','Lägg till','Toevoegen'))+'</button></div></form>'
      :'<p class="muted" style="font-size:13px;margin:0">'+esc(tr('Others appear here once they have chosen a username.','Andra visas här när de har valt ett användarnamn.','Anderen verschijnen hier zodra ze een gebruikersnaam hebben gekozen.'))+'</p>'):'');
}
function pjCommentsHTML(p,ed){
  const list=(state.comments||[]).filter(c=>c.project===p.id&&!c.sid).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
  return (list.length?list.map(c=>{const m=META.get(c.id)||{};return '<div class="cmt"><div class="ch"><span><b>'+esc(PROFILES.get(m.author)||tr('Someone','Någon','Iemand'))+'</b> · '+esc(fmtDate(c.createdAt||m.createdAt))+'</span>'+(canEdit(c.id)?'<span class="acts"><button type="button" class="btn sm danger" data-act="cmt-del" data-id="'+esc(c.id)+'">'+esc(tr('Delete','Radera','Verwijderen'))+'</button></span>':'')+'</div><p>'+esc(c.text||'')+'</p></div>'}).join('')
    :'<p class="muted" style="margin:0">'+esc(tr('No project notes yet.','Inga projektanteckningar ännu.','Nog geen projectnotities.'))+'</p>')+
    (ed?'<div class="cmtform" style="margin-top:8px"><textarea id="pjCmt" rows="2" maxlength="2000" placeholder="'+esc(tr('A note for the project (frost dates, plans, what you noticed)','En anteckning för projektet (frostdatum, planer, iakttagelser)','Een notitie voor het project (vorstdata, plannen, wat je zag)'))+'"></textarea><div class="acts" style="margin-top:6px"><button type="button" class="btn sm primary" data-act="pj-cmt">'+esc(tr('Post','Skicka','Plaatsen'))+'</button></div></div>':'');
}
function pjListsHTML(p,ed){
  const ls=(state.lists||[]).filter(l=>l.project===p.id);
  return (ls.length?ls.map(l=>'<a class="btn sm" href="#l-'+esc(l.id)+'">'+esc(l.name)+' ('+(l.sids||[]).length+')</a>').join(' '):'<p class="muted" style="margin:0">'+esc(tr('No plant lists in this project yet.','Inga växtlistor i projektet ännu.','Nog geen plantenlijsten in dit project.'))+'</p>')+
    (ed?'<div class="acts" style="margin-top:8px"><button type="button" class="btn sm" data-act="pj-list-new">'+esc(tr('New plant list in this project','Ny växtlista i projektet','Nieuwe plantenlijst in dit project'))+'</button></div>':'');
}
// Records without a project (from before 2.7.0): each can be moved into a project once (D9).
function pjUnassignedHTML(){
  const ed=pjEditable(),list=(state.plantings||[]).filter(p=>!p.project&&!isEnc(p)&&canEdit(p.id)).sort((a,b)=>String(a.latin).localeCompare(String(b.latin)));
  if(!list.length||!ed.length)return '';
  return '<section class="admsec"><h2 class="hsec">'+esc(tr('Planting records without a project','Planteringar utan projekt','Aanplantingen zonder project'))+' <span class="admcount">'+list.length+'</span></h2>'+
    '<p class="muted" style="margin:0 0 8px">'+esc(tr('These are shared with everyone signed in. Move each into its project; then only the project\'s members see it.','De här delas med alla inloggade. Flytta var och en till sitt projekt; då ser bara projektets medlemmar den.','Deze zijn gedeeld met iedereen die is ingelogd. Verplaats ze elk naar hun project; dan zien alleen de leden ze.'))+'</p><div class="stack">'+
    list.map(p=>{const x=bySid.get(p.sid);return '<div class="ent"><span><b>'+esc(x?dispName(x):p.latin||p.sid)+'</b>'+esc(plLabelTxt(p))+' · '+esc(p.place||tr('No place given','Ingen plats angiven'))+' · '+esc(p.date||'')+' '+pstatPill(p.status)+'</span><span class="acts"><select data-pjmove="'+esc(p.id)+'" aria-label="'+esc(tr('Move to project','Flytta till projekt','Naar project verplaatsen'))+'"><option value="">'+esc(tr('Move to…','Flytta till…','Verplaatsen naar…'))+'</option>'+ed.map(q=>'<option value="'+esc(q.id)+'">'+esc(pjName(q.id))+'</option>').join('')+'</select></span></div>'}).join('')+'</div></section>';
}
function updateProjects(){
  const box=$('#pjBody');if(!box)return;
  if(!PROJ_ON){box.innerHTML='<div class="empty"><p>'+esc(isAdmin()?tr('Projects need the database update v9_projects.sql.','Projekt kräver databasuppdateringen v9_projects.sql.','Projecten hebben database-update v9_projects.sql nodig.'):tr('Projects are not switched on yet.','Projekt är inte påslagna än.','Projecten zijn nog niet ingeschakeld.'))+'</p></div>';return}
  const ps=(state.projects||[]).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name))),p=pjActive();
  const tabs=ps.length?'<div class="seg pjtabs" role="group" aria-label="'+esc(tr('Project','Projekt','Project'))+'">'+ps.map(x=>'<button type="button" data-pj="'+esc(x.id)+'" aria-pressed="'+(p&&p.id===x.id)+'">'+esc(pjName(x.id))+'</button>').join('')+'</div>':'';
  const neu=CANW?'<form class="obsform" onsubmit="return false" style="margin:10px 0"><div class="f"><label class="fl" for="pjNew">'+esc(tr('New project (a garden, forest garden or allotment)','Nytt projekt (en trädgård, skogsträdgård eller odlingslott)','Nieuw project (een tuin, voedselbos of volkstuin)'))+'</label><input id="pjNew" maxlength="80"></div><div class="acts" style="align-self:end"><button type="button" class="btn sm primary" data-act="pj-new">'+esc(tr('Create','Skapa','Aanmaken'))+'</button></div></form>':'';
  if(!p){box.innerHTML=tabs+'<div class="empty"><p>'+esc(tr('No projects yet. A project keeps the planting records, places, plant lists and notes of one site together, visible only to the people you add.','Inga projekt ännu. Ett projekt samlar planteringar, platser, växtlistor och anteckningar för en plats, synliga bara för dem du lägger till.','Nog geen projecten. Een project houdt de aanplantingen, plekken, plantenlijsten en notities van één locatie bij elkaar, alleen zichtbaar voor wie jij toevoegt.'))+'</p></div>'+neu+pjUnassignedHTML();return}
  const ed=projCanEdit(p.id),own=projRole(p.id)==='owner',sec=(h,b)=>'<section class="admsec"><h2 class="hsec">'+esc(h)+'</h2>'+b+'</section>';
  box.innerHTML=tabs+
    '<div class="pjhead"><h2 style="margin:10px 0 4px">'+esc(pjName(p.id))+' <span class="pill">'+esc(roleName(projRole(p.id)||'viewer'))+'</span></h2>'+pjSiteHTML(p,ed)+'</div>'+
    sec(tr('Summary','Sammanfattning','Overzicht'),pjSummary(p)+'<div class="acts" style="margin-top:8px"><button type="button" class="btn sm" data-act="pj-goto" data-to="plantings">'+esc(tr('Planting records','Planteringar','Aanplantingen'))+'</button><button type="button" class="btn sm" data-act="mp-open">'+esc(tr('Garden plan on the map','Trädgårdsplan på kartan','Tuinplan op de kaart'))+'</button>'+(gpPlan(p)?'<button type="button" class="btn sm" data-act="gp-open">'+esc(tr('Garden plan in metres (2.8)','Trädgårdsplan i meter (2.8)','Tuinplan in meters (2.8)'))+'</button>':'')+'<button type="button" class="btn sm" data-act="pj-goto" data-to="calendar">'+esc(tr('Calendar of this project','Projektets kalender','Kalender van dit project'))+'</button>'+((p.szone||p.site||isFinite(p.lat)&&p.lat!=null&&p.lat!=='')?'<button type="button" class="btn sm" data-act="pj-pick">'+esc(tr('Pick a plant for this site','Välj en växt för platsen','Kies een plant voor deze locatie'))+'</button>':'')+'</div>')+
    sec(tr('Site values','Platsvärden','Locatiewaarden'),pjSiteValsHTML(p,ed))+
    sec(tr('Season checks','Säsongskoll','Seizoenscontrole'),scHTML(p))+
    sec(tr('Places','Platser','Plekken'),pjPlacesHTML(p,ed))+
    sec(tr('Plant lists','Växtlistor','Plantenlijsten'),pjListsHTML(p,ed))+
    sec(tr('Project notes','Projektanteckningar','Projectnotities'),pjCommentsHTML(p,ed))+
    sec(tr('Members','Medlemmar','Leden'),pjMembersHTML(p))+
    (own?'<div class="acts" style="margin:12px 0"><button type="button" class="btn sm danger" data-act="pj-trash">'+esc(tr('Move project to the trash','Flytta projektet till papperskorgen','Project naar de prullenbak'))+'</button></div>':'')+
    neu+pjUnassignedHTML();
}
async function pjCreate(){
  const n=($('#pjNew')||{}).value;const name=String(n||'').trim();if(!name){toast(tr('Give the project a name.','Ge projektet ett namn.','Geef het project een naam.'),'err');return}
  try{const id=await Data.saveRow('projects',null,{name,description:'',country:'',szone:'',usda:'',places:[],createdAt:Date.now()});pjSet(id);toast(tr('Project created','Projekt skapat','Project aangemaakt'));updateProjects()}catch(e){toast(errMsg(e),'err')}
}
async function pjSaveDoc(p,patch,msg){
  const doc=Object.assign({},p,patch);delete doc.id;
  try{await Data.saveRow('projects',p.id,doc);if(msg)toast(msg)}catch(e){toast(errMsg(e),'err')}
}
async function pjSaveSite(){
  const p=pjActive();if(!p)return;const g=String($('#pjGeo').value||'').split(',').map(v=>parseFloat(v));
  const patch={name:$('#pjName').value.trim()||p.name,country:$('#pjCountry').value.trim(),szone:$('#pjSzone').value.trim(),usda:$('#pjUsda').value.trim(),description:$('#pjDesc').value.trim()};
  if(g.length===2&&g.every(isFinite)){patch.lat=g[0];patch.lng=g[1]}else{patch.lat=null;patch.lng=null}
  pjState.edit=false;await pjSaveDoc(p,patch,tr('Project saved','Projektet sparat','Project opgeslagen'));
}
async function pjMemberAdd(){
  const p=pjActive();if(!p)return;const u=$('#pjMemNew').value,r=$('#pjMemRole').value;if(!u)return;
  const q=await SB.from('project_members').insert({project_id:p.id,user_id:u,role:r==='editor'?'editor':'viewer',added_by:meUid()});
  if(q.error){toast(errMsg(q.error),'err');return}toast(tr('Member added','Medlem tillagd','Lid toegevoegd'));await loadAll();
}
async function pjMemberRole(u,r){const p=pjActive();if(!p)return;const q=await SB.from('project_members').update({role:r}).eq('project_id',p.id).eq('user_id',u);if(q.error)toast(errMsg(q.error),'err');else{toast(tr('Role changed','Roll ändrad','Rol gewijzigd'));await loadAll()}}
async function pjMemberDel(u){const p=pjActive();if(!p)return;const q=await SB.from('project_members').delete().eq('project_id',p.id).eq('user_id',u);if(q.error)toast(errMsg(q.error),'err');else{if(u===meUid())pjSet('');await loadAll()}}
async function pjMove(id,pid){
  const p=(state.plantings||[]).find(x=>x.id===id);if(!p||!pid)return;const doc=Object.assign({},p,{project:pid});delete doc.id;
  try{await Data.saveRow('plantings',id,doc);toast(tr('Moved to ','Flyttad till ','Verplaatst naar ')+pjName(pid))}catch(e){toast(errMsg(e),'err')}
}
// Pick a plant for the project's site: its Swedish zone and site point are filled in.
// 2.8.0: also the winter low, soil and heat sum from the project's site values (row 71, row 24).
function pjToPick(){const p=pjActive();if(p)pickFromSite(p,null)}
