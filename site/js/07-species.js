// Artblad: Species card, overview, Add/Edit form and its draft, sheet view.
// Part 7 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- species card ---------- */
function cardHTML(s){
  const m=s.m,w=s.form==='w',lang=state.lang;
  const L=(en,sv)=>lang==='en'?esc(en):lang==='sv'?esc(sv):lang==='nl'?esc(nl(en)):esc(en)+' <em>'+esc(sv)+'</em>';
  const arr=k=>Array.isArray(m[k])?m[k]:(m[k]?[m[k]]:[]);
  const inh=k=>!!s.isCv&&[].concat(k).every(x=>isEmpty(s.own[x]));
  const sTag=k=>{const bs=[...new Set([].concat(k||[]).flatMap(x=>(s.srcOf||{})[x]||[]))];return bs.length?' <span class="srct" title="'+esc(tr('Filled in by Artie (bot) from ','Ifyllt av Artie (bot) från ','Ingevuld door Artie (bot) uit ')+bs.map(srcName).join(', '))+'">'+esc(bs.map(srcShort).join(', '))+'</span>':''};
  const P=(opts,k)=>{const a=arr(k),h=opts.filter(o=>a.indexOf(o.k)>=0);return h.length?'<div class="pills'+(inh(k)?' inh':'')+'">'+h.map(o=>'<span class="pill">'+L(o.en,o.sv)+'</span>').join('')+sTag(k)+'</div>':''};
  const KV=(en,sv,v,k)=>v?'<div class="kv'+(k&&inh(k)?' inh':'')+'"><div class="k">'+L(en,sv)+'</div><div class="v">'+v+sTag(k)+'</div></div>':'';
  const T=k=>m[k]?esc(m[k]):'';
  const N=(k,u)=>m[k]!=null?esc(m[k])+' '+(u||unitOf(DEF[k],s.form)||''):'';
  const B=(en,sv,inner,sec)=>inner.trim()?'<section class="blk"><h3>'+L(en,sv)+(sec?smark(s.sid,sec):'')+'</h3>'+inner+'</section>':'';
  const typeO=TYPES_ALL.find(o=>o.k===m.type),statO=STATUS.find(o=>o.k===m.status),invO=INV.find(o=>o.k===m.invasive);
  const size=(m.height!=null||m.spread!=null)?esc(m.height!=null?m.height:'?')+' × '+esc(m.spread!=null?m.spread:'?')+' '+unitOf(DEF.height,s.form):'';
  const nat=(m.nativeH!=null||m.nativeW!=null)?esc(m.nativeH!=null?m.nativeH:'?')+' × '+esc(m.nativeW!=null?m.nativeW:'?')+' m':'';
  const pv=provenOf(s);
  const blocks=[
   ['Origin','Ursprung',P(REGIONS,'region')+KV('Native size','Naturlig storlek',nat,['nativeH','nativeW'])+KV('Habitat','Miljö',T('habitat'),'habitat')+P(SUCC,'succession')+KV('Notes','Anm.',T('range'),'range')],
   ['Size & form','Storlek & form',P(O('annual:Can be grown as an annual:Kan odlas som ettårig'),'asAnnual')+KV('Size','Storlek',size,['height','spread'])+KV('Spacing','Avstånd',m.spacing!=null?N('spacing'):'','spacing')+P(w?CROWN:HABIT,w?'crown':'habit')+P(w?ROOTS_W:ROOTS_H,'roots')+P(w?LEAF:DORM,w?'leaf':'dormant')+KV('Lifespan','Livslängd',N('lifespan'),'lifespan')+KV(w?'First yield':'Sow→harvest',w?'Första skörd':'Sådd→skörd',w?N('firstYield'):N('sowHarvest'),['firstYield','sowHarvest'])+KV('Product','Produkt',T('product'),'product')],
   ['Site','Plats',(pv?KV('Proven hardy','Bevisat härdig',esc(provenTxt(pv))):'')+P(LIGHT,'light')+(m.moist?KV('Moisture','Fukt',dots(m.moist,5)+' <em>'+L('dry→wet','torr→blöt').replace(/<[^>]+>/g,'')+'</em>','moist'):'')+P(SOIL,'soil')+P(PH,'ph')+P(TOL,'tol')+KV('Zones','Zoner',[m.usda&&'USDA '+esc(m.usda),m.szone&&'SE '+esc(m.szone),m.rhs&&'RHS '+esc(m.rhs)].filter(Boolean).join(' · '),['usda','szone','rhs'])],
   ['Calendar & care','Kalender & skötsel',yearWheel(s)+(()=>{const rows=['cal1','cal2','cal3','cal4'].filter(k=>(m[k]||[]).length);if(!rows.length)return '';return rows.map(k=>'<div class="fl" style="margin-top:4px">'+L(CAL_LAB[k][s.form][0],CAL_LAB[k][s.form][1])+'</div><div class="cal'+(inh(k)?' inh':'')+'">'+MONTHS.map((x,i)=>'<span class="'+(m[k].indexOf(i+1)>=0?'on':'')+'">'+x+'</span>').join('')+'</div>').join('')})()+P(w?PROP_W:PROP_H,'prop')+P(w?POLL:SOWING,w?'poll':'sowing')+P(EFFORT,'effort')+P(ESTAB,'estab')+KV('Watch-outs','Se upp',T('watch'),'watch')],
   ['Uses','Användning',P(w?USES_W:USES_H,'uses')+P(YIELD,'yield')+KV('Edibility','Ätlighet',isEmpty(m.edibility)?'':Number(m.edibility)===0?L('Inedible','Oätlig'):dots(m.edibility,5),'edibility')+KV('Edible / notes','Ätligt',T('edible'),'edible')],
   ['Ecosystem functions','Ekosystemfunktioner',P(w?ECO_W:ECO_H,'eco')+KV('Notes','Anm.',T('ecoNotes'),'ecoNotes')],
   ['Placement','Placering',layerDiagram(s)+P(LAYER,'layer')+P(ROLE,'role')+P(STRUCT,'struct')+KV('Good with','Passar med',T('goodWith'),'goodWith')+KV('Avoid near','Undvik nära',T('avoid'),'avoid')],
   ['Cautions & sources','Varningar & källor',P(CAUT,'caut')+KV('Sources','Källor',m.sources?T('sources')+smark(s.sid,'sources'):'','sources')]
  ];
  const missing=blocks.filter(b=>!b[2].trim()).map(b=>b[0]);
  const conf=s.conf.length?'<p class="note"><b>'+L('Entries disagree','Posterna skiljer sig')+'.</b> '+s.conf.map(c=>{const d=DEF[c.k];const f=v=>d.t==='single'?((optsOf(d,s.form).find(o=>o.k===v)||{}).en||v):v;return esc(d.en)+': '+esc(f(c.cur))+' (newest), earlier '+c.olds.map(o=>esc(f(o.v))+' '+esc(o.date||'')).join(', ')}).join('; ')+'. The newest entry is used.</p>':'';
  // Outside sources that differ: one closed line (click to open), then one short line per field.
  const sconf=(()=>{const list=s.sconf||[];if(!list.length)return '';
    const f=(d,v)=>Array.isArray(v)?v.map(x=>labOf(d,s.form,x)).join(', '):labOf(d,s.form,v);
    const keys=[...new Set(list.map(c=>c.k))],lab=k=>trs(DEF[k].en,DEF[k].sv);
    const head=tr('Outside sources differ on ','Externa källor skiljer sig för ','Externe bronnen wijken af bij ')+keys.length+' '+(keys.length===1?tr('field','fält','veld'):tr('fields','fält','velden'))+' ('+keys.map(lab).join(', ')+')';
    return '<details class="note srcnote"><summary>'+esc(head)+'</summary><ul>'+list.map(c=>'<li>'+esc(lab(c.k))+': '+esc(srcShort(c.by))+' '+esc(f(DEF[c.k],c.v))+'</li>').join('')+'</ul><small class="muted">'+esc(tr('The values shown above are used: people’s entries always come first.','Värdena ovan används: personers poster går alltid först.','De waarden hierboven worden gebruikt: invoer van mensen gaat altijd voor.'))+'</small></details>'})();
  const img=s.cover?'<img src="'+blobSrc(s.cover)+'" alt="" data-lb="'+s.cover+'">':phIcon(s);
  return '<article class="card" style="--c:'+FCOL[s.form]+'">'+starBtn(s.sid)+'<div class="chead"><div class="ph" style="--c:'+FCOL[s.form]+'">'+img+'</div><div style="min-width:0"><div class="lat">'+names(s).main+'</div>'+
    '<div class="nm">'+names(s).sub+(m.family?' · '+esc(m.family):'')+smark(s.sid,'ident')+'</div>'+pictos(s)+
    '<div class="meta"><span class="pill t" style="--c:'+FCOL[s.form]+'">'+(typeO?L(typeO.en,typeO.sv):(w?L('Woody','Vedartad'):L('Herbaceous','Örtartad')))+'</span>'+(statO?'<span class="pill">'+L(statO.en,statO.sv)+'</span>':'')+(s.ex?'<span class="pill ex">'+L('Example','Exempel')+'</span>':'')+
    (m.verdict?'<span>'+dots(m.verdict,5)+'</span>':'')+(invO?'<span>'+L('Invasive risk','Invasionsrisk')+': '+L(invO.en,invO.sv)+sTag('invasive')+'</span>':'')+'<span>'+L('No.','Nr')+' '+esc(s.no)+' · '+s.entries.length+' '+(s.entries.length===1?L('entry','post'):L('entries','poster'))+'</span></div></div></div>'+
    (s.isCv?'<p class="cvnote">'+tr('Cultivar of ','Sort av ','Cultivar van ')+'<button type="button" class="lnk" data-open="'+esc(s.sid)+'"><i>'+esc(s.latin)+'</i></button>. '+tr('Grey values come from the species; the others are this cultivar’s own.','Grå värden kommer från arten; de andra gäller just den här sorten.','Grijze waarden komen van de soort; de andere zijn van deze cultivar zelf.')+'</p>':'')+'<div class="cbody">'+blocks.map((b,i)=>B(b[0],b[1],b[2],['origin','size','site','cal','uses','eco','place','verdict'][i])).join('')+'</div>'+extLinks(s)+artieBtn(s)+speciesStamp(s)+conf+sconf+(missing.length?'<div class="missing">'+L('Not yet filled','Saknas')+': '+missing.join(', ')+'</div>':'')+'</article>';
}

/* ---------- overview ---------- */
const FILTERS=[['type','Type','Typ',TYPES_ALL],['status','Status','Status',STATUS],['light','Light','Ljus',LIGHT],['layer','Layer','Skikt',LAYER],['struct','Structure','Struktur',STRUCT],['eco','Functions','Funktioner',ECO_ALL],['uses','Uses','Användning',USES_ALL],['tol','Tolerates','Tål',TOL]];
function buildFilters(){
  $('#fltBody').innerHTML='<div class="fgrp"><span class="fl">'+trh('Favourites','Favoriter')+'</span><div class="chips"><button type="button" class="chip sm" data-favonly aria-pressed="false"><i></i><span>'+trh('Only my favourites','Endast mina')+'</span></button></div></div><div class="fgrp"><span class="fl">'+trh('Form','Typ av växt')+'</span><div class="chips">'+
    [['',trh('All','Alla')],['w',trh('Woody','Vedartad')],['h',trh('Herbaceous','Örtartad')]].map(a=>'<button type="button" class="chip sm" data-form="'+a[0]+'" aria-pressed="'+(a[0]===state.fForm)+'"><i></i><span>'+a[1]+'</span></button>').join('')+'</div></div>'+
    FILTERS.map(f=>'<div class="fgrp"><span class="fl">'+trh(f[1],f[2])+'</span><div class="chips">'+f[3].map(o=>'<button type="button" class="chip sm" data-fk="'+f[0]+'" data-fv="'+o.k+'" aria-pressed="false"><i></i><span>'+labUI(o)+'</span></button>').join('')+'</div></div>').join('')+
    '<button type="button" class="btn sm" id="fltClear">'+tr('Clear filters','Rensa filter')+'</button><div style="height:12px"></div>';
}
function matches(s){
  if(state.fForm&&s.form!==state.fForm)return false;
  if(state.favOnly&&!Fav.has(s.sid))return false;
  if(state.q&&!textHit(s,state.q))return false;
  if(state.listId){const L=(state.lists||[]).find(l=>l.id===state.listId);if(!L||(L.sids||[]).indexOf(s.sid)<0)return false}
  for(const t of state.flt){const i=t.indexOf(':'),k=t.slice(0,i),v=t.slice(i+1),x=s.m[k];if(!(Array.isArray(x)?x.indexOf(v)>=0:x===v))return false}
  return true;
}
function spRow(s){
  const m=s.m,w=s.form==='w',typeO=TYPES_ALL.find(o=>o.k===m.type);
  const ecoO=(w?ECO_W:ECO_H).filter(o=>(m.eco||[]).indexOf(o.k)>=0);
  const size=m.height!=null?m.height+(m.spread!=null?'×'+m.spread:'')+' '+unitOf(DEF.height,s.form):'';
  const lights=LIGHT.filter(o=>(m.light||[]).indexOf(o.k)>=0).map(o=>trs(o.en,o.sv)).join('/');
  const sel=cmpMode?'<label class="cmpchk" title="'+esc(tr('Select to compare','Välj för jämförelse'))+'"><input type="checkbox" data-cmpsel="'+esc(s.sid)+'"'+(cmp.indexOf(s.sid)>=0?' checked':'')+' aria-label="'+esc(tr('Compare','Jämför')+' '+dispName(s))+'"></label>':'';
  return '<div class="spw'+(cmpMode?' sel':'')+'">'+sel+'<button type="button" class="sp" data-sid="'+esc(s.sid)+'"><div class="ph" style="--c:'+FCOL[s.form]+'">'+phInner(s,1)+'</div>'+
    '<div style="min-width:0"><div class="lat">'+names(s).main+'</div><div class="nm">'+names(s).sub+'</div>'+pictos(s,6)+
    (()=>{const c=state.q&&!textHit(Object.assign({},s,{cvs:[]}),state.q)&&cvHit(s,state.q);return c?'<div class="nm cvmatch">'+esc(tr('matches ','träff: ','komt overeen: '))+'<b>'+esc(cvQ(c.cv))+'</b></div>':''})()+
    '<div class="meta"><span class="pill t" style="--c:'+FCOL[s.form]+'">'+(typeO?trh(typeO.en,typeO.sv):(w?trh('Woody','Vedartad'):trh('Herbaceous','Örtartad')))+'</span>'+(size?'<span>'+esc(size)+'</span>':'')+(lights?'<span>'+esc(lights)+'</span>':'')+(s.ex?'<span class="pill ex">'+tr('Example','Exempel')+'</span>':'')+(s.cvs.length?'<span class="pill cvp">'+s.cvs.length+' '+esc(s.cvs.length===1?tr('cultivar','sort','cultivar'):tr('cultivars','sorter','cultivars'))+'</span>':'')+'</div>'+
    (ecoO.length?'<div class="pills" style="margin-top:6px">'+ecoO.slice(0,4).map(o=>'<span class="pill">'+esc(trs(o.en,o.sv))+'</span>').join('')+(ecoO.length>4?'<span class="pill">+'+(ecoO.length-4)+'</span>':'')+'</div>':'')+'</div>'+
    '<div class="side">'+(m.verdict?dots(m.verdict,5):'')+'<span class="cline">'+cbar(s)+'</span><span>'+s.entries.length+'×'+(s.obs.length?' · '+s.obs.length+' obs':'')+'</span></div></button>'+starBtn(s.sid)+'</div>';
}
function updateOverview(){
  const exN=species.filter(s=>s.ex).length;
  $('#rmEx').hidden=!exN;
  const photos=state.obs.filter(o=>o.photo).length+species.filter(s=>s.m.photo).length;
  $('#ovStats').textContent=!loaded?tr('Loading…','Laddar…'):[species.length+' '+trs('species','arter'),state.entries.length+' '+trs('entries','poster'),state.obs.length+' '+trs('observations','observationer'),photos+' '+trs('photos','foton')].join(' · ');
  const n=state.flt.size+(state.fForm?1:0)+(state.favOnly?1:0);const b=$('#fltN');b.hidden=!n;b.textContent=n;
  $$('#fltBody [data-fk]').forEach(el=>el.setAttribute('aria-pressed',state.flt.has(el.dataset.fk+':'+el.dataset.fv)));
  $$('#fltBody [data-form]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.form===state.fForm));
  $$('#fltBody [data-favonly]').forEach(el=>el.setAttribute('aria-pressed',state.favOnly));
  let list=species.filter(matches);
  const so=state.sort;
  list.sort((a,b)=>so==='fav'?(Number(Fav.has(b.sid))-Number(Fav.has(a.sid)))||a.latin.localeCompare(b.latin):so==='recent'?b.updated-a.updated:so==='verdict'?(b.m.verdict||0)-(a.m.verdict||0)||a.latin.localeCompare(b.latin):so==='no'?a.created-b.created:byName(a,b));
  updateCmpBar();
  const LF=state.listId&&listById(state.listId);$('#listFilter').hidden=!LF;if(LF)$('#listFilterName').textContent=LF.name;
  const el=$('#ovList');
  const nList=list.length;$$('[data-act=export-sheets],[data-act=print-sheets]').forEach(b=>{b.disabled=!nList;const c=b.querySelector('.n');if(c)c.textContent=nList});
  if(!loaded){el.innerHTML='<div class="empty"><p>Loading species…</p></div>';return}
  if(!species.length){el.innerHTML='<div class="empty"><h2>No species yet <em>Inga arter ännu</em></h2><p>Add a species with the form. Entries for the same Latin name are merged into one fact sheet, so you can come back and add information over time.</p><button class="btn primary w-only" data-act="goto-add">Add the first species · Lägg till</button></div>';return}
  el.classList.toggle('grid',store.get('ab.view')==='grid'&&!cmpMode);
  el.innerHTML=list.length?list.map(store.get('ab.view')==='grid'&&!cmpMode?spTile:spRow).join(''):'<div class="empty"><p>'+(state.favOnly&&!species.some(s=>Fav.has(s.sid))?tr('No favourites yet. Tap the star on a species to add one.','Inga favoriter ännu. Tryck på stjärnan vid en art för att lägga till.'):tr('No species match these filters.','Inga arter matchar filtren.'))+'</p></div>';
}

/* ---------- form ---------- */
let draft={},draftForm='w',editId=null,pendingPhoto=null,formBuilt=false;
const isOn=(d,k)=>{const v=draft[d.k];return d.t==='multi'||d.t==='cal'?(v||[]).indexOf(k)>=0:v===k};
const chipBtn=(d,o)=>'<button type="button" class="chip" data-k="'+d.k+'" data-v="'+o.k+'" aria-pressed="'+isOn(d,o.k)+'"><i></i><span>'+labUI(o)+'</span></button>';
function fieldHTML(d){
  const lbl=trh(d.en,d.sv||d.en),v=draft[d.k],u=unitOf(d,draftForm);
  if(d.t==='text'&&d.zone)return '<label class="f"><span class="fl">'+lbl+'</span><input type="text" data-k="'+d.k+'" value="'+esc(v||'')+'" inputmode="text" autocomplete="off"><span class="hint" data-zh="'+d.k+'">'+esc(zoneHint(d,v))+'</span></label>';
  if(d.t==='text')return d.cat?'<label class="f wide"><span class="fl">'+lbl+'</span><textarea rows="2" data-k="'+d.k+'">'+esc(v||'')+'</textarea></label>':'<label class="f"><span class="fl">'+lbl+'</span><input type="text" data-k="'+d.k+'" value="'+esc(v||'')+'"></label>';
  if(d.t==='num')return '<label class="f"><span class="fl">'+lbl+(u?' <b>('+u+')</b>':'')+'</span><input type="number" inputmode="decimal" step="any" data-k="'+d.k+'" value="'+esc(v==null?'':v)+'">'+(d.unit&&typeof d.unit==='object'?'<span class="hint">'+esc(tr('Woody plants in metres, herbaceous in centimetres.','Vedartade växter i meter, örtartade i centimeter.','Houtige planten in meter, kruidachtige in centimeter.'))+'</span>':'')+'</label>';
  if(d.t==='scale')return '<div class="fg"><div class="fl">'+lbl+'</div><div class="scale">'+[1,2,3,4,5].map(n=>'<button type="button" class="sc" data-k="'+d.k+'" data-v="'+n+'" aria-pressed="'+(Number(v)===n)+'">'+n+'</button>').join('')+(d.none?'<button type="button" class="chip sm scnone" data-k="'+d.k+'" data-v="0" aria-pressed="'+(v!=null&&v!==''&&Number(v)===0)+'"><i></i><span>'+trh(d.none[0],d.none[1])+'</span></button>':'')+'</div><div class="scap"><span>'+trh(d.cap[0][0],d.cap[0][1])+'</span><span>'+trh(d.cap[1][0],d.cap[1][1])+'</span></div></div>';
  if(d.t==='cal'){const lb=d.lab[draftForm];return '<div class="fg"><div class="fl">'+trh(lb[0],lb[1])+'</div><div class="months">'+MONTHS.map((x,i)=>'<button type="button" class="mc" style="--c:'+FCOL[draftForm]+'" data-k="'+d.k+'" data-v="'+(i+1)+'" aria-label="'+MONTH_NAMES[i]+'" aria-pressed="'+((v||[]).indexOf(i+1)>=0)+'">'+x+'</button>').join('')+'</div></div>'}
  return '<div class="fg"><div class="fl">'+lbl+'</div><div class="chips">'+optsOf(d,draftForm).map(o=>chipBtn(d,o)).join('')+'</div></div>';
}
function secCount(sec){return sec.f.filter(d=>(!d.only||d.only===draftForm)&&!isEmpty(draft[d.k])).length}
function buildForm(){
  formBuilt=true;
  const wide=window.matchMedia('(min-width:720px)').matches;
  const id='<div class="idbox"><div class="fields">'+
    '<label class="f wide"><span class="fl">'+trh('Latin name','Latinskt namn')+' *</span><input id="latin" type="text" data-k="latin" list="spNames" autocapitalize="off" spellcheck="false" placeholder="'+tr('e.g.','t.ex.').replace(/ · .*/,'')+' Hippophae rhamnoides" value="'+esc(draft.latin||'')+'"'+(draft._snap?' readonly title="'+esc(tr('Use Rename to change the name','Använd Byt namn för att ändra namnet'))+'"':'')+'><span id="latHint" class="hint"></span><span id="gbifHint" class="hint gbif" hidden></span></label>'+
    ['en','sv','nl','family'].map(k=>fieldHTML(DEF[k])).join('')+
    '<div class="f wide cvf"><label class="fl" for="cvSel">'+trh('Cultivar','Sort','Cultivar')+'</label><select id="cvSel"></select><input id="cvNew" type="text" maxlength="80" autocomplete="off" spellcheck="false" hidden placeholder="'+esc(tr('Cultivar name, e.g. Ingrid Marie','Sortnamn, t.ex. Ingrid Marie','Cultivarnaam, bijv. Ingrid Marie'))+'"><span id="cvHint" class="hint"></span></div>'+
    '<label class="f"><span class="fl">'+trh('Entry date','Datum')+'</span><input type="date" id="entDate" value="'+esc(draft._date||today())+'"></label>'+
    '<div class="fg"><div class="fl">'+trh('Type · woody','Typ · vedartad')+'</div><div class="chips">'+TYPES_W.map(o=>chipBtn(DEF.type,o)).join('')+'</div></div>'+
    '<div class="fg"><div class="fl">'+trh('Type · herbaceous','Typ · örtartad')+'</div><div class="chips">'+TYPES_H.map(o=>chipBtn(DEF.type,o)).join('')+'</div></div>'+
    fieldHTML(DEF.status)+
    '<div class="f wide ph-only"><label class="fl" for="entPhoto">'+trh('Photo','Foto')+'</label><input id="entPhoto" type="file" accept="image/*"><span class="hint" id="photoHint">'+(draft.photo?tr('A photo is already attached to this entry.','Ett foto finns redan på den här posten.'):tr('Shown on the card and the printed sheet.','Visas på kortet och det utskrivna bladet.'))+'</span></div>'+
    '</div></div>';
  $('#form').innerHTML=id+SEC.map((sec,i)=>'<details class="sec" data-sec="'+sec.id+'"'+(wide||i===0?' open':'')+'><summary>'+(state.lang==='both'?esc(sec.en)+' <em style="font:400 13px var(--ui)">'+esc(sec.sv)+'</em>':esc(trs(sec.en,sec.sv)))+(SPECIES_ONLY.indexOf(sec.f[0].k)>=0?'<small class="sponly">'+esc(tr('always for the whole species','gäller alltid hela arten','geldt altijd voor de hele soort'))+'</small>':'')+'<span class="n" data-n="'+sec.id+'"></span></summary><div class="fields">'+sec.f.filter(d=>(!d.only||d.only===draftForm)&&!d.hide).map(fieldHTML).join('')+'</div></details>').join('');
  updateCounts();updateHint();
}
// The cultivar picker on the form: the species, its known cultivars, or a new name.
function updateCvField(){
  const sel=$('#cvSel');if(!sel)return;
  const s=bySid.get(slug(canon(draft.latin||''))),k=draft.cultivar?cvKey(draft.cultivar):'',known=s&&s.cvs.find(c=>c.ck===k),inp=$('#cvNew');
  sel.innerHTML=cvOptions(s,'',tr('Species (all cultivars)','Arten (alla sorter)','Soort (alle cultivars)'));
  sel.value=known&&!draft._cvNew?k:(k||draft._cvNew?'__new':'');
  if(sel.value==='__new'){draft._cvNew=true;inp.hidden=false;if(document.activeElement!==inp)inp.value=draft.cultivar||''}else inp.hidden=true;
  cvHint();
}
function cvHint(){
  const el=$('#cvHint');if(!el)return;const n=cvNorm(draft.cultivar||''),s=bySid.get(slug(canon(draft.latin||'')));
  $('#form').classList.toggle('hascv',!!n);
  if(!n){el.className='hint';el.textContent=draft._cvNew?tr('Type the cultivar name without quotes.','Skriv sortnamnet utan citattecken.','Typ de cultivarnaam zonder aanhalingstekens.'):tr('Leave on “Species” for facts that hold for every cultivar.','Låt ”Arten” stå kvar för uppgifter som gäller alla sorter.','Laat op “Soort” staan voor feiten die voor elke cultivar gelden.');return}
  const k=cvKey(n),ex=s&&s.cvs.find(c=>c.ck===k),near=!ex&&s&&s.cvs.map(c=>[c,lev(k,c.ck)]).filter(a=>a[1]<=2).sort((a,b)=>a[1]-b[1])[0];
  el.className=near?'hint warn':'hint ok';
  el.innerHTML=esc(tr('What you fill in applies only to '+cvQ(n)+'. Names, family, type and origin always describe the whole species.','Det du fyller i gäller bara '+cvQ(n)+'. Namn, familj, typ och ursprung gäller alltid hela arten.','Wat je invult geldt alleen voor '+cvQ(n)+'. Namen, familie, type en herkomst gelden altijd voor de hele soort.'))+
    (!ex&&draft._cvNew?' '+esc(tr('New cultivar.','Ny sort.','Nieuwe cultivar.')):'')+
    (near?' '+esc(tr('Similar existing cultivar:','Liknande befintlig sort:','Vergelijkbare bestaande cultivar:'))+' <button type="button" class="lnk" data-cvfill="'+esc(near[0].ck)+'">'+esc(cvQ(near[0].cv))+'</button>?':'');
}
function updateCounts(){draftKeep();SEC.forEach(sec=>{const el=$('[data-n="'+sec.id+'"]');if(el){const n=secCount(sec);el.textContent=n?n+' '+tr('filled','ifyllda'):''}})}
function updateHint(){
  updateCvField();
  {const a=$('.artie-hint a'),l=canon(draft.latin||'');if(a){const nw=l.split(' ').length>=2&&!bySid.get(slug(l));a.textContent=nw?tr('New species? Ask Artie (bot) to pre-fill '+l+'.','Ny art? Be Artie (bot) att förifylla '+l+'.','Nieuwe soort? Vraag Artie (bot) om '+l+' vooraf in te vullen.'):tr(...a.dataset.t.split('|'))}}
  const el=$('#latHint');if(!el)return;const v=(draft.latin||'').trim();
  if(!v){el.className='hint';el.textContent=tr('Genus and species, e.g. Malus domestica. Entries with the same name are merged.','Släkte och art, t.ex. Malus domestica. Poster med samma namn slås ihop.');return}
  const sid=slug(v),s=bySid.get(sid);
  if(s){el.className='hint ok';el.innerHTML=tr('Adds to','Läggs till')+' <i>'+esc(s.latin)+'</i> ('+s.entries.length+' '+(s.entries.length===1?tr('entry so far','post hittills'):tr('entries so far','poster hittills'))+')';return}
  const near=nearMatch(sid);
  el.className=near?'hint warn':'hint';el.innerHTML=tr('New species.','Ny art.')+(near?' '+tr('Similar existing name:','Liknande befintligt namn:')+' <button type="button" class="lnk" data-fill="'+esc(near.latin)+'"><i>'+esc(near.latin)+'</i></button>?':'');
}
function resetDraft(){draft={};draftBase='{}';draftForm='w';editId=null;pendingPhoto=null;$('#editBanner').hidden=true;draftClear();buildForm()}
/* ---------- the Add-form draft is kept on this device until it is saved or cleared ---------- */
const DKEY='ab.draft';
let draftBase='{}';
const draftFilled=()=>Object.keys(draft).some(k=>k[0]!=='_'&&k!=='latin'&&!isEmpty(draft[k])&&String(draft[k]).trim()!=='');
// Dirty = something was filled in that differs from how the form was opened.
const draftDirty=()=>!!pendingPhoto||(draftFilled()&&JSON.stringify(draft)!==draftBase);
let draftT;
function draftKeep(){clearTimeout(draftT);draftT=setTimeout(()=>{try{if(draftDirty())store.set(DKEY,JSON.stringify({draft,draftForm,editId,at:Date.now()}));}catch(e){}},300)}
function draftClear(){clearTimeout(draftT);try{localStorage.removeItem(DKEY)}catch(e){}$('#draftBox').hidden=true}
function draftOffer(){
  const box=$('#draftBox');if(!box)return;let d=null;try{d=JSON.parse(store.get(DKEY)||'null')}catch(e){}
  if(!d||!d.draft||draftDirty()){box.hidden=true;return}
  const nm=canon(d.draft.latin||'')||tr('a species without a name','en art utan namn','een soort zonder naam');
  box.hidden=false;box.innerHTML='<p>'+esc(tr('You have an unsaved draft for ','Du har ett osparat utkast för ','Je hebt een niet-opgeslagen concept voor '))+'<i>'+esc(nm)+'</i> ('+esc(fmtDate(d.at))+').</p><div class="acts"><button type="button" class="btn primary sm" data-act="draft-restore">'+esc(tr('Continue with it','Fortsätt med det','Ga ermee verder'))+'</button><button type="button" class="btn sm" data-act="draft-discard">'+esc(tr('Discard it','Släng det','Weggooien'))+'</button></div>';
}
function draftRestore(){let d=null;try{d=JSON.parse(store.get(DKEY)||'null')}catch(e){}if(!d)return;draft=d.draft||{};draftForm=d.draftForm||'w';editId=d.editId&&state.entries.some(e=>e.id===d.editId)?d.editId:null;
  $('#editBanner').hidden=!editId;if(editId){const e=state.entries.find(x=>x.id===editId);$('#editBanner').innerHTML='<span>'+esc(tr('Editing the entry from ','Redigerar posten från ','Bewerkt de invoer van '))+'<b>'+esc(e.date||'')+'</b> · <i>'+esc(e.latin)+'</i>.</span><button class="btn sm" type="button" data-act="cancel-edit">'+tr('Cancel','Avbryt')+'</button>'}
  $('#draftBox').hidden=true;buildForm();toast(tr('Draft restored. A photo has to be chosen again.','Utkastet återställt. Ett foto måste väljas igen.','Concept teruggezet. Een foto moet opnieuw gekozen worden.'))}
addEventListener('beforeunload',e=>{if(!$('#v-add').hidden&&draftDirty()){e.preventDefault();e.returnValue=''}});
function openAdd(opts){
  opts=opts||{};
  if(opts.entry){const e=opts.entry;draft={latin:e.latin,_date:e.date};draftForm=e.form||'h';editId=e.id;Object.keys(e.fields||{}).forEach(k=>{const v=e.fields[k];draft[k]=DEF[k]&&DEF[k].t==='num'?String(v):v});
    $('#editBanner').hidden=false;$('#editBanner').innerHTML='<span>Editing the entry from <b>'+esc(e.date||'')+'</b> for <i>'+esc(e.latin)+'</i>.</span><button class="btn sm" type="button" data-act="cancel-edit">'+tr('Cancel','Avbryt')+'</button>'}
  else if(opts.sheet){const sp=opts.sheet,hum=sp.entries.filter(e=>!isSrcEnt(e)),last=hum[hum.length-1],vals=sp.isCv?sp.own:(sp.hm||sp.m);
    draft={latin:sp.latin,_snap:true};draftForm=sp.form;editId=last&&last.snapshot?last.id:null;
    Object.keys(vals).forEach(k=>{const v=vals[k];if(!DEF[k]||k==='cultivar')return;draft[k]=DEF[k].t==='num'?String(v):Array.isArray(v)?v.slice():v});
    if(sp.isCv)draft.cultivar=sp.cv;
    $('#editBanner').hidden=false;$('#editBanner').innerHTML='<span>'+tr('Editing the whole sheet for ','Redigerar hela bladet för ')+'<i>'+esc(sp.latin)+'</i>'+(sp.isCv?' '+esc(cvQ(sp.cv))+' ('+esc(tr('only this cultivar’s own values','bara sortens egna värden','alleen de eigen waarden van deze cultivar'))+')':'')+'. '+tr('Saving replaces the combined values; earlier entries stay as history.','När du sparar ersätts de sammanslagna värdena; tidigare poster finns kvar som historik.')+'</span><button class="btn sm" type="button" data-act="cancel-edit">'+tr('Cancel','Avbryt')+'</button>'}
  else{draft={latin:opts.latin||'',cultivar:opts.cultivar||''};if(opts.cvNew)draft._cvNew=true;draftForm=opts.form||'w';editId=null;$('#editBanner').hidden=true}
  pendingPhoto=null;draftBase=JSON.stringify(draft);buildForm();go('add');
  if(opts.cvNew)setTimeout(()=>{const i=$('#cvNew');if(i)i.focus()},60);
  if(opts.gap){const sec=GAP_SEC[opts.gap];setTimeout(()=>{const d=sec&&$('#form details[data-sec="'+sec+'"]');const el=d||$('#form .idbox');if(d)d.open=true;if(el)el.scrollIntoView({block:'start',behavior:'smooth'})},80)}
}
async function saveForm(){
  const latin=canon(draft.latin||'');
  if(latin.split(' ').length<2){toast('Enter genus and species, e.g. Malus domestica.','err');$('#latin').focus();return}
  const fields={};
  Object.keys(DEF).forEach(k=>{const d=DEF[k];if(k==='photo'||k==='latin')return;if(d.only&&d.only!==draftForm)return;let v=draft[k];if(isEmpty(v))return;
    if(d.t==='num'){v=Number(v);if(!isFinite(v))return}else if(d.t==='scale')v=Number(v);else if(d.t==='text')v=d.zone?zoneNorm(v,d.zone):String(v).trim();else if(d.t==='cal'||d.t==='multi')v=v.slice();
    if(!isEmpty(v))fields[k]=v});
  if(draft.photo)fields.photo=draft.photo;
  delete fields.cultivar;
  {const n=cvNorm(draft.cultivar||''),sp=bySid.get(slug(latin)),ex=n&&sp&&sp.cvs.find(c=>c.ck===cvKey(n));
   if(draft._cvNew&&!n){toast(tr('Type the cultivar name, or choose “Species”.','Skriv sortnamnet, eller välj ”Arten”.','Typ de cultivarnaam, of kies “Soort”.'),'err');const i=$('#cvNew');if(i)i.focus();return}
   if(n)fields.cultivar=ex?ex.cv:n}
  const nsid=slug(latin),near=!editId&&!draft._snap&&!bySid.get(nsid)&&nearMatch(nsid);
  if(near&&!draft._nearOk){
    const box=$('#nearBox');box.hidden=false;setTimeout(()=>box.scrollIntoView({block:'center',behavior:'smooth'}),0);
    box.innerHTML='<p>'+tr('“'+latin+'” is not in the database yet, but “'+near.latin+'” is very similar. Is it the same species?','”'+latin+'” finns inte än, men ”'+near.latin+'” är mycket likt. Är det samma art?','“'+latin+'” staat nog niet in de database, maar “'+near.latin+'” lijkt er sterk op. Is het dezelfde soort?')+'</p>'+
      '<div class="acts"><button type="button" class="btn primary" data-act="near-use" data-latin="'+esc(near.latin)+'">'+tr('Add to ','Lägg till i ')+'<i>'+esc(near.latin)+'</i></button><button type="button" class="btn" data-act="near-new">'+tr('Save as a new species','Spara som ny art')+'</button></div>';
    box.scrollIntoView({block:'nearest'});return;
  }
  $('#nearBox').hidden=true;
  const btn=$('#saveBtn');btn.disabled=true;$('#saveMsg').textContent='Saving…';
  try{
    if(pendingPhoto){fields.photo=await uploadPhoto(pendingPhoto)}
    const now=Date.now(),old=editId&&state.entries.find(e=>e.id===editId);
    const doc={sid:slug(latin),latin,date:draft._snap?today():(draft._date||today()),form:draftForm,fields,createdAt:old?old.createdAt:now,updatedAt:now};
    if(draft._snap||(old&&old.snapshot))doc.snapshot=true;
    if(old&&old.ex)doc.ex=true;
    if(old&&old.by){doc.by=old.by;if(old.src)doc.src=old.src}
    await Data.saveEntry(editId,doc);
    if(old&&old.fields&&old.fields.photo&&old.fields.photo!==fields.photo)dropPhoto(old.fields.photo,old.id);
    selected=doc.sid;selCv=fields.cultivar?cvKey(fields.cultivar):'';toast(tr('Saved to ','Sparad till ')+latin+(fields.cultivar?' '+cvQ(fields.cultivar):''));
    draft={};draftBase='{}';editId=null;pendingPhoto=null;draftClear();$('#editBanner').hidden=true;$('#nearBox').hidden=true;buildForm();go('sheet');
  }catch(e){toast(errMsg(e),'err')}
  finally{btn.disabled=false;$('#saveMsg').textContent=''}
}

/* ---------- sheet view ---------- */
function fitSheet(){
  const wrap=$('#sheetWrap'),fit=$('#sheetFit');if(!wrap||!fit.firstElementChild)return;
  const pxW=210*96/25.4,pxH=148*96/25.4,cw=wrap.clientWidth-28;
  const k=Math.min(1,Math.max(cw/pxW,0.3));
  fit.style.transform='scale('+k+')';fit.style.width=pxW+'px';
  fit.style.height=(fit.dataset.pages?fit.scrollHeight:pxH)+'px';
  fit.parentElement.style.height=(pxH*k+24)+'px';
  const n=fit.children.length;if(n>1){fit.style.height='auto';fit.parentElement.style.height=((fit.scrollHeight)*k+24)+'px'}
}
const cvPill=o=>o&&o.cultivar?' <span class="pill cvp">'+esc(cvQ(cvNorm(o.cultivar)))+'</span>':'';
// Options for "which cultivar" selects: the species itself, its known cultivars, and a new one.
function cvOptions(s,val,none){
  return '<option value="">'+esc(none||tr('Species (no particular cultivar)','Arten (ingen särskild sort)','Soort (geen bepaalde cultivar)'))+'</option>'+
    ((s&&s.cvs)||[]).map(c=>'<option value="'+esc(c.ck)+'"'+(c.ck===val?' selected':'')+'>'+esc(cvQ(c.cv))+'</option>').join('')+
    '<option value="__new">'+esc(tr('New cultivar…','Ny sort…','Nieuwe cultivar…'))+'</option>';
}
// Read a cultivar select (+ its "new" text box) as a cultivar name, or '' for the species.
function cvRead(sel,inp,s){
  const v=$(sel).value;if(!v)return '';
  if(v==='__new'){const n=cvNorm($(inp).value);if(!n)return null;const k=cvKey(n),ex=s&&s.cvs.find(c=>c.ck===k);return ex?ex.cv:n}
  const c=s&&s.cvs.find(x=>x.ck===v);return c?c.cv:'';
}
function cvBarHTML(s){
  if(!s.cvs.length)return '<div class="cvbar"><span class="fl">'+trh('Cultivars','Sorter','Cultivars')+'</span><span class="muted">'+esc(tr('None recorded yet.','Inga registrerade ännu.','Nog geen vastgelegd.'))+'</span><button type="button" class="btn sm w-only" data-act="cv-new">'+esc(tr('+ Add a cultivar','+ Lägg till en sort','+ Cultivar toevoegen'))+'</button></div>';
  return '<div class="cvbar" role="group" aria-label="'+esc(tr('Cultivars','Sorter','Cultivars'))+'"><span class="fl">'+trh('Show','Visa','Toon')+'</span>'+
    '<button type="button" class="chip sm" data-cv="" aria-pressed="'+(!selCv)+'"><i></i><span>'+esc(tr('Species, all cultivars','Arten, alla sorter','Soort, alle cultivars'))+'</span></button>'+
    s.cvs.map(c=>'<button type="button" class="chip sm" data-cv="'+esc(c.ck)+'" aria-pressed="'+(selCv===c.ck)+'"><i></i><span>'+esc(cvQ(c.cv))+'</span></button>').join('')+
    '<button type="button" class="btn sm w-only" data-act="cv-new">'+esc(tr('+ Add a cultivar','+ Lägg till en sort','+ Cultivar toevoegen'))+'</button></div>';
}
/* All cultivars of a species side by side: one row per cultivar, a column for each trait that some cultivar sets itself. */
const CV_SKIP={photo:1,cultivar:1};
function cvTableHTML(s){
  if(!s.cvs.length)return '';
  const lang=state.lang,keys=Object.keys(DEF).filter(k=>!CV_SKIP[k]&&SPECIES_ONLY.indexOf(k)<0&&s.cvs.some(c=>!isEmpty(c.own[k]))&&(!DEF[k].only||DEF[k].only===s.form));
  const order=Object.keys(DEF);keys.sort((a,b)=>order.indexOf(a)-order.indexOf(b));
  const lab=k=>DEF[k].t==='cal'?trh(CAL_LAB[k][s.form][0],CAL_LAB[k][s.form][1]):trh(DEF[k].en,DEF[k].sv);
  const same=(a,b)=>JSON.stringify(a==null?null:a)===JSON.stringify(b==null?null:b);
  const val=(x,k)=>{const v=x.m[k];if(isEmpty(v))return '';if(DEF[k].t==='cal')return '<span class="cmo">'+MONTHS.map((l,i)=>'<i'+(v.indexOf(i+1)>=0?' class="on"':'')+' title="'+MONTH_NAMES[i]+'"></i>').join('')+'</span>';if(k==='verdict')return dots(v,5);return esc(vtl(DEF[k],v,s.form,lang))};
  const cell=(x,k)=>{const v=val(x,k);if(!x.isCv)return '<td>'+(v||'<span class="muted">–</span>')+'</td>';
    const own=!isEmpty(x.own[k]);if(!own)return '<td class="inh" title="'+esc(tr('From the species','Från arten','Van de soort'))+'">'+(v||'<span class="muted">–</span>')+'</td>';
    return '<td class="own'+(same(x.own[k],s.m[k])?'':' dif')+'">'+v+'</td>'};
  const rowH=x=>'<th scope="row"><button type="button" class="lnk" data-cv="'+esc(x.isCv?x.ck:'')+'">'+(x.isCv?esc(cvQ(x.cv)):'<i>'+esc(tr('Species','Arten','Soort'))+'</i>')+'</button>'+(x.isCv&&x.plantings.length?'<small class="muted"> · '+x.plantings.reduce((t,p)=>t+(Number(p.count)||1),0)+' '+esc(tr('planted','planterade','geplant'))+'</small>':'')+'</th>';
  const rows=[s].concat(s.cvs);
  return '<div class="tbl"><table class="cmpt cvt"><thead><tr><th scope="col">'+trh('Cultivar','Sort','Cultivar')+'</th>'+(keys.length?keys.map(k=>'<th scope="col">'+lab(k)+'</th>').join(''):'<th></th>')+'</tr></thead><tbody>'+
    rows.map(x=>'<tr'+(x.isCv&&x.ck===selCv?' class="sel"':'')+'>'+rowH(x)+(keys.length?keys.map(k=>cell(x,k)).join(''):'<td class="muted">'+esc(tr('No cultivar has its own values yet; all follow the species.','Ingen sort har egna värden ännu; alla följer arten.','Nog geen cultivar heeft eigen waarden; alle volgen de soort.'))+'</td>')+'</tr>').join('')+'</tbody></table></div>'+
    '<p class="muted" style="font-size:13px;margin:0">'+esc(tr('Columns show every trait that at least one cultivar sets itself. Bold values are the cultivar’s own; highlighted ones differ from the species; grey values follow the species.','Kolumnerna visar varje egenskap som minst en sort anger själv. Fetstil är sortens egna värden; markerade skiljer sig från arten; grå värden följer arten.','De kolommen tonen elke eigenschap die minstens één cultivar zelf invult. Vet zijn de eigen waarden van de cultivar; gemarkeerde wijken af van de soort; grijze waarden volgen de soort.'))+'</p>';
}
function updateSheet(){
  const sel=$('#spSel');
  const byLat=(a,b)=>a.latin.localeCompare(b.latin,'en');
  sel.innerHTML=species.length?species.slice().sort(byLat).map(s=>'<option value="'+esc(s.sid)+'"'+(s.sid===selected?' selected':'')+'>'+esc(dispName(s))+((commonName(s)?s.latin:(s.m.en||s.m.sv))?' — '+esc(commonName(s)?s.latin:(s.m.en||s.m.sv)):'')+'</option>').join(''):'<option>No species yet</option>';
  spPickShow();
  $$('#langSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===state.lang));
  $$('#sideSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.side===state.side));
  const s=selected&&bySid.get(selected),p=cur();
  const dis=!s;$$('[data-act="export-one"],[data-act="add-info"]').forEach(b=>b.disabled=dis);
  if(!s){$('#cardArea').innerHTML='<div class="empty"><h2>Nothing to show yet <em>Inget att visa</em></h2><p>Save a species from the Add tab and its fact sheet appears here.</p><button class="btn primary w-only" data-act="goto-add">'+tr('Add a species','Lägg till art')+'</button></div>';
    $('#cvBar').innerHTML='';$('#cvSec').hidden=true;$('#sheetFit').innerHTML='';$('#obsList').innerHTML='';$('#srcList').innerHTML='';$('#entList').innerHTML='';$('#obsForm').hidden=true;$('#srcForm').hidden=true;return}
  $('#obsForm').hidden=false;$('#srcForm').hidden=false;
  $('#cvBar').innerHTML=cvBarHTML(s);
  $$('[data-act=cv-rename]').forEach(b=>b.style.display=p.isCv?'':'none');if(!p.isCv)$('#cvRenBox').hidden=true;
  $('#cardArea').innerHTML=cardHTML(p);
  $('#revBox').innerHTML=revBoxHTML(s);$$('[data-act=flag-open]').forEach(b=>b.hidden=!SB||!meUid());if(!SB||!meUid())$('#flagBox').hidden=true;
  $('#cvSec').hidden=!s.cvs.length;{const j=$('.spjump [data-jump=cvSec]');if(j)j.hidden=!s.cvs.length}$('#cvTable').innerHTML=cvTableHTML(s);
  $('#cvCount').textContent=s.cvs.length?' ('+s.cvs.length+')':'';
  {const gl=genusList(s),gs=$('#genSec');gs.hidden=gl.length<2;$('#genName').textContent=genusOf(s.latin);$('#genTable').innerHTML=gl.length<2?'':genusTableHTML(s,state.lang,false);const j=$('.spjump [data-jump=genSec]');if(j)j.hidden=gl.length<2;$$('[data-withgenus]').forEach(c=>c.checked=state.withGenus)}
  $$('#layoutSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.layout===state.layout));
  $$('[data-withlog]').forEach(c=>c.checked=state.withLog);
  $$('[data-withcv]').forEach(c=>c.checked=state.withCv);
  $('#sideSeg').hidden=!state.withLog&&!state.withGenus&&!(state.withCv&&s.cvs.length)&&state.side!=='back';
  $('#sheetFit').innerHTML=state.side==='front'?sheetFor(p,state.lang,blobSrc):(state.withLog?sheetBacks(p,state.lang,blobSrc):'')+(state.withCv?sheetCv(s,state.lang):'')+(state.withGenus?sheetGenus(p,state.lang):'');
  fitSheet();
  ['#obsCv','#srcCv'].forEach(id=>{const el=$(id);if(el){el.innerHTML=cvOptions(s,selCv);el.value=selCv;const nb=$(id+'New');if(nb){nb.hidden=true;nb.value=''}}});
  $('#srcList').innerHTML=srcHTML(p);
  updateComments(s);
  $('#spPlInfo').textContent=plSummary(p.plantings)||tr('No planting records yet.','Inga planteringar ännu.');
  $('#spPlList').innerHTML=p.plantings.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(x=>plRow(x,false)).join('');
  $('#sheetAddList').innerHTML=addListSelect(s.sid);
  $('#obsList').innerHTML=p.obs.length?p.obs.map(o=>'<div class="obs"><div class="ph" style="--c:'+FCOL[s.form]+'">'+(o.photo?'<img src="'+blobSrc(o.photo)+'" alt="" data-lb="'+o.photo+'" loading="lazy">':'–')+'</div><div style="min-width:0"><div class="d">'+esc(o.date||'')+(o.plot?' · '+esc(o.plot):'')+(p.isCv?'':cvPill(o))+'</div><p>'+esc(o.text||'')+'</p>'+(SB?'<small class="muted">'+rowStamp(o.id).slice(3)+'</small>':'')+'</div>'+(canEdit(o.id)?'<button class="btn sm danger w-only" data-act="del-obs" data-id="'+esc(o.id)+'">'+tr('Delete','Radera')+'</button>':'<span></span>')+'</div>').join(''):'<p class="muted" style="margin:0">'+(p.isCv?tr('No observations of this cultivar yet.','Inga observationer av den här sorten ännu.','Nog geen waarnemingen van deze cultivar.'):tr('No observations yet. Add a note or a photo above.','Inga observationer ännu. Lägg till en anteckning eller ett foto ovan.'))+'</p>';
  const ents=p.isCv?p.entries:s.entries;
  $('#entList').innerHTML=(p.isCv?'<p class="muted" style="margin:0;font-size:13px">'+esc(tr('Entries for this cultivar only. Entries for the whole species are listed when you show the species.','Endast poster för den här sorten. Poster för hela arten visas när du visar arten.','Alleen invoeren voor deze cultivar. Invoeren voor de hele soort staan bij de soort.'))+'</p>':'')+
    ents.slice().reverse().map(e=>'<div class="ent"><span><b>'+esc(e.date||'')+'</b> · '+(e.snapshot?'<span class="pill">'+tr('Sheet edit','Bladredigering')+'</span> · ':'')+(isSrcEnt(e)?srcPill(e)+' · ':'')+(p.isCv?'':cvPill({cultivar:entCv(e)}))+' '+Object.keys(e.fields||{}).filter(k=>k!=='cultivar').length+' '+(Object.keys(e.fields||{}).filter(k=>k!=='cultivar').length===1?tr('field','fält'):tr('fields','fält'))+(e.ex?' · <em>'+tr('example','exempel')+'</em>':'')+rowStamp(e.id)+'</span>'+(canEdit(e.id)?'<span class="acts w-only"><button class="btn sm" data-act="edit-entry" data-id="'+esc(e.id)+'">'+tr('Edit','Redigera')+'</button><button class="btn sm danger" data-act="del-entry" data-id="'+esc(e.id)+'">'+tr('Delete','Radera')+'</button></span>':'')+'</div>').join('');
}
