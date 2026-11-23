// Artblad: Garden plan on the map, plan B (2.12.0): planting lines, structures, supports, paths, water, the illustrated
// view, "Log as planted", typed lengths, repeating shapes and the phone view with field actions.
// Part 19f; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* Planting line (kind pline): a line with a species, the distance between plants in the row (inrow), the space a row
   needs across (rowsp), the number of rows in the strip (rows) and the distance between those rows (gap). The strip it
   takes up is drawn as a buffer of (rows−1)·gap + rowsp wide, half on each side; strips or plants that overlap turn red.
   Count = rows × (⌊length ÷ inrow⌋ + 1). A plan is never assumed planted: "Log as planted" makes one planting record
   (count, position, project place) and links it to the shape (shape.plantingId; record.plan {id, shape}). */
const mpLineW=s=>Math.max(.05,((Number(s.rows)||1)-1)*(Number(s.gap)||.3)+(Number(s.rowsp)||.4));
// 2.14.0: a tolerance of 2 % of a spacing, so a 20 m line at 10 cm holds 201 plants despite coordinate rounding.
const mpPerRow=s=>Math.floor(mpLen(mpPts(s),false)/(Number(s.inrow)||.3)+.02)+1;
const mpLineCount=s=>(Number(s.rows)||1)*mpPerRow(s);
function mpSpCm(sid,k){const x=bySid.get(sid),v=x&&Number((x.m||{})[k]);return isFinite(v)&&v>0?v/100:null}
function mpLineDefaults(s){
  const sp=mpSpCm(s.sid,'spacing')||mpSpCm(s.sid,'spread');
  if(!s.inrow)s.inrow=sp?Math.round(sp*100)/100:.3;if(!s.rowsp)s.rowsp=sp?Math.round(sp*100)/100:.4;if(!s.rows)s.rows=1;if(!s.gap)s.gap=.3;
}
const MP_TYPEC={tree:'#3c7a37',shrub:'#55893a',climber:'#78a03c',subshrub:'#6e9b56',perennial:'#86b057',annual:'#a7c46a',biennial:'#99ba61'};
function mpPlantType(s){const x=bySid.get(s.sid),t=x&&((x.m||{}).type);return t||''}
function mpPlantH(s){const v=mpSpCm(s.sid,'height');if(v)return v;const t=mpPlantType(s);return t==='tree'?6:t==='shrub'?1.8:t==='climber'?2.5:.6}
/* ---------- geometry in metres ---------- */
function mpSegDist(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy,t=L2?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/L2)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}
function mpSegSeg(a,b,c,d){
  const cr=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x),d1=cr(a,b,c),d2=cr(a,b,d),d3=cr(c,d,a),d4=cr(c,d,b);
  if(((d1>0&&d2<0)||(d1<0&&d2>0))&&((d3>0&&d4<0)||(d3<0&&d4>0)))return 0;
  return Math.min(mpSegDist(a,c,d),mpSegDist(b,c,d),mpSegDist(c,a,b),mpSegDist(d,a,b));
}
function mpLineLine(p,q){let m=Infinity;for(let i=0;i+1<p.length;i++)for(let j=0;j+1<q.length;j++)m=Math.min(m,mpSegSeg(p[i],p[i+1],q[j],q[j+1]));return m}
function mpPtLine(c,p){let m=Infinity;for(let i=0;i+1<p.length;i++)m=Math.min(m,mpSegDist(c,p[i],p[i+1]));return m}
function mpInPoly(c,poly){let a=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const p=poly[i],q=poly[j];if((p.y>c.y)!==(q.y>c.y)&&c.x<(q.x-p.x)*(c.y-p.y)/(q.y-p.y)+p.x)a=!a}return a}
// Shapes whose strips or crowns overlap a planting line's strip (shown red).
function mpOverlapSet(){
  const o=new Set(),L=MP.shapes.filter(s=>s.kind==='pline').map(s=>({s,p:mpPts(s).map(mpXY),h:mpLineW(s)/2}));
  const P=MP.shapes.filter(s=>s.kind==='plant').map(s=>({s,c:mpXY(mpPts(s)[0]),r:(mpSpread(s)||.5)/2}));
  for(let i=0;i<L.length;i++){for(let j=i+1;j<L.length;j++)if(mpLineLine(L[i].p,L[j].p)<L[i].h+L[j].h-.005){o.add(L[i].s.id);o.add(L[j].s.id)}
    P.forEach(q=>{if(mpPtLine(q.c,L[i].p)<L[i].h+q.r-.005){o.add(L[i].s.id);o.add(q.s.id)}})}
  return o;
}
// The point deepest inside a polygon (pole of inaccessibility), so a name stays inside C- and L-shaped beds.
function mpInner(pts){
  const P=pts.map(mpXY);if(P.length<3)return pts[0];
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;P.forEach(p=>{x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y)});
  const w=x1-x0,h=y1-y0,sz=Math.min(w,h);if(!(sz>0))return pts[0];
  const edge=(x,y)=>{let m=Infinity;for(let i=0,j=P.length-1;i<P.length;j=i++)m=Math.min(m,mpSegDist({x,y},P[j],P[i]));return (mpInPoly({x,y},P)?1:-1)*m};
  const cell=(x,y,hh)=>{const d=edge(x,y);return{x,y,h:hh,d,max:d+hh*Math.SQRT2}};
  const q=[];let hh=sz/2;for(let x=x0;x<x1;x+=sz)for(let y=y0;y<y1;y+=sz)q.push(cell(x+hh,y+hh,hh));
  let A=0,cx=0,cy=0;for(let i=0,j=P.length-1;i<P.length;j=i++){const f=P[j].x*P[i].y-P[i].x*P[j].y;A+=f;cx+=(P[j].x+P[i].x)*f;cy+=(P[j].y+P[i].y)*f}
  let best=A?cell(cx/(3*A),cy/(3*A),0):cell(x0+w/2,y0+h/2,0);const bb=cell(x0+w/2,y0+h/2,0);if(bb.d>best.d)best=bb;
  const prec=Math.max(.02,sz/100);let n=0;
  while(q.length&&n++<4000){let k=0;for(let i=1;i<q.length;i++)if(q[i].max>q[k].max)k=i;const c=q.splice(k,1)[0];
    if(c.d>best.d)best=c;if(c.max-best.d<=prec)continue;const g=c.h/2;q.push(cell(c.x-g,c.y-g,g),cell(c.x+g,c.y-g,g),cell(c.x-g,c.y+g,g),cell(c.x+g,c.y+g,g))}
  return mpLL(best.x,best.y);
}
// A line shifted sideways by d metres (left positive), for the rows of a multi-row strip.
function mpOffset(P,d){
  if(!d)return P;const n=P.length,out=[];
  for(let i=0;i<n;i++){const a=P[Math.max(0,i-1)],b=P[Math.min(n-1,i+1)],c=P[i];let nx=0,ny=0;
    const seg=(p,q)=>{const L=Math.hypot(q.x-p.x,q.y-p.y)||1;return{x:-(q.y-p.y)/L,y:(q.x-p.x)/L}};
    if(i>0){const s=seg(P[i-1],c);nx+=s.x;ny+=s.y}if(i<n-1){const s=seg(c,P[i+1]);nx+=s.x;ny+=s.y}
    const L=Math.hypot(nx,ny)||1;nx/=L;ny/=L;let k=1;if(i>0&&i<n-1){const s=seg(P[i-1],c);k=1/Math.max(.3,nx*s.x+ny*s.y)}
    out.push({x:c.x+nx*d*k,y:c.y+ny*d*k})}
  return out;
}
// Points every `step` metres along a line (in metres).
function mpAlong(P,step,max){const out=[];let carry=0;for(let i=0;i+1<P.length;i++){const a=P[i],b=P[i+1],L=Math.hypot(b.x-a.x,b.y-a.y);let t=carry;while(t<=L+1e-6){out.push({x:a.x+(b.x-a.x)*t/L,y:a.y+(b.y-a.y)*t/L});if(out.length>=max)return out;t+=step}carry=t-L}return out}
const mpMid=pts=>{const P=pts.map(mpXY),half=mpLen(pts,false)/2,a=mpAlong(P,Math.max(half,.001),2);const m=a[1]||a[0];return mpLL(m.x,m.y)};
/* ---------- drawing the shapes (technical and illustrated) ---------- */
function mpDefs(){
  if(!MP.map)return;const svg=MP.map.getPanes().overlayPane.querySelector('svg');if(!svg||svg.querySelector('#mpSoil'))return;
  const d=document.createElementNS('http://www.w3.org/2000/svg','defs');
  d.innerHTML='<pattern id="mpSoil" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#a98458"/><circle cx="2" cy="3" r="1" fill="#8d6a43"/><circle cx="7" cy="7" r="1.1" fill="#bf9a6c"/></pattern>'+
    '<pattern id="mpRoof" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#8f8f8f"/><path d="M0 4H8" stroke="#7a7a7a" stroke-width="1.5"/></pattern>'+
    '<pattern id="mpGravel" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#ddd2b4"/><circle cx="2" cy="2" r=".9" fill="#c2b48e"/><circle cx="5" cy="5" r=".8" fill="#eee6cf"/></pattern>'+
    '<pattern id="mpWater" width="14" height="8" patternUnits="userSpaceOnUse"><rect width="14" height="8" fill="#86c0e8"/><path d="M0 5q3.5-2 7 0t7 0" stroke="#b5dcf5" fill="none" stroke-width="1.2"/></pattern>';
  svg.insertBefore(d,svg.firstChild);
}
const mpPx=m=>Math.max(1,m/mpMpp());
function mpStyle(s,sel,other){
  const k=MPK[s.kind],act=!other&&(MP.tool==='select'||MP.tool==='moveall'),ill=MP.view==='ill'&&!other;
  const st={color:k.c,weight:sel?3.5:2,opacity:other?.35:1,fillColor:k.c,fillOpacity:other?.04:(k.f||0),dashArray:k.d||null,interactive:act,bubblingMouseEvents:false};
  if(ill){if(s.kind==='bed')Object.assign(st,{color:'#6d4a2a',fillColor:'url(#mpSoil)',fillOpacity:.95});
    if(s.kind==='structure')Object.assign(st,{color:'#4a4a4a',fillColor:'url(#mpRoof)',fillOpacity:1});
    if(s.kind==='water')Object.assign(st,{color:'#2f7fbf',fillColor:'url(#mpWater)',fillOpacity:1})}
  if(sel)st.weight=3.5;return st;
}
// 2.13.0: shadows for the chosen date and time (sun position from 19g); length = height ÷ tan(sun altitude).
function mpShadows(list){
  const v=mpSunVec();if(!v)return;const sh={stroke:false,fillColor:'#1d2a1d',fillOpacity:.17,interactive:false};
  list.forEach(s=>{
    if(s.kind==='plant'){const c=mpXY(mpPts(s)[0]),r=(mpSpread(s)||.5)/2,h=mpPlantH(s),d=Math.max(0,h-r*.8);
      L.circle(mpLat(mpLL(c.x+v.x*d,c.y+v.y*d)),Object.assign({radius:r*.95},sh)).addTo(MP.lay)}
    if(s.kind==='structure'||s.kind==='support'){const h=Number(s.height)||(s.kind==='structure'?2.5:1.8),P=mpPts(s).map(mpXY),T=P.map(p=>({x:p.x+v.x*h,y:p.y+v.y*h})),ll=p=>mpLat(mpLL(p.x,p.y));
      if(s.kind==='structure')L.polygon(T.map(ll),sh).addTo(MP.lay);
      for(let i=0;i<P.length-(s.kind==='structure'?0:1);i++){const j=(i+1)%P.length;L.polygon([P[i],P[j],T[j],T[i]].map(ll),sh).addTo(MP.lay)}}
  });
}
function mpShapeLayer(s,sel,other){
  const k=MPK[s.kind],pts=mpPts(s),st=mpStyle(s,sel,other),ill=MP.view==='ill'&&!other,bad=!other&&MP.ovl&&MP.ovl.has(s.id),planted=!!s.plantingId;
  const grp=L.layerGroup(),hit=[];const add=(ly,click)=>{ly.addTo(grp);if(click!==false&&st.interactive)hit.push(ly);return ly};
  const label=(c,txt,cls)=>{if(!other&&txt)L.marker(mpLat(c),{icon:L.divIcon({className:'mplbl'+(cls?' '+cls:''),html:'<span>'+esc(txt)+'</span>',iconSize:null}),interactive:false}).addTo(grp)};
  if(k.g==='Polygon'&&pts.length>2){add(L.polygon(pts.map(mpLat),st));if(s.name)label(mpInner(pts),s.name)}
  else if(s.kind==='pline'&&pts.length>1){
    const w=mpLineW(s),P=pts.map(mpXY),col=bad?'#d32f2f':ill?'#b89262':'#7cb342';
    add(L.polyline(pts.map(mpLat),{color:col,weight:mpPx(w),opacity:other?.15:bad?.45:ill?.75:.3,lineCap:'butt',lineJoin:'round',interactive:st.interactive,bubblingMouseEvents:false}));
    const rows=Number(s.rows)||1,gap=Number(s.gap)||.3,c=MP_TYPEC[mpPlantType(s)]||'#5d8a1f';
    for(let r=0;r<rows;r++){const R=mpOffset(P,(r-(rows-1)/2)*gap);
      add(L.polyline(R.map(v=>mpLat(mpLL(v.x,v.y))),{color:planted?c:'#5d8a1f',weight:sel?2.5:1.5,opacity:other?.3:.9,dashArray:planted?null:'4 3',interactive:false}),false);
      const inrow=Number(s.inrow)||.3,px=inrow/mpMpp();
      if(!other&&px>=5)mpAlong(R,inrow,600).forEach(v=>L.circleMarker(mpLat(mpLL(v.x,v.y)),{radius:Math.max(2,Math.min(7,px*.35)),color:c,weight:1,fillColor:c,fillOpacity:planted?.9:.35,interactive:false}).addTo(grp))}
    label(mpMid(pts),mpAbbr(s)+' · '+mpLineCount(s),'mpplant')}
  else if(s.kind==='path'&&pts.length>1){const w=Number(s.width)||1;
    add(L.polyline(pts.map(mpLat),{color:ill?'#9e9170':'#b3a57c',weight:mpPx(w)+2,opacity:other?.2:1,lineCap:'round',lineJoin:'round',interactive:st.interactive,bubblingMouseEvents:false}));
    add(L.polyline(pts.map(mpLat),{color:ill?'#ddd2b4':'#e8e0c8',weight:mpPx(w),opacity:other?.2:1,lineCap:'round',lineJoin:'round',interactive:st.interactive,bubblingMouseEvents:false}))}
  else if(s.kind==='support'&&pts.length>1){add(L.polyline(pts.map(mpLat),{color:k.c,weight:sel?5:3.5,opacity:other?.3:1,interactive:st.interactive,bubblingMouseEvents:false}));
    add(L.polyline(pts.map(mpLat),{color:'#f5ecd9',weight:1.5,dashArray:'2 7',interactive:false}),false)}
  else if(k.g==='LineString'&&pts.length>1){add(L.polyline(pts.map(mpLat),st));if(!other)label(mpMid(pts),mpM(mpLen(pts,false)),'mplenl')}
  else if(s.kind==='plant'&&pts[0]){const r=mpSpread(s),c=mpLat(pts[0]),guess=!s.spread&&r==null,tc=MP_TYPEC[mpPlantType(s)]||k.c,col=bad?'#d32f2f':tc;
    if(ill){add(L.circle(c,{radius:r?r/2:.25,color:bad?'#d32f2f':'#2b4a26',weight:sel?3:1,dashArray:planted?null:'4 3',fillColor:col,fillOpacity:other?.05:planted?.62:.32,interactive:st.interactive,bubblingMouseEvents:false}));
      if(!other&&r){const v=mpXY(pts[0]),hl=mpLL(v.x-r*.12,v.y-r*.12);L.circle(mpLat(hl),{radius:r*.28,stroke:false,fillColor:'#ffffff',fillOpacity:.13,interactive:false}).addTo(grp)}}
    else add(L.circle(c,Object.assign({},st,{radius:r?r/2:.25,color:col,fillColor:col,fillOpacity:other?.03:.12,dashArray:guess||!r||!s.spread&&!mpSpCm(s.sid,'spread')?'4 4':null})));
    add(L.circleMarker(c,{radius:3,color:col,weight:1,fillColor:col,fillOpacity:1,interactive:st.interactive,bubblingMouseEvents:false}));
    if(!other&&MP.map.getZoom()>=20)label(pts[0],mpAbbr(s),'mpplant mpright')}
  else if(s.kind==='note'&&pts[0]){add(L.marker(mpLat(pts[0]),{icon:L.divIcon({className:'mpnoteic',html:'<span>✎ '+esc(String(s.text||s.name||'').slice(0,40))+'</span>',iconSize:null}),interactive:st.interactive,bubblingMouseEvents:false}))}
  if(!other)hit.forEach(ly=>ly.on('mousedown',e=>mpShapeDown(e,s.id)));
  grp.addTo(MP.lay);
}
/* ---------- side panel parts ---------- */
const mpNumIn=(k,lab,v,min,max,step,ro,ph)=>'<label class="f"><span class="fl">'+esc(lab)+'</span><input data-mp="'+k+'" type="number" min="'+min+'" max="'+max+'" step="'+step+'" value="'+esc(v==null?'':v)+'"'+(ph?' placeholder="'+esc(ph)+'"':'')+ro+'></label>';
function mpSideKind(s,ro){
  let h='';
  if(s.kind==='pline'){
    h+='<div class="mprow">'+mpNumIn('inrow',tr('In the row (m)','I raden (m)','In de rij (m)'),s.inrow,.01,20,.01,ro)+mpNumIn('rowsp',tr('Row needs (m)','Raden behöver (m)','Rij heeft nodig (m)'),s.rowsp,.01,20,.01,ro)+'</div>'+
      '<div class="mprow">'+mpNumIn('rows',tr('Rows in the strip','Rader i bandet','Rijen in de strook'),s.rows||1,1,30,1,ro)+mpNumIn('gap',tr('Between rows (m)','Mellan rader (m)','Tussen rijen (m)'),s.gap,.01,10,.01,ro)+'</div>';
    h+='<p class="mpstat"><b>'+esc(mpLineCount(s)+' '+tr('plants','plantor','planten'))+'</b> · '+esc((Number(s.rows)||1)+' × '+mpPerRow(s)+' · '+mpM(mpLen(mpPts(s),false))+' · '+tr('strip ','band ','strook ')+mpM(mpLineW(s)))+'</p>';
    if(MP.ovl&&MP.ovl.has(s.id))h+='<p class="admwarn mpsmall">'+esc(tr('Its strip overlaps another planting line or a plant’s crown.','Bandet överlappar en annan planteringsrad eller en plantas krona.','De strook overlapt een andere plantrij of de kroon van een plant.'))+'</p>';
  }
  if(s.kind==='plant'&&MP.ovl&&MP.ovl.has(s.id))h+='<p class="admwarn mpsmall">'+esc(tr('Its crown overlaps a planting line’s strip.','Kronan överlappar en planteringsrads band.','De kroon overlapt de strook van een plantrij.'))+'</p>';
  if(s.kind==='structure'||s.kind==='support')h+=mpNumIn('height',tr('Height (m)','Höjd (m)','Hoogte (m)'),s.height,.1,60,.1,ro,s.kind==='structure'?'2.5':'1.8');
  if(s.kind==='path')h+=mpNumIn('width',tr('Width (m)','Bredd (m)','Breedte (m)'),s.width,.1,20,.05,ro,'1');
  return h;
}
const mpRec=s=>s&&s.plantingId?(state.plantings||[]).find(x=>x.id===s.plantingId):null;
const mpRep=s=>s.kind==='plant'?mpPts(s)[0]:mpMid(mpPts(s));
function mpRecDiff(s,r){if(!r)return false;const c=mpRep(s);if(!hasPt(r)||mpDist(c,[Number(r.lng),Number(r.lat)])>.05)return true;if(s.kind==='pline'&&Number(r.count)!==mpLineCount(s))return true;return (r.sid!==s.sid)}
function mpPlantedHTML(s){
  if(s.kind!=='plant'&&s.kind!=='pline')return '';const r=mpRec(s),can=mpCanEdit();
  if(s.plantingId&&r){let h='<p class="mpstat mpok">✓ '+esc(tr('Planted ','Planterad ','Geplant ')+(r.date||'')+(r.count?' · '+r.count+' '+tr('plants','plantor','planten'):''))+' · <a href="#p-'+esc(r.id)+'">'+esc(tr('its page','dess sida','de pagina'))+'</a></p>';
    if(can&&mpRecDiff(s,r))h+='<div class="acts"><button type="button" class="btn sm" data-act="mp-recupd">'+esc(tr('Update the planting record (position, count)','Uppdatera planteringen (position, antal)','Aanplant bijwerken (positie, aantal)'))+'</button></div>';
    return h}
  if(s.plantingId&&!r)return '<p class="muted mpsmall">'+esc(tr('Its planting record is gone (deleted or moved).','Planteringen finns inte längre (raderad eller flyttad).','De aanplant bestaat niet meer (verwijderd of verplaatst).'))+'</p>';
  return '<p class="muted mpsmall">'+esc(tr('Planned: nothing is planted until you log it.','Planerad: inget är planterat förrän du registrerar det.','Gepland: niets is geplant tot je het vastlegt.'))+'</p>'+(can?'<div class="acts"><button type="button" class="btn sm primary" data-act="mp-log">'+esc(tr('Log as planted','Registrera som planterad','Als geplant vastleggen'))+'</button></div>':'');
}
function mpRepeatHTML(s){
  return '<details class="mprep"><summary>'+esc(tr('Repeat','Upprepa','Herhalen'))+'</summary><div class="mprow"><label class="f"><span class="fl">'+esc(tr('Copies','Kopior','Kopieën'))+'</span><input id="mpRepN" type="number" min="1" max="50" value="1"></label>'+
    '<label class="f"><span class="fl">'+esc(tr('Every (m)','Var (m)','Elke (m)'))+'</span><input id="mpRepD" type="number" min="0.01" step="0.01" value="'+esc(s.kind==='pline'?Math.round(mpLineW(s)*100)/100:1)+'"></label></div>'+
    '<label class="f"><span class="fl">'+esc(tr('Direction','Riktning','Richting'))+'</span><select id="mpRepDir"><option value="left">'+esc(tr('beside it (left of the first side)','bredvid (vänster om första sidan)','ernaast (links van de eerste zijde)'))+'</option><option value="right">'+esc(tr('beside it (right)','bredvid (höger)','ernaast (rechts)'))+'</option><option value="along">'+esc(tr('along the first side','längs första sidan','langs de eerste zijde'))+'</option><option value="east">'+esc(tr('east','öster','oost'))+'</option><option value="north">'+esc(tr('north','norr','noord'))+'</option></select></label>'+
    '<div class="acts"><button type="button" class="btn sm" data-act="mp-repeat">'+esc(tr('Repeat','Upprepa','Herhalen'))+'</button></div></details>';
}
/* ---------- actions ---------- */
async function mpLog(s){
  const q=mpPlan(),p=pjActive(),x=bySid.get(s.sid);if(!q||!p)return;
  if(!x){toast(tr('Choose the species first.','Välj arten först.','Kies eerst de soort.'),'err');return}
  const c=mpRep(s),doc={sid:s.sid,latin:x.latin,project:q.project,date:today(),count:s.kind==='plant'?1:mpLineCount(s),source:'',status:'alive',notes:'',checks:[],createdAt:Date.now(),
    lat:Math.round(c[1]*1e7)/1e7,lng:Math.round(c[0]*1e7)/1e7,plan:{id:q.id,shape:s.id}};
  if(s.cultivar)doc.cultivar=s.cultivar;if(s.kind==='pline')doc.geo={type:'LineString',coordinates:mpPts(s)};
  // The bed it lies in becomes (or already is) a place of the project.
  const cv=mpXY(c),bed=MP.shapes.find(b=>b.kind==='bed'&&mpInPoly(cv,mpPts(b).map(mpXY)));let patchBed=null;
  if(bed){let pid=bed.placeId&&(p.places||[]).some(z=>z.id===bed.placeId)?bed.placeId:'';
    if(!pid&&bed.name){const ex=(p.places||[]).find(z=>z.name===bed.name);pid=ex?ex.id:randHex(5);if(!ex)await pjSaveDoc(pjById(p.id)||p,{places:(p.places||[]).concat([{id:pid,name:bed.name,kind:'bed'}])});patchBed=pid}
    if(pid){doc.placeId=pid;doc.place=bed.name||''}}
  try{const id=await Data.saveRow('plantings',null,doc);mpPush();const t=MP.shapes.find(z=>z.id===s.id);if(t)t.plantingId=id;if(patchBed){const b=MP.shapes.find(z=>z.id===bed.id);if(b)b.placeId=patchBed}
    mpChanged();toast(tr('Logged as planted: ','Registrerad som planterad: ','Als geplant vastgelegd: ')+(dispName(x))+' · '+doc.count)}catch(e){toast(errMsg(e),'err')}
}
async function mpRecUpd(s){
  const r=mpRec(s);if(!r)return;const d=plDoc(r),c=mpRep(s);d.lat=Math.round(c[1]*1e7)/1e7;d.lng=Math.round(c[0]*1e7)/1e7;delete d.acc;
  if(s.kind==='pline'){d.count=mpLineCount(s);d.geo={type:'LineString',coordinates:mpPts(s)}}
  try{await Data.saveRow('plantings',r.id,d);toast(tr('Planting record updated','Planteringen uppdaterad','Aanplant bijgewerkt'))}catch(e){toast(errMsg(e),'err')}
}
function mpRepeat(s,n,d,dir){
  n=Math.max(1,Math.min(50,Math.round(n)||1));if(!(d>0))return;const P=mpPts(s).map(mpXY);let ux=1,uy=0;
  if(P.length>1){const L0=Math.hypot(P[1].x-P[0].x,P[1].y-P[0].y)||1;ux=(P[1].x-P[0].x)/L0;uy=(P[1].y-P[0].y)/L0}
  const v=dir==='left'?{x:-uy,y:ux}:dir==='right'?{x:uy,y:-ux}:dir==='along'?{x:ux,y:uy}:dir==='north'?{x:0,y:1}:{x:1,y:0};
  const add=[];for(let i=1;i<=n;i++){const c=JSON.parse(JSON.stringify(s));c.id=randHex(6);delete c.plantingId;delete c.placeId;mpSetPts(c,P.map(p=>mpLL(p.x+v.x*d*i,p.y+v.y*d*i)));add.push(c)}
  if(mpTooBig(MP.shapes.concat(add))){toast(tr('A plan may cover at most 300 × 300 m.','En plan får täcka högst 300 × 300 m.','Een plan mag hoogstens 300 × 300 m beslaan.'),'err');return}
  mpPush();MP.shapes.push(...add);mpChanged();toast(n+' '+tr('copies added','kopior tillagda','kopieën toegevoegd'));
}
// Typed lengths while drawing: "4.5" = this side 4.5 m towards the pointer; "4.5<90" = 4.5 m turning 90° left of the last side.
function mpTypedKey(e){
  const k=e.key;
  if(/^[0-9.,<\-]$/.test(k)&&!e.ctrlKey&&!e.metaKey){e.preventDefault();MP.typed+=k===','?'.':k;mpLiveShow();return true}
  if(k==='Backspace'&&MP.typed){e.preventDefault();MP.typed=MP.typed.slice(0,-1);mpLiveShow();return true}
  if(k==='Escape'&&MP.typed){e.preventDefault();MP.typed='';mpLiveShow();return true}
  if(k==='Enter'&&MP.typed){e.preventDefault();mpTypedApply();return true}
  return false;
}
function mpTypedApply(){
  const m=/^(\d+(?:\.\d+)?)(?:<(-?\d+(?:\.\d+)?))?$/.exec(MP.typed);MP.typed='';
  if(!m||!MP.draft.length){toast(tr('Type a length in metres, e.g. 4.5 or 4.5<90.','Skriv en längd i meter, t.ex. 4.5 eller 4.5<90.','Typ een lengte in meters, bijv. 4.5 of 4.5<90.'),'err');mpLiveShow();return}
  const len=Number(m[1]),d=MP.draft,last=mpXY(d[d.length-1]);let base=null;
  if(d.length>1){const pr=mpXY(d[d.length-2]);base=Math.atan2(last.y-pr.y,last.x-pr.x)}
  let a;if(m[2]!=null)a=(base==null?0:base)+Number(m[2])*Math.PI/180;
  else if(MP.cur&&mpDist(d[d.length-1],MP.cur)>.001){const c=mpXY(MP.cur);a=Math.atan2(c.y-last.y,c.x-last.x)}else a=base==null?0:base;
  d.push(mpLL(last.x+Math.cos(a)*len,last.y+Math.sin(a)*len));MP.cur=null;mpDraftDraw();mpLiveShow();
}
/* ---------- the phone: look, find yourself, field actions ---------- */
function mpPhoneTools(){
  return '<button type="button" class="mptool'+(MP.gpsW!=null?' on':'')+'" data-act="mp-gps">'+esc(MP.gpsW!=null?tr('Hide my position','Dölj min position','Mijn positie verbergen'):tr('Show my position','Visa min position','Mijn positie tonen'))+'</button>'+
    '<p class="muted mphelp">'+esc(tr('Tap a plant or line to see it, log it as planted, add a note or photo on its page, or move a plant to where you stand. Drawing works on a laptop.','Tryck på en planta eller rad för att se den, registrera den som planterad, lägga till en anteckning eller ett foto på dess sida, eller flytta en planta dit du står. Ritandet fungerar på en dator.','Tik op een plant of rij om hem te zien, als geplant vast te leggen, een notitie of foto toe te voegen op de pagina, of een plant te verplaatsen naar waar je staat. Tekenen werkt op een laptop.'))+'</p>';
}
function mpGpsDraw(){
  mpDefs();if(!MP.map)return;if(MP.gpl){MP.gpl.remove();MP.gpl=null}const g=MP.gps;if(!g)return;
  MP.gpl=L.layerGroup().addTo(MP.map);L.circle([g.lat,g.lng],{radius:g.acc||5,color:'#1e88e5',weight:1,fillOpacity:.12,interactive:false}).addTo(MP.gpl);
  L.circleMarker([g.lat,g.lng],{radius:7,color:'#fff',weight:2,fillColor:'#1e88e5',fillOpacity:1,interactive:false}).addTo(MP.gpl);
}
function mpGpsToggle(){
  if(MP.gpsW!=null){try{navigator.geolocation.clearWatch(MP.gpsW)}catch(e){}MP.gpsW=null;MP.gps=null;mpGpsDraw();mpTools();return}
  if(!navigator.geolocation){toast(tr('This device does not give a position.','Den här enheten ger ingen position.','Dit apparaat geeft geen positie.'),'err');return}
  let first=true;MP.gpsW=navigator.geolocation.watchPosition(p=>{MP.gps={lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy||10};mpGpsDraw();if(first&&MP.map){first=false;MP.map.setView([MP.gps.lat,MP.gps.lng],Math.max(MP.map.getZoom(),19))}},
    ()=>toast(tr('No position (allow location for this site).','Ingen position (tillåt plats för den här webbplatsen).','Geen positie (sta locatie toe voor deze site).'),'err'),{enableHighAccuracy:true,maximumAge:2000});
  mpTools();
}
function mpHere(s){
  if(!s||s.kind!=='plant'||!mpCanEdit())return;toast(tr('Taking your position (a few seconds)…','Tar din position (några sekunder)…','Je positie bepalen (een paar seconden)…'));
  geoAvg(g=>{mpPush();const t=MP.shapes.find(z=>z.id===s.id);if(!t)return;t.g={type:'Point',coordinates:[g.lng,g.lat]};t.acc=g.acc;mpChanged();toast(tr('Moved to your position (± ','Flyttad till din position (± ','Verplaatst naar je positie (± ')+g.acc+' m)')},
    ()=>toast(tr('No position (allow location for this site).','Ingen position (tillåt plats för den här webbplatsen).','Geen positie (sta locatie toe voor deze site).'),'err'));
}
function mpClick2(act,a){
  const s=MP.shapes.find(x=>x.id===MP.sel);
  if(act==='mp-log'){if(s&&mpCanEdit())mpLog(s);return true}
  if(act==='mp-recupd'){if(s&&mpCanEdit())mpRecUpd(s);return true}
  if(act==='mp-repeat'){if(s&&mpDrawOK())mpRepeat(s,Number(($('#mpRepN')||{}).value),Number(($('#mpRepD')||{}).value),($('#mpRepDir')||{}).value);return true}
  if(act==='mp-gps'){mpGpsToggle();return true}
  if(act==='mp-here'){mpHere(s);return true}
  return false;
}
