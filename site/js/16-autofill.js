// Artblad: Auto-fill requests (Artie) and my contributions.
// Part 16 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- auto-fill requests (Artie, the bot) ----------
   Contributors and admins ask for species to be pre-filled from outside sources. Requests are stored in a table
   only admins can read (the database merges doubles); admins download the open ones as a text file for the bot. */
function afParse(line){
  let t=String(line||'').replace(/#.*$/,'').replace(/\s+/g,' ').trim(),cv='';if(!t)return null;
  const q=t.match(/^(.*?)\s*(?:['‘’"“”]([^'‘’"“”]+)['‘’"“”]|\bcv\.?\s+(.+))\s*$/i);if(q&&q[1]){t=q[1].trim();cv=(q[2]||q[3]||'').trim()}
  const latin=canon(t),sid=slug(latin),ok=latin.split(' ').length>=2&&latin.length<=120&&/^[A-Za-z×.\- ]+$/.test(latin)&&/^[a-z0-9]+(-[a-z0-9]+)+$/.test(sid);
  return{latin,sid,cv,ok,raw:String(line).trim()};
}
let afRows=[];
async function artieRequest(lines,btn){
  if(!SB||!CANW){toast(tr('Only contributors can ask for auto-fill.','Bara bidragsgivare kan be om förifyllning.','Alleen bijdragers kunnen om automatisch invullen vragen.'),'err');return}
  const items=[],seen=new Set();lines.map(afParse).filter(Boolean).forEach(x=>{if(x.ok&&seen.has(x.sid))return;seen.add(x.sid);items.push(x)});
  if(!items.length){toast(tr('Type at least one Latin name.','Skriv minst ett latinskt namn.','Typ minstens één Latijnse naam.'),'err');return}
  if(items.length>50){toast(tr('At most 50 names at a time.','Högst 50 namn åt gången.','Maximaal 50 namen tegelijk.'),'err');return}
  if(btn)btn.disabled=true;const out=[];
  for(const x of items){
    if(!x.ok){out.push({x,r:'invalid'});continue}
    try{const r=await SB.rpc('request_autofill',{p_sid:x.sid,p_latin:x.latin});out.push({x,r:r.error?'error':r.data,err:r.error})}catch(e){out.push({x,r:'error',err:e})}
  }
  if(btn)btn.disabled=false;
  const msg={added:tr('requested','begärd','aangevraagd'),duplicate:tr('already requested','redan begärd','al aangevraagd'),filled:tr('already filled in by Artie','redan ifylld av Artie','al ingevuld door Artie'),
    invalid:tr('not a Latin name (genus and species)','inget latinskt namn (släkte och art)','geen Latijnse naam (geslacht en soort)'),error:tr('could not be saved','kunde inte sparas','kon niet worden opgeslagen')};
  const box=$('#afResult');
  if(box&&!$('#v-autofill').hidden){
    box.hidden=false;box.innerHTML='<ul>'+out.map(o=>'<li class="af-'+esc(o.r)+'"><i>'+esc(o.x.ok?o.x.latin:o.x.raw)+'</i>: '+esc(msg[o.r]||o.r)+(o.err?' ('+esc(errMsg(o.err))+')':'')+(o.x.cv&&o.x.ok?' · '+esc(tr('the cultivar part was left out: Artie fills in species only','sortdelen togs bort: Artie fyller bara i arter','het cultivardeel is weggelaten: Artie vult alleen soorten in'))+'':'')+'</li>').join('')+'</ul>';
    const n=out.filter(o=>o.r==='added').length;if(n)$('#afNames').value='';
  }else{const o=out[0];toast((o.x.ok?o.x.latin:o.x.raw)+': '+(msg[o.r]||o.r),o.r==='added'||o.r==='duplicate'||o.r==='filled'?'':'err')}
  if(isAdmin())loadAfRows();
}
async function loadAfRows(){
  if(!SB||!isAdmin())return;
  try{const r=await SB.from('autofill_requests').select('sid,latin,n,status,first_requested_at,last_requested_at,sent_at').order('first_requested_at');if(r.error)throw r.error;afRows=r.data||[]}catch(e){afRows=[];toast(errMsg(e),'err')}
  renderAfAdmin();if(!$('#v-admin').hidden)updateAdmin();updateAdminBadge();
}
function renderAfAdmin(){
  const box=$('#afAdmin');if(!box)return;
  if(!isAdmin()){box.innerHTML='';return}
  const open=afRows.filter(r=>r.status==='open'),sent=afRows.filter(r=>r.status!=='open');
  const row=r=>'<div class="ent'+(r.status==='open'?'':' muted')+'"><span><i>'+esc(r.latin)+'</i> · '+esc(tr('asked by ','begärd av ','gevraagd door '))+r.n+' '+esc(r.n===1?tr('person','person','persoon'):tr('people','personer','personen'))+' · '+esc(fmtDate(r.first_requested_at))+(r.status==='open'?'':' · '+esc(tr('sent to Artie ','skickad till Artie ','naar Artie gestuurd '))+esc(fmtDate(r.sent_at)))+'</span><button type="button" class="btn sm danger" data-act="af-del" data-sid="'+esc(r.sid)+'">'+esc(tr('Remove','Ta bort','Verwijderen'))+'</button></div>';
  box.innerHTML='<h2 class="hsec">'+trh('Requests (admins only)','Förfrågningar (bara admin)','Aanvragen (alleen beheerders)')+' <em>'+open.length+' '+esc(tr('open','öppna','open'))+'</em></h2>'+
    '<p class="muted">'+esc(tr('Only admins see this list. Download the open requests, give the file to Artie (species.txt in the bot repository), then mark them as sent.','Bara admin ser listan. Ladda ner de öppna förfrågningarna, ge filen till Artie (species.txt i botens förråd) och markera dem som skickade.','Alleen beheerders zien deze lijst. Download de open aanvragen, geef het bestand aan Artie (species.txt in de bot-repository) en markeer ze daarna als verstuurd.'))+'</p>'+
    '<div class="acts"><button type="button" class="btn sm primary" data-act="af-download"'+(open.length?'':' disabled')+'>'+esc(tr('Download open requests (.txt)','Ladda ner öppna förfrågningar (.txt)','Open aanvragen downloaden (.txt)'))+'</button><button type="button" class="btn sm" data-act="af-sent"'+(open.length?'':' disabled')+'>'+esc(tr('Mark open requests as sent','Markera öppna som skickade','Open aanvragen als verstuurd markeren'))+'</button></div>'+
    '<div class="stack">'+(afRows.length?open.concat(sent).map(row).join(''):'<p class="muted">'+esc(tr('No requests yet.','Inga förfrågningar ännu.','Nog geen aanvragen.'))+'</p>')+'</div>'+
    (sent.length?'<p class="muted" style="font-size:13px">'+esc(tr('Remove a sent request if Artie could not fill it in, so it can be asked for again.','Ta bort en skickad förfrågan om Artie inte kunde fylla i den, så att den kan begäras igen.','Verwijder een verstuurde aanvraag als Artie hem niet kon invullen, zodat hij opnieuw kan worden aangevraagd.'))+'</p>':'');
}
function afDownload(){
  const open=afRows.filter(r=>r.status==='open');if(!open.length)return;
  saveFile('artie-requests-'+today()+'.txt','# Artie auto-fill requests, downloaded '+today()+' ('+open.length+' species)\n# One Latin name per line. Paste the names into species.txt in the artie-bot repository.\n'+open.map(r=>r.latin).join('\n')+'\n');
}
async function afMarkSent(){
  const open=afRows.filter(r=>r.status==='open').map(r=>r.sid);if(!open.length)return;
  try{const r=await SB.rpc('autofill_mark_sent',{p_sids:open});if(r.error)throw r.error;toast(tr('Marked as sent: ','Markerade som skickade: ','Als verstuurd gemarkeerd: ')+r.data)}catch(e){toast(errMsg(e),'err')}
  loadAfRows();
}
async function afDelete(sid){
  try{const r=await SB.from('autofill_requests').delete().eq('sid',sid).select('sid');if(r.error)throw r.error;if(!r.data||!r.data.length)throw gone()}catch(e){toast(errMsg(e),'err')}
  loadAfRows();
}
let afPrefill='';
function updateAutofill(){
  if(afPrefill){const ta=$('#afNames'),have=String(ta.value||'').split(/\n/).map(x=>canon(x));if(have.indexOf(afPrefill)<0)ta.value=(ta.value.trim()?ta.value.trim()+'\n':'')+afPrefill;afPrefill='';ta.focus()}
  const ro=!SB||!CANW;$('#afForm').hidden=ro;$('#afRo').hidden=!ro;
  if(isAdmin())loadAfRows();else renderAfAdmin();
}

/* ---------- my contributions ---------- */
function statsFor(uid){
  const mine=id=>(META.get(id)||{}).author===uid;
  const ents=state.entries.filter(e=>mine(e.id)&&!e.snapshot&&!isSrcEnt(e)),obs=state.obs.filter(o=>mine(o.id));
  // The first entry of all, Artie's included: a species Artie added first was not started by a person.
  const first=s=>s.entries.slice().sort((a,b)=>(a.createdAt||0)-(b.createdAt||0))[0];
  const started=species.filter(s=>{const f=first(s);return f&&!isSrcEnt(f)&&mine(f.id)});
  // Each species and each cultivar you add information to counts once; a species you started yourself does not count again (its cultivars do).
  const touched=new Set(ents.map(e=>{const c=entCv(e);return c?e.sid+'--'+cvKey(c):e.sid}));started.forEach(s=>touched.delete(s.sid));
  const facts=ents.reduce((t,e)=>t+Object.keys(e.fields||{}).length,0);
  const nObs=obs.filter(o=>o.kind!=='source').length,nSrc=obs.filter(o=>o.kind==='source').length;
  const photos=obs.filter(o=>o.photo).length+ents.filter(e=>e.fields&&e.fields.photo).length;
  const d=new Date(),m0=new Date(d.getFullYear(),d.getMonth(),1).getTime();
  const month=ents.filter(e=>(e.createdAt||0)>=m0).length+obs.filter(o=>(o.createdAt||0)>=m0).length;
  const points=5*started.length+2*touched.size+nObs+nSrc+photos+Math.floor(facts/5);
  return {started:started.length,expanded:touched.size,entries:ents.length,facts,obs:nObs,src:nSrc,photos,month,points};
}
/* Contribution shields: six ladders of five growth stages (seed to forest elder), and three overall shields
   (copper beech, silver birch, golden larch) for reaching stage 3, 4 and 5 on every ladder. */
const STAGES=[
  {en:'Seed',sv:'Frö',nl:'Zaad',c:'#8b6b4a',g:'<ellipse cx="12" cy="13.5" rx="4.2" ry="5.8"/><path d="M12 8.5c-1.2 2-1.2 7 0 10"/>'},
  {en:'Sprout',sv:'Grodd',nl:'Kiemplant',c:'#7fa83f',g:'<path d="M12 21v-8"/><path d="M12 13c-3 0-5-2-5-5 3 0 5 2 5 5zM12 13c3 0 5-2 5-5-3 0-5 2-5 5z"/><path d="M8 21h8"/>'},
  {en:'Sapling',sv:'Planta',nl:'Jong boompje',c:'#4f8f3a',g:'<path d="M12 21V8"/><path d="M12 12c-2.6 0-4.4-1.6-4.4-4.2 2.6 0 4.4 1.6 4.4 4.2zM12 10c2.6 0 4.4-1.6 4.4-4.2-2.6 0-4.4 1.6-4.4 4.2zM12 16c-2.4 0-4-1.4-4-3.6 2.4 0 4 1.4 4 3.6zM12 15c2.4 0 4-1.4 4-3.6-2.4 0-4 1.4-4 3.6z"/>'},
  {en:'Tree',sv:'Träd',nl:'Boom',c:'#2f6b3f',g:'<circle cx="12" cy="9" r="6"/><path d="M12 15v7M9 22h6"/>'},
  {en:'Forest elder',sv:'Skogens äldste',nl:'Bosoudste',c:'#173d29',rim:'#d4a72c',g:'<path d="M4.5 11.5C4.5 7 8 4 12 4s7.5 3 7.5 7.5c0 2.6-2 4.5-4.5 4.5H9c-2.5 0-4.5-1.9-4.5-4.5z"/><path d="M10 16v5M14 16v5M7.5 21h9M12 16v-3M9.5 13l2.5 1.5 2.5-1.5"/>'}
];
const LADDERS=[
  {k:'started',t:['Pioneer','Pionjär','Pionier'],en:'Species started',sv:'Arter startade',nl:'Soorten gestart',need:[1,5,10,25,50],ic:'<path d="M12 20v-7"/><path d="M12 13c-3 0-5-2-5-5 3 0 5 2 5 5zM12 13c3 0 5-2 5-5-3 0-5 2-5 5z"/>'},
  {k:'facts',t:['Fact gatherer','Faktasamlare','Feitenverzamelaar'],en:'Facts filled in',sv:'Ifyllda uppgifter',nl:'Ingevulde gegevens',need:[50,100,250,500,1000],ic:'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 11h5M10 14h5M10 17h3"/>'},
  {k:'expanded',t:['Helping hand','Hjälpande hand','Helpende hand'],en:'Species or cultivars added to',sv:'Arter eller sorter du bidragit till',nl:'Soorten of cultivars aangevuld',need:[5,10,25,50,100],ic:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'},
  {k:'obs',t:['Field notes','Fältanteckningar','Veldnotities'],en:'Observations',sv:'Observationer',nl:'Waarnemingen',need:[5,10,25,50,100],ic:'<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>'},
  {k:'photos',t:['Photographer','Fotograf','Fotograaf'],en:'Photos',sv:'Foton',nl:'Foto\'s',need:[5,10,25,50,100],ic:'<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.4"/>'},
  {k:'src',t:['Source scout','Källspanare','Bronnenspeurder'],en:'Sources',sv:'Källor',nl:'Bronnen',need:[5,10,25,50,100],ic:'<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'}
];
const GRAND=[
  {en:'Copper beech',sv:'Blodbok',nl:'Bruine beuk',metal:['Bronze','Brons','Brons'],stage:3,c:'#a5592a',g:'<path d="M3.5 12.5C3.5 7.5 7.4 4 12 4s8.5 3.5 8.5 8.5c0 2.2-1.8 3.5-4 3.5h-9c-2.2 0-4-1.3-4-3.5z"/><path d="M12 16v6M9 22h6"/>'},
  {en:'Silver birch',sv:'Silverbjörk',nl:'Zilverberk',metal:['Silver','Silver','Zilver'],stage:4,c:'#8d989c',g:'<path d="M12 22V5"/><path d="M12 8c-3 1-5 4.5-5 8M12 8c3 1 5 4.5 5 8M12 12c-2 .8-3.3 2.5-3.7 5M12 12c2 .8 3.3 2.5 3.7 5"/><path d="M11 10h2M11 15h2M11 19h2"/>'},
  {en:'Golden larch',sv:'Gyllenlärk',nl:'Goudlariks',metal:['Gold','Guld','Goud'],stage:5,c:'#c08f12',g:'<path d="M12 3l6.5 13h-13z"/><path d="M12 16v6M9 22h6M8.5 11h7"/>'}
];
const SHIELD='M24 2 L44 9 V27 C44 40.5 35.5 49.5 24 54 C12.5 49.5 4 40.5 4 27 V9 Z';
const stageOf=(L,v)=>L.need.filter(n=>v>=n).length; // 0 = not started, 1..5
// One shield: filled in its colour when earned, a dashed outline when still to come.
function shieldSvg(glyph,col,rim,on){
  return '<svg class="shd'+(on?' on':'')+'" viewBox="0 0 48 56" aria-hidden="true"'+(on?' style="--sc:'+col+';--sr:'+(rim||col)+'"':'')+'><path class="sh-bg" d="'+SHIELD+'"/><path class="sh-rim" d="'+SHIELD+'" fill="none"/>'+
    '<g transform="translate(12 13)" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="sh-ic">'+glyph+'</g></svg>';
}
const stName=st=>tr(st.en,st.sv,st.nl);
function ladderHTML(L,t){
  const v=t[L.k],n=stageOf(L,v),cur=n?STAGES[n-1]:null,nx=n<5?STAGES[n]:null,need=nx?L.need[n]:0,prev=n?L.need[n-1]:0;
  const pct=nx?Math.round(100*Math.min(1,v/need)):100;
  const pips='<span class="pips" aria-label="'+esc(tr('Stage '+n+' of 5','Steg '+n+' av 5','Stap '+n+' van 5'))+'">'+STAGES.map((st,i)=>'<i'+(i<n?' style="background:'+st.c+'"':'')+'></i>').join('')+'</span>';
  return '<div class="lad'+(n?' on':'')+'" data-ladder="'+L.k+'"><div class="ladh"><svg class="lic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+L.ic+'</svg><span class="ladt"><b>'+esc(tr(L.t[0],L.t[1],L.t[2]))+'</b><small>'+esc(tr(L.en,L.sv,L.nl))+'</small></span><span class="ladn">'+v+'</span></div>'+
    '<div class="ladrow"><div class="sh1">'+(cur?shieldSvg(cur.g,cur.c,cur.rim,true):shieldSvg(STAGES[0].g,'',null,false))+'<small>'+(cur?'<b>'+esc(stName(cur))+'</b>':esc(tr('Not started','Inte påbörjad','Nog niet begonnen')))+'</small></div>'+
    (nx?'<span class="ladarr" aria-hidden="true">→</span><div class="sh1 next">'+shieldSvg(nx.g,'',null,false)+'<small>'+esc(stName(nx))+'</small></div>'+
      '<div class="ladp"><span class="prog" aria-label="'+v+' / '+need+'"><i style="width:'+pct+'%;background:'+nx.c+'"></i></span><small>'+esc(tr(v+' / '+need+' · '+(need-v)+' to go',v+' / '+need+' · '+(need-v)+' kvar',v+' / '+need+' · nog '+(need-v)))+'</small></div>'
      :'<div class="ladp"><small class="got">'+esc(tr('All five stages reached','Alla fem steg uppnådda','Alle vijf stappen bereikt'))+'</small></div>')+'</div>'+pips+'</div>';
}
function grandHTML(t){
  const st=LADDERS.map(L=>stageOf(L,t[L.k])),got=GRAND.filter(G=>st.every(n=>n>=G.stage)),nx=GRAND.find(G=>!st.every(n=>n>=G.stage));
  const card=(G,on)=>'<div class="grand'+(on?' on':'')+'">'+shieldSvg(G.g,G.c,null,on)+'<b>'+esc(tr(G.metal[0],G.metal[1],G.metal[2]))+'</b><small>'+esc(tr(G.en,G.sv,G.nl))+'</small>'+
    (on?'<small class="got">'+esc(tr('Earned','Uppnått','Behaald'))+'</small>':'<small>'+esc(tr('Every ladder at '+STAGES[G.stage-1].en,'Alla stegar på '+STAGES[G.stage-1].sv,'Elke ladder op '+STAGES[G.stage-1].nl))+'</small>')+'</div>';
  const todo=nx?LADDERS.map((L,i)=>st[i]>=nx.stage?'':'<li>'+esc(tr(L.en,L.sv,L.nl))+': '+t[L.k]+' / '+L.need[nx.stage-1]+'</li>').join(''):'';
  return '<div class="grands">'+GRAND.map(G=>card(G,got.indexOf(G)>=0)).join('')+'</div>'+
    (nx?'<p class="muted" style="margin:6px 0 0">'+esc(tr('Still needed for '+nx.metal[0]+' ('+nx.en+'):','Kvar till '+nx.metal[1]+' ('+nx.sv+'):','Nog nodig voor '+nx.metal[2]+' ('+nx.nl+'):'))+'</p><ul class="gtodo">'+todo+'</ul>':'<p class="got" style="margin:6px 0 0">'+esc(tr('You have every shield. Thank you!','Du har alla sköldar. Tack!','Je hebt alle schilden. Dank je!'))+'</p>');
}
const shieldCount=t=>LADDERS.reduce((a,L)=>a+stageOf(L,t[L.k]),0)+(()=>{const st=LADDERS.map(L=>stageOf(L,t[L.k]));return GRAND.filter(G=>st.every(n=>n>=G.stage)).length})();
const SHIELD_TOTAL=LADDERS.length*5+GRAND.length;
function updateMe(){
  const box=$('#meBody');if(!box)return;
  if(!SB||!meUid()){box.innerHTML='<p class="muted">'+tr('Sign in to see your contributions.','Logga in för att se dina bidrag.')+'</p>';return}
  const uids=[...new Set([...META.values()].map(m=>m.author).filter(Boolean))];
  const board=uids.map(u=>({u,t:statsFor(u)})).filter(x=>x.t.points>0).sort((a,b)=>b.t.points-a.t.points);
  const t=statsFor(meUid()),rank=board.findIndex(x=>x.u===meUid())+1,myName=PROFILES.get(meUid());
  const nameRow='<p class="meName">'+(myName?esc(trs('Your username: ','Ditt användarnamn: '))+'<b>'+esc(myName)+'</b>':esc(trs('You have no username yet, so others see “a user without a name”.','Du har inget användarnamn än, så andra ser ”en användare utan namn”.')))+' <button type="button" class="btn sm" data-act="set-name">'+esc(myName?trs('Change','Ändra'):trs('Choose a username','Välj ett användarnamn'))+'</button></p>';
  const tile=(n,en,sv,nl)=>'<div class="stat"><b>'+n+'</b><span>'+esc(tr(en,sv,nl))+'</span></div>';
  const top=board.length?board[0].t.points:1;
  box.innerHTML=nameRow+'<p class="rank">'+(rank?esc(tr('You are number '+rank+' of '+board.length+' contributors, with '+t.points+' points.','Du är nummer '+rank+' av '+board.length+' bidragsgivare, med '+t.points+' poäng.','Je staat op plaats '+rank+' van '+board.length+' bijdragers, met '+t.points+' punten.')):esc(tr('No contributions yet. Add a species or some information to get started.','Inga bidrag ännu. Lägg till en art eller information för att komma igång.')))+'</p>'+
    '<div class="stats">'+tile(t.started,'species started','arter startade')+tile(t.expanded,'species or cultivars added to','arter eller sorter du bidragit till','soorten of cultivars aangevuld')+tile(t.facts,'facts filled in','ifyllda uppgifter')+tile(t.obs,'observations','observationer')+tile(t.src,'sources','källor')+tile(t.photos,'photos','foton')+tile(t.month,'this month','denna månad')+'</div>'+
    '<h2 class="hsec">'+trh('Shields','Sköldar','Schilden')+' <em>'+shieldCount(t)+' / '+SHIELD_TOTAL+'</em></h2>'+
    '<p class="muted" style="margin:0 0 8px">'+esc(tr('Each kind of contribution grows through five stages: seed, sprout, sapling, tree and forest elder. Reach the same stage on all six to earn the overall shields.','Varje slags bidrag växer genom fem steg: frö, grodd, planta, träd och skogens äldste. Nå samma steg på alla sex för att få de stora sköldarna.','Elke soort bijdrage groeit in vijf stappen: zaad, kiemplant, jong boompje, boom en bosoudste. Bereik dezelfde stap bij alle zes om de grote schilden te verdienen.'))+'</p>'+
    '<div class="ladders">'+LADDERS.map(L=>ladderHTML(L,t)).join('')+'</div>'+
    '<h2 class="hsec">'+trh('Overall shields','Stora sköldar','Grote schilden')+'</h2>'+grandHTML(t)+
    '<h2 class="hsec">'+trh('Leaderboard','Topplista')+'</h2><p class="muted" style="margin:0 0 8px">'+esc(tr('Others are shown without names.','Andra visas utan namn.'))+'</p>'+
    '<div class="board">'+board.map((x,i)=>'<div class="brow'+(x.u===meUid()?' me':'')+'"><span class="bn2">'+(i+1)+'</span><span class="bl">'+esc(x.u===meUid()?tr('You','Du'):tr('Contributor','Bidragsgivare'))+'</span><span class="bb"><i style="width:'+Math.max(4,Math.round(100*x.t.points/top))+'%"></i></span><span class="bp">'+x.t.points+'</span></div>').join('')+'</div>'+
    '<p class="muted" style="font-size:13px;margin-top:10px">'+esc(tr('Points: 5 per species you start, 2 per species or cultivar you add to, 1 per observation, source or photo, and 1 per 5 facts.','Poäng: 5 per art du startar, 2 per art eller sort du bidrar till, 1 per observation, källa eller foto, och 1 per 5 uppgifter.','Punten: 5 per soort die je start, 2 per soort of cultivar die je aanvult, 1 per waarneming, bron of foto, en 1 per 5 gegevens.'))+'</p>';
  shieldCelebrate(t);
}
