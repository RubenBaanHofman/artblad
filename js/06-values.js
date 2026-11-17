// Artblad: Value text in the chosen language.
// Part 6 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- value text in the chosen language ---------- */
const MON_SV=['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
const MON_NL=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
function vtl(d,v,form,lang){
  const pick=o=>lang==='sv'?o.sv:lang==='en'?o.en:lang==='nl'?nl(o.en):o.en+' / '+o.sv;
  if(Array.isArray(v)){
    if(d.t==='cal')return v.slice().sort((a,b)=>a-b).map(n=>lang==='sv'?MON_SV[n-1]:lang==='nl'?MON_NL[n-1]:MONTH_NAMES[n-1]).join(', ');
    const o=optsOf(d,form);return v.map(k=>{const x=o.find(z=>z.k===k);return x?pick(x):k}).join(', ');
  }
  if(d.t==='single'){const x=optsOf(d,form).find(z=>z.k===v);return x?pick(x):String(v)}
  if(d.t==='scale')return d.none&&Number(v)===0?(lang==='sv'?d.none[1]:lang==='nl'?nl(d.none[0]):d.none[0]):v+'/5';
  if(d.t==='num'){if(LEN_KEYS.indexOf(d.k)>=0)return fmtLen(v);const u=unitOf(d,form);return v+(u?' '+u:'')}
  return String(v);
}
const SIC={
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>',
  part:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="7"/><path d="M12 5a7 7 0 0 1 0 14z" fill="currentColor"/></svg>',
  shade:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5" fill="currentColor"/></svg>',
  drop:'<svg viewBox="0 0 24 24"><path d="M12 3c3 4.5 6 7.8 6 11a6 6 0 0 1-12 0c0-3.2 3-6.5 6-11z" fill="currentColor"/></svg>',
  dropo:'<svg viewBox="0 0 24 24"><path d="M12 3c3 4.5 6 7.8 6 11a6 6 0 0 1-12 0c0-3.2 3-6.5 6-11z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>'
};
function sheetHead(s,lang,src,band){
  const m=s.m,w=s.form==='w',L=(en,sv)=>esc(lang==='sv'?sv:lang==='en'?en:lang==='nl'?nl(en):en+' · '+sv);
  const typeO=TYPES_ALL.find(o=>o.k===m.type),statO=null/* species Status retired in 2.7.0 */,invO=INV.find(o=>o.k===m.invasive);
  const cn=lang==='sv'?m.sv:lang==='en'?m.en:lang==='nl'?m.nl:'';const main=cn||s.latin;
  const others=[m.en,m.sv,m.nl].filter(x=>x&&x!==main);
  const pic=s.cover&&src(s.cover)?'<img src="'+src(s.cover)+'" alt="">':phIcon(s);
  const v=m.verdict?'<span class="dots">'+'●'.repeat(m.verdict)+'<span style="opacity:.25">'+'●'.repeat(5-m.verdict)+'</span></span>':'';
  return '<div class="band2"><span>'+(typeO?L(typeO.en,typeO.sv).toUpperCase():(w?L('Woody plant','Vedartad växt'):L('Herbaceous plant','Örtartad växt')).toUpperCase())+'</span><span>SKOGSTRÄDGÅRDENS ARTBLAD · '+esc(s.no)+'</span></div>'+
    '<div class="hd"><div class="pic">'+pic+'</div><div style="min-width:0"><div class="nm1"'+(cn?'':' style="font-style:italic"')+'>'+esc(main)+(m.cultivar?' ‘'+esc(m.cultivar)+'’':'')+'</div>'+
    '<div class="nm2">'+(cn?'<i>'+esc(s.latin)+'</i>'+(others.length?' · ':''):'')+others.map(esc).join(' · ')+(m.family?' · '+esc(m.family):'')+'</div>'+
    '<div class="tags">'+(statO?'<span class="tag soft">'+L(statO.en,statO.sv)+'</span>':'')+(v?'<span class="tag soft">'+L('Use it?','Använda?')+' '+v+'</span>':'')+(invO&&invO.k!=='none'?'<span class="tag">'+L('Invasive risk','Invasionsrisk')+': '+L(invO.en,invO.sv)+'</span>':'')+'</div></div>'+
    '<div class="qrw">'+qrSvg(speciesUrl(s))+L('Scan for the latest version','Skanna för senaste versionen')+'</div></div>';
}
// Card layout: the same sections as the species page (year wheel, layer diagram, pills), only what is filled in.
// The text size steps down until everything fits on the A5 page (measured in a hidden sheet).
function sheetCard(s,lang,src){
  const html=z=>sheetCardHTML(s,lang,src,z);
  if(!document.body)return html('z1');
  const host=document.createElement('div');host.setAttribute('aria-hidden','true');host.style.cssText='position:absolute;left:-10000px;top:0;visibility:hidden';document.body.appendChild(host);
  try{for(const z of ['zxl','zl','','z1','z2','z3']){host.innerHTML=html(z);const b=host.querySelector('.bd');if(!b||(b.scrollWidth<=b.clientWidth+1&&b.scrollHeight<=b.clientHeight+1))return html(z)}return html('z4')}
  finally{host.remove()}
}
function sheetCardHTML(s,lang,src,z){
  const m=s.m,w=s.form==='w',L=(en,sv)=>esc(lang==='sv'?sv:lang==='en'?en:lang==='nl'?nl(en):en+' · '+sv);
  const P=(opts,k)=>{const a=[].concat(m[k]==null?[]:m[k]),h=opts.filter(o=>a.indexOf(o.k)>=0);return h.length?'<div class="pl">'+h.map(o=>'<span>'+(k==='light'&&SIC[o.k]?SIC[o.k]:'')+L(o.en,o.sv)+'</span>').join('')+'</div>':''};
  const KV=(en,sv,v)=>v?'<div class="pkv"><u>'+L(en,sv)+'</u><b>'+v+'</b></div>':'';
  const T=k=>m[k]?esc(m[k]):'',N=(k,u)=>m[k]!=null&&m[k]!==''?(LEN_KEYS.indexOf(k)>=0?esc(fmtLen(m[k])):esc(m[k])+' '+(u||unitOf(DEF[k],s.form)||'')):'';
  const DD=n=>'<span class="pdd">'+[1,2,3,4,5].map(i=>'<i'+(i<=n?' class="on"':'')+'></i>').join('')+'</span>';
  const size=esc(fmtSize(m.height,m.spread));
  const nat=esc(fmtSize(m.nativeH,m.nativeW));
  const pv=provenOf(s),zones=[m.usda&&'USDA '+esc(m.usda),m.szone&&'SE '+esc(m.szone),m.rhs&&'RHS '+esc(m.rhs)].filter(Boolean).join(' · ');
  const calRows=['cal1','cal2','cal3','cal4'].filter(k=>(m[k]||[]).length);
  const wheel=calRows.length?'<div class="pwh">'+yearWheel(s,0,true)+'<div class="pwl">'+calRows.map(k=>'<span><i style="background:'+CAL_COL[k]+'"></i>'+L(CAL_LAB[k][s.form][0],CAL_LAB[k][s.form][1])+': '+esc(monthsTxt(m[k],lang==='both'?'en':lang))+'</span>').join('')+'</div></div>':'';
  const planted=s.plantings&&s.plantings.length?esc(plSummary(s.plantings).replace(/^[^:]*: /,'')):'';
  const blocks=[
   ['Origin','Ursprung',P(REGIONS,'region')+KV('Native size','Naturlig storlek',nat)+KV('Habitat','Miljö',T('habitat'))+P(SUCC,'succession')+KV('Notes','Anm.',T('range'))],
   ['Size & form','Storlek & form',P(O('annual:Can be grown as an annual:Kan odlas som ettårig'),'asAnnual')+KV('Size','Storlek',size)+KV('Spacing','Avstånd',N('spacing'))+P(w?CROWN:HABIT,w?'crown':'habit')+P(w?ROOTS_W:ROOTS_H,'roots')+P(w?LEAF:DORM,w?'leaf':'dormant')+KV('Lifespan','Livslängd',N('lifespan'))+KV(w?'First yield':'Sow→harvest',w?'Första skörd':'Sådd→skörd',w?N('firstYield'):N('sowHarvest'))+KV('Product','Produkt',T('product'))],
   ['Site','Plats',(pv?KV('Proven hardy','Bevisat härdig',esc(provenTxt(pv))):'')+P(LIGHT,'light')+(m.moist?KV('Moisture','Fukt',DD(m.moist)+' '+L('dry→wet','torr→blöt')):'')+P(SOIL,'soil')+P(PH,'ph')+P(TOL,'tol')+KV('Zones','Zoner',zones)],
   ['Calendar & care','Kalender & skötsel',wheel+P(w?PROP_W:PROP_H,'prop')+P(w?POLL:SOWING,w?'poll':'sowing')+P(EFFORT,'effort')+P(ESTAB,'estab')+KV('Watch-outs','Se upp',T('watch'))],
   ['Uses','Användning',P(w?USES_W:USES_H,'uses')+P(YIELD,'yield')+KV('Edibility','Ätlighet',isEmpty(m.edibility)?'':Number(m.edibility)===0?L('Inedible','Oätlig'):DD(m.edibility))+KV('Edible / notes','Ätligt',T('edible'))],
   ['Ecosystem functions','Ekosystemfunktioner',P(w?ECO_W:ECO_H,'eco')+KV('Notes','Anm.',T('ecoNotes'))],
   ['Placement','Placering',layerDiagram(s,true)+P(LAYER,'layer')+P(ROLE,'role')+P(STRUCT,'struct')+KV('Good with','Passar med',T('goodWith'))+KV('Avoid near','Undvik nära',T('avoid'))],
   ['Cautions & sources','Varningar & källor',P(CAUT,'caut')+KV('Sources','Källor',T('sources'))+KV('Planted','Planterad',planted)+KV('Get it from','Finns hos',s.src&&s.src.length?s.src.slice(0,3).map(o=>esc(o.supplier||'')).filter(Boolean).join(', '):'')]
  ];
  const filled=blocks.filter(b=>b[2].trim()),missing=blocks.filter(b=>!b[2].trim()).map(b=>L(b[0],b[1]));
  const head=sheetHead(s,lang,src).replace('<div class="tags">','<div class="tags">'+pictos(s,8).replace(/class="pics"/,'class="pis"').replace(/class="pic"/g,'class="pi"'));
  return '<section class="acs pc'+(w?'':' herb')+(z?' '+z:'')+'">'+head+
    '<div class="bd">'+(filled.length?filled.map(b=>'<section class="bk"><h4>'+L(b[0],b[1])+'</h4>'+b[2]+'</section>').join(''):'<span class="none">'+L('Nothing recorded yet.','Inget registrerat ännu.')+'</span>')+'</div>'+
    '<div class="ft"><span>'+(missing.length?L('Not yet filled','Saknas')+': '+missing.join(', '):'')+'</span><span>'+L('Updated','Uppdaterad')+' '+esc(s.updatedDate||'')+'</span></div></section>';
}
function sheetList(s,lang,src){
  const m=s.m,w=s.form==='w',L=(en,sv)=>esc(lang==='sv'?sv:lang==='en'?en:lang==='nl'?nl(en):en+' · '+sv);
  const skip=['en','sv','nl','cultivar','status','photo','type','verdict','invasive','family'];
  const secs=SEC.map(sec=>{const rows=sec.f.filter(d=>(!d.only||d.only===s.form)&&skip.indexOf(d.k)<0&&!isEmpty(m[d.k])).map(d=>{
      const lab=d.t==='cal'?CAL_LAB[d.k][s.form]:[d.en,d.sv||d.en];
      return '<div><u>'+L(lab[0],lab[1])+':</u> '+esc(vtl(d,m[d.k],s.form,lang))+'</div>'}).join('');
    return rows?'<h5>'+L(sec.en,sec.sv)+'</h5>'+rows:''}).join('');
  return '<section class="acs sl'+(w?'':' herb')+'">'+sheetHead(s,lang,src)+'<div class="lst">'+(secs||'<span class="none">'+L('Nothing recorded yet.','Inget registrerat ännu.')+'</span>')+'</div>'+
    '<div class="ft"><span>'+L('Only filled-in facts are shown.','Endast ifyllda uppgifter visas.')+'</span><span>'+L('Updated','Uppdaterad')+' '+esc(s.updatedDate||'')+'</span></div></section>';
}
// Layouts: Card (only what is filled in) and Form (every option, for filling in by hand). sheetList is kept but not offered.
function sheetFor(s,lang,src){return state.layout==='form'?sheetFront(s,lang,src):sheetCard(s,lang,src)}
const wantBack=s=>state.withLog&&(state.layout==='form'||s.obs.length>0);

function sheetFront(s,lang,src){
  const m=s.m,w=s.form==='w',L=(en,sv)=>lang==='en'?esc(en):lang==='sv'?esc(sv):lang==='nl'?esc(nl(en)):esc(en)+'<s>'+esc(sv)+'</s>';
  const sel=(k,o)=>{const v=m[k];return Array.isArray(v)?v.indexOf(o.k)>=0:v===o.k};
  const C=(o,on)=>'<span class="c'+(on?' on':'')+'"><i></i><span class="t">'+L(o.en,o.sv)+'</span></span>';
  const G=(k,opts,n)=>'<div class="cg" style="--n:'+n+'">'+opts.map(o=>C(o,sel(k,o))).join('')+'</div>';
  const F=(en,sv,val,unit,wt,cls)=>'<div class="fl'+(cls?' '+cls:'')+'" style="--w:'+(wt||1)+'"><u>'+L(en,sv)+'</u><b>'+esc(val==null?'':val)+'</b>'+(unit?'<u>'+unit+'</u>':'')+'</div>';
  const LR=(en,sv,inner)=>'<div class="lr"><u>'+L(en,sv)+'</u>'+inner+'</div>';
  const H=(en,sv)=>'<h4>'+esc((lang==='nl'?nl(en):en).toUpperCase())+(lang==='en'||lang==='nl'?'':'<s>'+esc(sv)+'</s>')+'</h4>';
  const U=k=>unitOf(DEF[k],s.form);
  const types=w?TYPES_W:TYPES_H, ent=s.entries.length;
  const pic=s.cover&&src(s.cover)?'<img src="'+src(s.cover)+'" alt="">':'Photo<br>Foto';
  const dd=(n,max)=>{let h='';for(let i=1;i<=max;i++)h+='<i'+(i<=n?' class="on"':'')+'></i>';return '<span class="dd">'+h+'</span>'};
  const mo=k=>'<u>'+L(CAL_LAB[k][s.form][0],CAL_LAB[k][s.form][1])+'</u>'+MONTHS.map((_,i)=>'<span class="mo'+((m[k]||[]).indexOf(i+1)>=0?' on':'')+'"></span>').join('');
  const ocr=SEC[1].f;
  const b1='<div class="bx">'+H('1 Origin & native form','Ursprung')+
    LR('Region','Region',G('region',REGIONS,3))+LR('Succession','Succession',G('succession',SUCC,3))+
    F('Native habitat','Miljö',m.habitat)+'<div class="two">'+F('Native H','Höjd',fmtLen(m.nativeH))+F('Native W','Bredd',fmtLen(m.nativeW))+'</div>'+F('Range / notes','Utbredning',m.range)+'</div>';
  const b2='<div class="bx">'+H('2 Size & form','Storlek & form')+
    G(w?'crown':'habit',w?CROWN:HABIT,w?3:4)+
    '<div class="two">'+F('Height','Höjd',fmtLen(m.height))+F('Spread','Bredd',fmtLen(m.spread))+(w?'':F('Spacing','Avstånd',fmtLen(m.spacing)))+'</div>'+
    LR('Roots','Rötter',G('roots',w?ROOTS_W:ROOTS_H,4))+
    (w?LR('Foliage','Lövverk',G('leaf',LEAF,3)):LR('Dormant','Vilar',G('dormant',DORM,3)))+
    '<div class="two">'+F('Lifespan','Livslängd',m.lifespan,'yr')+(w?F('First yield','Första skörd',m.firstYield,'yr'):F('Sow→harvest','Sådd→skörd',m.sowHarvest,'d'))+'</div>'+F('Main product','Produkt',m.product)+'</div>';
  const moist='<div class="cg" style="--n:5">'+[1,2,3,4,5].map(n=>'<span class="c'+(m.moist===n?' on':'')+'"><i></i><span class="t">'+(n===1?L('dry','torr'):n===5?L('wet','blöt'):n)+'</span></span>').join('')+'</div>';
  const b3='<div class="bx">'+H('3 Site & tolerance','Plats')+
    LR('Light','Ljus',G('light',LIGHT,3))+LR('Moisture','Fukt',moist)+LR('Soil','Jord',G('soil',SOIL,4))+LR('pH','pH',G('ph',PH,3))+LR('Tolerates','Tål',G('tol',TOL,3))+
    '<div class="two">'+F('USDA','USDA',m.usda)+F('SE zone','Zon',m.szone)+F('RHS','RHS',m.rhs)+'</div></div>';
  const calL='<div class="mt"><span></span>'+MONTHS.map(x=>'<span class="mh">'+x+'</span>').join('')+['cal1','cal2','cal3','cal4'].map(mo).join('')+'</div>';
  const calR='<div style="display:flex;flex-direction:column;gap:.7mm;min-width:0">'+LR('Propagate','Förökning',G('prop',w?PROP_W:PROP_H,3))+
    (w?LR('Pollination','Pollinering',G('poll',POLL,3)):LR('Sowing','Sådd',G('sowing',SOWING,4)))+
    '<div class="two">'+LR('Effort','Insats',G('effort',EFFORT,3))+LR('Establish','Etablering',G('estab',ESTAB,2))+'</div>'+F('Watch-outs','Att se upp med',m.watch)+'</div>';
  const b4='<div class="bx">'+H('4 Calendar & propagation','Kalender & förökning')+'<div class="calbx">'+calL+calR+'</div></div>';
  const b5='<div class="bx">'+H('5 Uses','Användning')+G('uses',w?USES_W:USES_H,3)+LR('Edibility','Ätlighet','<span class="c'+(m.edibility===0?' on':'')+'"><i></i><span class="t">'+L('No','Nej')+'</span></span>'+dd(m.edibility||0,5))+LR('Yield','Skörd',G('yield',YIELD,3))+F('Edible part / notes','Ätlig del',m.edible)+'</div>';
  const b6='<div class="bx">'+H('6 Ecosystem functions','Ekosystemfunktioner')+G('eco',w?ECO_W:ECO_H,2)+F('Notes','Anteckningar',m.ecoNotes)+'</div>';
  const b7='<div class="bx">'+H('7 Placement','Placering')+LR('Layer','Skikt',G('layer',LAYER,2))+LR('Role','Roll',G('role',ROLE,2))+LR('Structure','Struktur',G('struct',STRUCT,2))+F('Good with','Passar med',m.goodWith)+F('Avoid near','Undvik nära',m.avoid)+'</div>';
  const ft='<div class="bx ft"><div class="r"><span class="lr"><u>'+L('Use it?','Använda?')+'</u>'+dd(m.verdict||0,5)+'</span>'+
    '<span class="lr" style="flex:1"><u>'+L('Invasive risk (SE)','Invasionsrisk')+'</u>'+G('invasive',INV,3)+'</span><div style="flex:1">'+F('Updated','Uppdaterad',s.updatedDate)+'</div></div>'+
    '<div class="r"><span class="lr" style="flex:1.4"><u>'+L('Cautions','Varningar')+'</u>'+G('caut',CAUT,5)+'</span><div style="flex:1">'+F('Sources','Källor',m.sources)+'</div></div></div>';
  return '<section class="sheet'+(w?'':' herb')+'"><div class="band"><span>'+(lang==='en'?(w?'WOODY PLANT':'HERBACEOUS PLANT'):lang==='nl'?(w?'HOUTIGE PLANT':'KRUIDACHTIGE PLANT'):lang==='sv'?(w?'VEDARTAD VÄXT':'ÖRTARTAD VÄXT'):(w?'WOODY PLANT · VEDARTAD VÄXT':'HERBACEOUS PLANT · ÖRTARTAD VÄXT'))+'</span><small>SKOGSTRÄDGÅRDENS ARTBLAD</small></div>'+
    '<div class="idb"><div class="idl"><div class="row">'+F('Common name','Namn',m.en,'',1.1)+F('Latin name','Latinskt namn',s.latin+(m.cultivar?" ‘"+m.cultivar+"’":''),'',1.4,'latin')+F('Swedish name','Svenskt namn',m.sv,'',1)+'</div>'+
    '<div class="row">'+F('Family','Familj',m.family,'',1.4)+F('Dutch name','Nederländskt namn',m.nl,'',1.6)+F('No.','Nr',s.no,'',.6)+'</div>'+
    '<div class="row"><span class="lr" style="flex:1"><u>'+L('Type','Typ')+'</u>'+G('type',types,types.length)+'</span></div></div>'+
    '<div class="pic">'+pic+'</div></div>'+
    '<div class="tri">'+b1+b2+b3+'</div>'+b4+'<div class="tri">'+b5+b6+b7+'</div>'+ft+'</section>';
}
function sheetBacks(s,lang,src){
  const L=(en,sv)=>lang==='en'?esc(en):lang==='sv'?esc(sv):lang==='nl'?esc(nl(en)):esc(en)+'<s>'+esc(sv)+'</s>';
  const rows=s.obs.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.createdAt||0)-(b.createdAt||0));
  const per=14,pages=[];
  for(let i=0;i<Math.max(1,rows.length);i+=per)pages.push(rows.slice(i,i+per));
  return pages.map(ch=>{
    let h='';
    ch.forEach(o=>{const u=o.photo&&src(o.photo);h+='<div class="lgr"><span>'+esc(o.date||'')+'</span><span>'+esc([o.plot,!s.isCv&&o.cultivar?cvQ(o.cultivar):''].filter(Boolean).join(' · '))+'</span><span class="tx">'+esc(o.text||'')+'</span><span>'+(u?'<img src="'+u+'" alt="">':'')+'</span></div>'});
    for(let i=ch.length;i<per;i++)h+='<div class="lgr"><span></span><span></span><span></span><span></span></div>';
    return '<section class="sheet back'+(s.form==='w'?'':' herb')+'"><div class="band"><span>'+L('OBSERVATIONS LOG','OBSERVATIONSLOGG')+'</span><small><i>'+esc(s.latin)+'</i>'+(s.isCv?' '+esc(cvQ(s.cv)):'')+' · '+esc(s.no)+'</small></div>'+
      '<div class="lgh"><span>'+L('Date','Datum')+'</span><span>'+L('Plot','Plats')+'</span><span>'+L('Observation','Observation')+'</span><span>'+L('Photo','Foto')+'</span></div><div class="lg">'+h+'</div></section>';
  }).join('');
}
function docShell(title,body){
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>@page{size:210mm 148mm;margin:0}html,body{margin:0;background:#8d948c}body{display:flex;flex-direction:column;align-items:center;gap:6mm;padding:6mm 0}'+SHEET_CSS+'@media print{html,body{background:#fff;display:block;padding:0}.sheet{break-after:page;page-break-after:always}}</style></head><body>'+body+'</body></html>';
}
