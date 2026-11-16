// Artblad: SERVICE: map of planting records (Leaflet served from this site, OpenStreetMap tiles).
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
async function updatePlMap(list){
  const box=$('#plMap');if(!box)return;const pts=list.filter(p=>isFinite(p.lat)&&isFinite(p.lng)&&p.lat!==''&&p.lng!=='');
  box.hidden=!pts.length;if(!pts.length){const k=$('#plMapKey');if(k)k.hidden=true;return}
  try{await loadLeaflet()}catch(e){box.hidden=true;return}
  if(!plMap){plMap=L.map(box,{scrollWheelZoom:false});L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(plMap);plLayer=L.layerGroup().addTo(plMap)}
  plLayer.clearLayers();const b=[];
  {const k=$('#plMapKey');if(k)k.hidden=!pts.some(isEnc)}
  pts.forEach(p=>{const s=bySid.get(p.sid),en=isEnc(p);const mk=L.circleMarker([p.lat,p.lng],en?{radius:6,weight:2,dashArray:'3 3',color:'#2f6f8f',fillColor:'#2f6f8f',fillOpacity:.3}:{radius:7,weight:2,color:p.status==='dead'?'#9a3a2a':p.status==='struggling'?'#b07a12':'#2f5d3a',fillOpacity:.6});
    mk.bindPopup('<b>'+esc(s?dispName(s):p.latin||p.sid)+'</b><br>'+(en?esc(tr('Encounter','Fynd','Vondst'))+' · ':'')+esc(p.place||'')+' · '+esc(p.status||''));mk.addTo(plLayer);b.push([p.lat,p.lng])});
  setTimeout(()=>{plMap.invalidateSize();if(b.length===1)plMap.setView(b[0],16);else plMap.fitBounds(b,{padding:[24,24],maxZoom:17})},50);
}
