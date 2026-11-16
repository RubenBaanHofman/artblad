// Artblad: Loading screen and start-up (runs last).
// Part 22 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- loading screen: the logo grows (spruce, birch, lingonberry), then moves into the header ---------- */
let splashT0=0,namePrompted=false;
function splashStart(){
  const el=$('#splash');if(!el||window.__noSplash)return;
  el.classList.remove('out','go');const lg=el.querySelector('.splogo');lg.style.transform='';
  el.hidden=false;splashT0=0;
  const begin=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{el.classList.add('go');splashT0=Date.now()}));
  // Start the growing only when the page is actually on screen, so nobody misses it.
  if(document.hidden){const v=()=>{if(!document.hidden){document.removeEventListener('visibilitychange',v);begin()}};document.addEventListener('visibilitychange',v)}else begin();
  clearTimeout(splashStart.fail);splashStart.fail=setTimeout(()=>{splashT0=1;splashEnd()},12000);
}
const SPLASH_MS=matchMedia('(prefers-reduced-motion: reduce)').matches?900:3600;
function splashEnd(){
  const el=$('#splash');if(!el||el.hidden)return;
  if(!splashT0){setTimeout(splashEnd,200);return}
  clearTimeout(splashStart.fail);
  const wait=Math.max(0,SPLASH_MS-(Date.now()-splashT0));
  setTimeout(()=>{
    if(el.hidden||el.classList.contains('out'))return;
    const lg=el.querySelector('.splogo'),to=$('.top .brand .bm');
    if(to&&to.getBoundingClientRect().width){
      const a=lg.getBoundingClientRect(),b=to.getBoundingClientRect();
      lg.style.transform='translate('+(b.left-a.left)+'px,'+(b.top-a.top)+'px) scale('+(b.width/a.width)+')';
    }
    el.classList.add('out');
    setTimeout(()=>{el.hidden=true;el.classList.remove('out','go');lg.style.transform=''},650);
  },wait);
}
async function applySession(s){
  const uid=s&&s.user?s.user.id:null;
  if(uid===curUid)return;
  curUid=uid;SESSION=s;
  if(uid)splashStart();else{const sp=$('#splash');if(sp&&!sp.classList.contains('go'))sp.hidden=true}
  const gated=!cfg.PUBLIC_READ&&!uid;
  $('#auth').hidden=!gated;$('#authCancel').hidden=gated;
  if(gated){
    {const sp=$('#splash');if(sp&&!sp.classList.contains('go'))sp.hidden=true}
    stopRealtime();state.entries=[];state.obs=[];state.plantings=[];state.lists=[];state.comments=[];state.trashC=[];state.trashE=[];state.trashO=[];META.clear();PROFILES.clear();MYROLE='viewer';revSet(null);afRows=[];$('#admBody').innerHTML='';$('#revBox').innerHTML='';document.body.classList.remove('admin');CANW=false;ASSETS=null;Fav.ref=null;Fav.loadLocal();loaded=true;
    namePrompted=false;$('#nameBox').hidden=true;document.body.classList.add('ro','nophoto');renderAcct();refresh();splashEnd();return;
  }
  CANW=false;MYROLE='viewer';
  if(uid){try{const r=await SB.rpc('my_role');if(!r.error&&r.data)MYROLE=r.data;else{const q=await SB.rpc('is_editor');if(q.data===true)MYROLE='contributor'}}catch(e){}}
  if(uid&&MYROLE==='viewer'){try{const q=await SB.rpc('is_editor');if(q.data===true)MYROLE='contributor'}catch(e){}}
  CANW=MYROLE==='admin'||MYROLE==='contributor';
  if(uid&&!/^#s-/.test(location.hash||'')){if(location.hash&&location.hash!=='#home')location.hash='home';else show('home')}
  document.body.classList.toggle('admin',MYROLE==='admin');
  ASSETS=CANW?PHOTOS:null;
  document.body.classList.toggle('ro',!CANW);document.body.classList.toggle('nophoto',!ASSETS);
  if(uid){
    Fav.ref={set:async d=>{const r=await SB.from('favorites').upsert({user_id:uid,sids:d.sids,updated_at:new Date().toISOString()});if(r.error)throw r.error}};
    await loadFav(uid);
  }else{Fav.ref=null;Fav.loadLocal()}
  renderAcct();
  await loadAll();startRealtime(uid);
  splashEnd();
  if(uid&&CANW&&!PROFILES.get(uid)&&!namePrompted){namePrompted=true;openName(true)}
}
$('#authForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!SB)return;
  const btn=$('#authBtn'),msg=$('#authMsg');btn.disabled=true;msg.textContent='';
  try{
    const r=await SB.auth.signInWithPassword({email:$('#authEmail').value.trim(),password:$('#authPw').value});
    if(r.error)throw r.error;$('#authPw').value='';
  }catch(err){
    const m=(err&&err.message)||'';
    msg.textContent=/invalid login credentials/i.test(m)?tr('Wrong email or password, or this account has no password.','Fel e-post eller lösenord, eller så saknar kontot lösenord.')
      :/api key|apikey/i.test(m)?'The Supabase key in config.js is wrong or was not saved. ('+m+')'
      :/failed to fetch|network|load failed/i.test(m)?'Cannot reach Supabase. Check the Project URL in config.js. ('+m+')'
      :(m||'Could not sign in.');
  }
  finally{btn.disabled=false}
});
$('#authCancel').addEventListener('click',()=>{$('#auth').hidden=true});

/* ---------- init ---------- */
// The header height (--hh) places the shortcut strip right under the header; nothing sits at the bottom except Save/Clear on the Add page.
function dockSize(){const d=$('#dock'),t=$('header.top');if(t)document.documentElement.style.setProperty('--hh',t.getBoundingClientRect().height+'px');if(!d||!d.offsetHeight)return;document.documentElement.style.setProperty('--dockh','0px')}
// Phone menu (language and account) behind the round buttons in the header.
function mmenu(open){document.body.classList.toggle('mmenu',open);$$('[data-act=mmenu]').forEach(b=>b.setAttribute('aria-expanded',open))}
document.addEventListener('click',e=>{if(document.body.classList.contains('mmenu')&&!e.target.closest('.hdr-r,[data-act=mmenu]'))mmenu(false)},true);
addEventListener('resize',dockSize);addEventListener('load',dockSize);
(async function init(){
  const sty=document.createElement('style');sty.textContent=SHEET_CSS;document.head.appendChild(sty);
  $('#obsDate').value=today();
  Fav.loadLocal();
  {const d=$('#dock'),t=$('header.top');if(d&&t)t.after(d)}
  pickLoad();
  seasonApply();dispApply();if(window.__noSplash){const sp=$('#splash');if(sp)sp.hidden=true}
  if(window.__noSplash)window.__ab={REV,bySid:()=>bySid};  // test hook (tests set __noSplash)
  {const pa=$('#pickAdv');if(pa)pa.addEventListener('toggle',()=>{advState.open=pa.open})}
  applyLang();buildFilters();route();updateOverview();dockSize();
  const bn=$('#banner');
  if(!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY||/your-/i.test(String(cfg.SUPABASE_URL)+String(cfg.SUPABASE_ANON_KEY))||!window.supabase){
    {const sp=$('#splash');if(sp)sp.hidden=true}
    bn.hidden=false;bn.textContent='Not connected to a database yet. Add your Supabase details to config.js. Until then, entries stay in memory and disappear when you reload.';
    document.body.classList.add('nophoto');loaded=true;refresh();return;
  }
  if(/(^|\.)supabase\.com$/i.test(String(cfg.SUPABASE_URL).replace(/^https?:\/\//,'').split('/')[0])){
    bn.hidden=false;bn.textContent='The address in config.js is the Supabase website, not your Project URL. Use the one that looks like https://abcdefgh.supabase.co.';loaded=true;refresh();return;
  }
  SB=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
  SB.auth.onAuthStateChange((ev,s)=>{setTimeout(()=>applySession(s),0)});
  const r=await SB.auth.getSession();
  await applySession(r.data&&r.data.session);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&SB&&(curUid||cfg.PUBLIC_READ))loadAll()});
})();
