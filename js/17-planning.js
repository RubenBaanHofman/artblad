// Artblad: Planning: compare, calendar, pick a plant, hardiness scale.
// Part 17 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- planning: compare ---------- */
const CMP_MAX=40; // also named in the compare bars in index.html ("up to 40")
let cmpMode=false;
function updateCmpBar(){const b=$('#cmpBar');if(!b)return;const n=cmp.filter(x=>byRef(x)).length;b.hidden=!cmpMode;$('#cmpN').textContent=n;$('#cmpGo').disabled=n<2;const pb=$('#pickCmpBar');if(pb){pb.hidden=!n;$('#pickCmpN').textContent=n;$('#pickCmpGo').disabled=n<2}$$('[data-act=cmp-mode]').forEach(x=>x.setAttribute('aria-pressed',cmpMode))}
let cmp=(()=>{try{const a=JSON.parse(store.get('ab.cmp')||'[]');return Array.isArray(a)?a.slice(0,CMP_MAX):[]}catch(e){return []}})();
const saveCmp=()=>store.set('ab.cmp',JSON.stringify(cmp));
function cmpAdd(sid){if(cmp.indexOf(sid)<0){if(cmp.length>=CMP_MAX)cmp.shift();cmp.push(sid);saveCmp()}}
/* Compare (2.6.0): a table with one row per species, like the genus and cultivar tables, sorted in a few useful ways
   and with columns to choose. The side-by-side view was removed in 2.6.1. */
const cmpPref={sort:store.get('ab.cmpsort')||'layer',cols:(()=>{try{const a=JSON.parse(store.get('ab.cmpcols')||'null');return Array.isArray(a)?new Set(a):null}catch(e){return null}})()};
const layerRank=x=>{const a=[].concat(x.m.layer||[]).map(k=>LAYER.findIndex(o=>o.k===k)).filter(i=>i>=0);return a.length?Math.min.apply(null,a):99};
const firstMonth=(x,k)=>{const a=[].concat(x.m[k]||[]).map(Number).filter(n=>n>=1&&n<=12);return a.length?Math.min.apply(null,a):99};
const CMP_SORTS=[
  ['layer','Forest layer (canopy to roots)','Skikt (krontak till rötter)',(a,b)=>layerRank(a)-layerRank(b)||(Number(b.m.height)||0)-(Number(a.m.height)||0)],
  ['hardy','Hardiness (hardiest first)','Härdighet (härdigast först)',(a,b)=>{const t=x=>{const h=hardOf(x.m);if(h)return h.t;const z=seTok(x.m.szone);return z.length?500-Math.max.apply(null,z):999};return t(a)-t(b)}],
  ['height','Mature height (tallest first)','Höjd (högst först)',(a,b)=>(isEmpty(b.m.height)?-1:Number(b.m.height))-(isEmpty(a.m.height)?-1:Number(a.m.height))],
  ['harvest','Harvest month (earliest first)','Skördemånad (tidigast först)',(a,b)=>firstMonth(a,'cal3')-firstMonth(b,'cal3')],
  ['flower','Flowering month (earliest first)','Blomningsmånad (tidigast först)',(a,b)=>firstMonth(a,'cal2')-firstMonth(b,'cal2')],
  ['name','Name','Namn',byName]
];
const CMP_COLS=[
  ['type','Type','Typ',1],['size','Height × spread','Höjd × bredd',1],['layer','Layer','Skikt',1],['hardy','Hardiness','Härdighet',1],
  ['light','Light','Ljus',1],['moist','Moisture','Fukt',1],['soil','Soil','Jord',0],['cal2','Flowering','Blomning',0],['cal3','Harvest','Skörd',1],
  ['uses','Uses','Användning',0],['edib','Edibility','Ätlighet',1],['eco','Ecosystem','Ekosystem',0],['verdict','Use it?','Använda?',1]
];
const cmpColOn=k=>cmpPref.cols?cmpPref.cols.has(k):!!(CMP_COLS.find(c=>c[0]===k)||[])[3];
function cmpTableHTML(list){
  const lang=state.lang,dash='<span class="muted">–</span>';
  const V=(x,k)=>{const d=DEF[k],v=x.m[k];return isEmpty(v)||!d?'':esc(vtl(d,v,x.form,lang))};
  const months=(x,k)=>isEmpty(x.m[k])?'':'<span class="cmo">'+MONTHS.map((l,i)=>'<i'+((x.m[k]||[]).indexOf(i+1)>=0?' class="on"':'')+' title="'+MONTH_NAMES[i]+'"></i>').join('')+'</span>';
  const cell={type:x=>V(x,'type'),size:x=>esc(isEmpty(x.m.spread)?fmtLen(x.m.height):fmtSize(x.m.height,x.m.spread)),layer:x=>V(x,'layer'),
    hardy:x=>[x.m.szone?'SE '+esc(x.m.szone):'',x.m.usda?'USDA '+esc(x.m.usda):'',x.m.rhs?'RHS '+esc(x.m.rhs):''].filter(Boolean).join(' · '),
    light:x=>V(x,'light'),moist:x=>x.m.moist?esc(x.m.moist+'/5'):'',soil:x=>V(x,'soil'),cal2:x=>months(x,'cal2'),cal3:x=>months(x,'cal3'),
    uses:x=>V(x,'uses'),edib:x=>isEmpty(x.m.edibility)?'':Number(x.m.edibility)===0?esc(trs('Inedible','Oätlig')):dots(x.m.edibility,5),eco:x=>V(x,'eco'),verdict:x=>x.m.verdict?dots(x.m.verdict,5):''};
  const cols=CMP_COLS.filter(c=>cmpColOn(c[0]));
  const srt=CMP_SORTS.find(z=>z[0]===cmpPref.sort)||CMP_SORTS[0];
  const rows=list.slice().sort((a,b)=>srt[3](a,b)||byName(a,b));
  // Sorted by layer: a heading row for each layer, so the table reads from the canopy down.
  let lastL=null;
  const body=rows.map(x=>{
    let h='';if(srt[0]==='layer'){const r=layerRank(x);if(r!==lastL){lastL=r;const o=LAYER[r];h='<tr class="cmpgrp"><th colspan="'+(cols.length+2)+'">'+(o?esc(trs(o.en,o.sv)):esc(tr('No layer recorded','Inget skikt angivet','Geen laag vastgelegd')))+'</th></tr>'}}
    return h+'<tr><td class="cmpnm"><span class="ph sm" style="--c:'+FCOL[x.form]+'">'+phInner(x,1)+'</span><button type="button" class="lnk" data-open="'+esc(x.ref)+'"><i>'+esc(x.latin)+'</i>'+(x.isCv?' '+esc(cvQ(x.cv)):'')+'</button>'+(commonName(x)?'<br><small>'+esc(commonName(x))+'</small>':'')+'</td>'+
      cols.map(c=>{const v=cell[c[0]](x);return '<td>'+(v||dash)+'</td>'}).join('')+
      '<td><span class="cmpacts">'+starBtn(x.sid)+addListSelect(x.sid)+'<button type="button" class="btn sm" data-cmp-del="'+esc(x.ref)+'" aria-label="'+esc(tr('Remove','Ta bort','Verwijderen'))+'">×</button></span></td></tr>'}).join('');
  return '<div class="tbl"><table class="cmpt cmptab"><thead><tr><th scope="col">'+esc(tr('Species','Art','Soort'))+'</th>'+cols.map(c=>'<th scope="col">'+esc(trs(c[1],c[2]))+'</th>').join('')+'<th></th></tr></thead><tbody>'+body+'</tbody></table></div>';
}
function updateCompare(){
  cmp=cmp.filter(x=>byRef(x));
  const list=cmp.map(byRef);
  const opts=species.slice().sort(byName).map(x=>'<option value="'+esc(x.sid)+'">'+esc(dispName(x))+'</option>'+x.cvs.map(c=>'<option value="'+esc(c.ref)+'">'+'\u00a0\u00a0\u00a0'+esc(dispName(c))+'</option>').join('')).join('');
  $('#cmpPick').innerHTML='<option value="">'+esc(tr('Add a species…','Lägg till en art…','Soort toevoegen…'))+'</option>'+opts;
  $('#cmpPick').disabled=list.length>=CMP_MAX;
  const ctl=$('#cmpCtl');
  if(ctl)ctl.innerHTML=('<label class="cmpsort">'+esc(tr('Order','Ordning','Volgorde'))+' <select id="cmpSort">'+CMP_SORTS.map(z=>'<option value="'+z[0]+'"'+(z[0]===cmpPref.sort?' selected':'')+'>'+esc(trs(z[1],z[2]))+'</option>').join('')+'</select></label>'+
    '<span class="chips cmpcols" aria-label="'+esc(tr('Columns','Kolumner','Kolommen'))+'">'+CMP_COLS.map(c=>'<button type="button" class="chip sm" data-cmpcol="'+c[0]+'" aria-pressed="'+cmpColOn(c[0])+'"><i></i><span>'+esc(trs(c[1],c[2]))+'</span></button>').join('')+'</span>');
  if(ctl)ctl.hidden=!list.length;
  if(!list.length){$('#cmpTable').innerHTML='<div class="empty"><p>'+tr('Add species to compare them in a table: one at a time, “Add my favourites”, “Compare” on a species page, a list, or the tick boxes in Pick a plant.','Lägg till arter för att jämföra dem i en tabell: en i taget, ”Lägg till mina favoriter”, ”Jämför” på en artsida, en lista eller kryssrutorna i Välj en växt.','Voeg soorten toe om ze in een tabel te vergelijken: één voor één, “Mijn favorieten toevoegen”, “Vergelijken” op een soortpagina, een lijst of de vinkjes in Kies een plant.')+'</p></div>';return}
  $('#cmpTable').innerHTML=cmpTableHTML(list)+'<p class="muted" style="font-size:13px">'+esc(tr(list.length+' species. Tap a name to open its page.',list.length+' arter. Tryck på ett namn för att öppna sidan.',list.length+' soorten. Tik op een naam om de pagina te openen.'))+'</p>';
}
function cmpSet(kind,v){
  if(kind==='sort'){cmpPref.sort=v;store.set('ab.cmpsort',v)}
  else if(kind==='col'){if(!cmpPref.cols)cmpPref.cols=new Set(CMP_COLS.filter(c=>c[3]).map(c=>c[0]));if(cmpPref.cols.has(v))cmpPref.cols.delete(v);else cmpPref.cols.add(v);store.set('ab.cmpcols',JSON.stringify([...cmpPref.cols]))}
  updateCompare();
}
/* ---------- planning: calendar ---------- */
const calState={set:'all',acts:new Set(['cal1','cal2','cal3','cal4']),cv:store.get('ab.calcv')!=='0'};
const CAL_ACT=[['cal1','Plant / sow','Plantera / så'],['cal2','Flower','Blomning'],['cal3','Harvest','Skörd'],['cal4','Prune / cut','Beskär / skär']];
function updateCalendar(){
  const lang=state.lang,mo=new Date().getMonth();
  let pool=calState.set==='fav'?species.filter(x=>Fav.has(x.sid)):calState.set==='cmp'?cmp.map(byRef).filter(Boolean):calState.set==='list'?listInView():species;
  const acts=CAL_ACT.filter(a=>calState.acts.has(a[0]));
  const list=pool.filter(x=>acts.some(a=>!isEmpty(x.m[a[0]]))||(calState.cv&&(x.cvs||[]).some(c=>acts.some(a=>!isEmpty(c.own[a[0]]))))).sort(byName);
  $$('#calSet button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.calset===calState.set));
  $$('#calActs [data-calact]').forEach(b=>b.setAttribute('aria-pressed',calState.acts.has(b.dataset.calact)));
  const miss=pool.length-list.length;
  $('#calNote').textContent=tr(list.length+' species with months'+(miss?'; '+miss+' have none recorded yet.':'.'),list.length+' arter med månader'+(miss?'; '+miss+' saknar månader ännu.':'.'),list.length+' soorten met maanden'+(miss?'; bij '+miss+' zijn nog geen maanden vastgelegd.':'.'));
  if(!list.length){$('#calGrid').innerHTML='<div class="empty"><p>'+tr('No calendar months recorded for these species yet.','Inga kalendermånader registrerade för dessa arter ännu.')+'</p></div>';return}
  const mh=MONTHS.map((x,i)=>'<span class="cmh'+(i===mo?' now':'')+'">'+(lang==='sv'?MON_SV[i]:lang==='nl'?MON_NL[i]:MONTH_NAMES[i])+'</span>').join('');
  const cells=x=>MONTHS.map((_,i)=>'<span class="ccell'+(i===mo?' now':'')+'">'+acts.map(a=>(x.m[a[0]]||[]).indexOf(i+1)>=0?'<i class="ca '+a[0]+'" title="'+esc(tr(a[1],a[2]))+'"></i>':'').join('')+'</span>').join('');
  // Cultivars get their own row under the species when their months differ from the species.
  const subs=x=>calState.cv&&!x.isCv&&x.cvs?x.cvs.filter(c=>acts.some(a=>!isEmpty(c.own[a[0]])&&JSON.stringify(c.m[a[0]])!==JSON.stringify(x.m[a[0]]))):[];
  const pc=$('#calCv');if(pc)pc.checked=calState.cv;
  $('#calGrid').innerHTML='<div class="calg"><span class="cname"></span>'+mh+list.map(x=>
    '<button type="button" class="cname" data-open="'+esc(x.ref)+'">'+(commonName(x)?esc(dispName(x)):'<i>'+esc(x.latin)+'</i>'+(x.isCv?' '+esc(cvQ(x.cv)):''))+vmark(x.sid)+'</button>'+cells(x)+
    subs(x).map(c=>'<button type="button" class="cname cvsubn" data-open="'+esc(c.ref)+'" title="'+esc(dispName(c))+'">'+esc(cvQ(c.cv))+'</button>'+cells(c)).join('')).join('')+'</div>';
}

/* ---------- planning: pick a plant ---------- */
const pickState={light:'',moist:0,soil:new Set(),zone:'',temp:'',form:'',scope:'',cv:store.get('ab.pickcv')!=='0'};
// Pick a plant remembers the spot and the filters on this device.
const PKEY='ab.pick';
function pickSave(){try{store.set(PKEY,JSON.stringify({light:pickState.light,moist:pickState.moist,soil:[...pickState.soil],zone:pickState.zone,temp:pickState.temp,form:pickState.form,scope:pickState.scope,adv:{sets:Object.fromEntries(Object.entries(advState.sets).map(([k,v])=>[k,[...v]])),caut:[...advState.caut],inv:advState.inv,verdict:advState.verdict,edib:advState.edib,strict:advState.strict,ann:advState.ann}}))}catch(e){}}
function pickLoad(){try{const d=JSON.parse(store.get(PKEY)||'null');if(!d)return;Object.assign(pickState,{light:d.light||'',moist:d.moist||0,soil:new Set(d.soil||[]),zone:d.zone||'',temp:d.temp||'',form:d.form||'',scope:d.scope||''});
  const a=d.adv||{};Object.keys(advState.sets).forEach(k=>advState.sets[k]=new Set((a.sets||{})[k]||[]));advState.caut=new Set(a.caut||[]);advState.inv=a.inv||'';advState.verdict=a.verdict||0;advState.edib=a.edib||0;advState.strict=!!a.strict;advState.ann=!!a.ann}catch(e){}}
// scope: '' = all species, 'fav' = my favourites, 'l:<id>' = one shared list.
function pickScopeSel(){
  const sel=$('#pickScope');if(!sel)return;
  if(pickState.scope.startsWith('l:')&&!listById(pickState.scope.slice(2)))pickState.scope='';
  const ls=(state.lists||[]).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  sel.innerHTML='<option value="">'+esc(tr('All species','Alla arter'))+'</option><option value="fav">'+esc(tr('My favourites','Mina favoriter'))+' ('+Fav.set.size+')</option>'+
    (ls.length?'<optgroup label="'+esc(tr('Shared lists','Delade listor'))+'">'+ls.map(l=>'<option value="l:'+esc(l.id)+'">'+esc(l.name||'–')+' ('+(l.sids||[]).length+')</option>').join('')+'</optgroup>':'');
  sel.value=pickState.scope;
}
function pickInScope(x){
  if(!pickState.scope)return true;
  if(pickState.scope==='fav')return Fav.has(x.sid);
  const L=listById(pickState.scope.slice(2));return !!L&&(L.sids||[]).indexOf(x.sid)>=0;
}
/* Advanced filters: narrow the pool by placement, role, uses, functions, care and cautions. A species without data for a
   chosen filter is kept and marked "?", unless "Hide species without data" is ticked. Cultivars are filtered on their own values. */
const ADV=[['type','Type','Typ','Type',TYPES_ALL],['layer','Layer','Skikt','Laag',LAYER],['role','Role','Roll','Rol',ROLE],['struct','Structure','Struktur','Structuur',STRUCT],['uses','Uses','Användning','Gebruik',USES_ALL],['eco','Ecosystem functions','Ekosystemfunktioner','Ecosysteemfuncties',ECO_ALL],['effort','Effort','Arbetsinsats','Inspanning',EFFORT],['estab','Establishes','Etablering','Vestiging',ESTAB]];
const advState={sets:Object.fromEntries(ADV.map(a=>[a[0],new Set()])),caut:new Set(),inv:'',verdict:0,edib:0,strict:false,ann:false,open:false};
const isAnnualish=m=>m.type==='annual'||(m.asAnnual||[]).indexOf('annual')>=0;
const advCount=()=>ADV.reduce((t,a)=>t+(advState.sets[a[0]].size?1:0),0)+(advState.caut.size?1:0)+(advState.inv?1:0)+(advState.verdict?1:0)+(advState.edib?1:0);
function buildPickAdv(){
  const el=$('#pickAdv');if(!el)return;const n=advCount();
  el.open=advState.open;
  el.innerHTML='<summary>'+esc(tr('Advanced filters','Avancerade filter','Geavanceerde filters'))+(n?' <span class="badge">'+n+'</span>':'')+'</summary><div class="advb">'+
    '<p class="hint">'+esc(tr('Within each group, any ticked option counts. Groups combine: each one makes the list shorter.','Inom varje grupp räcker ett ikryssat alternativ. Grupperna kombineras: var och en gör listan kortare.','Binnen elke groep telt elke aangevinkte optie. Groepen combineren: elke groep maakt de lijst korter.'))+'</p>'+
    ADV.map(a=>'<div class="fgrp"><span class="fl">'+trh(a[1],a[2],a[3])+'</span><div class="chips">'+a[4].map(o=>'<button type="button" class="chip sm" data-adv="'+a[0]+'" data-v="'+o.k+'" aria-pressed="'+advState.sets[a[0]].has(o.k)+'"><i></i><span>'+labUI(o)+'</span></button>').join('')+'</div></div>').join('')+
    '<div class="fgrp"><span class="fl">'+trh('Leave out species with','Uteslut arter med','Laat soorten weg met')+'</span><div class="chips">'+CAUT.map(o=>'<button type="button" class="chip sm ex" data-advx="'+o.k+'" aria-pressed="'+advState.caut.has(o.k)+'"><i></i><span>'+labUI(o)+'</span></button>').join('')+'</div></div>'+
    '<div class="fgrp advacts"><label><span class="fl">'+trh('Invasive risk (Sweden)','Invasionsrisk (Sverige)','Invasierisico (Zweden)')+'</span><select id="advInv">'+
      [['',tr('Any','Alla','Alle')],['nohigh',tr('Leave out high risk','Uteslut hög risk','Hoog risico weglaten')],['none',tr('Only species with no risk','Bara arter utan risk','Alleen soorten zonder risico')]].map(o=>'<option value="'+o[0]+'"'+(advState.inv===o[0]?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select></label>'+
    '<label><span class="fl">'+trh('Edibility at least','Ätlighet minst','Eetbaarheid minstens')+'</span><select id="advEdib">'+[0,1,2,3,4,5].map(v=>'<option value="'+v+'"'+(advState.edib===v?' selected':'')+'>'+(v?v+' / 5':esc(tr('Any','Alla','Alle')))+'</option>').join('')+'</select></label>'+
    '<label><span class="fl">'+trh('Use it? at least','Använda? minst','Gebruiken? minstens')+'</span><select id="advVerdict">'+[0,2,3,4,5].map(v=>'<option value="'+v+'"'+(advState.verdict===v?' selected':'')+'>'+(v?v+' / 5':esc(tr('Any','Alla','Alle')))+'</option>').join('')+'</select></label></div>'+
    '<div class="advacts"><label class="pkopt"><input type="checkbox" id="advAnn"'+(advState.ann?' checked':'')+'> <span>'+esc(tr('Ignore growing zones for annuals (and plants that can be grown as annuals)','Bortse från odlingszon för ettåriga (och växter som kan odlas som ettåriga)','Groeizones negeren voor eenjarigen (en planten die als eenjarige te kweken zijn)'))+'</span></label></div>'+
    '<div class="advacts"><label class="pkopt"><input type="checkbox" id="advStrict"'+(advState.strict?' checked':'')+'> <span>'+esc(tr('Hide species without data for these filters','Dölj arter som saknar uppgifter för dessa filter','Soorten zonder gegevens voor deze filters verbergen'))+'</span></label>'+
    (n?'<button type="button" class="btn sm" data-act="adv-clear">'+esc(tr('Clear advanced filters','Rensa avancerade filter','Geavanceerde filters wissen'))+'</button>':'')+'</div></div>';
}
// Returns null when x is filtered out, otherwise the list of filters x has no data for.
function advCheck(x){
  const m=x.m,unk=[];
  for(const a of ADV){const S=advState.sets[a[0]];if(!S.size)continue;const v=m[a[0]];if(isEmpty(v)){unk.push(a);continue}if(![].concat(v).some(k=>S.has(k)))return null}
  if(advState.caut.size&&(m.caut||[]).some(k=>advState.caut.has(k)))return null;
  if(advState.inv){const v=m.invasive;if(!v)unk.push(['invasive','Invasive risk','Invasionsrisk','Invasierisico']);else if(v==='high'||(advState.inv==='none'&&v!=='none'))return null}
  if(advState.verdict){const v=m.verdict;if(!v)unk.push(['verdict','Use it?','Använda?','Gebruiken?']);else if(v<advState.verdict)return null}
  if(advState.edib){const v=m.edibility;if(isEmpty(v))unk.push(['edibility','Edibility','Ätlighet','Eetbaarheid']);else if(Number(v)<advState.edib)return null}
  if(advState.strict&&unk.length)return null;
  return unk;
}
const zoneMax=z=>{const n=String(z||'').match(/\d+/g);return n?Math.max.apply(null,n.map(Number)):null};
/* ---------- hardiness on one temperature scale ----------
   USDA zones and RHS ratings are defined by the lowest winter temperature. Swedish zones are not (they also reflect
   the growing season), so they are never converted to temperatures (since 2.4.7). A range like "2-7" means: grows in zones 2 to 7;
   the coldest zone in it (USDA: lowest number, Swedish: highest number) says how hardy the plant is. */
const usdaLo=(n,h)=>Math.round(((-60+10*(n-1)+(h==='b'?5:0))-32)/1.8*10)/10;   // lower edge in °C
const usdaTok=z=>[...String(z||'').toLowerCase().matchAll(/(\d{1,2})\s*([ab])?/g)].map(m=>({n:+m[1],h:m[2]||''})).filter(t=>t.n>=1&&t.n<=13);
const seTok=z=>(String(z||'').match(/\d+/g)||[]).map(Number).filter(n=>n>=1&&n<=8);
const RHS_K=RHS.map(r=>r.k);
// RHS ratings with or without the H: "H5", "5", "h1b", "H4-H6", "4-6". A plain 1 is read as H1c.
const rhsTok=z=>[...String(z||'').toLowerCase().matchAll(/h?\s*([1-7])\s*([abc])?/g)].map(m=>m[1]==='1'?'H1'+(m[2]||'c'):'H'+m[1]).filter(k=>RHS_K.indexOf(k)>=0);
// The coldest temperature a plant is rated for, from its USDA zone (leading) or else its RHS rating. Swedish zones are not
// temperatures and are compared only with a Swedish zone (zoneMax).
function hardOf(m){
  const us=usdaTok(m.usda);if(us.length){const c=us.slice().sort((a,b)=>a.n-b.n||(a.h>b.h?1:-1))[0];return{t:usdaLo(c.n,c.h||'a'),by:'usda',label:'USDA '+c.n+c.h,approx:1}}
  const rh=rhsTok(m.rhs);if(rh.length){const k=rh.slice().sort((a,b)=>RHS_K.indexOf(b)-RHS_K.indexOf(a))[0],r=RHS.find(o=>o.k===k);return{t:r.hi==null?r.lo:r.lo==null?r.hi:r.lo,by:'rhs',label:'RHS '+r.k,approx:1,open:r.lo==null}}
  return null;
}
function zoneNorm(v,kind){
  if(kind==='rhs'){const t=rhsTok(v);if(!t.length)return String(v).trim();t.sort((a,b)=>RHS_K.indexOf(a)-RHS_K.indexOf(b));const a=t[0],b=t[t.length-1];return a===b?a:a+'-'+b}
  if(kind==='se'){const t=seTok(v);if(!t.length)return String(v).trim();const a=Math.min.apply(null,t),b=Math.max.apply(null,t);return a===b?String(a):a+'-'+b}
  const t=usdaTok(v);if(!t.length)return String(v).trim();const k=x=>x.n*2+(x.h==='b'?1:0);t.sort((a,b)=>k(a)-k(b));const a=t[0],b=t[t.length-1];return k(a)===k(b)?a.n+a.h:a.n+a.h+'-'+b.n+b.h;
}
function zoneHint(d,v){
  if(d.zone==='rhs'){
    if(!String(v||'').trim())return tr('E.g. H5, 5 or H4-H6, with or without the H. The hardiest rating counts.','T.ex. H5, 5 eller H4-H6, med eller utan H. Den härdigaste klassen räknas.','Bijv. H5, 5 of H4-H6, met of zonder H. De winterhardste klasse telt.');
    const h=hardOf({rhs:v});if(!h)return tr('Not understood: use ratings H1a to H7, e.g. H5 or 4-6.','Förstås inte: använd klasserna H1a till H7, t.ex. H5 eller 4-6.','Niet begrepen: gebruik de klassen H1a tot H7, bijv. H5 of 4-6.');
    return (h.open?tr('Hardy below ','Härdig under ','Winterhard onder '):tr('Hardy to ','Härdig till ','Winterhard tot '))+fmtC(h.t)+' ('+h.label+')';
  }
  if(!String(v||'').trim())return d.zone==='se'?tr('E.g. 1-4: grows in zones 1 to 4. The highest number counts.','T.ex. 1-4: växer i zon 1 till 4. Den högsta siffran räknas.','Bijv. 1-4: groeit in zone 1 tot 4. Het hoogste getal telt.'):tr('E.g. 5, 5b or 2-7: grows in zones 2 to 7. The lowest number counts.','T.ex. 5, 5b eller 2-7: växer i zon 2 till 7. Den lägsta siffran räknas.','Bijv. 5, 5b of 2-7: groeit in zone 2 tot 7. Het laagste getal telt.');
  if(d.zone==='se'){const t=seTok(v);if(!t.length)return tr('Not understood: use zone numbers 1 to 8, like 4 or 1-4.','Förstås inte: använd zonnummer 1 till 8, som 4 eller 1-4.','Niet begrepen: gebruik zonenummers 1 tot 8, zoals 4 of 1-4.');return tr('Hardy up to zone ','Härdig upp till zon ','Winterhard tot zone ')+Math.max.apply(null,t)}
  const h=hardOf({usda:v});
  if(!h)return tr('Not understood: use zone numbers like 5, 5b or 2-7.','Förstås inte: använd zonnummer som 5, 5b eller 2-7.','Niet begrepen: gebruik zonenummers zoals 5, 5b of 2-7.');
  return tr('Hardy to ','Härdig till ','Winterhard tot ')+fmtC(h.t)+' ('+h.label+')';
}
// Older data: herbaceous "types" that were not life cycles, and structural roles that sat under ecosystem functions.
function normFields(f){
  if(!f)return f;const o=Object.assign({},f),add=(k,v)=>{o[k]=[...new Set((o[k]||[]).concat(v))]};
  if(o.type==='bulb'){delete o.type;add('habit','bulbous')}
  else if(o.type==='rootcrop'){delete o.type;add('uses','root')}
  else if(o.type==='groundcover'){delete o.type;add('struct','ground')}
  if(Array.isArray(o.eco)){const mv=o.eco.filter(k=>k==='screen'||k==='wind'||k==='shade');if(mv.length){o.eco=o.eco.filter(k=>mv.indexOf(k)<0);if(!o.eco.length)delete o.eco;add('struct',mv)}}
  return o;
}
function pickEval(x){
  const m=x.m,res=[];
  if(pickState.light){const L=m.light||[];res.push({k:'light',st:L.length?(L.indexOf(pickState.light)>=0||(pickState.light==='shade'&&(m.tol||[]).indexOf('shade')>=0)?'ok':'no'):'?'})}
  if(pickState.moist){const v=m.moist,T=m.tol||[];let st='?';if(v){const d=pickState.moist-v;st=Math.abs(d)<=1||(d>0&&T.indexOf('wet')>=0)||(d<0&&T.indexOf('drought')>=0)?'ok':'no';res.push({k:'moist',st,dir:d})}else res.push({k:'moist',st})}
  if(pickState.soil.size){const S=m.soil||[];res.push({k:'soil',st:S.length?(S.some(z=>pickState.soil.has(z))?'ok':'no'):'?'})}
  // Cold: two separate checks that work together. Temperature (from a map position or typed): the species' USDA rating (else RHS)
  // and its Proven hardy record, whichever is hardier. Swedish zone: only the species' own Swedish zone. Either match is enough;
  // both together mean a high chance of success (snowflake mark, ranked first).
  if(pickState.temp!==''||pickState.zone){
    const r={k:'zone',st:'?'},rank={ok:3,edge:2,no:1,'?':0};
    if(pickState.temp!==''){const Ts=Number(pickState.temp),h=hardOf(m),pv=provenOf(x),cand=[];
      if(h&&!h.open)cand.push(h.t);if(pv)cand.push(pv.t);
      const t=cand.length?Math.min.apply(null,cand):null;
      r.T={Ts,h,pv,t,st:t==null?'?':t<=Ts?'ok':t<=Ts+5?'edge':'no'}}
    if(pickState.zone){const z=Number(pickState.zone),mx=zoneMax(m.szone);r.Z={z,mx,st:mx==null?'?':mx>=z?'ok':mx>=z-1?'edge':'no'}}
    const parts=[r.T,r.Z].filter(Boolean),sts=parts.map(p=>p.st);
    r.st=sts.indexOf('ok')>=0?'ok':sts.indexOf('edge')>=0?'edge':sts.indexOf('no')>=0?'no':'?';
    r.both=parts.length===2&&sts.every(v=>v==='ok');
    if(advState.ann&&isAnnualish(m)){r.st='ok';r.ann=1}
    res.push(r);
  }
  if(advCount()){const u=advCheck(x)||[];res.push({k:'adv',st:'ok'});u.forEach(a=>res.push({k:'a:'+a[0],st:'?',lab:a}))}
  return res;
}
function pickTip(r,x){
  const m=x.m;
  if(r.k==='light'){const L=m.light||[];if(pickState.light==='shade'||(pickState.light==='part'&&L.indexOf('sun')>=0&&L.indexOf('part')<0))return tr('Wants more light: use the sunniest edge of the spot, or thin out the plants that shade it.','Vill ha mer ljus: använd platsens soligaste kant, eller gallra det som skuggar.');return tr('Wants more shade: plant on the north side of taller plants, or under a canopy.','Vill ha mer skugga: plantera norr om högre växter eller under ett krontak.')}
  if(r.k==='moist')return r.dir>0?tr('The spot is wetter than it likes: plant on a mound or raised bed and add grit for drainage.','Platsen är blötare än den vill: plantera på en kulle eller upphöjd bädd och tillsätt grus för dränering.'):tr('The spot is drier than it likes: water while it establishes and mulch thickly; a lower or shadier part helps.','Platsen är torrare än den vill: vattna under etableringen och täckodla tjockt; en lägre eller skuggigare del hjälper.');
  if(r.k==='soil'){const S=m.soil||[],sv=s=>SOIL.filter(o=>S.indexOf(o.k)>=0).map(o=>trs(o.en,o.sv)).join(', ');return tr('Prefers '+sv()+': improve the soil with compost, and grit on heavy clay or organic matter on sand.','Föredrar '+sv()+': förbättra jorden med kompost, och grus på styv lera eller organiskt material på sand.','Geeft de voorkeur aan '+sv()+': verbeter de grond met compost, en met grit bij zware klei of organisch materiaal bij zand.')}
  if(r.k==='zone'){const bits=[];
    if(r.T&&r.T.t!=null&&r.T.st!=='ok')bits.push(tr('hardy to about ','härdig till ungefär ','winterhard tot ongeveer ')+fmtC(r.T.t)+(r.T.h?' ('+r.T.h.label+')':''));
    if(r.Z&&r.Z.mx!=null&&r.Z.st!=='ok')bits.push(tr('Swedish zone up to ','svensk zon upp till ','Zweedse zone tot ')+r.Z.mx);
    return (bits.length?bits.join(', ').replace(/^./,c=>c.toUpperCase())+': ':'')+tr('give it the warmest, most sheltered place (south wall, no frost pocket) and winter protection.','ge den den varmaste, mest skyddade platsen (sydvägg, ingen frostgrop) och vinterskydd.','geef hem de warmste, meest beschutte plek (zuidmuur, geen vorstgat) en winterbescherming.')}
  return '';
}
const PICK_LAB={light:['Light','Ljus'],moist:['Moisture','Fukt'],soil:['Soil','Jord'],zone:['Cold','Kyla']};
const pkCls=st=>st==='ok'?'ok':st==='?'?'unk':st==='edge'?'edge':'no';
const pkBadges=ev=>['light','moist','soil','zone'].map(k=>{const r=ev.find(z=>z.k===k);if(!r)return '';
  if(k==='zone'){if(r.ann)return '<span class="pk ok">'+esc(tr('Grown as annual','Odlas som ettårig','Als eenjarige'))+'</span>';
    return (r.Z?'<span class="pk '+pkCls(r.Z.st)+'" title="'+esc(r.Z.mx==null?tr('No Swedish zone recorded','Ingen svensk zon angiven','Geen Zweedse zone vastgelegd'):tr('Swedish zone up to ','Svensk zon upp till ','Zweedse zone tot ')+r.Z.mx)+'">'+esc(tr('Zone ','Zon ','Zone ')+r.Z.z)+(r.Z.st==='?'?' ?':'')+'</span>':'')+
      (r.T?'<span class="pk '+pkCls(r.T.st)+'" title="'+esc(r.T.t==null?tr('No USDA/RHS rating or proven hardiness','Ingen USDA/RHS-uppgift eller bevisad härdighet','Geen USDA/RHS-gegevens of bewezen winterhardheid'):tr('Hardy to ','Härdig till ','Winterhard tot ')+fmtC(r.T.t))+'">'+esc(fmtC(r.T.Ts))+(r.T.st==='?'?' ?':'')+'</span>':'')}const cls=r.st==='ok'?'ok':r.st==='?'?'unk':r.st==='edge'?'edge':'no';return '<span class="pk '+cls+'"'+(r.approx&&r.h?' title="'+esc(r.h.label+' ≈ '+fmtC(r.h.t))+'"':'')+'>'+esc(tr(PICK_LAB[k][0],PICK_LAB[k][1]))+(r.approx?' ≈':'')+(r.st==='?'?' ?':'')+'</span>'}).join('')+
  ev.filter(r=>r.lab).map(r=>'<span class="pk unk" title="'+esc(tr('No data for this filter yet','Inga uppgifter för detta filter ännu','Nog geen gegevens voor dit filter'))+'">'+esc(tr(r.lab[1],r.lab[2],r.lab[3]))+' ?</span>').join('');
// Small signs at the top right of a Pick a plant result: sources recorded, invasive risk, toxic, very edible.
const PKI={
  seed:'<svg viewBox="0 0 16 16"><path d="M8 2.3c3 1.8 4.3 5.2 3.3 8.1-.6 1.9-2 3.2-3.3 3.2s-2.7-1.3-3.3-3.2C3.7 7.5 5 4.1 8 2.3z" fill="#d7b27a" stroke="#8a6332" stroke-width="1"/><path d="M8 5.2c-.9 2.3-.9 4.9 0 7.4" fill="none" stroke="#8a6332" stroke-width="1" stroke-linecap="round"/></svg>',
  inv:'<svg viewBox="0 0 16 16"><path d="M8 1.6l6.8 12H1.2z" fill="#f4c430" stroke="#a07c00" stroke-width="1" stroke-linejoin="round"/><path d="M8 5.8v3.9" stroke="#3b2f00" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="11.7" r=".95" fill="#3b2f00"/></svg>',
  tox:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7.3" fill="#b8322a"/><path d="M8 3.4c-2.4 0-4 1.6-4 3.8 0 1.3.6 2.2 1.5 2.8v1.7h5V10c.9-.6 1.5-1.5 1.5-2.8 0-2.2-1.6-3.8-4-3.8z" fill="#fff"/><circle cx="6.4" cy="7.3" r="1.05" fill="#b8322a"/><circle cx="9.6" cy="7.3" r="1.05" fill="#b8322a"/><path d="M7 11.7v-1.2M9 11.7v-1.2" stroke="#b8322a" stroke-width=".8"/></svg>',
  edib:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7.3" fill="#2f7d3a"/><path d="M5.3 3.6v2.8a1.25 1.25 0 0 0 2.5 0V3.6M6.55 3.6v8.8M10.6 12.4V3.6c-1.2.6-1.9 2-1.9 3.6v1.7h1.9" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
function pkIcons(x){
  const s=bySid.get(x.sid)||x,m=x.m||{},out=[];
  if((s.src&&s.src.length)||(x.src&&x.src.length))out.push(['seed',tr('Where to get it: sources recorded','Var finns den: källor finns','Waar te krijgen: bronnen vastgelegd')]);
  if(m.invasive==='low'||m.invasive==='high')out.push(['inv',tr('Possibly invasive','Möjligen invasiv','Mogelijk invasief')+' ('+tr('risk ','risk ','risico ')+(m.invasive==='high'?tr('high','hög','hoog'):tr('low','låg','laag'))+')']);
  if((m.caut||[]).indexOf('toxic')>=0)out.push(['tox',tr('Toxic','Giftig','Giftig')]);
  if(Number(m.edibility)>=4)out.push(['edib',tr('Very edible','Mycket ätlig','Zeer eetbaar')+' ('+m.edibility+'/5)']);
  return{n:out.length,html:out.length?'<span class="pkicons">'+out.map(o=>'<span class="pki '+o[0]+'" role="img" title="'+esc(o[1])+'" aria-label="'+esc(o[1])+'">'+PKI[o[0]]+'</span>').join('')+'</span>':''};
}
const cmpChk=(x,small)=>'<label class="cmpchk'+(small?'':' pkchk')+'" title="'+esc(tr('Tick to compare this with others','Kryssa för att jämföra med andra','Aanvinken om te vergelijken'))+'"><input type="checkbox" data-cmpsel="'+esc(x.ref)+'"'+(cmp.indexOf(x.ref)>=0?' checked':'')+' aria-label="'+esc(tr('Compare','Jämför')+' '+dispName(x))+'">'+(small?'':'<span>'+esc(tr('Compare','Jämför'))+'</span>')+'</label>';
// The species' hardiness side by side: Swedish zone, USDA/RHS, proven hardy.
function pkHard(x,ev){
  const r=ev.find(z=>z.k==='zone');if(!r)return '';const m=x.m,parts=[];
  if(m.szone)parts.push(tr('Swedish zone ','Svensk zon ','Zweedse zone ')+esc(m.szone));
  const h=hardOf(m);if(h)parts.push(esc(h.label)+' ('+(h.open?'> ':'')+esc(fmtC(h.t))+')');
  const pv=provenOf(x);if(pv)parts.push(esc(provenTxt(pv)));
  return '<div class="pkhard">'+(r.both?'<span class="pkboth" role="img" title="'+esc(tr('Fits both the Swedish zone and the winter temperature: high chance of success','Passar både den svenska zonen och vintertemperaturen: stor chans att lyckas','Past bij zowel de Zweedse zone als de wintertemperatuur: grote kans op succes'))+'" aria-label="'+esc(tr('Fits zone and temperature','Passar zon och temperatur','Past bij zone en temperatuur'))+'">'+PK_BOTH+'</span> ':'')+(parts.length?parts.join(' · '):'<span class="muted">'+esc(tr('No hardiness data yet','Inga härdighetsuppgifter än','Nog geen winterhardheidsgegevens'))+'</span>')+'</div>';
}
const PK_BOTH='<svg viewBox="0 0 20 16" aria-hidden="true"><g stroke="#2a6f9e" stroke-width="1.4" stroke-linecap="round"><path d="M7 1.5v13M1.4 4.75l11.2 6.5M1.4 11.25l11.2-6.5"/><path d="M5.3 2.6L7 4l1.7-1.4M5.3 13.4L7 12l1.7 1.4"/></g><circle cx="15" cy="11" r="4.6" fill="#2f8a43"/><path d="M12.9 11.1l1.5 1.5 2.8-3" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function pickRow(x,ev,tips,extra){
  const nm=names(x),ic=pkIcons(x);
  return '<div class="pickrow'+(ic.n?' hasic" style="--ni:'+ic.n:'')+'">'+ic.html+cmpChk(x)+'<button type="button" class="gapmain" data-open="'+esc(x.ref)+'"><span class="ph" style="--c:'+FCOL[x.form]+'">'+phInner(x,1)+'</span><span style="min-width:0"><span class="lat">'+nm.main+'</span><span class="nm">'+nm.sub+'</span></span></button>'+
    '<div style="min-width:0"><div class="pks">'+pkBadges(ev)+(Fav.has(x.sid)?'<span class="pk fav">★ '+tr('Favourite','Favorit')+'</span>':'')+'</div>'+pkHard(x,ev)+(extra||'')+(tips&&tips.length?'<ul class="tips">'+tips.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>':'')+'</div></div>';
}
// Score one species or cultivar for the spot: fits (ok), could work with help (close), no data (unk) or does not fit (no).
function pickScore(x){const ev=pickEval(x),no=ev.filter(r=>r.st==='no'||r.st==='edge').length,unk=ev.filter(r=>r.st==='?').length,ok=ev.filter(r=>r.st==='ok').length;
  // More than one zone too cold is a hard no: winter protection will not bridge that.
  const hard=ev.some(r=>r.k==='zone'&&r.st==='no'),both=ev.some(r=>r.k==='zone'&&r.both);
  return{x,ev,no,unk,ok,both,cls:no===0&&ok>0?'ok':no===0?'unk':no<=2&&!hard?'close':'no'}}
const RANK={ok:0,close:1,unk:2,no:3};
const byFit=(a,b)=>RANK[a.cls]-RANK[b.cls]||(b.both?1:0)-(a.both?1:0)||a.no-b.no||a.unk-b.unk;
const cvLabel=x=>x.isCv?esc(cvQ(x.cv)):'<i>'+esc(tr('Species (seed-grown or unnamed cultivar)','Arten (fröodlad eller okänd sort)','Soort (uit zaad of onbekende cultivar)'))+'</i>';
const failed=r=>r.ev.filter(z=>z.st==='no'||z.st==='edge').map(z=>tr(PICK_LAB[z.k][0],PICK_LAB[z.k][1])).join(', ');
function cvRow(r){
  const tips=r.cls==='close'?r.ev.filter(z=>z.st==='no'||z.st==='edge').map(z=>pickTip(z,r.x)):[];
  return '<div class="cvrow '+r.cls+'">'+cmpChk(r.x,1)+'<button type="button" class="cvname" data-open="'+esc(r.x.ref)+'"><span class="vd '+r.cls+'" aria-hidden="true">'+(r.cls==='ok'?'✓':'')+'</span>'+cvLabel(r.x)+'</button>'+
    '<div style="min-width:0"><div class="pks">'+pkBadges(r.ev)+'</div>'+pkHard(r.x,r.ev)+(tips.length?'<ul class="tips">'+tips.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>':'')+'</div></div>';
}
function cvSummary(g){
  const all=g.cands.filter(r=>r.x.isCv),n=k=>all.filter(r=>r.cls===k).length;
  return tr(n('ok')+' of '+all.length+' cultivars fit'+(n('close')?', '+n('close')+' could work with help':''),n('ok')+' av '+all.length+' sorter passar'+(n('close')?', '+n('close')+' kan fungera med hjälp':''),n('ok')+' van '+all.length+' cultivars passen'+(n('close')?', '+n('close')+' kunnen werken met hulp':''));
}
function pickGroup(g){
  const s=g.s;
  if(!s.cvs.length){const r=g.cands[0];return pickRow(s,r.ev,r.cls!=='ok'?r.ev.filter(z=>z.st==='no'||z.st==='edge').map(z=>pickTip(z,s)):null)}
  const shown=g.cands.filter(r=>r.cls==='ok'||r.cls==='close').sort(byFit),no=g.cands.filter(r=>r.cls==='no'),unk=g.cands.filter(r=>r.cls==='unk');
  const sum='<span class="pksum">'+esc(cvSummary(g))+'</span>';
  if(!pickState.cv){const fit=g.cands.filter(r=>r.cls==='ok'&&r.x.isCv);const sr=g.cands[0];
    return pickRow(s,sr.ev,null,sum+(fit.length?'<span class="pksum">'+esc(tr('Fits: ','Passar: ','Past: '))+fit.map(r=>cvQ(r.x.cv)).join(', ')+'</span>':''))}
  const nm=names(s),ic=pkIcons(s);
  return '<div class="pkgrp"><div class="pickrow'+(ic.n?' hasic" style="--ni:'+ic.n:'')+'">'+ic.html+'<span></span><button type="button" class="gapmain" data-open="'+esc(s.sid)+'"><span class="ph" style="--c:'+FCOL[s.form]+'">'+phInner(s,1)+'</span><span style="min-width:0"><span class="lat">'+nm.main+'</span><span class="nm">'+nm.sub+'</span></span></button>'+
    '<div style="min-width:0">'+(Fav.has(s.sid)?'<div class="pks"><span class="pk fav">★ '+tr('Favourite','Favorit')+'</span></div>':'')+sum+pkHard(s,g.cands[0].ev)+'</div></div>'+
    '<div class="cvsub">'+shown.map(cvRow).join('')+
    (no.length?'<div class="cvno"><span class="vd no" aria-hidden="true">✕</span>'+esc(tr(no.length+' do not fit: ',no.length+' passar inte: ',no.length+' passen niet: '))+no.map(r=>cvLabel(r.x)+' <small>('+esc(failed(r))+')</small>').join(', ')+'</div>':'')+
    (unk.length?'<div class="cvno"><span class="vd" aria-hidden="true">?</span>'+esc(tr(unk.length+' without data for this spot: ',unk.length+' utan uppgifter för platsen: ',unk.length+' zonder gegevens voor deze plek: '))+unk.map(r=>cvLabel(r.x)).join(', ')+'</div>':'')+
    '</div></div>';
}
// Table: USDA zones with their temperatures, the RHS ratings and (approximately) the Swedish zones that match.
function buildHardTab(){
  const el=$('#hardTab');if(!el||el.dataset.lang===state.lang)return;el.dataset.lang=state.lang;
  const ov=(a,b,c,d)=>Math.min(b,d)-Math.max(a,c)>0.5;
  // Rows: 5 °C bands of the lowest winter temperature; each column lists the zones or ratings that fall in that band.
  const B=[[-99,-45]];for(let t=-45;t<15;t+=5)B.push([t,t+5]);B.push([15,99]);
  const uz=[];for(let n=1;n<=13;n++)['a','b'].forEach(h=>{const lo=n===1&&h==='a'?-99:usdaLo(n,h),nx=h==='a'?usdaLo(n,'b'):(n===13?99:usdaLo(n+1,'a'));uz.push({k:n+h,lo,hi:nx})});
  const rows=B.slice().reverse().map(([lo,hi])=>{
    const us=uz.filter(z=>ov(lo,hi,z.lo,z.hi)).map(z=>z.k),rh=RHS.filter(r=>ov(lo,hi,r.lo==null?-99:r.lo,r.hi==null?99:r.hi)).map(r=>r.k);
    const t=lo===-99?'< '+fmtC(hi):hi===99?'> '+fmtC(lo):String(lo).replace('-','−')+' … '+fmtC(hi);
    return '<tr><th scope="row">'+t+'</th><td>'+esc(us.join(', ')||'–')+'</td><td>'+esc(rh.join(', ')||'–')+'</td></tr>'});
  el.innerHTML='<summary>'+esc(tr('Hardiness zones compared','Härdighetszoner jämförda','Winterhardheidszones vergeleken'))+'</summary>'+
    '<div class="tbl"><table class="cmpt hardtab"><thead><tr><th scope="col">'+esc(tr('Lowest winter temperature','Lägsta vintertemperatur','Laagste wintertemperatuur'))+'</th><th scope="col">'+esc(tr('USDA zone','USDA-zon','USDA-zone'))+'</th><th scope="col">RHS (UK)</th></tr></thead><tbody>'+rows.join('')+'</tbody></table></div>'+
    '<p class="muted" style="font-size:13px;margin:6px 0 0">'+esc(tr('USDA zones and RHS ratings are defined by the lowest winter temperature (each USDA zone is split into a and b halves of about 3 °C). Swedish growing zones are not: they also reflect the growing season, so they are not converted to temperatures. Pick a plant checks the winter temperature against a species’ USDA zone (or else its RHS rating) and its proven hardiness, and the Swedish zone against its Swedish zone, separately. In a range such as USDA 2-7 the coldest zone counts.','USDA-zoner och RHS-klasser definieras av lägsta vintertemperatur (varje USDA-zon delas i a- och b-halvor på ungefär 3 °C). Svenska odlingszoner gör det inte: de speglar också växtsäsongen, så de räknas inte om till temperaturer. Välj en växt jämför vintertemperaturen med artens USDA-zon (annars RHS-klass) och bevisade härdighet, och den svenska zonen med artens svenska zon, var för sig. I ett spann som USDA 2-7 räknas den kallaste zonen.','USDA-zones en RHS-klassen worden bepaald door de laagste wintertemperatuur (elke USDA-zone is verdeeld in a- en b-helften van ongeveer 3 °C). Zweedse groeizones niet: die weerspiegelen ook het groeiseizoen, dus ze worden niet omgerekend naar temperaturen. Kies een plant vergelijkt de wintertemperatuur met de USDA-zone (anders RHS-klasse) en bewezen winterhardheid van een soort, en de Zweedse zone met zijn Zweedse zone, elk apart. Bij een bereik zoals USDA 2-7 telt de koudste zone.'))+'</p>';
}
function updatePick(){
  updateCmpBar();pickScopeSel();buildHardTab();
  $$('#pickLight [data-pl]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.pl===pickState.light));
  $$('#pickMoist [data-pm]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.pm)===pickState.moist));
  $$('#pickSoil [data-ps]').forEach(b=>b.setAttribute('aria-pressed',pickState.soil.has(b.dataset.ps)));
  $$('#pickForm [data-pf]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.pf===pickState.form));
  const pc=$('#pickCv');if(pc)pc.checked=pickState.cv;
  buildPickAdv();
  pickSave();
  {const ps=$('#pickTemp');if(ps&&ps.dataset.lang!==state.lang){ps.dataset.lang=state.lang;ps.innerHTML='<option value="">–</option>'+[-50,-45,-40,-35,-30,-25,-20,-15,-10,-5,0].map(t=>'<option value="'+t+'">'+fmtC(t)+' (USDA '+usdaOfT(t)+')</option>').join('')}if(ps&&pickState.temp!==''&&![...ps.options].some(o=>o.value===String(pickState.temp))){const o=document.createElement('option');o.value=String(pickState.temp);o.textContent=fmtC(Number(pickState.temp))+' (USDA '+usdaOfT(Number(pickState.temp))+')';o.dataset.extra='1';ps.appendChild(o)}if(ps)ps.value=pickState.temp;pkGeoShow();const pz=$('#pickZone');if(pz)pz.value=pickState.zone}
  const any=pickState.light||pickState.moist||pickState.soil.size||pickState.zone||pickState.temp!==''||advCount();
  {const j=$('#pickJump');if(j)j.hidden=true}
  if(!any){$('#pickOut').innerHTML='<div class="empty"><p>'+tr('Describe the spot above: light, moisture, soil and zone. Leave out what you do not know. Advanced filters narrow it down further.','Beskriv platsen ovan: ljus, fukt, jord och zon. Hoppa över det du inte vet. Avancerade filter begränsar urvalet ytterligare.','Beschrijf de plek hierboven: licht, vocht, grond en zone. Laat weg wat je niet weet. Geavanceerde filters beperken de keuze verder.')+'</p></div>';return}
  const pool=species.filter(x=>(!pickState.form||x.form===pickState.form)&&pickInScope(x));
  const scoped=!!pickState.scope;
  if(scoped&&!pool.length){$('#pickOut').innerHTML='<div class="empty"><p>'+(pickState.scope==='fav'?tr('You have no favourites yet. Star species in the species list or on a sheet.','Du har inga favoriter än. Stjärnmärk arter i artlistan eller på ett blad.'):tr('This list has no species yet.','Den här listan har inga arter än.'))+'</p></div>';return}
  // Each species is judged by its best fit: the species itself or any of its cultivars.
  const adv=advCount();
  const groups=pool.map(s=>{const cands=[s].concat(s.cvs).filter(x=>!adv||advCheck(x)).map(pickScore);return cands.length?{s,cands,best:cands.slice().sort(byFit)[0]}:null}).filter(Boolean);
  const good=groups.filter(g=>g.best.cls==='ok').sort((a,b)=>(b.best.both?1:0)-(a.best.both?1:0)||a.best.unk-b.best.unk||(b.best.x.m.verdict||0)-(a.best.x.m.verdict||0)||byName(a.s,b.s));
  const close=groups.filter(g=>g.best.cls==='close'&&(scoped||Fav.has(g.s.sid))).sort((a,b)=>a.best.no-b.best.no||byName(a.s,b.s));
  const sec=(title,rows,empty)=>'<h2 class="hsec">'+title+' <em>'+rows.length+'</em></h2>'+(rows.length?'<div class="splist">'+rows.map(pickGroup).join('')+'</div>':'<p class="muted">'+empty+'</p>');
  const hint='<p class="cmphint"><span class="cmpbox" aria-hidden="true"></span>'+esc(tr('Tick “Compare” on two or more species or cultivars (up to 40) to see them in one table.','Kryssa i ”Jämför” på två eller fler arter eller sorter (upp till 40) för att se dem i en tabell.','Vink “Vergelijken” aan bij twee of meer soorten of cultivars (tot 40) om ze in één tabel te zien.'))+'</p>';
  {const j=$('#pickJump'),n=good.length+close.length;if(j){j.hidden=!n;j.textContent=tr('Show '+n+' matches ↓','Visa '+n+' träffar ↓','Toon '+n+' resultaten ↓')}}
  $('#pickOut').innerHTML=hint+sec(trh('Good matches','Bra matchningar'),good,tr('No species match everything yet. Try leaving out a condition.','Inga arter matchar allt ännu. Prova att hoppa över ett villkor.'))+
    sec(scoped?trh('Could work with some help','Kan fungera med lite hjälp'):trh('Favourites that could work with some help','Favoriter som kan fungera med lite hjälp'),close,scoped?tr('None of these species are a near miss for this spot.','Ingen av dessa arter är nära att passa här.'):tr('None of your favourites are a near miss for this spot.','Ingen av dina favoriter är nära att passa här.'))+
    '<p class="muted" style="font-size:13px">'+tr('A “?” means the species has no data for that condition yet; it still counts as a match on the rest. Cold is checked twice, separately: the Swedish zone against the species’ Swedish zone, and the winter temperature against its USDA zone (or RHS rating) and proven hardiness, whichever is hardier. Either match is enough; species that fit both are listed first and get the snowflake mark. A species with cultivars is listed when the species itself or at least one cultivar fits; each cultivar is judged on its own values plus what it inherits from the species.','Ett ”?” betyder att arten saknar uppgift för det villkoret; den räknas ändå som matchning på resten. Kylan kontrolleras två gånger, var för sig: den svenska zonen mot artens svenska zon, och vintertemperaturen mot dess USDA-zon (eller RHS-klass) och bevisade härdighet, det som är härdigast. Det räcker att en av dem passar; arter som passar båda visas först och får snöflingemärket. En art med sorter visas när arten själv eller minst en sort passar; varje sort bedöms på sina egna värden plus det den ärver från arten.','Een “?” betekent dat de soort voor die voorwaarde nog geen gegevens heeft; hij telt dan op de rest als match. Kou wordt twee keer apart gecontroleerd: de Zweedse zone tegen de Zweedse zone van de soort, en de wintertemperatuur tegen zijn USDA-zone (of RHS-klasse) en bewezen winterhardheid, wat het winterhardst is. Eén match is genoeg; soorten die bij beide passen staan bovenaan en krijgen het sneeuwvlokteken. Een soort met cultivars wordt getoond als de soort zelf of minstens één cultivar past; elke cultivar wordt beoordeeld op zijn eigen waarden plus wat hij van de soort erft.')+'</p>';
}
