// Artblad: SERVICE: Swedish zones and winter temperatures; soil permeability (SGU open data).
// Part 13 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- 2.4.7: Swedish zones and winter temperatures are kept apart (no conversion between them) ---------- */
/* Pick a plant: fill in cold, soil and moisture from a map position */
// Addresses come from SERVICES.sguSoil and SERVICES.sguPerm (01-core.js; can be changed in config.js).
const SGU_SOIL_WMS=svcUrl('sguSoil'),SGU_SOIL_LAYER=SERVICES.sguSoil.layer;
const SGU_PERM_API=svcUrl('sguPerm');
async function fetchJ(u,ms,id){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms||12000);try{const r=id?await svcFetch(id,u,{signal:c.signal}):await fetch(u,{signal:c.signal});if(!r.ok)throw new Error('HTTP '+r.status);const tx=await r.text();try{return JSON.parse(tx)}catch(e){return{_text:tx}}}finally{clearTimeout(t)}}
const propStrings=f=>Object.entries((f&&f.properties)||{}).filter(([k,v])=>typeof v==='string'&&v.trim());
// 2.8.1 fix: the answer may be JSON, GeoServer's plain text ("name = value" lines) or an HTML table, and it also carries the
// map's own title ("Jordarter 1:25 000-1:100 000 (visningstjänst)"), which earlier versions took for the soil type.
// So: look at every name/value pair, skip anything that is a map title or scale, and prefer values that name a soil.
const SOIL_WORD=/morän|lera|lerig|sand|grus|torv|silt|mjäla|\bmo\b|finmo|gyttja|dy\b|berg|häll|fyll|isälv|svall|klapper|block|kärr|mosse|organogen|postglacial|glacial|vatten|skal|älvsediment|svämsediment|flygsand/i;
const NOT_SOIL=/1\s*:\s*\d|visningstjänst|jordarter\s|\bwms\b|karttyp|https?:|^\s*\d+([.,]\d+)?\s*$/i;
function soilPairs(j){
  const out=[];
  if(j&&!j._text){(j.features||[]).forEach(f=>propStrings(f).forEach(([k,v])=>out.push([k,v.trim()])));return out}
  const t=String((j&&j._text)||'');
  // GeoServer text/plain: "name = value"
  t.split(/\r?\n/).forEach(l=>{const m=/^\s*([\wåäöÅÄÖ.:-]+)\s*=\s*(.+?)\s*$/.exec(l);if(m)out.push([m[1],m[2]])});
  // XML / GML: <ns:name>value</ns:name> elements without child elements
  for(const m of t.matchAll(/<(?:[\w-]+:)?([\w-]+)(?:\s[^>]*)?>([^<>]{1,120})<\/(?:[\w-]+:)?\1>/g))out.push([m[1],m[2].trim()]);
  // HTML table: header cells, then the cells of the first data row
  if(/<t[hd][\s>]/i.test(t)){
    const cells=row=>[...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(m=>m[1].replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').trim());
    const rows=[...t.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>cells(m[1]));
    if(rows.length>1)rows.slice(1).forEach(r=>r.forEach((v,i)=>out.push([rows[0][i]||'',v])));
  }
  return out;
}
// 2.8.2: the old address (SGU resource server) answers soil questions with the service description (WMS_Capabilities), whose
// title holds the map scale. Soil questions go to SGU's GeoServer (SERVICES.sguSoil in part 1, the GetFeatureInfo address that the
// description itself names); a description or an error message is never read as an answer.
const NOT_ANSWER=/WMS_Capabilities|ServiceException|ExceptionReport/;
function soilFrom(j){
  if(j&&j._text&&NOT_ANSWER.test(j._text))return null;
  const ok=([k,v])=>v&&v.length<80&&!NOT_SOIL.test(v);
  const ps=soilPairs(j).filter(ok);
  const named=ps.filter(([k])=>/jordart|jg2|soil/i.test(k)&&!/kod|code|id$/i.test(k));
  const pick=named.find(([,v])=>SOIL_WORD.test(v))||ps.find(([,v])=>SOIL_WORD.test(v))||named.find(([,v])=>/[a-zåäö]{3}/i.test(v));
  return pick?pick[1]:null;
}
async function sguSoil(lat,lng){
  const d=0.0005,q=f=>SGU_SOIL_WMS+'?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&LAYERS='+encodeURIComponent(SGU_SOIL_LAYER)+'&QUERY_LAYERS='+encodeURIComponent(SGU_SOIL_LAYER)+'&STYLES=&CRS=EPSG:4326&BBOX='+[lat-d,lng-d,lat+d,lng+d].map(v=>v.toFixed(6)).join(',')+'&WIDTH=101&HEIGHT=101&I=50&J=50&INFO_FORMAT='+encodeURIComponent(f)+'&FEATURE_COUNT=1';
  let v=soilFrom(await fetchJ(q('application/json'),0,'sguSoil'));
  if(!v)v=soilFrom(await fetchJ(q('text/plain'),0,'sguSoil'));
  return v;
}
async function sguPerm(lat,lng){
  const c=await fetchJ(SGU_PERM_API+'/collections?f=json',0,'sguPerm');const col=((c.collections||[])[0]||{}).id;if(!col)return null;
  const d=0.0004,j=await fetchJ(SGU_PERM_API+'/collections/'+encodeURIComponent(col)+'/items?f=json&limit=1&bbox='+[lng-d,lat-d,lng+d,lat+d].map(v=>v.toFixed(6)).join(','),0,'sguPerm');
  const f=(j.features||[])[0];if(!f)return null;const v=propStrings(f).map(x=>x[1]).find(v=>/hög|medel|låg|high|medium|low/i.test(v));return v||null;
}
// Swedish soil-type names (SGU) → the app's soil classes and a moisture guess (1 dry … 5 wet).
function soilClass(name){
  const n=String(name||'').toLowerCase();
  if(/torv|gyttja|\bdy\b|kärr|mosse|organogen/.test(n))return{soil:['humus'],m:5};
  if(/vatten/.test(n))return{soil:[],m:5};
  if(/fyll|utfylld|antropogen/.test(n))return{soil:[],m:null,fill:1};
  if(/berg|häll|urberg/.test(n))return{soil:[],m:1,rock:1};
  if(/lerig morän|lerig-moig|lerig/.test(n))return{soil:['clay','loam'],m:4};
  if(/lera|\bler\b|glacial lera|postglacial lera/.test(n))return{soil:['clay'],m:4};
  if(/silt|mjäla|finmo|\bmo\b/.test(n))return{soil:['loam'],m:3};
  if(/sandig morän|sandig-moig/.test(n))return{soil:['sand','loam'],m:2};
  if(/morän/.test(n))return{soil:['loam'],m:3};
  if(/grus|sand|isälv|svall|flygsand|klapper|block/.test(n))return{soil:['sand'],m:2};
  return{soil:[],m:null};
}
function moistGuess(sc,perm){
  let m=sc&&sc.m!=null?sc.m:null;const p=String(perm||'').toLowerCase();
  const adj=/hög|high/.test(p)?-1:/låg|low/.test(p)?1:0;
  if(m==null&&perm)m=adj<0?2:adj>0?4:3;else if(m!=null&&m<5&&!sc.rock)m=Math.max(1,Math.min(5,m+adj));
  return m;
}
const PKGEO={busy:false,out:''};
async function pickFromMap(){
  const v=String(($('#pkGeo')||{}).value||'').split(',').map(x=>parseFloat(x));
  if(v.length!==2||!v.every(isFinite)){toast(tr('Give a map position: lat, long','Ange en kartposition: lat, long','Geef een kaartpositie: lat, long'),'err');return}
  const [lat,lng]=v;PKGEO.busy=true;PKGEO.out='<p class="muted">'+esc(tr('Looking up winter climate, soil type and permeability…','Hämtar vinterklimat, jordart och genomsläpplighet…','Winterklimaat, grondsoort en doorlatendheid opzoeken…'))+'</p>';pkGeoShow();
  const [c,s,p]=await Promise.allSettled([climLookup(lat,lng),sguSoil(lat,lng),sguPerm(lat,lng)]);
  const lines=[],ok=x=>x.status==='fulfilled'&&x.value!=null;
  if(ok(c)){pickState.temp=String(Math.round(c.value.t));lines.push('<li><b>'+esc(tr('Lowest winter temperature: ','Lägsta vintertemperatur: ','Laagste wintertemperatuur: '))+esc(fmtC(c.value.t))+'</b> '+esc(tr('(typical winter low, ≈ USDA ','(typisk vinterlägsta, ≈ USDA ','(typisch winterminimum, ≈ USDA ')+usdaOfT(c.value.t)+')')+' <small class="muted">'+CLIM_CREDIT+'</small></li>')}
  else lines.push('<li class="muted">'+esc(tr('Winter climate: ','Vinterklimat: ','Winterklimaat: ')+omErrMsg(c.reason))+'</li>');
  const sc=ok(s)?soilClass(s.value):null;
  if(ok(s)){if(sc.soil.length)pickState.soil=new Set(sc.soil);
    lines.push('<li><b>'+esc(tr('Soil: ','Jord: ','Grond: '))+esc(s.value)+'</b>'+(sc.soil.length?' → '+esc(sc.soil.map(k=>{const o=SOIL.find(x=>x.k===k);return o?trs(o.en,o.sv):k}).join(', ')):sc.fill?' · '+esc(tr('made ground: check the actual soil','utfyllnad: kontrollera den verkliga jorden','opgehoogde grond: controleer de echte grond')):sc.rock?' · '+esc(tr('thin soil on bedrock','tunt jordlager på berg','dunne grond op rots')):'')+' <small class="muted">SGU, '+esc(tr('soil map 1:25 000–1:100 000','jordartskarta 1:25 000–1:100 000','grondsoortenkaart 1:25 000–1:100 000'))+' (CC0)</small></li>')}
  else lines.push('<li class="muted">'+esc(tr('Soil type: not found (no detailed SGU soil map here, or no connection).','Jordart: hittades inte (ingen detaljerad jordartskarta här, eller ingen anslutning).','Grondsoort: niet gevonden (geen gedetailleerde SGU-kaart hier, of geen verbinding).'))+'</li>');
  const m=moistGuess(sc,ok(p)?p.value:null);
  if(m!=null){pickState.moist=m;lines.push('<li><b>'+esc(tr('Moisture (rough guess): ','Fukt (grov uppskattning): ','Vocht (ruwe schatting): '))+m+'/5</b> '+esc(tr('from the soil type','utifrån jordarten','op basis van de grondsoort'))+(ok(p)?esc(tr(' and the permeability (',' och genomsläppligheten (',' en de doorlatendheid ('))+esc(p.value)+')':'')+' <small class="muted">SGU (CC0)</small></li>')}
  else lines.push('<li class="muted">'+esc(tr('Moisture: no guess possible here.','Fukt: ingen uppskattning möjlig här.','Vocht: hier geen schatting mogelijk.'))+'</li>');
  PKGEO.busy=false;PKGEO.out='<ul class="pkgeo-res">'+lines.join('')+'</ul><p class="muted" style="font-size:13px;margin:4px 0 0">'+esc(tr('Suggestions from maps: check them against what you see at the spot (shelter, drainage, improved soil). Light is not filled in.','Förslag från kartor: jämför med vad du ser på platsen (lä, dränering, förbättrad jord). Ljus fylls inte i.','Suggesties uit kaarten: vergelijk ze met wat je op de plek ziet (beschutting, afwatering, verbeterde grond). Licht wordt niet ingevuld.'))+'</p>';
  updatePick();pkGeoShow();
}
function pkGeoShow(){const o=$('#pkGeoOut');if(o)o.innerHTML=PKGEO.out;const b=$('[data-act=pk-geo-fill]');if(b)b.disabled=PKGEO.busy;
}
