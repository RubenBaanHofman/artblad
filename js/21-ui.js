// Artblad: Home, navigation, events, sign-in, roles and realtime.
// Part 21 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- home ---------- */
const textHit=(s,q)=>{q=String(q).toLowerCase();return [s.latin,s.m.en,s.m.sv,s.m.nl,s.m.family].concat((s.cvs||[]).map(c=>c.cv)).some(x=>x&&String(x).toLowerCase().indexOf(q)>=0)};
const cvHit=(s,q)=>{q=String(q).toLowerCase().replace(/[‘’'"]/g,'').trim();return q?(s.cvs||[]).find(c=>c.cv.toLowerCase().indexOf(q)>=0):null};
const MONTHS_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SV=['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];
const MONTHS_NL=['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
// Species of the day: a stable pick per calendar day, from species with enough data to be worth showing.
function speciesOfDay(d){
  const pool=species.filter(s=>!s.ex&&Object.keys(s.m).length>=6);
  const list=(pool.length?pool:species).slice().sort((a,b)=>a.sid.localeCompare(b.sid));
  if(!list.length)return null;
  const day=Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5);
  return list[(day*2654435761>>>0)%list.length];
}
const chipList=(arr)=>arr.length?'<div class="tchips">'+arr.slice().sort(byName).map(s=>'<button type="button" class="tchip'+(commonName(s)?' cn':'')+'" data-open="'+esc(s.sid)+'">'+esc(dispName(s))+vmark(s.sid)+'</button>').join('')+'</div>':'';
function updateHome(){
  $('#homeStats').textContent=!loaded?tr('Loading…','Laddar…'):[species.length+' '+trs('species','arter'),state.entries.length+' '+trs('entries','poster'),state.obs.length+' '+trs('observations','observationer')].join(' · ');
  const now=new Date(),mo=now.getMonth()+1,s=speciesOfDay(now);
  let left='<div><div class="eyebrow">'+esc(tr('Species of the day','Dagens art'))+'</div>';
  if(s){const m=s.m,typeO=TYPES_ALL.find(o=>o.k===m.type);
    const line=m.product||m.edible||m.habitat||'';
    left+='<button type="button" class="sotd" data-open="'+esc(s.sid)+'" style="margin-top:12px"><div class="ph" style="--c:'+FCOL[s.form]+'">'+phInner(s)+'</div>'+
      '<div style="min-width:0"><div class="lat">'+names(s).main+'</div><div class="nm">'+names(s).sub+'</div>'+
      '<div class="meta" style="margin-top:6px"><span class="pill t" style="--c:'+FCOL[s.form]+'">'+(typeO?trh(typeO.en,typeO.sv):(s.form==='w'?trh('Woody','Vedartad'):trh('Herbaceous','Örtartad')))+'</span>'+(m.verdict?dots(m.verdict,5):'')+'</div>'+
      (line?'<p>'+esc(line)+'</p>':'')+'</div></button>';
  }else left+='<p class="tnone">'+tr('No species yet.','Inga arter ännu.')+'</p>';
  left+='</div>';
  const plant=species.filter(x=>(x.m.cal1||[]).indexOf(mo)>=0),harvest=species.filter(x=>(x.m.cal3||[]).indexOf(mo)>=0);
  const none='<span class="tnone">'+(state.lang==='sv'?'Inget registrerat för '+MONTHS_SV[mo-1]+' ännu.':state.lang==='nl'?'Nog niets vastgelegd voor '+MONTHS_NL[mo-1]+'.':'Nothing recorded for '+MONTHS_EN[mo-1]+' yet.')+'</span>';
  const right='<div><div class="eyebrow">'+esc(tr('Now in '+MONTHS_EN[mo-1],'Nu i '+MONTHS_SV[mo-1],'Nu in '+MONTHS_NL[mo-1]))+'</div>'+
    '<div class="trow"><span>'+trh('Plant','Plantera')+'</span>'+(chipList(plant)||none)+'</div>'+
    '<div class="trow"><span>'+trh('Harvest','Skörda')+'</span>'+(chipList(harvest)||none)+'</div>'+
    '<p class="tnone" style="margin:0;padding:0">'+tr('Based on the planting and harvest months on each species sheet.','Baserat på plantering- och skördemånaderna på varje artblad.')+'</p></div>';
  $('#today').innerHTML=left+right;
  updateHomeSearch();
}
function updateHomeSearch(){
  const q=($('#hq').value||'').trim(),box=$('#hqRes');
  if(!q){box.hidden=true;box.innerHTML='';return}
  const hits=species.filter(s=>textHit(s,q)).sort(byName);
  box.hidden=false;
  box.innerHTML=hits.length?hits.slice(0,6).map(s=>{const c=!textHit(Object.assign({},s,{cvs:[]}),q)&&cvHit(s,q),x=c||s;return '<button type="button" data-open="'+esc(x.ref)+'"><span class="lat">'+names(x).main+'</span><small>'+names(x).sub+'</small></button>'}).join('')+
    (hits.length>6?'<button type="button" data-act="home-all"><span class="more">'+tr('Show all '+hits.length+' matches','Visa alla '+hits.length+' träffar','Alle '+hits.length+' resultaten tonen')+'</span></button>':''):'<p class="tnone" style="margin:0">'+tr('No species match','Inga arter matchar')+' “'+esc(q)+'”.</p>';
}
function homeToOverview(){const q=($('#hq').value||'').trim();state.q=q;$('#q').value=q;go('overview');updateOverview()}

/* ---------- navigation ---------- */
function show(v){
  if(v!=='add'&&!$('#v-add').hidden&&draftDirty()){draftKeep();toast(tr('Your unsaved entry is kept on this device. Open Add to finish it.','Din osparade post sparas på den här enheten. Öppna Lägg till för att göra klart den.','Je niet-opgeslagen invoer blijft op dit apparaat bewaard. Open Toevoegen om hem af te maken.'))}
  mmenu(false);$$('.acts.mcol.open').forEach(c=>c.classList.remove('open'));
  $$('.view').forEach(x=>{x.hidden=x.id!=='v-'+v});
  document.body.classList.toggle('onadd',v==='add');dockSize();
  $$('#dock [data-dk]').forEach(t=>t.setAttribute('aria-current',t.dataset.dk===(v==='trash'||v==='lists'?'overview':v==='help'||v==='autofill'?'home':v)?'page':'false'));
  $$('.tab').forEach(t=>t.setAttribute('aria-current',t.dataset.v===(['gaps','trash','compare','lists'].indexOf(v)>=0?'overview':v==='help'||v==='autofill'||v==='admin'||v==='join'?'home':v)?'page':'false'));
  if(FAMILY&&(v==='me'||v==='join'||(v==='gaps'&&loaded&&!isAdmin()))){location.hash='home';return}
  if(v==='add'&&!formBuilt)buildForm();
  if(v==='add')draftOffer();
  if(v==='sheet')updateSheet();
  if(v==='home')updateHome();
  if(v==='gaps')updateGaps();
  if(v==='trash')openTrash();
  if(v==='me')updateMe();
  if(v==='compare')updateCompare();
  if(v==='calendar')updateCalendar();
  if(v==='pick')updatePick();
  if(v==='plantings')updatePlantings();
  if(v==='projects')updateProjects();
  if(v==='lists')updateLists();
  if(v==='help')updateHelp();
  if(v==='autofill')updateAutofill();
  if(v==='admin')updateAdmin();
  if(v==='add'&&document.body.classList.contains('ro')){location.hash='home';return}
  if(['gaps','plantings','lists','projects'].indexOf(v)>=0&&document.body.classList.contains('ro')&&SESSION){location.hash='join';return}
  if(v==='join')updateJoin();
  if(v!=='sheet'&&$('#renBox'))$('#renBox').hidden=true;
  window.scrollTo(0,0);
}
function route(){const h=(location.hash||'#home').slice(1);
  if(h.indexOf('s-')===0){setSel(h.slice(2));show('sheet');return}
  if(h.indexOf('l-')===0){openList=h.slice(2);show('lists');return}
  if(h==='lists')openList='';
 show(['home','overview','add','sheet','gaps','trash','me','compare','calendar','pick','plantings','projects','lists','help','autofill','admin','join'].indexOf(h)>=0?h:'home')}
function go(v){if(location.hash==='#'+v)show(v);else location.hash=v}
function refresh(){derive();revCompute();updateAdminBadge();if(!$('#v-admin').hidden)updateAdmin();updateOverview();if(!$('#v-home').hidden)updateHome();if(!$('#v-gaps').hidden)updateGaps();if(!$('#v-me').hidden)updateMe();if(!$('#v-compare').hidden)updateCompare();if(!$('#v-calendar').hidden)updateCalendar();if(!$('#v-pick').hidden)updatePick();if(!$('#v-plantings').hidden)updatePlantings();if(!$('#v-projects').hidden)updateProjects();if(!$('#v-lists').hidden)updateLists();if(!$('#v-help').hidden)updateHelp();updateTrash();if(!$('#v-sheet').hidden)updateSheet();
  $('#spNames').innerHTML=species.map(s=>'<option value="'+esc(s.latin)+'"></option>').join('');updateHint()}
function arm(btn,run){
  if(btn.dataset.armed){clearTimeout(btn._t);delete btn.dataset.armed;btn.textContent=btn.dataset.label;run();return}
  btn.dataset.armed='1';btn.dataset.label=btn.textContent;btn.textContent=tr('Confirm','Bekräfta');
  btn._t=setTimeout(()=>{delete btn.dataset.armed;btn.textContent=btn.dataset.label},4000);
}

/* ---------- events ---------- */
document.addEventListener('click',async e=>{
  const t=e.target;
  const ah=t.closest('.artie-hint a');if(ah){const l=canon(draft.latin||'');if(l.split(' ').length>=2)afPrefill=l}
  const sj=t.closest('[data-jump]');if(sj){e.preventDefault();const el=document.getElementById(sj.dataset.jump);if(el&&!el.hidden)el.scrollIntoView({block:'start',behavior:'smooth'});return}
  const hj=t.closest('[data-hjump]');if(hj){const h=document.getElementById(hj.dataset.hjump);if(h)h.scrollIntoView({behavior:'smooth',block:'start'});return}
  const lb=t.closest('[data-lb]');if(lb){$('#lb img').src=blobSrc(lb.dataset.lb);$('#lb').hidden=false;return}
  if(t.closest('#lb')){$('#lb').hidden=true;return}
  const st=t.closest('[data-fav]');if(st){Fav.toggle(st.dataset.fav);return}
  const bo=t.closest('[data-bulko]');if(bo){const k=bulkField(),d=k==='type'?{t:'single'}:DEF[k],v=bo.dataset.bulko;if(d&&d.t==='multi'){const a=new Set(bulkState.val||[]);a.has(v)?a.delete(v):a.add(v);bulkState.val=a.size?[...a]:null}else bulkState.val=bulkState.val===v?null:v;updateGaps();return}
  const bv=t.closest('[data-bulkv]');if(bv){const v=Number(bv.dataset.bulkv);bulkState.val=bulkState.val===v?null:v;updateGaps();return}
  const bm=t.closest('[data-bulkm]');if(bm){const v=Number(bm.dataset.bulkm),a=new Set(bulkState.val||[]);a.has(v)?a.delete(v):a.add(v);bulkState.val=a.size?[...a].sort((x,y)=>x-y):null;updateGaps();return}
  const zb=t.closest('[data-zoom]');if(zb){store.set('ab.zoom',zb.dataset.zoom);dispApply();dockSize();return}
  const gso=t.closest('[data-gapsort]');if(gso){store.set('ab.gapsort',gso.dataset.gapsort);updateGaps();return}
  const vb=t.closest('[data-view]');if(vb){store.set('ab.view',vb.dataset.view);dispApply();updateOverview();return}
  const fo=t.closest('[data-favonly]');if(fo){state.favOnly=!state.favOnly;updateOverview();return}
  const cc=t.closest('[data-cmpcol]');if(cc){cmpSet('col',cc.dataset.cmpcol);return}
  const pj=t.closest('[data-pj]');if(pj){pjSet(pj.dataset.pj);pjState.edit=false;updateProjects();return}
  const cd=t.closest('[data-cmp-del]');if(cd){cmp=cmp.filter(x=>x!==cd.dataset.cmpDel);saveCmp();updateCompare();return}
  const cs=t.closest('[data-calset]');if(cs){calState.set=cs.dataset.calset;updateCalendar();return}
  const ca=t.closest('[data-calact]');if(ca){const k=ca.dataset.calact;if(calState.acts.has(k)&&calState.acts.size>1)calState.acts.delete(k);else calState.acts.add(k);updateCalendar();return}
  const pl=t.closest('[data-pl]');if(pl){pickState.light=pickState.light===pl.dataset.pl?'':pl.dataset.pl;updatePick();return}
  const pm=t.closest('[data-pm]');if(pm){const v=Number(pm.dataset.pm);pickState.moist=pickState.moist===v?0:v;updatePick();return}
  const ps=t.closest('[data-ps]');if(ps){const k=ps.dataset.ps;pickState.soil.has(k)?pickState.soil.delete(k):pickState.soil.add(k);updatePick();return}
  const ad=t.closest('[data-adv]');if(ad){const S=advState.sets[ad.dataset.adv],v=ad.dataset.v;S.has(v)?S.delete(v):S.add(v);updatePick();return}
  const adx=t.closest('[data-advx]');if(adx){const v=adx.dataset.advx;advState.caut.has(v)?advState.caut.delete(v):advState.caut.add(v);updatePick();return}
  const pf=t.closest('[data-pf]');if(pf){pickState.form=pickState.form===pf.dataset.pf?'':pf.dataset.pf;updatePick();return}
  const pst=t.closest('[data-plst]');if(pst){plState.status=plState.status===pst.dataset.plst?'':pst.dataset.plst;updatePlantings();return}
  const gp=t.closest('[data-gap]');if(gp){gapState.only=gp.dataset.gap;updateGaps();return}
  const cvb=t.closest('#v-sheet [data-cv]');if(cvb){selCv=cvb.dataset.cv;$('#cvRenBox').hidden=true;try{history.replaceState(null,'','#s-'+selected+(selCv?'--'+selCv:''))}catch(err){}updateSheet();if(cvb.closest('#cvTable'))$('#cardArea').scrollIntoView({block:'start',behavior:'smooth'});return}
  const cvf=t.closest('[data-cvfill]');if(cvf){const sp=bySid.get(slug(canon(draft.latin||''))),c=sp&&sp.cvs.find(x=>x.ck===cvf.dataset.cvfill);if(c){draft.cultivar=c.cv;draft._cvNew=false;updateCvField()}return}
  const op=t.closest('[data-open]');if(op){setSel(op.dataset.open);go('sheet');updateSheet();return}
  const row=t.closest('.sp');if(row){selected=row.dataset.sid;selCv='';go('sheet');updateSheet();return}
  const fb=t.closest('[data-fk]');if(fb){const key=fb.dataset.fk+':'+fb.dataset.fv;state.flt.has(key)?state.flt.delete(key):state.flt.add(key);updateOverview();return}
  const ff=t.closest('[data-form]');if(ff){state.fForm=ff.dataset.form;updateOverview();return}
  if(t.closest('#fltClear')){state.flt.clear();state.fForm='';state.favOnly=false;updateOverview();return}
  const sg=t.closest('[data-side]');if(sg){state.side=sg.dataset.side;updateSheet();return}
  const ly=t.closest('[data-layout]');if(ly){state.layout=LAYOUTS_OK(ly.dataset.layout);store.set('ab.layout',state.layout);state.side='front';updateSheet();return}
  const lg=t.closest('[data-lang]');if(lg){setLang(lg.dataset.lang);return}
  const fill=t.closest('[data-fill]');if(fill){draft.latin=fill.dataset.fill;$('#latin').value=draft.latin;updateHint();return}
  const kb=t.closest('#form button[data-k]');
  if(kb){
    const k=kb.dataset.k,d=DEF[k],v=kb.dataset.v;
    if(d.t==='multi'||d.t==='cal'){const val=d.t==='cal'?Number(v):v,a=(draft[k]||[]).slice(),i=a.indexOf(val);if(i>=0)a.splice(i,1);else a.push(val);draft[k]=a;kb.setAttribute('aria-pressed',i<0)}
    else{const val=d.t==='scale'?Number(v):v,was=draft[k]===val;draft[k]=was?null:val;$$('#form [data-k="'+k+'"]').forEach(b=>b.setAttribute('aria-pressed',!was&&b===kb))}
    if(k==='type'&&draft.type&&formOf(draft.type)!==draftForm){draftForm=formOf(draft.type);buildForm();return}
    updateCounts();return;
  }
  const a=t.closest('[data-act]');if(!a)return;
  const act=a.dataset.act,s=selected&&bySid.get(selected),cp=cur();
  if(act==='goto-add')openAdd({});
  else if(act==='artie-req')artieRequest([a.dataset.latin],a);
  else if(act==='af-send')artieRequest(String($('#afNames').value||'').split(/\n/),a);
  else if(act==='af-download')afDownload();
  else if(act==='pl-winter'){const b=$('[data-plw="'+a.dataset.id+'"]');if(b){b.hidden=!b.hidden;if(!b.hidden)b.querySelector('.plw-t').focus()}}
  else if(act==='pl-winter-save')plWinterSave(a.dataset.id);
  else if(act==='gbif-use'){const l=a.dataset.latin,i=$('#latin');if(i){i.value=l;draft.latin=l;delete draft._nearOk;updateHint();gbifCheck();updateCounts()}}
  else if(act==='bulk-all'){$$('#gapList [data-bulksel]').forEach(c=>bulkState.sel.add(c.dataset.bulksel));updateGaps()}
  else if(act==='bulk-none'){bulkState.sel.clear();updateGaps()}
  else if(act==='bulk-apply')arm(a,bulkApply);
  else if(act==='thumbs-make')thumbsMake(a);
  else if(act==='install'&&installEvt){installEvt.prompt();installEvt.userChoice.finally(()=>{installEvt=null;const b=$('#installBtn');if(b)b.hidden=true})}
  else if(act==='sec-mark'&&s&&SB&&isAdmin())secToggle(a,s);
  else if(act==='chk-dismiss'&&SB&&isAdmin())chkCall('dismiss_check',a);
  else if(act==='chk-undo'&&SB&&isAdmin())chkCall('undismiss_check',a);
  else if(act==='rev-mark'&&s&&SB&&isAdmin())revCall('mark_reviewed',{p_sid:s.sid},tr('Marked as verified: ','Markerad som verifierad: ','Als geverifieerd gemarkeerd: ')+s.latin);
  else if(act==='rev-unmark'&&s&&SB&&isAdmin())arm(a,()=>revCall('unmark_reviewed',{p_sid:s.sid},tr('Mark removed','Markering borttagen','Markering verwijderd')));
  else if(act==='flag-resolve'&&SB&&isAdmin())revCall('resolve_flag',{p_id:Number(a.dataset.fid)},tr('Flag closed','Flagga stängd','Melding gesloten'));
  else if(act==='flag-open'&&s){const b=$('#flagBox');b.hidden=!b.hidden;if(!b.hidden)$('#flagReason').focus()}
  else if(act==='flag-cancel')$('#flagBox').hidden=true;
  else if(act==='flag-send'&&s&&SB)flagSend(s);
  else if(act==='adm-tab'){admState.tab=a.dataset.tab;admState.n=40;updateAdmin()}
  else if(act==='adm-more'){admState.n+=40;updateAdmin()}
  else if(act==='af-sent')arm(a,afMarkSent);
  else if(act==='af-del')arm(a,()=>afDelete(a.dataset.sid));
  else if(act==='signin'){$('#auth').hidden=false;$('#authEmail').focus()}
  else if(act==='pj-new'){pjCreate()}
  else if(act==='pj-edit'){pjState.edit=true;updateProjects()}
  else if(act==='pj-cancel'){pjState.edit=false;updateProjects()}
  else if(act==='pj-save'){pjSaveSite()}
  else if(act==='pj-geo'){if(navigator.geolocation)navigator.geolocation.getCurrentPosition(g=>{const i=$('#pjGeo');if(i)i.value=g.coords.latitude.toFixed(5)+', '+g.coords.longitude.toFixed(5)},()=>toast(tr('Position not available.','Positionen är inte tillgänglig.','Positie niet beschikbaar.'),'err'),{enableHighAccuracy:true,timeout:15000})}
  else if(act==='pj-place-add'){const p=pjActive(),n=($('#pjPlName')||{}).value||'';if(p&&n.trim())pjSaveDoc(p,{places:(p.places||[]).concat([{id:newId(),name:n.trim().slice(0,60),kind:$('#pjPlKind').value}])},tr('Place added','Plats tillagd','Plek toegevoegd'))}
  else if(act==='pj-place-ren'){const p=pjActive(),x=p&&(p.places||[]).find(y=>y.id===a.dataset.id);if(x){const n=prompt(tr('New name','Nytt namn','Nieuwe naam'),x.name);if(n&&n.trim())pjSaveDoc(p,{places:p.places.map(y=>y.id===x.id?Object.assign({},y,{name:n.trim().slice(0,60)}):y)})}}
  else if(act==='pj-place-del'){const p=pjActive();if(p)arm(a,()=>pjSaveDoc(p,{places:(p.places||[]).filter(y=>y.id!==a.dataset.id)},tr('Place removed; its records keep their text place','Platsen borttagen; dess poster behåller sin textplats','Plek verwijderd; de records houden hun tekstplek')))}
  else if(act==='pj-mem-add'){pjMemberAdd()}
  else if(act==='pj-mem-del'){arm(a,()=>pjMemberDel(a.dataset.uid))}
  else if(act==='pj-leave'){arm(a,()=>pjMemberDel(meUid()))}
  else if(act==='pj-cmt'){const p=pjActive(),t=($('#pjCmt')||{}).value||'';if(p&&t.trim()){Data.saveRow('comments',null,{text:t.trim(),createdAt:Date.now(),project:p.id}).then(()=>toast(tr('Note posted','Anteckning skickad','Notitie geplaatst')),e=>toast(errMsg(e),'err'))}}
  else if(act==='pj-list-new'){const p=pjActive();if(p)Data.saveRow('lists',null,{name:tr('Plant list','Växtlista','Plantenlijst')+' '+pjName(p.id),description:'',sids:[],createdAt:Date.now(),project:p.id}).then(id=>{location.hash='l-'+id},e=>toast(errMsg(e),'err'))}
  else if(act==='pj-goto'){const p=pjActive();if(!p)return;if(a.dataset.to==='plantings'){plState.proj=p.id;go('plantings')}else{calState.set='proj';go('calendar')}}
  else if(act==='pj-pick'){pjToPick()}
  else if(act==='pj-trash'){const p=pjActive();if(p)arm(a,async()=>{try{await Data.trash('projects',p.id,true);pjSet('');toast(tr('Project moved to the trash','Projektet flyttat till papperskorgen','Project naar de prullenbak'))}catch(e){toast(errMsg(e),'err')}})}
  else if(act==='chk-run'){chkRun()}
  else if(act==='orph-find'){orphFind()}
  else if(act==='orph-del'){arm(a,orphDelete)}
  else if(act==='signout'){offClear();if(SB)SB.auth.signOut()}
  else if(act==='add-info'&&s)openAdd({latin:s.latin,form:s.form,cultivar:cp&&cp.isCv?cp.cv:''});
  else if(act==='cv-new'&&s)openAdd({latin:s.latin,form:s.form,cvNew:true});
  else if(act==='cv-rename'&&cp&&cp.isCv)openCvRename(cp);
  else if(act==='cv-ren-cancel')$('#cvRenBox').hidden=true;
  else if(act==='cv-ren-go'&&cp&&cp.isCv){const n=cvNorm($('#cvRenInput').value),ex=s.cvs.find(c=>c.ck===cvKey(n)&&c!==cp);if(ex)arm(a,()=>doCvRename(cp,n));else doCvRename(cp,n)}
  else if(act==='cancel-edit'){resetDraft()}
  else if(act==='draft-restore')draftRestore();
  else if(act==='draft-discard'){draftClear();toast(tr('Draft discarded','Utkastet slängt','Concept weggegooid'))}
  else if((act==='print-one'||act==='export-one'||act==='print-sheets'||act==='export-sheets')&&SB&&!CANW)toast(tr('Printing and downloading sheets is for contributors.','Utskrift och nedladdning av blad är för bidragsgivare.','Afdrukken en downloaden van bladen is voor bijdragers.'),'err');
  else if(act==='export-sheets')exportSheets(listInView(),'list_'+today());
  else if(act==='print-sheets')printSheets(listInView());
  else if(act==='print-one'&&cp)printSheets([cp]);
  else if(act==='export-one'&&cp)exportSheets([cp],cp.ref);
  else if(act==='export-csv')exportCsv();
  else if(act==='export-json')exportJson();
  else if(act==='home-all')homeToOverview();
  else if(act==='near-use'){draft.latin=a.dataset.latin;$('#latin').value=a.dataset.latin;$('#nearBox').hidden=true;saveForm()}
  else if(act==='near-new'){draft._nearOk=true;$('#nearBox').hidden=true;saveForm()}
  else if(act==='rename')openRename();
  else if(act==='sp-trash'&&s&&SB&&isAdmin())arm(a,async()=>{const n=s.latin;try{await Data.trashMany('entries',s.entries.map(e=>e.id));toast(tr('Moved to the trash: ','Flyttad till papperskorgen: ','Naar de prullenbak: ')+n+'. '+tr('Restore it from Species → Trash within 30 days.','Återställ den från Arter → Papperskorg inom 30 dagar.','Zet hem binnen 30 dagen terug via Soorten → Prullenbak.'));go('overview')}catch(err){toast(errMsg(err),'err')}});
  else if(act==='compare-add'&&cp){cmpAdd(cp.ref);go('compare')}
  else if(act==='cmp-favs'){species.filter(x=>Fav.has(x.sid)).slice(0,CMP_MAX).forEach(x=>cmpAdd(x.sid));updateCompare()}
  else if(act==='cmp-clear'){cmp=[];saveCmp();updateCompare();updateOverview();if(!$('#v-pick').hidden)updatePick()}
  else if(act==='adv-clear'){ADV.forEach(x=>advState.sets[x[0]].clear());advState.caut.clear();advState.inv='';advState.verdict=0;advState.edib=0;updatePick()}
  else if(act==='pick-jump'){const o=$('#pickOut');if(o)o.scrollIntoView({block:'start',behavior:'smooth'})}
  else if(act==='pick-clear'){Object.assign(pickState,{light:'',moist:0,soil:new Set(),zone:'',temp:'',form:'',scope:''});ADV.forEach(x=>advState.sets[x[0]].clear());advState.caut.clear();advState.inv='';advState.verdict=0;advState.edib=0;advState.strict=false;updatePick()}
  else if(act==='cmp-mode'){cmpMode=!cmpMode;updateOverview()}
  else if(act==='pl-new')plFormOpen(null,a.dataset.sid);
  else if(act==='pk-geo-fill')pickFromMap();
  else if(act==='pk-geo-here'){try{navigator.geolocation.getCurrentPosition(pos=>{$('#pkGeo').value=pos.coords.latitude.toFixed(5)+', '+pos.coords.longitude.toFixed(5)},()=>toast(tr('Location is not available.','Positionen är inte tillgänglig.','Locatie is niet beschikbaar.'),'err'),{enableHighAccuracy:true,timeout:15000})}catch(e){}}
  else if(act==='pl-clim')plClimRetry(a.dataset.id);
  else if(act==='pl-new-enc')plFormOpen(null,a.dataset.sid,'','encounter');
  else if(act==='mmenu')mmenu(!document.body.classList.contains('mmenu'));
  else if(act==='mmore'){const c=a.closest('.acts');const o=!c.classList.contains('open');c.classList.toggle('open',o);a.setAttribute('aria-expanded',o)}
  else if(act==='cmt-post'&&s)cmtPost(s);
  else if(act==='cmt-edit'&&s){cmtState.edit=a.dataset.id;updateComments(s);const t=$('#cmtEdit');if(t)t.focus()}
  else if(act==='cmt-cancel'&&s){cmtState.edit=null;updateComments(s)}
  else if(act==='cmt-save')cmtSave(a.dataset.id);
  else if(act==='cmt-del')arm(a,async()=>{try{await Data.trash('comments',a.dataset.id,true);toast(tr('Moved to the trash','Flyttad till papperskorgen'))}catch(err){toast(errMsg(err),'err')}});
  else if(act==='pl-new-here'&&s){go('plantings');setTimeout(()=>plFormOpen(null,s.sid,selCv),50)}
  else if(act==='pl-enc-here'&&s){go('plantings');setTimeout(()=>plFormOpen(null,s.sid,'','encounter'),50)}
  else if(act==='pl-edit'){const p=(state.plantings||[]).find(x=>x.id===a.dataset.id);if(p){if($('#v-plantings').hidden){go('plantings');setTimeout(()=>plFormOpen(p),50)}else plFormOpen(p)}}
  else if(act==='pl-save')plSave();
  else if(act==='pl-cancel'){$('#plForm').hidden=true;plState.edit=null}
  else if(act==='pl-geo'){try{navigator.geolocation.getCurrentPosition(pos=>{$('#plGeo').value=pos.coords.latitude.toFixed(5)+', '+pos.coords.longitude.toFixed(5)},()=>toast(tr('Location is not available here.','Platsen är inte tillgänglig här.'),'err'))}catch(e){toast(tr('Location is not available here.','Platsen är inte tillgänglig här.'),'err')}}
  else if(act==='pl-del')arm(a,async()=>{try{await Data.trash('plantings',a.dataset.id,true);toast(tr('Moved to the trash','Flyttad till papperskorgen'))}catch(err){toast(errMsg(err),'err')}});
  else if(act==='list-new'){const n=$('#newListName').value.trim();if(!n){toast(tr('Give the list a name.','Ge listan ett namn.'),'err');return}try{const lp=($('#newListProj')||{}).value||'',doc={name:n,description:$('#newListDesc').value.trim(),sids:[],createdAt:Date.now()};if(lp)doc.project=lp;const id=await Data.saveRow('lists',null,doc);$('#newListName').value='';$('#newListDesc').value='';location.hash='l-'+id}catch(err){toast(errMsg(err),'err')}}
  else if(act==='list-save'){const L=listById(openList);if(L){const doc=Object.assign({},L);delete doc.id;doc.name=$('#listName').value.trim()||L.name;doc.description=$('#listDesc').value.trim();try{await Data.saveRow('lists',L.id,doc);toast(tr('List saved','Lista sparad'))}catch(err){toast(errMsg(err),'err')}}}
  else if(act==='list-rm'){const L=listById(openList);if(L){const doc=Object.assign({},L);delete doc.id;doc.sids=(L.sids||[]).filter(x=>x!==a.dataset.sid);try{await Data.saveRow('lists',L.id,doc)}catch(err){toast(errMsg(err),'err')}}}
  else if(act==='list-del')arm(a,async()=>{try{await Data.trash('lists',openList,true);location.hash='lists';toast(tr('Moved to the trash','Flyttad till papperskorgen'))}catch(err){toast(errMsg(err),'err')}});
  else if(act==='list-show'){state.listId=openList;go('overview');updateOverview()}
  else if(act==='list-cmp'){const L=listById(openList);if(L){cmp=[];(L.sids||[]).filter(x=>bySid.has(x)).slice(0,CMP_MAX).forEach(cmpAdd);saveCmp();go('compare')}}
  else if(act==='list-clear-filter'){state.listId='';updateOverview()}
  else if(act==='cmp-go'){cmpMode=false;go('compare')}
  else if(act==='edit-sheet'&&cp)openAdd({sheet:cp});
  else if(act==='restore'){try{await Data.trash(a.dataset.t2,a.dataset.id,false);toast(tr('Restored','Återställd'));updateTrash()}catch(err){toast(errMsg(err),'err')}}
  else if(act==='purge')arm(a,async()=>{
    // The photo file goes too, once nothing else (live or in the trash) uses it (since 2.5.1).
    const t2=a.dataset.t2,id=a.dataset.id,doc=t2==='entries'?(state.trashE||[]).find(x=>x.id===id):t2==='obs'?(state.trashO||[]).find(x=>x.id===id):null;
    const ph=doc&&(t2==='entries'?doc.fields&&doc.fields.photo:doc.photo);
    try{await Data.purge(t2,id);if(ph)dropPhoto(ph,id);toast(tr('Deleted for good','Raderad för gott'));updateTrash()}catch(err){toast(errMsg(err),'err')}});
  else if(act==='set-name'){mmenu(false);openName()}
  else if(act==='name-save')saveName();
  else if(act==='name-cancel')$('#nameBox').hidden=true;
  else if(act==='ren-cancel')$('#renBox').hidden=true;
  else if(act==='ren-go'){const t2=bySid.get(slug(canon($('#renInput').value)));if(t2&&t2!==s)arm(a,doRename);else doRename()}
  else if(act==='gap-add'){const g=bySid.get(a.dataset.sid);if(g){selected=g.sid;selCv='';const miss=gapState.only&&!GAPS.find(x=>x.k===gapState.only).ok(g)?gapState.only:((missingOf(g)[0]||{}).k||'');openAdd({latin:g.latin,form:g.form,gap:miss})}}
  else if(act==='edit-entry'){const en=state.entries.find(x=>x.id===a.dataset.id);if(en)openAdd({entry:en})}
  else if(act==='del-entry')arm(a,async()=>{const en=state.entries.find(x=>x.id===a.dataset.id);try{await Data.delEntry(a.dataset.id);if(!SB&&en&&en.fields&&en.fields.photo)dropPhoto(en.fields.photo,en.id);toast(SB?tr('Moved to the trash','Flyttad till papperskorgen'):tr('Entry deleted','Post raderad'))}catch(err){toast(errMsg(err),'err')}});
  else if(act==='del-obs')arm(a,async()=>{const o=state.obs.find(x=>x.id===a.dataset.id);try{await Data.delObs(a.dataset.id);if(!SB&&o&&o.photo)dropPhoto(o.photo,o.id);toast(SB?tr('Moved to the trash','Flyttad till papperskorgen'):tr('Observation deleted','Observation raderad'))}catch(err){toast(errMsg(err),'err')}});
  else if(act==='remove-examples')arm(a,async()=>{try{for(const en of state.entries.filter(x=>x.ex))await Data.delEntry(en.id);toast(tr('Examples removed','Exemplen borttagna','Voorbeelden verwijderd'))}catch(err){toast(errMsg(err),'err')}});
});
document.addEventListener('change',e=>{
  if(e.target.id==='cmpSort'){cmpSet('sort',e.target.value);return}
  if(e.target.id==='plProjSel'){plState.proj=e.target.value;plState.place='';updatePlantings();return}
  if(e.target.id==='plProj'){plProjToggle();plPlaceFill(e.target.value==='__new'?'':e.target.value,'');return}
  if(e.target.matches('[data-pjrole]')){pjMemberRole(e.target.dataset.pjrole,e.target.value);return}
  if(e.target.matches('[data-pjmove]')){const v=e.target.value;if(v)pjMove(e.target.dataset.pjmove,v);return}
  if(e.target.matches('select[data-lu]')){lenUnitSet(e.target.dataset.lu,e.target.value);return}
  if(e.target.id==='cvSel'){const v=e.target.value,sp=bySid.get(slug(canon(draft.latin||'')));if(v==='__new'){draft._cvNew=true;draft.cultivar='';$('#cvNew').value='';$('#cvNew').hidden=false;$('#cvNew').focus()}else{draft._cvNew=false;const c=sp&&sp.cvs.find(x=>x.ck===v);draft.cultivar=c?c.cv:'';$('#cvNew').hidden=true}cvHint();return}
  if(e.target.matches('select[data-cvnew]')){const i=$('#'+e.target.dataset.cvnew);if(i){i.hidden=e.target.value!=='__new';if(!i.hidden)i.focus()}return}
  if(e.target.matches('[data-addlist]')){const v=e.target.value;e.target.value='';if(v)listAdd(v,e.target.dataset.addlist);return}if(e.target.id==='plShowEnc'){store.set('ab.plenc',e.target.checked?'1':'0');updatePlantings();return}if(e.target.matches('[data-plstat]')){plSetStatus(e.target.dataset.plstat,e.target.value);return}if(e.target.id==='plSp'){plCvFill('');return}if(e.target.id==='plPlaceSel'){plState.place=e.target.value;updatePlantings();return}if(e.target.matches('[data-cmpsel]')){const id=e.target.dataset.cmpsel;if(e.target.checked){if(cmp.length>=CMP_MAX){e.target.checked=false;toast(tr('You can compare up to 4 species.','Du kan jämföra upp till 4 arter.'),'err');return}cmp.push(id)}else cmp=cmp.filter(x=>x!==id);saveCmp();updateCmpBar();return}if(e.target.id==='cmpPick'&&e.target.value){cmpAdd(e.target.value);updateCompare();return}if(e.target.id==='pickZone'){pickState.zone=e.target.value;updatePick();return}if(e.target.id==='pickTemp'){pickState.temp=e.target.value;updatePick();return}if(e.target.id==='pickScope'){pickState.scope=e.target.value;updatePick();return}if(e.target.id==='advInv'){advState.inv=e.target.value;updatePick();return}if(e.target.id==='advEdib'){advState.edib=Number(e.target.value);updatePick();return}if(e.target.id==='advVerdict'){advState.verdict=Number(e.target.value);updatePick();return}if(e.target.id==='advStrict'){advState.strict=e.target.checked;updatePick();return}if(e.target.id==='advAnn'){advState.ann=e.target.checked;updatePick();return}if(e.target.id==='pickCv'){pickState.cv=e.target.checked;store.set('ab.pickcv',pickState.cv?'1':'0');updatePick();return}if(e.target.id==='calCv'){calState.cv=e.target.checked;store.set('ab.calcv',calState.cv?'1':'0');updateCalendar();return}if(e.target.matches('[data-bulksel]')){const v=e.target.dataset.bulksel;e.target.checked?bulkState.sel.add(v):bulkState.sel.delete(v);$('#bulkBox').innerHTML=bulkBarHTML();return}if(e.target.id==='bulkCal'){bulkState.cal=e.target.value;bulkState.val=null;updateGaps();return}if(e.target.id==='bulkZf'){bulkState.zfield=e.target.value;updateGaps();return}if(e.target.id==='dispCompact'){store.set('ab.compact',e.target.checked?'1':'0');dispApply();return}if(e.target.matches('[data-withcv]')){state.withCv=e.target.checked;store.set('ab.withcv',state.withCv?'1':'0');updateSheet();return}if(e.target.matches('[data-withgenus]')){state.withGenus=e.target.checked;store.set('ab.withgenus',state.withGenus?'1':'0');updateSheet();return}if(e.target.matches('[data-withlog]')){state.withLog=e.target.checked;store.set('ab.withlog',state.withLog?'1':'0');if(!state.withLog)state.side='front';$$('[data-withlog]').forEach(c=>c.checked=state.withLog);updateSheet();return}if(e.target.id==='gapSel'){gapState.only=e.target.value;updateGaps()}});
document.addEventListener('input',e=>{
  if(e.target.id==='bulkText'){bulkState.val=e.target.value.trim()||null;const b=$('[data-act=bulk-apply]');if(b)b.disabled=!bulkState.sel.size||isEmpty(bulkState.val);return}
  const t=e.target;
  if(t.id==='q'){state.q=t.value.trim();updateOverview();return}
  if(t.id==='hq'){updateHomeSearch();return}
  if(t.id==='renInput'){renHint();return}
  if(t.id==='cvRenInput'){cvRenHint();return}
  if(t.closest('#form')){
    if(t.id==='entDate'){draft._date=t.value;return}
    if(t.id==='entPhoto'){pendingPhoto=t.files[0]||null;return}
    if(t.id==='cvNew'){draft.cultivar=t.value;cvHint();return}
    const k=t.dataset.k;if(!k)return;draft[k]=t.dataset.len?lenFromInput(k,t.value):t.value;if(DEF[k]&&DEF[k].zone){const zh=$('[data-zh="'+k+'"]');if(zh)zh.textContent=zoneHint(DEF[k],t.value)}if(k==='latin'){delete draft._nearOk;$('#nearBox').hidden=true;updateHint();gbifCheck()}updateCounts();
  }
});
$('#sortSel').addEventListener('change',e=>{state.sort=e.target.value;updateOverview()});
$('#spSel').addEventListener('change',e=>{selected=e.target.value;selCv='';updateSheet()});
/* Species picker on the species page: type to filter (like the Home search) or open the whole list; sorted by Latin name. */
const spLabel=s=>s.latin+(commonName(s)?' — '+commonName(s):(s.m.en||s.m.sv)?' — '+(s.m.en||s.m.sv):'');
let spAct=-1;
function spPickShow(){const i=$('#spPick');if(!i||document.activeElement===i)return;const s=selected&&bySid.get(selected);i.value=s?spLabel(s)+(selCv?' '+cvQ((s.cvs.find(c=>c.ck===selCv)||{}).cv||''):''):''}
function spPickOpen(q){
  const box=$('#spPickList'),i=$('#spPick');q=String(q||'').trim();
  const hits=species.filter(s=>!q||textHit(s,q)).sort((a,b)=>a.latin.localeCompare(b.latin,'en'));
  box.innerHTML=hits.length?hits.map((s,k)=>{const c=q&&!textHit(Object.assign({},s,{cvs:[]}),q)&&cvHit(s,q),ref=c?s.sid+'--'+c.ck:s.sid,cm=commonName(s)||s.m.en||s.m.sv||'';
    return '<button type="button" role="option" id="spo'+k+'" data-pick="'+esc(ref)+'" aria-selected="'+(s.sid===selected&&!c)+'"><i>'+esc(s.latin)+'</i>'+(c?' <b>'+esc(cvQ(c.cv))+'</b>':'')+(cm?'<small>'+esc(cm)+'</small>':'')+'</button>'}).join('')
    :'<p class="muted" style="margin:6px 10px">'+esc(tr('No species match','Inga arter matchar','Geen soorten gevonden'))+' “'+esc(q)+'”.</p>';
  box.hidden=false;i.setAttribute('aria-expanded','true');if(q)box.scrollTop=0;
  spAct=q?0:hits.findIndex(s=>s.sid===selected);spMark(!q);
}
function spMark(scroll){const bs=$$('#spPickList [data-pick]');bs.forEach((b,k)=>b.classList.toggle('act',k===spAct));const a=bs[spAct];$('#spPick').setAttribute('aria-activedescendant',a?a.id:'');if(a&&scroll!==false)a.scrollIntoView({block:'nearest'})}
function spPickClose(){const box=$('#spPickList');if(!box)return;box.hidden=true;$('#spPick').setAttribute('aria-expanded','false');spAct=-1}
function spPickGo(ref){spPickClose();setSel(ref);try{history.replaceState(null,'','#s-'+ref)}catch(e){}$('#spPick').blur();updateSheet()}
(()=>{const i=$('#spPick');if(!i)return;
  i.addEventListener('focus',()=>{i.select();spPickOpen('')});
  i.addEventListener('input',()=>spPickOpen(i.value));
  i.addEventListener('keydown',e=>{const bs=$$('#spPickList [data-pick]');
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if($('#spPickList').hidden)spPickOpen(i.value);spAct=Math.max(0,Math.min(bs.length-1,spAct+(e.key==='ArrowDown'?1:-1)));spMark()}
    else if(e.key==='Enter'){e.preventDefault();const b=bs[spAct>=0?spAct:0];if(b)spPickGo(b.dataset.pick)}
    else if(e.key==='Escape'){spPickClose();i.blur();spPickShow()}});
  $('#spPickBtn').addEventListener('click',()=>{if($('#spPickList').hidden){i.focus()}else{spPickClose();i.blur();spPickShow()}});
  $('#spPickList').addEventListener('mousedown',e=>e.preventDefault());
  $('#spPickList').addEventListener('click',e=>{const b=e.target.closest('[data-pick]');if(b)spPickGo(b.dataset.pick)});
  i.addEventListener('blur',()=>setTimeout(()=>{if(document.activeElement!==i){spPickClose();spPickShow()}},120));
})();
$('#saveBtn').addEventListener('click',saveForm);
$('#resetBtn').addEventListener('click',resetDraft);
$('#form').addEventListener('submit',e=>e.preventDefault());
$('#obsForm').addEventListener('submit',async e=>{
  e.preventDefault();const s=selected&&bySid.get(selected);if(!s)return;
  const text=$('#obsText').value.trim(),plot=$('#obsPlot').value.trim(),date=$('#obsDate').value||today(),file=$('#obsPhoto').files[0],cv=cvRead('#obsCv','#obsCvNew',s);
  if(!text&&!file){toast(tr('Add a note or a photo.','Lägg till en anteckning eller ett foto.','Voeg een notitie of een foto toe.'),'err');return}
  if(cv===null){toast(tr('Type the cultivar name.','Skriv sortnamnet.','Typ de cultivarnaam.'),'err');return}
  const btn=$('#obsBtn');btn.disabled=true;
  try{
    const photo=file?await uploadPhoto(file):null;
    const doc={sid:s.sid,latin:s.latin,date,plot,text,photo,createdAt:Date.now()};if(cv)doc.cultivar=cv;
    await Data.saveObs(doc);
    $('#obsText').value='';$('#obsPhoto').value='';toast(tr('Observation saved','Observation sparad'));
  }catch(err){toast(errMsg(err),'err')}finally{btn.disabled=false}
});
$('#srcForm').addEventListener('submit',async e=>{
  e.preventDefault();const s=selected&&bySid.get(selected);if(!s)return;
  const supplier=$('#srcName').value.trim(),url=$('#srcUrl').value.trim(),material=$('#srcMat').value,text=$('#srcNote').value.trim();
  if(!supplier&&!url){toast(tr('Add a name or a link.','Ange ett namn eller en länk.'),'err');return}
  const cv=cvRead('#srcCv','#srcCvNew',s);if(cv===null){toast(tr('Type the cultivar name.','Skriv sortnamnet.','Typ de cultivarnaam.'),'err');return}
  if(url&&!safeUrl(url)){toast(tr('That link does not look right.','Länken ser inte rätt ut.'),'err');return}
  const btn=$('#srcBtn');btn.disabled=true;
  try{
    const doc={kind:'source',sid:s.sid,latin:s.latin,date:today(),supplier,url:safeUrl(url),material,text,createdAt:Date.now()};if(cv)doc.cultivar=cv;
    await Data.saveObs(doc);
    ['#srcName','#srcUrl','#srcNote'].forEach(x=>$(x).value='');toast(tr('Source saved','Källa sparad'));
  }catch(err){toast(errMsg(err),'err')}finally{btn.disabled=false}
});
window.addEventListener('hashchange',route);
window.addEventListener('resize',()=>{if(!$('#v-sheet').hidden)fitSheet()});
try{new ResizeObserver(()=>{if(!$('#v-sheet').hidden)fitSheet()}).observe($('#sheetWrap'))}catch(e){}
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#lb').hidden=true;if(e.key==='Enter'&&e.target&&e.target.id==='hq'){e.preventDefault();homeToOverview()}});

/* ---------- sign-in, roles and realtime ---------- */
function stopRealtime(){if(RT&&SB){try{SB.removeChannel(RT)}catch(e){}}RT=null}
function startRealtime(uid){
  stopRealtime();let tm;
  // A change I just saved arrives here too; the save already reloaded everything, so skip that echo.
  const kick=p=>{const r=p&&(p.new||p.old)||{};if((r.updated_by||r.author||r.user_id)===meUid()&&Date.now()-lastLoad<2500)return;clearTimeout(tm);tm=setTimeout(loadAll,350)};
  RT=SB.channel('artblad')
    .on('postgres_changes',{event:'*',schema:'public',table:'entries'},kick)
    .on('postgres_changes',{event:'*',schema:'public',table:'obs'},kick)
    .on('postgres_changes',{event:'*',schema:'public',table:'profiles'},kick)
    .on('postgres_changes',{event:'*',schema:'public',table:'plantings'},kick)
    .on('postgres_changes',{event:'*',schema:'public',table:'lists'},kick)
    .on('postgres_changes',{event:'*',schema:'public',table:'comments'},kick)
    .on('postgres_changes',{event:'*',schema:'public',table:'projects'},kick)
    .on('postgres_changes',{event:'*',schema:'public',table:'project_members'},kick);
  if(uid)RT.on('postgres_changes',{event:'*',schema:'public',table:'favorites',filter:'user_id=eq.'+uid},async()=>{await loadFav(uid);refresh()});
  // Admins (database update v5): flags, marks and Artie requests arrive live. Others receive nothing from these tables.
  if(isAdmin())['review_flags','reviews','review_sections','review_dismissed','autofill_requests'].forEach(t=>RT.on('postgres_changes',{event:'*',schema:'public',table:t},revLive));
  RT.subscribe();
}
function renderAcct(){
  const ma=$('#mAcct');if(ma){const n=SESSION&&SESSION.user?(PROFILES.get(SESSION.user.id)||SESSION.user.email||'?'):'';ma.textContent=n?n.trim().charAt(0).toUpperCase():'…'}
  const el=$('#acct');if(!SB){el.innerHTML='';return}
  el.innerHTML=SESSION&&SESSION.user
    ?'<button type="button" class="who lnk" data-act="set-name" title="'+esc(SESSION.user.email+' · '+trs('Change your username','Ändra ditt användarnamn'))+'">'+esc(PROFILES.get(SESSION.user.id)||SESSION.user.email)+'</button><span class="pill">'+(MYROLE==='admin'?'Admin':MYROLE==='contributor'?tr('Contributor','Bidragsgivare'):tr('View only','Läsläge'))+'</span><button class="btn sm" data-act="signout" type="button">'+tr('Sign out','Logga ut')+'</button>'
    :'<button class="btn sm" data-act="signin" type="button">'+tr('Sign in','Logga in')+'</button>';
}
