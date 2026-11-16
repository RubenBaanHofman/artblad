// Artblad: Labels and language switching.
// Part 4 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- label helpers ---------- */
/* ---------- language ---------- */
// state.lang: 'en' | 'sv' | 'nl' | 'both' (EN+SV). It sets the interface, the data labels, the printed sheets and which name leads.
// 'nl' shows the Dutch interface: Dutch text comes from nl.js (window.ARTBLAD_NL, keyed by the English text),
// or from a third argument for sentences built from numbers or names. Anything missing falls back to English.
const NLD=window.ARTBLAD_NL||{};
const nl=en=>{let v=NLD[en];if(v!=null)return v;const t=String(en==null?'':en).trim();v=NLD[t];if(v==null&&window.__nlMiss&&t)window.__nlMiss.add(t);return v==null?en:String(en).replace(t,v)};
const tr=(en,sv,n)=>state.lang==='sv'?sv:state.lang==='en'?en:state.lang==='nl'?(n!=null?n:nl(en)):en+' · '+sv;
const trh=(en,sv,n)=>state.lang==='sv'?esc(sv):state.lang==='en'?esc(en):state.lang==='nl'?esc(n!=null?n:nl(en)):esc(en)+(sv&&sv!==en?' <em>'+esc(sv)+'</em>':'');
// One language only (English in EN+SV mode).
const trs=(en,sv,n)=>state.lang==='sv'?sv:state.lang==='nl'?(n!=null?n:nl(en)):en;
const labUI=o=>trh(o.en,o.sv);
// Main name: the common name in the chosen language if there is one, otherwise the Latin name.
const commonName=s=>state.lang==='en'?s.m.en:state.lang==='sv'?s.m.sv:state.lang==='nl'?s.m.nl:'';
const dispName=s=>(commonName(s)||s.latin)+(s.isCv?' '+cvQ(s.cv):'');
function names(s){
  const m=s.m,cn=commonName(s),others=[m.en,m.sv,m.nl].filter(x=>x&&x!==cn),cvh=s.isCv?' <span class="cvn">'+esc(cvQ(s.cv))+'</span>':'';
  if(cn)return{main:'<span class="cn">'+esc(cn)+'</span>'+cvh+vmark(s.sid),sub:'<i>'+esc(s.latin)+'</i>'+(others.length?' · '+others.map(esc).join(' · '):'')};
  return{main:esc(s.latin)+cvh+vmark(s.sid),sub:others.map(esc).join(' · ')};
}
const LOC=()=>state.lang==='sv'?'sv':state.lang==='nl'?'nl':'en';
const byName=(a,b)=>dispName(a).localeCompare(dispName(b),LOC());
function applyLang(){
  document.documentElement.lang=LOC();
  $$('[data-t]').forEach(el=>{const p=el.dataset.t.split('|');el.textContent=tr(p[0],p[1],p[2])});
  $$('[data-th]').forEach(el=>{const p=el.dataset.th.split('|');el.innerHTML=trh(p[0],p[1],p[2])});
  $$('[data-tp]').forEach(el=>{const p=el.dataset.tp.split('|');el.placeholder=tr(p[0],p[1],p[2])});
  $$('[data-tab]').forEach(el=>{const p=el.dataset.tab.split('|');el.querySelector('span').textContent=trs(p[0],p[1]);const sm=el.querySelector('small');sm.textContent=p[1];sm.hidden=state.lang!=='both'});
  $$('[data-ta]').forEach(el=>{const p=el.dataset.ta.split('|');el.title=tr(p[0],p[1]);el.setAttribute('aria-label',tr(p[0],p[1]))});
  $$('#langSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===state.lang));
  const ml=$('#mLang');if(ml)ml.textContent=state.lang.toUpperCase();
}
function setLang(l){
  state.lang=l;store.set('ab.lang',l);applyLang();mmenu(false);seasonApply();
  formBuilt=false;if(!$('#v-add').hidden)buildForm();
  buildFilters();refresh();renderAcct();
}
const dots=(n,max)=>{max=max||5;let h='';for(let i=1;i<=max;i++)h+='<i'+(i<=n?' class="on"':'')+'></i>';return '<span class="dots" aria-label="'+(n||0)+' of '+max+'">'+h+'</span>'};
