// Artblad: SERVICE: measured winter lows from weather stations (SMHI, MET Norway Frost, FMI).
// Part 19a; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- 2.9.0 (queue rows 78 and 79): measured station values first, the model second ----------
   Open-Meteo's ERA5-Land is a model on a ~9 km grid. In northern Sweden it is several degrees too warm on clear winter nights
   (ECMWF documents a warm bias of winter night minimums over Sweden, Finland and NW Russia). For Umeå it gave a typical low of
   −19 °C, coldest −26 °C, while SMHI's station measured −30.7 °C in January 2024.
   So the winter low now comes from the nearest weather station with enough winters, when there is one within ST_MAXKM:
     Sweden  SMHI open data (metobs), parameter 19 "Lufttemperatur, min, 1 gång per dygn". No key. CC BY 4.0, credit SMHI.
     Norway  MET Norway Frost API, element min(air_temperature P1D). Needs a free client ID (cfg.FROST_CLIENT_ID). NLOD 2.0 / CC BY 4.0.
     Finland FMI open data (WFS), stored query fmi::observations::weather::daily::simple, parameter tmin. No key. CC BY 4.0.
   Open-Meteo stays as the fallback (no station near, a station service down or switched off) and as the comparison value,
   and every value says where it comes from (row 79). A winter is Oct–Apr; a winter counts for the typical low only when at
   least 80 of its 90 days of December–February have a value. */
const ST_MAXKM=50,ST_MINW=10,ST_NW=20,ST_DJF=80,ST_PROVS=['smhiObs','frost','fmi'];
// Rough boxes (lat0, lat1, lng0, lng1) of each country with a margin, so a point near a border can use a station across it.
const ST_BOX={smhiObs:[54.9,69.4,10.3,24.5],frost:[57.6,71.4,4.0,31.5],fmi:[59.4,70.3,19.0,31.8]};
const ST_ORG={smhiObs:'SMHI',frost:'MET Norway',fmi:'FMI'};
const ST_LINK={smhiObs:'https://www.smhi.se/data/meteorologi/ladda-ner-meteorologiska-observationer',frost:'https://frost.met.no/',fmi:'https://en.ilmatieteenlaitos.fi/open-data'};
const stCredit=prov=>ST_ORG[prov]?'<a href="'+ST_LINK[prov]+'" target="_blank" rel="noopener">'+ST_ORG[prov]+'</a> (CC BY 4.0; '+tr('winter lows worked out by Artblad from the daily minimums','vinterlägsta beräknade av Artblad ur dygnsminimum','winterminima door Artblad berekend uit de dagminima')+')':'';
const frostKey=()=>String((SERVICES.frost&&SERVICES.frost.clientId)||cfg.FROST_CLIENT_ID||'').trim();
// The winter that starts in the autumn of the returned year is the last one that has ended (winters end 30 April).
function stLastWinter(now){const d=now||new Date(),y=d.getUTCFullYear();return d.getUTCMonth()>=4?y-1:y-2}
const wLbl=y=>y+'/'+String(y+1).slice(2);
function stKm(a,b,c,d){const R=6371,r=Math.PI/180,x=Math.sin((c-a)*r/2),y=Math.sin((d-b)*r/2),h=x*x+Math.cos(a*r)*Math.cos(c*r)*y*y;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
const stIn=(prov,lat,lng)=>{const b=ST_BOX[prov];return lat>=b[0]&&lat<=b[1]&&lng>=b[2]&&lng<=b[3]};
function stJGet(k){try{return JSON.parse(store.get(k)||'null')}catch(e){return null}}
function stJSet(k,v){try{store.set(k,JSON.stringify(v))}catch(e){}}
// One winter's values per station are kept on the device: 'prov:id:year' → [lowest, days with a value in Dec–Feb, days].
function stWinGet(k){const c=stJGet('ab.stwin')||{};return c[k]}
function stWinSet(o){const c=stJGet('ab.stwin')||{};Object.assign(c,o);const ks=Object.keys(c);for(let i=0;i<ks.length-4000;i++)delete c[ks[i]];stJSet('ab.stwin',c)}
async function stFetch(id,url,opts,ms){
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),ms||25000);
  try{return await svcFetch(id,url,Object.assign({signal:ctl.signal},opts||{}))}
  catch(e){throw Object.assign(new Error(e&&e.name==='AbortError'?'timeout':'connection'),{why:e&&e.why==='off'?'off':'net',prov:id})}
  finally{clearTimeout(to)}
}
const stHttp=(id,r)=>Object.assign(new Error('HTTP '+r.status),{why:'http',status:r.status,prov:id});
// Daily values [['YYYY-MM-DD', °C], …] → winters {year: [lowest, Dec–Feb days, days]}.
function stWinters(days){
  const o={};
  for(const [d,v] of days){const y=+d.slice(0,4),m=+d.slice(5,7);const w=m>=10?y:m<=4?y-1:null;if(w==null||!isFinite(v))continue;
    const x=o[w]||(o[w]=[Infinity,0,0]);if(v<x[0])x[0]=v;x[2]++;if(m===12||m<=2)x[1]++}
  Object.keys(o).forEach(w=>{o[w][0]=Math.round(o[w][0]*10)/10});return o;
}

/* ---------- Sweden: SMHI ---------- */
// Station list of parameter 19: [id, name, lat, lng, height, first year, last year].
async function smhiStations(){
  const c=stJGet('ab.st.smhiObs');if(c&&Date.now()-c.at<30*864e5)return c.l;
  const r=await stFetch('smhiObs',svcUrl('smhiObs')+'/parameter/19.json');if(!r.ok)throw stHttp('smhiObs',r);
  const j=await r.json(),l=(j.station||[]).filter(s=>isFinite(s.latitude)&&isFinite(s.longitude)).map(s=>[String(s.id),String(s.name||s.id),+s.latitude,+s.longitude,s.height!=null?+s.height:null,s.from?new Date(s.from).getUTCFullYear():null,s.to?new Date(s.to).getUTCFullYear():null]);
  stJSet('ab.st.smhiObs',{at:Date.now(),l});return l;
}
// The quality-controlled archive is a ';' CSV: some lines about the station, then a header with "Representativt dygn",
// the value and "Kvalitet". The value column is the one just left of "Kvalitet".
function smhiCsv(txt){
  const L=String(txt||'').replace(/^﻿/,'').split(/\r?\n/),out=[];let vi=-1,di=-1;
  for(const line of L){const c=line.split(';');
    if(vi<0){const k=c.indexOf('Kvalitet');if(k>0){vi=k-1;di=c.indexOf('Representativt dygn');if(di<0)di=0}continue}
    const d=(c[di]||'').trim(),v=parseFloat(String(c[vi]||'').replace(',','.'));if(/^\d{4}-\d\d-\d\d/.test(d)&&isFinite(v))out.push([d.slice(0,10),v])}
  return out;
}
const SMHI_ARCH=new Map();
async function smhiDays(id,y0,y1){
  const base=svcUrl('smhiObs')+'/parameter/19/station/'+encodeURIComponent(id)+'/period/';let days=SMHI_ARCH.get(id);
  if(!days){const r=await stFetch('smhiObs',base+'corrected-archive/data.csv',null,40000);
    if(r.status===404)days=[];else if(!r.ok)throw stHttp('smhiObs',r);else days=smhiCsv(await r.text());SMHI_ARCH.set(id,days)}
  days=days.slice();
  // The archive reaches to about three months ago; the latest months come as JSON.
  if(new Date(Date.UTC(y1+1,4,1))>Date.now()-130*864e5){
    try{const r=await stFetch('smhiObs',base+'latest-months/data.json');if(r.ok){const j=await r.json(),have=new Set(days.map(x=>x[0]));
      (j.value||[]).forEach(v=>{const d=v.ref?String(v.ref).slice(0,10):v.date!=null?new Date(v.date).toISOString().slice(0,10):'';const t=parseFloat(v.value);if(d&&isFinite(t)&&!have.has(d))days.push([d,t])})}}catch(e){}}
  return days;
}
async function smhiNear(lat,lng,Y0,Y1){
  const l=await smhiStations();
  return l.map(s=>({prov:'smhiObs',id:s[0],name:s[1],lat:s[2],lng:s[3],elev:s[4]!=null?Math.round(s[4]):null,km:stKm(lat,lng,s[2],s[3]),y0:s[5],y1:s[6]}))
    .filter(s=>s.km<=ST_MAXKM&&(s.y0==null||s.y1==null||Math.min(s.y1,Y1+1)-Math.max(s.y0,Y0)>=Math.min(ST_MINW,Y1-Y0)));
}

/* ---------- Norway: MET Norway Frost (client ID needed, sent as the user name of basic authentication) ---------- */
const frostOpts=()=>({headers:{Authorization:'Basic '+btoa(frostKey()+':')}});
async function frostNear(lat,lng){
  if(!frostKey())throw Object.assign(new Error('no client ID'),{why:'nokey',prov:'frost'});
  const k=lat.toFixed(2)+','+lng.toFixed(2),c=stJGet('ab.st.frost')||{};if(c[k]&&Date.now()-c[k].at<30*864e5)return c[k].l;
  const r=await stFetch('frost',svcUrl('frost')+'/sources/v0.jsonld?types=SensorSystem&geometry='+encodeURIComponent('nearest(POINT('+lng.toFixed(4)+' '+lat.toFixed(4)+'))')+'&nearestmaxcount=10',frostOpts());
  if(r.status===404)return [];if(!r.ok)throw stHttp('frost',r);
  const j=await r.json(),l=(j.data||[]).filter(s=>s.geometry&&Array.isArray(s.geometry.coordinates)).map(s=>{const la=+s.geometry.coordinates[1],lo=+s.geometry.coordinates[0];
    return{prov:'frost',id:String(s.id),name:String(s.shortName||s.name||s.id),lat:la,lng:lo,elev:s.masl!=null?Math.round(+s.masl):null,km:s.distance!=null?+s.distance:stKm(lat,lng,la,lo),y0:s.validFrom?+String(s.validFrom).slice(0,4):null,y1:s.validTo?+String(s.validTo).slice(0,4):null}}).filter(s=>s.km<=ST_MAXKM);
  c[k]={at:Date.now(),l};const ks=Object.keys(c);if(ks.length>200)delete c[ks[0]];stJSet('ab.st.frost',c);return l;
}
const FROST_EL='min(air_temperature P1D)',FROST_OFF=['PT18H','PT6H','PT0H'];
async function frostDays(id,y0,y1){
  const out=[];
  // Five winters a request keeps each answer well under Frost's limit of 100 000 observations.
  for(let a=y0;a<=y1;a+=5){const b=Math.min(y1,a+4);
    const u=svcUrl('frost')+'/observations/v0.jsonld?sources='+encodeURIComponent(id)+'&referencetime='+a+'-10-01/'+(b+1)+'-05-01&elements='+encodeURIComponent(FROST_EL);
    const r=await stFetch('frost',u,frostOpts());if(r.status===404||r.status===412)continue;if(!r.ok)throw stHttp('frost',r);
    const j=await r.json(),by=new Map();
    (j.data||[]).forEach(x=>{const d=String(x.referenceTime||'').slice(0,10);(x.observations||[]).forEach(o=>{if(String(o.elementId)!==FROST_EL||!isFinite(o.value))return;
      const rank=FROST_OFF.indexOf(o.timeOffset),q=rank<0?9:rank,h=by.get(d);if(!h||q<h.q)by.set(d,{q,v:+o.value})})});
    by.forEach((v,d)=>out.push([d,v.v]))}
  return out;
}

/* ---------- Finland: FMI (WFS, XML) ---------- */
async function fmiStations(){
  const c=stJGet('ab.st.fmi');if(c&&Date.now()-c.at<30*864e5)return c.l;
  const r=await stFetch('fmi',svcUrl('fmi')+'?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::ef::stations&networkid=121',null,40000);if(!r.ok)throw stHttp('fmi',r);
  const x=new DOMParser().parseFromString(await r.text(),'text/xml'),l=[];
  const kids=(el,n)=>[...el.getElementsByTagNameNS('*',n)];
  kids(x,'EnvironmentalMonitoringFacility').forEach(f=>{
    const id=(kids(f,'identifier')[0]||{}).textContent,nm=kids(f,'name').map(n=>n.textContent.trim()).filter(Boolean),pos=((kids(f,'pos')[0]||{}).textContent||'').trim().split(/\s+/).map(Number);
    const b=((kids(f,'beginPosition')[0]||{}).textContent||'').slice(0,4),e=((kids(f,'endPosition')[0]||{}).textContent||'').slice(0,4);
    if(id&&pos.length>=2&&pos.every(isFinite))l.push([String(id).trim(),nm[0]||String(id),pos[0],pos[1],null,+b||null,+e||null])});
  stJSet('ab.st.fmi',{at:Date.now(),l});return l;
}
async function fmiNear(lat,lng,Y0,Y1){
  const l=await fmiStations();
  return l.map(s=>({prov:'fmi',id:s[0],name:s[1],lat:s[2],lng:s[3],elev:null,km:stKm(lat,lng,s[2],s[3]),y0:s[5],y1:s[6]}))
    .filter(s=>s.km<=ST_MAXKM&&(s.y0==null||s.y0<=Y1-Math.min(ST_MINW,Y1-Y0)+1)&&(s.y1==null||s.y1>=Y0+Math.min(ST_MINW,Y1-Y0)-1));
}
// One request per winter (1 Oct–30 Apr), a few at a time.
async function fmiDays(id,y0,y1){
  const ys=[];for(let y=y0;y<=y1;y++)ys.push(y);const out=[];
  const one=async y=>{const now=new Date(Date.now()-864e5).toISOString().slice(0,10),end=(y+1)+'-04-30',to=end<now?end:now;if(to<y+'-10-01')return;
    const u=svcUrl('fmi')+'?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::observations::weather::daily::simple&fmisid='+encodeURIComponent(id)+'&parameters=tmin&starttime='+y+'-10-01T00:00:00Z&endtime='+to+'T00:00:00Z';
    const r=await stFetch('fmi',u);if(r.status===400)return;if(!r.ok)throw stHttp('fmi',r);
    const x=new DOMParser().parseFromString(await r.text(),'text/xml');
    [...x.getElementsByTagNameNS('*','BsWfsElement')].forEach(e=>{const t=(e.getElementsByTagNameNS('*','Time')[0]||{}).textContent||'',v=parseFloat((e.getElementsByTagNameNS('*','ParameterValue')[0]||{}).textContent);if(t&&isFinite(v))out.push([t.slice(0,10),v])})};
  for(let i=0;i<ys.length;i+=4)await Promise.all(ys.slice(i,i+4).map(one));
  return out;
}

const ST_NEAR={smhiObs:smhiNear,frost:frostNear,fmi:fmiNear},ST_DAYS={smhiObs:smhiDays,frost:frostDays,fmi:fmiDays};
// Stations within ST_MAXKM of a point, nearest first, from every service whose country box holds the point.
async function stCands(lat,lng,Y0,Y1){
  const errs=[],all=[];
  await Promise.all(ST_PROVS.filter(p=>svcOn(p)&&stIn(p,lat,lng)).map(p=>ST_NEAR[p](lat,lng,Y0,Y1).then(l=>{all.push(...l)},e=>{errs.push(e)})));
  all.sort((a,b)=>a.km-b.km);return{list:all,errs};
}
// The winters y0..y1 of one station, from the device where possible. Only winters that ended more than 130 days ago are kept
// (by then SMHI's quality-controlled archive holds them).
async function stWinRange(s,y0,y1){
  const out={},miss=[],keep=Date.now()-130*864e5;
  for(let y=y0;y<=y1;y++){const v=stWinGet(s.prov+':'+s.id+':'+y);if(v!==undefined)out[y]=v;else miss.push(y)}
  if(miss.length){const w=stWinters(await ST_DAYS[s.prov](s.id,miss[0],miss[miss.length-1])),save={};
    miss.forEach(y=>{out[y]=w[y]||null;if(Date.UTC(y+1,4,1)<keep)save[s.prov+':'+s.id+':'+y]=out[y]});stWinSet(save)}
  return out;
}
const stLabel=s=>s.name+' ('+ST_ORG[s.prov]+', '+(s.km<10?numTxt(Math.round(s.km*10)/10):Math.round(s.km))+' km'+(s.elev!=null?', '+s.elev+' m':'')+')';
// The typical winter low at a point from the nearest station with at least ST_MINW full winters among the last ST_NW.
// Returns null when no station qualifies; throws when every station service in reach failed (so the caller can say so).
async function stClim(lat,lng){
  const Y1=stLastWinter(),Y0=Y1-ST_NW+1,k=lat.toFixed(3)+','+lng.toFixed(3)+','+Y1,c=(stJGet('ab.stclim')||{})[k];
  if(c&&Date.now()-c.ts<30*864e5)return c.v;
  const {list,errs}=await stCands(lat,lng,Y0,Y1);
  // A missing Frost client ID matters only when nothing else answered (a Swedish point is also inside Norway's box).
  if(!list.length&&errs.length)throw errs.find(e=>e&&e.why!=='nokey')||errs[0];
  let v=null,failed=0;
  for(const s of list.slice(0,4)){
    let w;try{w=await stWinRange(s,Y0,Y1)}catch(e){errs.push(e);failed++;continue}
    const ys=Object.keys(w).map(Number).filter(y=>w[y]&&w[y][1]>=ST_DJF).sort((a,b)=>a-b);if(ys.length<ST_MINW)continue;
    const m=ys.map(y=>w[y][0]),mean=m.reduce((a,b)=>a+b,0)/m.length,lo=Math.min.apply(null,m),loY=ys[m.indexOf(lo)];
    v={t:Math.round(mean*10)/10,lo,loW:wLbl(loY),n:ys.length,kind:'station',prov:s.prov,stn:{id:s.id,name:s.name,km:Math.round(s.km*10)/10,elev:s.elev},
      src:stLabel(s)+' · '+ys.length+' '+tr('winters','vintrar','winters')+' '+wLbl(ys[0])+'–'+wLbl(ys[ys.length-1])+', 1 Oct–30 Apr',at:today()};break}
  // A station that could not be read is not the same as no station: nothing is kept then, and the caller falls back for now.
  if(!v&&failed)throw errs[errs.length-1];
  const cc=stJGet('ab.stclim')||{};cc[k]={ts:Date.now(),v};const ks=Object.keys(cc);if(ks.length>300)delete cc[ks[0]];stJSet('ab.stclim',cc);
  return v;
}
// The best typical winter low: a station when there is one, else the model (marked kind 'model').
async function climBest(lat,lng,wait,onWait){
  let why='';try{const s=await stClim(lat,lng);if(s)return s;why='nostation'}catch(e){why=e&&e.why==='nokey'?'nokey':'stfail'}
  const m=await climLookup(lat,lng,wait,onWait);return Object.assign({},m,{kind:'model',why});
}
// The lowest temperature of one winter (Oct y – Apr y+1) at a point: the nearest station that has that winter, else the model.
async function winterBest(lat,lng,y){
  const lastDay=new Date(Date.UTC(y+1,3,30)),partial=lastDay>Date.now()-2*864e5,need=partial?Math.min(20,Math.max(1,Math.floor((Date.now()-Date.UTC(y,9,1))/864e5)-3)):150;
  try{const {list}=await stCands(lat,lng,y,y);
    for(const s of list.slice(0,3)){let w;try{w=await stWinRange(s,y,y)}catch(e){continue}const x=w[y];
      if(x&&x[2]>=need&&(partial||x[1]>=ST_DJF))return{t:x[0],partial,src:s.prov,stn:stLabel(s)}}}catch(e){}
  const r=await winterMin(lat,lng,y);return Object.assign({},r,{src:'open-meteo'});
}
// Words for where a winter value comes from (row 79).
function climSrcTxt(c){
  if(!c)return '';
  if(c.kind==='station')return tr('measured at ','uppmätt vid ','gemeten bij ')+stLabel(Object.assign({prov:c.prov},c.stn));
  return tr('model estimate (Open-Meteo, ERA5-Land, ~9 km grid; often too mild on cold nights in the north)','modelluppskattning (Open-Meteo, ERA5-Land, ~9 km rutnät; ofta för mild under kalla nätter i norr)','modelschatting (Open-Meteo, ERA5-Land, ~9 km raster; vaak te mild in koude nachten in het noorden)');
}
const climCredit=c=>c&&c.kind==='station'?stCredit(c.prov):CLIM_CREDIT;
const tSrcTxt=w=>w.tSrc==='open-meteo'?tr('model estimate: Open-Meteo, ERA5-Land, CC BY 4.0','modelluppskattning: Open-Meteo, ERA5-Land, CC BY 4.0','modelschatting: Open-Meteo, ERA5-Land, CC BY 4.0'):ST_ORG[w.tSrc]?tr('measured: ','uppmätt: ','gemeten: ')+(w.tStn||ST_ORG[w.tSrc])+', CC BY 4.0':'';
