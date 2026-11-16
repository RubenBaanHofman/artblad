// Artblad: Planting records and comments.
// Part 18 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- planting records ---------- */
const PSTAT=O('alive:Alive:Lever|struggling:Struggling:Kämpar|dead:Dead:Död|removed:Removed:Borttagen|unknown:Unknown:Okänd');
const plState={status:'',place:'',edit:null,kind:''};
const isEnc=p=>p&&p.kind==='encounter';
const plShowEnc=()=>store.get('ab.plenc')!=='0';
const pstatPill=st=>{const o=PSTAT.find(x=>x.k===st)||PSTAT[4];return '<span class="pill pst '+esc(o.k)+'">'+esc(trs(o.en,o.sv))+'</span>'};
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
  el.innerHTML=list.length?list.map(c=>{
    const m=META.get(c.id)||{},who=m.author?(PROFILES.get(m.author)||tr('Someone','Någon')):tr('Someone','Någon'),ed=m.updatedAt&&m.createdAt&&new Date(m.updatedAt)-new Date(m.createdAt)>60000;
    const mine=canEdit(c.id);
    if(cmtState.edit===c.id)return '<div class="cmt" data-cmt="'+esc(c.id)+'"><div class="ch"><b>'+esc(who)+'</b></div><textarea id="cmtEdit" rows="3" maxlength="2000">'+esc(c.text||'')+'</textarea><div class="acts" style="margin-top:6px"><button type="button" class="btn sm primary" data-act="cmt-save" data-id="'+esc(c.id)+'">'+tr('Save','Spara')+'</button><button type="button" class="btn sm" data-act="cmt-cancel">'+tr('Cancel','Avbryt')+'</button></div></div>';
    return '<div class="cmt" data-cmt="'+esc(c.id)+'"><div class="ch"><span><b>'+esc(who)+'</b> · '+esc(fmtDate(c.createdAt||m.createdAt))+(ed?' · '+tr('edited','redigerad'):'')+cvPill(c)+'</span>'+
      (mine?'<span class="acts w-only"><button type="button" class="btn sm" data-act="cmt-edit" data-id="'+esc(c.id)+'">'+tr('Edit','Redigera')+'</button><button type="button" class="btn sm danger" data-act="cmt-del" data-id="'+esc(c.id)+'">'+tr('Delete','Radera')+'</button></span>':'')+
      '</div><p>'+esc(c.text||'')+'</p></div>'}).join(''):'<p class="muted" style="margin:0">'+tr('No comments yet.','Inga kommentarer ännu.')+'</p>';
}
async function cmtPost(s){
  const t=$('#cmtText').value.trim();if(!t){toast(tr('Write something first.','Skriv något först.'),'err');return}
  const p=cur(),doc={sid:s.sid,text:t,createdAt:Date.now()};if(p&&p.isCv&&p.sid===s.sid)doc.cultivar=p.cv;
  try{await Data.saveRow('comments',null,doc);$('#cmtText').value='';toast(tr('Comment posted','Kommentar skickad'))}catch(e){toast(errMsg(e),'err')}
}
async function cmtSave(id){
  const c=(state.comments||[]).find(x=>x.id===id),t=($('#cmtEdit')||{}).value;if(!c||!t||!t.trim())return;
  try{cmtState.edit=null;await Data.saveRow('comments',id,Object.assign({},c,{id:undefined,text:t.trim()}));toast(tr('Comment saved','Kommentar sparad'))}catch(e){toast(errMsg(e),'err')}
}
