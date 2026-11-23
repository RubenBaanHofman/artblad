// Artblad: SERVICE: map of planting records (Leaflet served from this site, map tiles from SERVICES.tiles).
// Part 11 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- map of planting records (Leaflet 1.9.4 from vendor/leaflet since 2.5.1, OpenStreetMap tiles; loaded only when needed) ---------- */
let plMap=null,plLayer=null,leafletP=null;
function loadLeaflet(){
  if(window.L)return Promise.resolve();if(leafletP)return leafletP;
  leafletP=new Promise((res,rej)=>{const c=document.createElement('link');c.rel='stylesheet';c.href='vendor/leaflet/leaflet.css?v='+APP_VERSION;document.head.appendChild(c);
    const sc=document.createElement('script');sc.src='vendor/leaflet/leaflet.js?v='+APP_VERSION;sc.onload=res;sc.onerror=()=>{leafletP=null;rej()};document.head.appendChild(sc)});
  return leafletP;
}
// 2.8.0 (batch 5, rows 20 and 70): plants placed on a linked garden plan show at their plan position; positions taken with
// GPS show their accuracy circle; "Place on the map" lets you tap the map to set a plant's position.
const mapPt=p=>hasPt(p)?{lat:Number(p.lat),lng:Number(p.lng),acc:Number(p.acc)||0,plan:false}:(!isEnc(p)&&typeof plPlanPt==='function'&&plPlanPt(p))?Object.assign(plPlanPt(p),{acc:0,plan:true}):null;
async function updatePlMap(list){
  const box=$('#plMap');if(!box)return;const placing=plState.mapPlace&&(state.plantings||[]).find(p=>p.id===plState.mapPlace);
  {const bn=$('#plMapPlace');if(bn){bn.hidden=!placing;if(placing)bn.innerHTML=esc(tr('Tap the map where this plant grows: ','Tryck på kartan där plantan växer: ','Tik op de kaart waar deze plant groeit: '))+'<b>'+esc(plTitle(placing))+'</b> <button type="button" class="btn sm" data-act="pl-mapplace-stop">'+esc(tr('Cancel','Avbryt','Annuleren'))+'</button>'}}
  const pts=list.map(p=>({p,q:mapPt(p)})).filter(o=>o.q);
  const cen=placing&&(plPoint(placing)||null);
  box.hidden=!pts.length&&!placing;if(!pts.length&&!placing){const k=$('#plMapKey');if(k)k.hidden=true;return}
  try{await loadLeaflet()}catch(e){box.hidden=true;return}
  if(!plMap){plMap=L.map(box,{scrollWheelZoom:false});
    // Tile address from SERVICES (01-core.js; can be changed in config.js). Without tiles the points still show on a blank map.
    if(svcOn('tiles')){const tl=L.tileLayer(svcUrl('tiles'),{maxZoom:19,attribution:SERVICES.tiles.attr||''});tl.on('tileerror',()=>svcNote('tiles',false,'tile error'));tl.on('load',()=>svcNote('tiles',true));tl.addTo(plMap)}
    plLayer=L.layerGroup().addTo(plMap);
    plMap.on('click',ev=>{const id=plState.mapPlace;if(!id)return;plState.mapPlace='';const la=Math.round(ev.latlng.lat*1e6)/1e6,ln=Math.round(ev.latlng.lng*1e6)/1e6;
      plPatch(id,d=>{d.lat=la;d.lng=ln;delete d.acc},tr('Map position saved (only project members see it)','Kartposition sparad (bara projektets medlemmar ser den)','Kaartpositie opgeslagen (alleen projectleden zien hem)'))})}
  box.classList.toggle('placing',!!placing);
  plLayer.clearLayers();const b=[];
  {const k=$('#plMapKey');if(k)k.hidden=!pts.some(o=>isEnc(o.p))}
  pts.forEach(({p,q})=>{const s=bySid.get(p.sid),en=isEnc(p);
    if(q.acc>3)L.circle([q.lat,q.lng],{radius:q.acc,weight:1,color:'#2a6f9e',fillOpacity:.06,interactive:false}).addTo(plLayer);
    const mk=L.circleMarker([q.lat,q.lng],en?{radius:6,weight:2,dashArray:'3 3',color:'#2f6f8f',fillColor:'#2f6f8f',fillOpacity:.3}:{radius:7,weight:2,color:p.status==='dead'?'#9a3a2a':p.status==='struggling'?'#b07a12':'#2f5d3a',fillOpacity:.6});
    mk.bindPopup('<b>'+esc(s?dispName(s):p.latin||p.sid)+'</b>'+esc(plLabelTxt(p))+'<br>'+(en?esc(tr('Encounter','Fynd','Vondst'))+' · ':'')+esc(plPlaceName(p)||'')+' · '+esc(p.status||'')+(q.acc>3?'<br>± '+Math.round(q.acc)+' m':'')+(q.plan?'<br>'+esc(tr('position from the garden plan','position från trädgårdsplanen','positie uit het tuinplan')):'')+(en?'':'<br><a href="#p-'+esc(p.id)+'">'+esc(tr('History','Historik','Geschiedenis'))+'</a>'));mk.addTo(plLayer);b.push([q.lat,q.lng])});
  if(placing&&!b.length&&cen)b.push([cen.lat,cen.lng]);
  setTimeout(()=>{plMap.invalidateSize();if(!b.length){plMap.setView([62,16],4);return}if(b.length===1)plMap.setView(b[0],placing?18:16);else plMap.fitBounds(b,{padding:[24,24],maxZoom:17})},50);
}
