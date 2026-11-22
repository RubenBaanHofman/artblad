// Artblad: SERVICE: site values derived from a project's private site point (2.8.0, queue rows 71 and 74, decision D11).
// Part 19b; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- site values (row 71, D11) ----------
   The precise site point stays in the project (only members see it). From it the app derives the values that explain
   winter survival and summer ripening, and stores them with the project:
     winter low and USDA zone (20 winters, as before), elevation, distance to the sea, frost-free period with the usual
     last spring and first autumn frost, heat sum (degree days above 5 °C, April–October), summer temperature
     (June–August), sunshine hours (April–September), days with at least 5 cm of snow, and the soil type (Sweden).
   Sources, all already registered in the Dependencies tab: Open-Meteo historical weather (ERA5-Land for temperature and
   snow, ERA5 for sunshine; CC BY 4.0; the "climate" service), SGU soil maps (CC0) and, new in 2.8.0, the Natural Earth
   coastline (public domain), kept as a file in this app (vendor/coast-nordic.json), so no outside call.
   Open-Meteo's free limit: about 390 "calls" for one site (10 years of temperature, 5 of sunshine and snow), so a
   look-up takes one to two minutes and is stored; the budget code in part 19 waits when needed. */
const SITE_Y=10,SITE_Y_SHORT=5,SNOW_M=0.05;
const O3=s=>s.split('|').map(x=>{const p=x.split(':');return{k:p[0],en:p[1],sv:p[2],nl:p[3]}});
const t3=o=>o?tr(o.en,o.sv,o.nl):'';
// The last complete year in Open-Meteo's archive (it lags about 5 days).
function siteLastYear(){const d=new Date();return d.getMonth()===0&&d.getDate()<12?d.getFullYear()-2:d.getFullYear()-1}
const isoLag=()=>new Date(Date.now()-6*864e5).toISOString().slice(0,10);
const dayNo=iso=>Math.round((Date.UTC(+iso.slice(0,4),+iso.slice(5,7)-1,+iso.slice(8,10))-Date.UTC(+iso.slice(0,4),0,1))/864e5)+1;
const dayIso=(y,n)=>new Date(Date.UTC(y,0,n)).toISOString().slice(0,10);
function siteCache(k,v){try{const c=JSON.parse(store.get('ab.omsite')||'{}');if(v===undefined)return c[k];c[k]=v;const ks=Object.keys(c);if(ks.length>1500)delete c[ks[0]];store.set('ab.omsite',JSON.stringify(c))}catch(e){return undefined}}
const ptKey=(lat,lng)=>lat.toFixed(3)+','+lng.toFixed(3);
// One growing year at a spot: heat sum, frost-free period, summer mean. For the current year: up to a few days ago.
async function yearVals(lat,lng,y,wait,onWait){
  const k='y'+ptKey(lat,lng)+','+y,c=siteCache(k);if(c)return c;
  const lag=isoLag(),end0=y+'-12-31',end=end0<lag?end0:lag;if(end<y+'-04-15')throw Object.assign(new Error('too early'),{why:'nodata'});
  const j=await omGet(lat,lng,y+'-01-01',end,'&daily=temperature_2m_max,temperature_2m_min&models=era5_land&timezone=GMT',wait,onWait);
  const d=j.daily||{},tm=d.time||[],tx=d.temperature_2m_max||[],tn=d.temperature_2m_min||[];
  if(tm.length<100)throw Object.assign(new Error('too little data'),{why:'nodata'});
  let gdd=0,last=null,first=null,ss=0,sn=0;const mid=y+'-07-01';
  tm.forEach((t,i)=>{const a=tx[i],b=tn[i];if(a==null||b==null)return;const m=(a+b)/2;
    if(t>=y+'-04-01'&&t<=y+'-10-31')gdd+=Math.max(0,m-5);
    if(t>=y+'-06-01'&&t<=y+'-08-31'){ss+=m;sn++}
    if(b<0){if(t<mid)last=t;else if(!first)first=t}});
  const partial=end<end0,from=last?dayNo(last)+1:1,to=first?dayNo(first)-1:dayNo(end);
  const out={y,gdd:Math.round(gdd),ffd:Math.max(0,to-from+1),last,first,summerT:sn?Math.round(ss/sn*10)/10:null,partial,until:end};
  if(!partial)siteCache(k,out);
  return out;
}
// Sunshine hours April–September (ERA5; ERA5-Land has no sunshine).
async function sunVals(lat,lng,y,wait,onWait){
  const k='s'+ptKey(lat,lng)+','+y,c=siteCache(k);if(c!==undefined)return c;
  const j=await omGet(lat,lng,y+'-04-01',y+'-09-30','&daily=sunshine_duration&models=era5&timezone=GMT',wait,onWait);
  const v=((j.daily||{}).sunshine_duration||[]).filter(x=>x!=null&&isFinite(x));
  const h=v.length>150?Math.round(v.reduce((a,b)=>a+b,0)/3600):null;siteCache(k,h);return h;
}
// Days with at least 5 cm of snow from November to April (ERA5-Land snow depth, hourly; the day's highest value).
async function snowVals(lat,lng,y,wait,onWait){
  const k='n'+ptKey(lat,lng)+','+y,c=siteCache(k);if(c!==undefined)return c;
  const j=await omGet(lat,lng,y+'-11-01',(y+1)+'-04-30','&hourly=snow_depth&models=era5_land&timezone=GMT',wait,onWait);
  const h=j.hourly||{},tm=h.time||[],sd=h.snow_depth||[],day=new Map();
  tm.forEach((t,i)=>{const v=sd[i];if(v==null||!isFinite(v))return;const d=t.slice(0,10);day.set(d,Math.max(day.get(d)||0,v))});
  const n=day.size>150?[...day.values()].filter(v=>v>=SNOW_M).length:null;siteCache(k,n);return n;
}
/* Distance to the sea: the Natural Earth 1:10m coastline (public domain), cut to 12°W–45°E and 50–72°N and simplified to
   about 1 km. Lakes are not sea. Outside that area: no value. */
let COAST=null;
async function coastLoad(){if(COAST)return COAST;const r=await fetch('vendor/coast-nordic.json?v='+APP_VERSION);if(!r.ok)throw new Error('HTTP '+r.status);COAST=await r.json();return COAST}
async function coastKm(lat,lng){
  if(lat<50||lat>72||lng<-12||lng>45)return null;
  const c=await coastLoad(),kx=111.32*Math.cos(lat*Math.PI/180),ky=110.57;let best=Infinity;
  (c.l||[]).forEach(l=>{for(let i=0;i+3<l.length;i+=2){
    const ax=(l[i]-lng)*kx,ay=(l[i+1]-lat)*ky,bx=(l[i+2]-lng)*kx,by=(l[i+3]-lat)*ky,dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy;
    const t=L?Math.max(0,Math.min(1,-(ax*dx+ay*dy)/L)):0,x=ax+t*dx,y=ay+t*dy,d=x*x+y*y;if(d<best)best=d}});
  best=Math.sqrt(best);return best>400?null:Math.round(best*(best<10?10:1))/(best<10?10:1);
}
const avg=a=>{const v=a.filter(x=>x!=null&&isFinite(x));return v.length?v.reduce((s,x)=>s+x,0)/v.length:null};
// All site values for a point. Each part may fail on its own; what was found is kept (miss lists the rest).
async function siteLookup(lat,lng,onStep){
  const step=t=>{if(onStep)onStep(t)},wait=ms=>step(tr('Waiting for Open-Meteo’s free limit (about ','Väntar på Open-Meteos fria gräns (ungefär ','Wachten op de gratis limiet van Open-Meteo (ongeveer ')+Math.max(1,Math.ceil(ms/6e4))+' min)…');
  const out={at:today(),miss:[]},Y1=siteLastYear(),Y0=Y1-SITE_Y+1,S0=Y1-SITE_Y_SHORT+1;
  step(tr('Winter climate (20 winters)…','Vinterklimat (20 vintrar)…','Winterklimaat (20 winters)…'));
  try{const c=await climLookup(lat,lng,true,wait);out.winterLow=c.t;out.coldest=c.lo;out.usda=usdaOfT(c.t);if(c.elev!=null)out.elev=c.elev}catch(e){out.miss.push('winter')}
  const ys=[];for(let y=Y0;y<=Y1;y++){step(tr('Growing season ','Växtsäsong ','Groeiseizoen ')+y+'…');try{ys.push(await yearVals(lat,lng,y,true,wait))}catch(e){if(e&&e.limit==='day')break}}
  if(ys.length>=5){out.gdd=Math.round(avg(ys.map(x=>x.gdd)));out.ffd=Math.round(avg(ys.map(x=>x.ffd)));out.summerT=Math.round(avg(ys.map(x=>x.summerT))*10)/10;
    const ls=ys.filter(x=>x.last).map(x=>dayNo(x.last)),fs=ys.filter(x=>x.first).map(x=>dayNo(x.first));
    if(ls.length)out.lastFrost=dayIso(2001,Math.round(avg(ls))).slice(5);if(fs.length)out.firstFrost=dayIso(2001,Math.round(avg(fs))).slice(5);
    out.years=ys[0].y+'–'+ys[ys.length-1].y;out.gddMin=Math.min.apply(null,ys.map(x=>x.gdd));out.gddMax=Math.max.apply(null,ys.map(x=>x.gdd))}
  else out.miss.push('season');
  const sun=[],snow=[];
  for(let y=S0;y<=Y1;y++){step(tr('Sunshine and snow ','Solsken och snö ','Zon en sneeuw ')+y+'…');
    try{sun.push(await sunVals(lat,lng,y,true,wait))}catch(e){}
    try{snow.push(await snowVals(lat,lng,y-1,true,wait))}catch(e){}}
  {const s=avg(sun);if(s!=null)out.sunH=Math.round(s);else out.miss.push('sun')}
  {const s=avg(snow);if(s!=null)out.snowDays=Math.round(s);else out.miss.push('snow')}
  step(tr('Distance to the sea…','Avstånd till havet…','Afstand tot de zee…'));
  try{const k=await coastKm(lat,lng);if(k!=null)out.coastKm=k;else out.miss.push('coast')}catch(e){out.miss.push('coast')}
  step(tr('Soil type…','Jordart…','Grondsoort…'));
  try{const [s,p]=await Promise.allSettled([sguSoil(lat,lng),sguPerm(lat,lng)]);if(s.status==='fulfilled'&&s.value){out.soil=s.value;out.soilCls=soilClass(s.value).soil}if(p.status==='fulfilled'&&p.value)out.perm=p.value;if(!out.soil)out.miss.push('soil')}catch(e){out.miss.push('soil')}
  return out;
}
const SITE_CREDIT='<a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> (ERA5-Land, ERA5, CC BY 4.0) · SGU (CC0) · <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a> ('+'public domain)';
const mdTxt=md=>{if(!md)return '';const m=+md.slice(0,2),d=+md.slice(3,5);return d+' '+(state.lang==='sv'?MONTHS_SV:state.lang==='nl'?MONTHS_NL:MONTHS_EN)[m-1].slice(0,3)};
const intTxt=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
// The values as rows of a small table (also used on the history page of a planting).
function siteRows(v){
  if(!v)return [];const r=[],add=(a,b)=>r.push([a,b]);
  if(v.winterLow!=null)add(tr('Typical winter low','Typisk vinterlägsta','Typisch winterminimum'),fmtC(v.winterLow)+' (USDA '+v.usda+')'+(v.coldest!=null?', '+tr('coldest ','kallast ','koudst ')+fmtC(v.coldest):''));
  if(v.elev!=null)add(tr('Elevation','Höjd över havet','Hoogte'),intTxt(v.elev)+' m');
  if(v.coastKm!=null)add(tr('Distance to the sea','Avstånd till havet','Afstand tot de zee'),numTxt(v.coastKm)+' km');
  if(v.ffd!=null)add(tr('Frost-free period','Frostfri period','Vorstvrije periode'),v.ffd+' '+tr('days','dagar','dagen')+(v.lastFrost||v.firstFrost?' ('+[v.lastFrost?tr('last frost ≈ ','sista frost ≈ ','laatste vorst ≈ ')+mdTxt(v.lastFrost):'',v.firstFrost?tr('first ≈ ','första ≈ ','eerste ≈ ')+mdTxt(v.firstFrost):''].filter(Boolean).join(', ')+')':''));
  if(v.gdd!=null)add(tr('Heat sum (degree days above 5 °C, Apr–Oct)','Värmesumma (graddagar över 5 °C, apr–okt)','Warmtesom (graaddagen boven 5 °C, apr–okt)'),intTxt(v.gdd)+(v.gddMin!=null?' ('+intTxt(v.gddMin)+'–'+intTxt(v.gddMax)+')':''));
  if(v.summerT!=null)add(tr('Summer temperature (Jun–Aug mean)','Sommartemperatur (medel jun–aug)','Zomertemperatuur (gemiddeld jun–aug)'),numTxt(v.summerT)+' °C');
  if(v.sunH!=null)add(tr('Sunshine (Apr–Sep)','Solsken (apr–sep)','Zonneschijn (apr–sep)'),intTxt(v.sunH)+' h');
  if(v.snowDays!=null)add(tr('Snow cover of 5 cm or more','Snötäcke på minst 5 cm','Sneeuwdek van 5 cm of meer'),v.snowDays+' '+tr('days a winter','dagar per vinter','dagen per winter'));
  // A soil value saved by 2.8.0 before the SGU fix may be the map's title ("25 000-1:100 000 (visningstjänst)"): not shown.
  if(v.soil&&!NOT_SOIL.test(v.soil))add(tr('Soil (SGU map)','Jord (SGU-karta)','Grond (SGU-kaart)'),v.soil+(v.perm?' · '+tr('permeability ','genomsläpplighet ','doorlatendheid ')+v.perm:''));
  return r;
}
function siteTable(v){const r=siteRows(v);return r.length?'<table class="sitetab">'+r.map(x=>'<tr><th>'+esc(x[0])+'</th><td>'+esc(x[1])+'</td></tr>').join('')+'</table>':''}
/* ---------- the place of a record on the map: its own position, else its project's site point ---------- */
const hasPt=o=>o&&o.lat!=null&&o.lat!==''&&isFinite(o.lat)&&o.lng!=null&&o.lng!==''&&isFinite(o.lng);
// 2.8.0 batch 5: a plant placed on a garden plan that is linked to the map gets its position from the plan.
function plPoint(p){if(hasPt(p))return{lat:Number(p.lat),lng:Number(p.lng),own:true};const pp=plPlanPt(p);if(pp)return Object.assign(pp,{own:false,plan:true});const q=p&&p.project&&pjById(p.project);return hasPt(q)?{lat:Number(q.lat),lng:Number(q.lng),own:false}:null}
