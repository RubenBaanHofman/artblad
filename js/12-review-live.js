// Artblad: Install on home screen; section marks, dismissed problems, live updates for admins.
// Part 12 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- install on the home screen ---------- */
let installEvt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;const b=$('#installBtn');if(b)b.hidden=false});

/* ---------- version 2.4.2: section marks, dismissed problems, live updates for admins (setup/v5_live_sections.sql) ---------- */
// APP_VERSION lives in 01-core.js.
// The sheet's sections for verification. Literature sources have their own mark, which also goes grey after two years.
const RSECS=[{id:'ident',en:'Names & photo',sv:'Namn & foto',f:['latin','en','sv','nl','family','type','status','photo']}]
  .concat(SEC.map(x=>({id:x.id,en:x.en,sv:x.sv,f:x.f.map(d=>d.k).filter(k=>k!=='sources')})))
  .concat([{id:'sources',en:'Sources',sv:'Källor',f:['sources']}]);
const RSEC_BY=Object.fromEntries(RSECS.map(x=>[x.id,x]));
const SRC_DAYS=730;
const secName=id=>{const x=RSEC_BY[id];return x?tr(x.en,x.sv,nl(x.en)):id};
// Section marks for one species: Map section -> {at,by,chg,stale,old}
function revSecCompute(){
  REV.sec=new Map();if(!REV.v5)return;
  const want=new Set(REV.smarks.keys());if(!want.size)return;
  const bySidE=new Map(),add=(e,live)=>{if(!want.has(e.sid))return;(bySidE.get(e.sid)||bySidE.set(e.sid,[]).get(e.sid)).push({e,live,m:META.get(e.id)||{}})};
  (state.entries||[]).forEach(e=>add(e,true));(state.trashE||[]).forEach(e=>add(e,false));
  const ord=(a,b)=>(a.date||'').localeCompare(b.date||'')||(a.createdAt||0)-(b.createdAt||0);
  REV.smarks.forEach((marks,sid)=>{
    const list=bySidE.get(sid)||[],out=new Map(),nowM=mergeEntries(list.filter(x=>x.live).map(x=>x.e).sort(ord)).m;
    marks.forEach((r,sec)=>{
      const at=new Date(r.at);let chg=null;
      // Since 2.5.1 any edit after the mark counts, also by an admin (the whole-species mark still ignores admin edits).
      const late=x=>new Date(x.m.updatedAt||x.m.createdAt||0)>at;
      const gone=x=>!x.live&&x.m.deletedAt&&new Date(x.m.deletedAt)>at;
      let stale=false;
      if(list.some(x=>late(x)||gone(x))){
        const before=mergeEntries(list.filter(x=>(x.live&&!late(x))||gone(x)).map(x=>x.e).sort(ord)).m;
        const ks=(RSEC_BY[sec]||{f:[]}).f.filter(k=>!sameVal(before[k],nowM[k]));
        if(ks.length){stale=true;list.forEach(x=>{if(late(x)||gone(x)){const t=x.m.updatedAt||x.m.createdAt;if(!chg||new Date(t)>new Date(chg.at))chg={at:t,by:x.m.updatedBy,ks}}})}
      }
      const old=sec==='sources'&&Date.now()-at.getTime()>SRC_DAYS*864e5;
      out.set(sec,Object.assign({},r,{chg,stale:stale||old,old}));
    });
    REV.sec.set(sid,out);
  });
}
const secState=(sid,sec)=>{const m=REV.sec.get(sid);return m&&m.get(sec)||null};
function secTitle(r,sec){
  if(!r)return secName(sec)+': '+tr('not verified','inte verifierad','niet geverifieerd');
  return secName(sec)+': '+tr('verified ','verifierad ','geverifieerd ')+fmtDate(r.at)+' '+tr('by ','av ','door ')+who(r.by)+
    (r.old?' · '+tr('more than two years ago: check the sources again','för mer än två år sedan: kontrollera källorna igen','meer dan twee jaar geleden: controleer de bronnen opnieuw'):'')+
    (r.chg?' · '+tr('changed since by ','ändrad sedan dess av ','sindsdien gewijzigd door ')+who(r.chg.by)+' ('+fmtDate(r.chg.at)+')':'');
}
// Small mark next to a section heading on the species card (admins only, only when the section has a mark).
function smark(sid,sec){
  if(!REV.v5||!isAdmin())return '';const r=secState(sid,sec);if(!r)return '';const t=secTitle(r,sec);
  return ' <span class="vmk smk'+(r.stale?' stale':'')+'" role="img" title="'+esc(t)+'" aria-label="'+esc(t)+'">'+SVG_VMK+'</span>';
}
// The row of section chips in the admin box on the species page. Click: verify (again); a green chip asks before removing.
function secChipsHTML(s){
  if(!REV.v5)return '';
  const n=RSECS.filter(x=>{const r=secState(s.sid,x.id);return r&&!r.stale}).length;
  return '<div class="secmarks"><b>'+esc(tr('Sections','Avsnitt','Onderdelen'))+' ('+n+'/'+RSECS.length+')</b><span class="secchips">'+RSECS.map(x=>{const r=secState(s.sid,x.id),cl=r?(r.stale?' stale':' ok'):'';
    return '<button type="button" class="secchip'+cl+'" data-act="sec-mark" data-sec="'+x.id+'" title="'+esc(secTitle(r,x.id)+' · '+(r&&!r.stale?tr('click twice to remove the mark','klicka två gånger för att ta bort markeringen','twee keer klikken om de markering te verwijderen'):tr('click to mark as verified','klicka för att markera som verifierad','klik om als geverifieerd te markeren')))+'">'+(r?SVG_VMK:'<i class="sc0"></i>')+'<span>'+esc(secName(x.id))+'</span></button>'}).join('')+'</span>'+
    '<small class="muted">'+esc(tr('Green: verified. Grey: changed since by someone who is not an admin (sources also after two years). Verifying the whole species marks every section.','Grön: verifierad. Grå: ändrad sedan dess av någon som inte är admin (källor även efter två år). Att verifiera hela arten markerar alla avsnitt.','Groen: geverifieerd. Grijs: sindsdien gewijzigd door iemand die geen beheerder is (bronnen ook na twee jaar). De hele soort verifiëren markeert alle onderdelen.'))+'</small></div>';
}
async function secToggle(a,s){
  const sec=a.dataset.sec,r=secState(s.sid,sec);
  if(r&&!r.stale){
    if(!a.dataset.armed){a.dataset.armed='1';a.classList.add('armed');const sp=a.querySelector('span');a.dataset.label=sp.textContent;sp.textContent=tr('Remove?','Ta bort?','Verwijderen?');
      a._t=setTimeout(()=>{delete a.dataset.armed;a.classList.remove('armed');sp.textContent=a.dataset.label},4000);return}
    clearTimeout(a._t);return revCall('unmark_section',{p_sid:s.sid,p_section:sec},tr('Mark removed: ','Markering borttagen: ','Markering verwijderd: ')+secName(sec));
  }
  try{const q=await SB.rpc('mark_section',{p_sid:s.sid,p_section:sec});if(q.error)throw q.error;
    await loadReview();
    // When every section is now green, the whole species counts as verified too.
    const all=RSECS.every(x=>{const v=secState(s.sid,x.id);return v&&!v.stale}),full=REV.st.get(s.sid);
    if(all&&(!full||full.stale||full.chg)){const q2=await SB.rpc('mark_reviewed',{p_sid:s.sid});if(q2.error)throw q2.error;await loadReview();toast(tr('All sections verified: the species is marked as verified.','Alla avsnitt verifierade: arten är markerad som verifierad.','Alle onderdelen geverifieerd: de soort is als geverifieerd gemarkeerd.'))}
    else toast(tr('Verified: ','Verifierad: ','Geverifieerd: ')+secName(sec));
    refresh();
  }catch(e){toast(errMsg(e),'err')}
}
function secCounts(){
  let ok=0,part=0,old=0;
  species.forEach(s=>{const m=REV.sec.get(s.sid);if(!m)return;let g=0;m.forEach((r,k)=>{if(!r.stale)g++;if(k==='sources'&&r.old)old++});ok+=g;const f=REV.st.get(s.sid);if(g&&g<RSECS.length&&!(f&&!f.stale))part++});
  return{ok,tot:species.length*RSECS.length,part,old};
}

/* dismissed possible problems */
const ckHash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36)};
const isDismissed=(sid,key)=>{const m=REV.dis.get(sid);return !!(m&&m.has(key))};
const liveChecks=s=>checksOf(s).filter(c=>!isDismissed(s.sid,c.key));
const dismissedChecks=s=>checksOf(s).filter(c=>isDismissed(s.sid,c.key));
const disBtn=(sid,c)=>REV.v5?' <button type="button" class="lnk disbtn" data-act="chk-dismiss" data-sid="'+esc(sid)+'" data-key="'+esc(c.key)+'" title="'+esc(tr('Not a problem: hide this warning for this species','Inget problem: dölj varningen för den här arten','Geen probleem: deze waarschuwing voor deze soort verbergen'))+'">'+esc(tr('Dismiss','Avfärda','Negeren'))+'</button>':'';
const undoBtn=(sid,c)=>' <button type="button" class="lnk disbtn" data-act="chk-undo" data-sid="'+esc(sid)+'" data-key="'+esc(c.key)+'">'+esc(tr('Bring back','Ta tillbaka','Terugzetten'))+'</button>';
function probListHTML(s){
  const ck=liveChecks(s),dn=REV.v5?dismissedChecks(s):[];if(!ck.length&&!dn.length)return '';
  return '<div class="revflags"><b>'+esc(tr('Possible problems','Möjliga problem','Mogelijke problemen'))+' ('+ck.length+')</b>'+(ck.length?'<ul class="probs">'+ck.map(c=>'<li>'+esc(c.txt)+disBtn(s.sid,c)+'</li>').join('')+'</ul>':'')+
    (dn.length?'<details class="disd"><summary>'+esc(dn.length+' '+tr('dismissed','avfärdade','genegeerd'))+'</summary><ul class="probs">'+dn.map(c=>'<li class="muted">'+esc(c.txt)+undoBtn(s.sid,c)+'</li>').join('')+'</ul></details>':'')+'</div>';
}
async function chkCall(name,a){
  try{const q=await SB.rpc(name,{p_sid:a.dataset.sid,p_key:a.dataset.key});if(q.error)throw q.error;
    toast(name==='dismiss_check'?tr('Warning dismissed for this species.','Varningen avfärdad för den här arten.','Waarschuwing genegeerd voor deze soort.'):tr('Warning brought back.','Varningen är tillbaka.','Waarschuwing teruggezet.'));
    await loadReview();refresh()}catch(e){toast(errMsg(e),'err')}
}

/* live updates for admins: new flags, marks and Artie requests arrive without reloading */
let rvT=0;
async function loadAdminLive(){
  if(!SB||!isAdmin())return;
  const [a,b]=await Promise.all([SB.rpc('review_state').then(x=>x,e=>({error:e})),SB.from('autofill_requests').select('sid,latin,n,status,first_requested_at,last_requested_at,sent_at').order('first_requested_at').then(x=>x,e=>({error:e}))]);
  if(a&&!a.error)revSet(a.data);if(b&&!b.error)afRows=b.data||[];
  refresh();
}
function revLive(p){
  const r=p&&p.new||{},ev=p&&p.eventType;
  if(ev==='INSERT'&&p.table==='review_flags'&&r.flagged_by!==meUid())toast(tr('New flag: ','Ny flagga: ','Nieuwe melding: ')+(r.latin||r.sid||''));
  if(ev==='INSERT'&&p.table==='autofill_requests')toast(tr('New request for Artie: ','Ny förfrågan till Artie: ','Nieuwe aanvraag voor Artie: ')+(r.latin||r.sid||''));
  clearTimeout(rvT);rvT=setTimeout(loadAdminLive,400);
}

/* cultivars compared, on the back of the printed card */
function monthsTxt(v,lang){
  const a=[].concat(v||[]).map(Number).filter(x=>x>=1&&x<=12).sort((x,y)=>x-y);if(!a.length)return '';
  const nm=i=>lang!=='sv'&&lang!=='nl'?MONTH_NAMES[i-1]:new Date(2001,i-1,1).toLocaleDateString(lang==='sv'?'sv-SE':lang==='nl'?'nl-NL':'en-GB',{month:'short'}).replace('.','');
  const runs=[];a.forEach(x=>{const l=runs[runs.length-1];if(l&&x===l[1]+1)l[1]=x;else runs.push([x,x])});
  return runs.map(r=>r[0]===r[1]?nm(r[0]):nm(r[0])+'–'+nm(r[1])).join(', ');
}
function sheetCv(s,lang){
  if(!s||!s.cvs||!s.cvs.length)return '';
  const keys=Object.keys(DEF).filter(k=>!CV_SKIP[k]&&SPECIES_ONLY.indexOf(k)<0&&s.cvs.some(c=>!isEmpty(c.own[k]))&&(!DEF[k].only||DEF[k].only===s.form));
  const order=Object.keys(DEF);keys.sort((a,b)=>order.indexOf(a)-order.indexOf(b));
  const L=(en,sv)=>esc(lang==='sv'?sv:lang==='nl'?nl(en):en),dash='–',lg=lang==='both'?'en':lang;
  const lab=k=>DEF[k].t==='cal'?L(CAL_LAB[k][s.form][0],CAL_LAB[k][s.form][1]):L(DEF[k].en,DEF[k].sv);
  const val=(x,k)=>{const v=x.m[k];if(isEmpty(v))return dash;if(DEF[k].t==='cal')return esc(monthsTxt(v,lg));if(DEF[k].t==='scale')return Number(v)===0&&k==='edibility'?L('Inedible','Oätlig'):esc(v+'/5');return esc(vtl(DEF[k],v,s.form,lg))};
  const rows=[s].concat(s.cvs),PER_C=6;
  const kc=keys.length?[]:[[]];for(let i=0;i<keys.length;i+=PER_C)kc.push(keys.slice(i,i+PER_C));
  return kc.map(ks=>fitPages(rows,rs=>'<section class="sheet back tblp'+(s.form==='w'?'':' herb')+'"><div class="band"><span>'+L('CULTIVARS COMPARED','SORTERNA JÄMFÖRDA')+'</span><small><i>'+esc(s.latin)+'</i> · '+esc(s.no)+'</small></div><div class="gwrap"><table class="gtab"><thead><tr><th scope="col">'+L('Cultivar','Sort')+'</th>'+
    (ks.length?ks.map(k=>'<th scope="col">'+lab(k)+'</th>').join(''):'<th></th>')+'</tr></thead><tbody>'+
    rs.map(x=>'<tr'+(x.isCv?'':' class="me"')+'><td>'+(x.isCv?esc(cvQ(x.cv)):'<i>'+L('Species','Arten')+'</i>')+'</td>'+(ks.length?ks.map(k=>{const own=x.isCv&&!isEmpty(x.own[k]);return '<td'+(x.isCv&&!own?' class="inh"':own?' class="own"':'')+'>'+val(x,k)+'</td>'}).join(''):'<td>'+L('All cultivars follow the species.','Alla sorter följer arten.')+'</td>')+'</tr>').join('')+
    '</tbody></table><p class="gnote">'+L('Bold: the cultivar’s own value. Grey: follows the species.','Fetstil: sortens eget värde. Grått: följer arten.')+'</p></div></section>',13)).join('');
}

// The page (index.html) carries its own version number; if it differs, files from two versions are mixed (row 4, since 2.5.1).
let VERSION_MIX=null;
{const av=document.getElementById('appVer');if(av){const hv=av.textContent.trim();if(hv&&hv!==APP_VERSION)VERSION_MIX=hv;av.textContent=APP_VERSION}}
