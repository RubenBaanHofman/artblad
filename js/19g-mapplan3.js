// Artblad: Garden plan on the map, plan C (2.13.0): aerial photos (Netherlands live from PDOK; Sweden fetched once per
// plan from Lantmäteriet by the backup repository's job), elevation (Lantmäteriet grid 1+, AHN), hill-shade, contour
// lines, slope and aspect of beds and zones, and shadows for a chosen date and time.
// Part 19g; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* plan.aerial = {status: requested|ready|failed|unavailable, country: SE|NL, box: {s,w,n,e}, at, by,
                  photo: {path, box, w, h, gsd, year, src}, dem: {path, box, w, h, src}, msg}
   Only the request is written by the app; the job (scripts/aerial.mjs, database update v12) writes the result, so the
   app never overwrites it: every save of a plan takes data.aerial from the database first (mpKeepAerial). */
const MP_SE=[55,69.2,10.9,24.2],MP_NL=[50.7,53.6,3.3,7.25];
const mpIn=(b,lat,lng)=>lat>=b[0]&&lat<=b[1]&&lng>=b[2]&&lng<=b[3];
const mpCountry=o=>o?mpIn(MP_NL,o.lat,o.lng)?'NL':mpIn(MP_SE,o.lat,o.lng)?'SE':'':'';
const esriKey=()=>String((SERVICES.esriImagery&&SERVICES.esriImagery.apiKey)||cfg.ESRI_API_KEY||'').trim();
const mpPubUrl=p=>String(cfg.SUPABASE_URL||'').replace(/\/+$/,'')+'/storage/v1/object/public/photos/'+p;
const MPT={hill:store.get('ab.mphill')!=='0',cont:store.get('ab.mpcont')!=='0',step:Number(store.get('ab.mpstep')||.5),date:store.get('ab.mpdate')||'',time:store.get('ab.mptime')||'12:00',dem:null,demFor:'',hillUrl:'',cont0:null,contFor:''};
/* ---------- the plan's aerial photo and elevation: request and status ---------- */
function mpAerialBox(){
  const p=pjActive(),b=mpBox(MP.shapes),kx=mpKx();let x0,y0,x1,y1;
  if(b){let xs=[],ys=[];MP.shapes.forEach(s=>mpPts(s).forEach(c=>{const v=mpXY(c);xs.push(v.x);ys.push(v.y)}));x0=Math.min(...xs)-20;x1=Math.max(...xs)+20;y0=Math.min(...ys)-20;y1=Math.max(...ys)+20}
  else{x0=-40;x1=40;y0=-40;y1=40}
  const cx=(x0+x1)/2,cy=(y0+y1)/2,hw=Math.min(170,Math.max(40,(x1-x0)/2)),hh=Math.min(170,Math.max(40,(y1-y0)/2));
  const a=mpLL(cx-hw,cy-hh),c=mpLL(cx+hw,cy+hh),r=v=>Math.round(v*1e6)/1e6;return{s:r(a[1]),w:r(a[0]),n:r(c[1]),e:r(c[0])};
}
const mpBoxHas=(b,shapes)=>!!b&&shapes.every(s=>mpPts(s).every(c=>c[1]>=b.s&&c[1]<=b.n&&c[0]>=b.w&&c[0]<=b.e));
async function mpAerialRequest(){
  const q=mpPlan(),cty=mpCountry(MP.o);if(!q||!mpCanEdit())return;
  if(!cty){toast(tr('There is no open aerial photo or elevation source for this country yet.','Det finns ännu ingen öppen flygbild eller höjdkälla för det här landet.','Er is nog geen open luchtfoto- of hoogtebron voor dit land.'),'err');return}
  await mpSaveMeta({aerial:{status:'requested',country:cty,what:'dem',box:mpAerialBox(),at:Date.now(),by:meUid()||''}},
    tr('Requested. The elevation is fetched within the hour (the backup repository’s job).','Beställd. Höjddata hämtas inom en timme (jobbet i backup-repot).','Aangevraagd. De hoogte wordt binnen het uur opgehaald (de taak in de backup-repository).'));
}
// A save of the plan keeps whatever the job has written to data.aerial in the meantime.
async function mpKeepAerial(id,doc,patch){
  if(patch&&Object.prototype.hasOwnProperty.call(patch,'aerial'))return;
  if(!SB){return}try{const r=await SB.from('plans').select('data').eq('id',id).maybeSingle();if(r&&!r.error&&r.data&&r.data.data){const a=r.data.data.aerial;if(a)doc.aerial=a;else delete doc.aerial}}catch(e){}
}
function mpTerrainHTML(q){
  const a=q.aerial||{},cty=mpCountry(MP.o),ed=mpCanEdit();let h='<h3 class="hsub">'+esc(tr('Aerial photo and terrain','Flygbild och terräng','Luchtfoto en terrein'))+'</h3>';
  if(cty==='NL')h+='<p class="mpsmall muted">'+esc(tr('Aerial photo: live from PDOK (Beeldmateriaal.nl, 8 cm).','Flygbild: direkt från PDOK (Beeldmateriaal.nl, 8 cm).','Luchtfoto: live van PDOK (Beeldmateriaal.nl, 8 cm).'))+'</p>';
  else if(esriKey()&&svcOn('esriImagery'))h+='<p class="mpsmall muted">'+esc(tr('Aerial photo: live from Esri World Imagery (often 0.3–1 m; date varies).','Flygbild: direkt från Esri World Imagery (ofta 0,3–1 m; datum varierar).','Luchtfoto: live van Esri World Imagery (vaak 0,3–1 m; datum wisselt).'))+'</p>';
  else h+='<p class="mpsmall muted">'+esc(tr('No aerial photo: add ESRI_API_KEY to config.js (see the manual), or use your own photo in the 2.8 plan.','Ingen flygbild: lägg till ESRI_API_KEY i config.js (se manualen), eller använd ditt eget foto i 2.8-planen.','Geen luchtfoto: voeg ESRI_API_KEY toe aan config.js (zie de handleiding), of gebruik je eigen foto in het 2.8-plan.'))+'</p>';
  if(!cty)h+='<p class="mpsmall muted">'+esc(tr('No open elevation source for this country yet.','Ingen öppen höjdkälla för det här landet än.','Nog geen open hoogtebron voor dit land.'))+'</p>';
  const st={requested:tr('Requested ','Beställd ','Aangevraagd ')+fmtDate(a.at)+tr(': fetched within the hour.',': hämtas inom en timme.',': wordt binnen het uur opgehaald.'),
    ready:tr('Ready','Klar','Klaar')+(a.photo?' · '+tr('photo ','foto ','foto ')+(a.photo.year||'')+(a.photo.gsd?' ('+numTxt(a.photo.gsd*100)+' cm)':''):'')+(a.dem?' · '+tr('elevation 1 m','höjd 1 m','hoogte 1 m'):''),
    failed:tr('Could not be fetched: ','Kunde inte hämtas: ','Kon niet worden opgehaald: ')+(a.msg||''),unavailable:tr('Not available here.','Finns inte här.','Hier niet beschikbaar.')}[a.status];
  if(st)h+='<p class="mpsmall'+(a.status==='failed'?' admwarn':'')+'">'+esc(st)+(a.status==='ready'&&a.msg?' <span class="muted">('+esc(a.msg)+')</span>':'')+'</p>';
  if(a.status==='ready'&&a.box&&!mpBoxHas(a.box,MP.shapes))h+='<p class="mpsmall muted">'+esc(tr('Some shapes lie outside the fetched area: fetch again to cover them.','Några former ligger utanför det hämtade området: hämta igen för att täcka dem.','Sommige vormen liggen buiten het opgehaalde gebied: haal opnieuw op om ze te dekken.'))+'</p>';
  if(ed&&cty&&a.status!=='requested')h+='<div class="acts"><button type="button" class="btn sm" data-act="mp-aerial">'+esc(a.status==='ready'?tr('Fetch again','Hämta igen','Opnieuw ophalen'):tr('Get the elevation','Hämta höjddata','Hoogte ophalen'))+'</button></div>';
  if(MPT.dem){const sl=MPT.dem;
    h+='<div class="mplayers"><label class="chk"><input type="checkbox" data-mpt="hill"'+(MPT.hill?' checked':'')+'> '+esc(tr('Hill-shade','Terrängskuggning','Reliëfschaduw'))+'</label>'+
      '<label class="chk"><input type="checkbox" data-mpt="cont"'+(MPT.cont?' checked':'')+'> '+esc(tr('Contour lines every','Höjdkurvor var','Hoogtelijnen om de'))+' <select data-mpt="step">'+[.25,.5,1,2].map(v=>'<option value="'+v+'"'+(v===MPT.step?' selected':'')+'>'+numTxt(v)+' m</option>').join('')+'</select></label></div>'+
      '<p class="mpsmall muted">'+esc(tr('Height ','Höjd ','Hoogte ')+numTxt(Math.round(sl.min*10)/10)+'–'+numTxt(Math.round(sl.max*10)/10)+' m · '+sl.src)+'</p>'}
  h+='<h3 class="hsub">'+esc(tr('Sun and shade','Sol och skugga','Zon en schaduw'))+'</h3><div class="mprow"><label class="f"><span class="fl">'+esc(tr('Date','Datum','Datum'))+'</span><input data-mpt="date" type="date" value="'+esc(mpSunDate())+'"></label>'+
    '<label class="f"><span class="fl">'+esc(tr('Time','Tid','Tijd'))+'</span><input data-mpt="time" type="time" value="'+esc(MPT.time)+'"></label></div>';
  const sp=mpSunPos();h+='<p class="mpsmall muted">'+esc(sp.alt>0?tr('Sun ','Solen ','Zon ')+Math.round(sp.alt)+'° '+tr('high, from the ','högt, från ','hoog, uit het ')+mpDir(sp.az)+tr(' (shadows in the illustrated view).',' (skuggor i den illustrerade vyn).',' (schaduwen in de geïllustreerde weergave).'):tr('The sun is below the horizon then.','Solen är under horisonten då.','De zon staat dan onder de horizon.'))+'</p>';
  return h;
}
/* ---------- the sun (NOAA's simplified solar position) ---------- */
const mpSunDate=()=>MPT.date||(new Date().getFullYear()+'-06-21');
function mpSunPos(){
  const o=MP.o||{lat:60,lng:15},d=new Date(mpSunDate()+'T'+(MPT.time||'12:00')+':00');if(isNaN(d))return{alt:45,az:180};
  const rad=Math.PI/180,J=d.getTime()/864e5+2440587.5,n=J-2451545,L=(280.46+.9856474*n)%360,g=(357.528+.9856003*n)%360*rad;
  const lam=(L+1.915*Math.sin(g)+.02*Math.sin(2*g))*rad,eps=(23.439-4e-7*n)*rad,dec=Math.asin(Math.sin(eps)*Math.sin(lam));
  let ra=Math.atan2(Math.cos(eps)*Math.sin(lam),Math.cos(lam));const gmst=(18.697374558+24.06570982441908*n)%24,lst=(gmst*15+o.lng)*rad,H=lst-ra,la=o.lat*rad;
  const alt=Math.asin(Math.sin(la)*Math.sin(dec)+Math.cos(la)*Math.cos(dec)*Math.cos(H));let az=Math.atan2(-Math.sin(H),Math.tan(dec)*Math.cos(la)-Math.sin(la)*Math.cos(H));
  return{alt:alt/rad,az:((az/rad)+360)%360};
}
const mpDir=az=>[tr('north','norr','noorden'),tr('north-east','nordost','noordoosten'),tr('east','öster','oosten'),tr('south-east','sydost','zuidoosten'),tr('south','söder','zuiden'),tr('south-west','sydväst','zuidwesten'),tr('west','väster','westen'),tr('north-west','nordväst','noordwesten')][Math.round(az/45)%8];
// Shadow of 1 m of height, in metres east and north (null at night or with the sun very low).
function mpSunVec(){const s=mpSunPos();if(s.alt<=1)return null;const k=Math.min(40,1/Math.tan(s.alt*Math.PI/180)),a=(s.az+180)*Math.PI/180;return{x:Math.sin(a)*k,y:Math.cos(a)*k}}
/* ---------- elevation: load, hill-shade, contour lines, slope ---------- */
async function mpDemLoad(q){
  const a=q&&q.aerial,d=a&&a.status==='ready'&&a.dem;if(!d){if(MPT.dem){MPT.dem=null;mpTerrainDraw()}MPT.demFor='';return}
  if(MPT.demFor===d.path)return;MPT.demFor=d.path;MPT.dem=null;MPT.hillUrl='';MPT.contFor='';
  try{const r=await fetch(mpPubUrl(d.path));if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();
    const bin=atob(j.data),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);const raw=new Int16Array(u8.buffer),z=new Float32Array(raw.length);
    let mn=Infinity,mx=-Infinity;for(let i=0;i<raw.length;i++){if(raw[i]===j.nodata){z[i]=NaN;continue}z[i]=j.min+raw[i]*j.scale;if(z[i]<mn)mn=z[i];if(z[i]>mx)mx=z[i]}
    if(MPT.demFor!==d.path)return;MPT.dem={w:j.w,h:j.h,box:j.box,z,min:mn,max:mx,src:d.src||j.src||''};mpTerrainDraw();mpSide();
  }catch(e){MPT.demFor='';toast(tr('The elevation could not be loaded.','Höjddata kunde inte laddas.','De hoogtegegevens konden niet worden geladen.'),'err')}
}
function mpDemCell(D){const kx=111320*Math.cos((D.box.s+D.box.n)/2*Math.PI/180);return{cx:(D.box.e-D.box.w)*kx/D.w,cy:(D.box.n-D.box.s)*110574/D.h}}
// Slope (degrees) and aspect (degrees from north, the way the slope faces) at grid cell (i, j).
function mpSlope(D,i,j){
  const z=(a,b)=>D.z[Math.max(0,Math.min(D.h-1,b))*D.w+Math.max(0,Math.min(D.w-1,a))],c=mpDemCell(D);
  const dx=(z(i+1,j)-z(i-1,j))/(2*c.cx),dy=(z(i,j-1)-z(i,j+1))/(2*c.cy);if(!isFinite(dx)||!isFinite(dy))return null;
  return{s:Math.atan(Math.hypot(dx,dy))*180/Math.PI,a:(Math.atan2(-dx,-dy)*180/Math.PI+360)%360};
}
function mpHillUrl(D){
  const c=document.createElement('canvas');c.width=D.w;c.height=D.h;const g=c.getContext('2d'),im=g.createImageData(D.w,D.h),az=315*Math.PI/180,al=45*Math.PI/180;
  for(let j=0;j<D.h;j++)for(let i=0;i<D.w;i++){const s=mpSlope(D,i,j),k=(j*D.w+i)*4;if(!s){im.data[k+3]=0;continue}
    const sl=s.s*Math.PI/180,as=s.a*Math.PI/180,v=Math.max(0,Math.cos(al)*Math.cos(sl)+Math.sin(al)*Math.sin(sl)*Math.cos(az-as));
    const t=Math.round(255*v);im.data[k]=t;im.data[k+1]=t;im.data[k+2]=t;im.data[k+3]=Math.round(Math.min(160,Math.abs(v-Math.cos(al))*400+20))}
  g.putImageData(im,0,0);return c.toDataURL('image/png');
}
// Contour lines by marching squares: [[height, [[lat,lng],[lat,lng]]]…], one segment per cell crossing.
function mpContours(D,step){
  const out=[],ll=(x,y)=>[D.box.n-(y+.5)/D.h*(D.box.n-D.box.s),D.box.w+(x+.5)/D.w*(D.box.e-D.box.w)],Z=(i,j)=>D.z[j*D.w+i];
  const lv0=Math.ceil(D.min/step)*step;
  for(let lv=lv0;lv<=D.max;lv+=step){const L=[];
    for(let j=0;j+1<D.h;j++)for(let i=0;i+1<D.w;i++){const a=Z(i,j),b=Z(i+1,j),c=Z(i+1,j+1),d=Z(i,j+1);if(!(isFinite(a)&&isFinite(b)&&isFinite(c)&&isFinite(d)))continue;
      const p=[],e=(z1,z2,x1,y1,x2,y2)=>{if((z1<lv)!==(z2<lv)){const t=(lv-z1)/(z2-z1);p.push(ll(x1+(x2-x1)*t,y1+(y2-y1)*t))}};
      e(a,b,i,j,i+1,j);e(b,c,i+1,j,i+1,j+1);e(c,d,i+1,j+1,i,j+1);e(d,a,i,j+1,i,j);
      if(p.length===2)L.push(p);else if(p.length===4){L.push([p[0],p[1]]);L.push([p[2],p[3]])}}
    if(L.length)out.push([Math.round(lv*100)/100,L])}
  return out;
}
function mpTerrainDraw(){
  if(!MP.map)return;if(MP.ter){MP.ter.remove();MP.ter=null}const D=MPT.dem;if(!D)return;
  MP.ter=L.layerGroup().addTo(MP.map);const b=[[D.box.s,D.box.w],[D.box.n,D.box.e]];
  if(MPT.hill){if(!MPT.hillUrl)MPT.hillUrl=mpHillUrl(D);L.imageOverlay(MPT.hillUrl,b,{opacity:.55,interactive:false,className:'mphill'}).addTo(MP.ter)}
  if(MPT.cont){const k=D.w+'|'+MPT.step;if(MPT.contFor!==k){MPT.cont0=mpContours(D,MPT.step);MPT.contFor=k}
    MPT.cont0.forEach(([lv,segs])=>{const major=Math.abs(lv/(MPT.step*4)-Math.round(lv/(MPT.step*4)))<1e-6;
      L.polyline(segs,{color:'#7a4b1e',weight:major?1.6:.8,opacity:major?.85:.6,interactive:false}).addTo(MP.ter)})}
}
// Slope, aspect and height range of a bed or zone from the elevation grid.
function mpShapeTerrain(s){
  const D=MPT.dem;if(!D||MPK[s.kind].g!=='Polygon')return '';const P=mpPts(s).map(mpXY);let n=0,sx=0,sy=0,zs=0,lo=Infinity,hi=-Infinity;
  for(let j=1;j<D.h-1;j++)for(let i=1;i<D.w-1;i++){const lat=D.box.n-(j+.5)/D.h*(D.box.n-D.box.s),lng=D.box.w+(i+.5)/D.w*(D.box.e-D.box.w);if(!mpInPoly(mpXY([lng,lat]),P))continue;
    const sl=mpSlope(D,i,j),z=D.z[j*D.w+i];if(!sl||!isFinite(z))continue;n++;zs+=sl.s;const a=sl.a*Math.PI/180;sx+=Math.sin(a)*sl.s;sy+=Math.cos(a)*sl.s;lo=Math.min(lo,z);hi=Math.max(hi,z)}
  if(!n)return '';const s0=zs/n,az=(Math.atan2(sx,sy)*180/Math.PI+360)%360;
  return '<p class="mpstat">'+esc(tr('Slope ','Lutning ','Helling ')+numTxt(Math.round(s0*10)/10)+'°'+(s0>=1?', '+tr('facing ','mot ','op het ')+mpDir(az):', '+tr('flat','plan','vlak'))+' · '+tr('height ','höjd ','hoogte ')+numTxt(Math.round(lo*10)/10)+'–'+numTxt(Math.round(hi*10)/10)+' m')+'</p>';
}
/* ---------- the aerial layer ---------- */
function mpAerialLayer(){
  if(!MP.map)return;const q=mpPlan(),a=q&&q.aerial,cty=mpCountry(MP.o);
  const want=cty==='NL'&&svcOn('pdokAerial')?'nl':a&&a.status==='ready'&&a.photo?'se:'+a.photo.path:esriKey()&&svcOn('esriImagery')?'esri':'';
  if(MP.aerFor===want)return;MP.aerFor=want;if(MP.aer){MP.aer.remove();MP.aer=null}MP.aerGsd=null;
  if(want==='nl'){MP.aer=L.tileLayer(svcUrl('pdokAerial'),{maxNativeZoom:SERVICES.pdokAerial.maxZoom||19,maxZoom:24,zIndex:2,attribution:SERVICES.pdokAerial.attr||''});MP.aer.on('tileerror',()=>svcNote('pdokAerial',false,'tile error'));MP.aer.on('load',()=>svcNote('pdokAerial',true));MP.aerGsd=.08}
  else if(want==='esri'){MP.aer=L.tileLayer(svcUrl('esriImagery')+'?token='+encodeURIComponent(esriKey()),{maxNativeZoom:SERVICES.esriImagery.maxZoom||19,maxZoom:24,zIndex:2,attribution:SERVICES.esriImagery.attr||''});MP.aer.on('tileerror',()=>svcNote('esriImagery',false,'tile error'));MP.aer.on('load',()=>svcNote('esriImagery',true));MP.aerGsd=.5}
  else if(want){const p=a.photo,b=p.box||a.box;MP.aer=L.imageOverlay(mpPubUrl(p.path),[[b.s,b.w],[b.n,b.e]],{interactive:false,attribution:'Lantmäteriet (CC0)'});MP.aerGsd=p.gsd||.25}
  if(MP.aer){MP.aer.addTo(MP.map);if(MP.aer.bringToBack)MP.aer.bringToBack();if(MP.tiles&&MP.tiles.bringToBack)MP.tiles.bringToBack()}
}
// Opacity of the map and of the aerial photo for the background choice, zoom and fade slider. In Auto the photo fades to the
// neutral grid once one photo pixel is more than 3 screen pixels (gone at 6); the map fades between zoom 20 and 21.
function mpBackOps(z){
  const f=MP.fade/100;let map=0,aer=0;const px=MP.aerGsd?MP.aerGsd/mpMpp():0,aerRes=MP.aerGsd?Math.max(0,Math.min(1,(6-px)/3)):0;
  if(MP.bg==='map')map=1;else if(MP.bg==='aerial')aer=MP.aer?1:0;else if(MP.bg==='auto'){
    // 2.13.1 (Ruben): Auto goes photo → map → grid. The photo lies on top of the map and fades by its own detail;
    // the map under it fades at zoom 20–21. A photo coarser than the map (Esri) thus gives way to the map first;
    // a photo finer than the map (PDOK 8 cm) stays until the map has already gone, then fades to the grid.
    map=Math.max(0,Math.min(1,21-z));if(MP.aer)aer=aerRes}
  return{map:map*f,aer:aer*f};
}
function mpChange2(t){
  const k=t.dataset&&t.dataset.mpt;if(!k)return false;
  if(k==='hill'){MPT.hill=t.checked;store.set('ab.mphill',t.checked?'1':'0')}
  if(k==='cont'){MPT.cont=t.checked;store.set('ab.mpcont',t.checked?'1':'0')}
  if(k==='step'){MPT.step=Number(t.value)||.5;store.set('ab.mpstep',String(MPT.step));t.blur()}
  if(k==='date'){MPT.date=t.value;store.set('ab.mpdate',t.value)}
  if(k==='time'){MPT.time=t.value||'12:00';store.set('ab.mptime',MPT.time)}
  if(k==='hill'||k==='cont'||k==='step')mpTerrainDraw();else{mpDraw();mpSide()}
  return true;
}
