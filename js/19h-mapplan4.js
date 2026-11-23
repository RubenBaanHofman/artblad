// Artblad: Garden plan on the map, plan D (2.14.0): the tape measure, print to scale, a picture to share, CSV lists,
// GeoJSON/KML export and import, and a preview picture for archived plans.
// Part 19h; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* Everything here is drawn in the browser from the plan's own shapes: no outside service, no new dependency. The aerial
   photo is never part of a print or picture (Esri's terms forbid passing its tiles on; decision 23 Nov). Exports are for
   project owners and editors only (decision 10: viewers may not export). The picture to share leaves out the project's
   name and every coordinate by default. */

/* ---------- the tape measure: place a plant from two measured distances ---------- */
// Tool "Tape" (D): click reference point A and B (corners snap), type the distances measured in the garden; the two
// places where those circles meet are offered; click one to put a plant (or a note) there. Replaces the reference
// points of the 2.8 plan in metres.
MP.tape={a:null,b:null,da:'',db:'',pick:'a',what:'plant'};
function mpTapeCands(){
  const T=MP.tape;if(!T.a||!T.b)return [];const ra=Number(T.da),rb=Number(T.db);if(!(ra>0&&rb>0))return [];
  const A=mpXY(T.a),B=mpXY(T.b),d=Math.hypot(B.x-A.x,B.y-A.y);if(d<.01)return [];
  if(d>ra+rb+.02||d<Math.abs(ra-rb)-.02)return [];
  const a=(ra*ra-rb*rb+d*d)/(2*d),h=Math.sqrt(Math.max(0,ra*ra-a*a)),ux=(B.x-A.x)/d,uy=(B.y-A.y)/d,mx=A.x+a*ux,my=A.y+a*uy;
  if(h<.01)return [mpLL(mx,my)];
  return [mpLL(mx-h*uy,my+h*ux),mpLL(mx+h*uy,my-h*ux)];
}
function mpTapeClick(e){
  if(!mpDrawOK())return;const T=MP.tape,m=MP.map,P=m.latLngToContainerPoint(e.latlng);
  const hit=mpTapeCands().find(c=>m.latLngToContainerPoint(mpLat(c)).distanceTo(P)<14);
  if(hit&&!T.pick){mpTapePlace(hit);return}
  if(!T.pick)return;const sn=mpSnap(e.latlng,e.originalEvent);
  T[T.pick]=sn.c;T.pick=T.pick==='a'&&!T.b?'b':'';mpDraw();mpSide();
}
function mpTapePlace(c){
  const T=MP.tape,s={id:randHex(6),kind:T.what==='note'?'note':'plant',g:{type:'Point',coordinates:c.slice()}};
  if(s.kind==='plant'&&MP.lastSid)s.sid=MP.lastSid;
  s.acc='tape';mpAddShape(s);MP.sel='';mpDraw();mpSide();
  toast(tr('Placed by tape: ','Placerad med måttband: ','Geplaatst met het meetlint: ')+mpM(Number(T.da))+' / '+mpM(Number(T.db)));
}
function mpTapeDraw(){
  if(MP.tool!=='tape'||!MP.lay)return;const T=MP.tape,ref=(c,t)=>{L.circleMarker(mpLat(c),{radius:7,color:'#6a1b9a',weight:2.5,fillColor:'#fff',fillOpacity:1,interactive:false}).addTo(MP.lay);
    L.marker(mpLat(c),{icon:L.divIcon({className:'mplbl mptapel',html:'<span>'+t+'</span>',iconSize:null}),interactive:false}).addTo(MP.lay)};
  if(T.a){ref(T.a,'A');if(Number(T.da)>0)L.circle(mpLat(T.a),{radius:Number(T.da),color:'#6a1b9a',weight:1.2,dashArray:'5 5',fill:false,interactive:false}).addTo(MP.lay)}
  if(T.b){ref(T.b,'B');if(Number(T.db)>0)L.circle(mpLat(T.b),{radius:Number(T.db),color:'#6a1b9a',weight:1.2,dashArray:'5 5',fill:false,interactive:false}).addTo(MP.lay)}
  mpTapeCands().forEach(c=>L.circleMarker(mpLat(c),{radius:9,color:'#e65100',weight:3,fillColor:'#ffcc80',fillOpacity:.9,interactive:false,className:'mptapec'}).bindTooltip(tr('Click to place here','Klicka för att placera här','Klik om hier te plaatsen'),{direction:'top'}).addTo(MP.lay));
}
function mpTapeHTML(){
  const T=MP.tape,ab=T.a&&T.b?mpDist(T.a,T.b):null,c=mpTapeCands(),ro=mpDrawOK()?'':' disabled';
  const row=(k,lab)=>'<div class="mptaper"><b>'+k.toUpperCase()+'</b> <span>'+esc(T[k]?tr('set','satt','gezet'):T.pick===k?tr('click it on the map','klicka på kartan','klik op de kaart'):'–')+'</span>'+
    '<label class="f"><span class="fl">'+esc(lab)+'</span><input data-mptape="d'+k+'" type="number" min="0.01" step="0.01" value="'+esc(T['d'+k])+'"'+ro+'></label>'+
    '<button type="button" class="btn sm" data-act="mp-tape-set" data-k="'+k+'"'+ro+'>'+esc(tr('Set '+k.toUpperCase()+' again','Sätt '+k.toUpperCase()+' igen',k.toUpperCase()+' opnieuw zetten'))+'</button></div>';
  let h='<h3 class="hsub">'+esc(tr('Tape measure','Måttband','Meetlint'))+'</h3><p class="mpsmall muted">'+esc(tr('Measure in the garden from two fixed points (a house corner, a post) to where the plant stands. Click those two points on the map (corners snap), type the two distances, then click one of the two spots offered.','Mät i trädgården från två fasta punkter (ett husknut, en stolpe) till där växten står. Klicka på de två punkterna på kartan (hörn fäster), skriv in de två avstånden och klicka sedan på en av de två platserna som visas.','Meet in de tuin vanaf twee vaste punten (een hoek van het huis, een paal) tot waar de plant staat. Klik die twee punten op de kaart (hoeken lijnen uit), typ de twee afstanden en klik dan op een van de twee aangeboden plekken.'))+'</p>'+
    row('a',tr('Distance from A (m)','Avstånd från A (m)','Afstand vanaf A (m)'))+row('b',tr('Distance from B (m)','Avstånd från B (m)','Afstand vanaf B (m)'));
  if(ab!=null)h+='<p class="mpstat">'+esc(tr('A to B: ','A till B: ','A tot B: ')+mpM(ab))+'</p>';
  h+='<label class="f"><span class="fl">'+esc(tr('Place','Placera','Plaatsen'))+'</span><select data-mptape="what"'+ro+'><option value="plant"'+(T.what==='plant'?' selected':'')+'>'+esc(tr('a plant','en planta','een plant'))+(MP.lastSid&&bySid.get(MP.lastSid)?' ('+esc(dispName(bySid.get(MP.lastSid)))+')':'')+'</option><option value="note"'+(T.what==='note'?' selected':'')+'>'+esc(tr('a note','en anteckning','een notitie'))+'</option></select></label>';
  if(T.a&&T.b&&Number(T.da)>0&&Number(T.db)>0)h+='<p class="mpsmall '+(c.length?'':'admwarn')+'" id="mpTapeMsg">'+esc(c.length===2?tr('Two spots fit: click the right one on the map (orange).','Två platser passar: klicka på rätt plats på kartan (orange).','Twee plekken passen: klik de juiste op de kaart (oranje).'):c.length===1?tr('One spot fits: click it on the map.','En plats passar: klicka på den på kartan.','Eén plek past: klik hem op de kaart.'):tr('The distances do not meet: together they must be at least A to B, and their difference at most A to B. Check the measurements.','Avstånden möts inte: tillsammans måste de vara minst A till B, och skillnaden högst A till B. Kontrollera måtten.','De afstanden komen niet samen: samen moeten ze minstens A tot B zijn en het verschil hoogstens A tot B. Controleer de maten.'))+'</p>';
  return h+'<div class="acts"><button type="button" class="btn sm" data-act="mp-tape-clear">'+esc(tr('Start again','Börja om','Opnieuw'))+'</button><button type="button" class="btn sm" data-act="mp-tool" data-k="select">'+esc(tr('Done','Klar','Klaar'))+'</button></div>';
}

/* ---------- drawing the plan as SVG (print, picture, archive preview) ---------- */
// Metre coordinates, north up (SVG y = −north). u = metres per millimetre of paper, so line widths and text sizes are
// given in millimetres and come out the same at every scale.
const mpF=v=>String(Math.round(v*1000)/1000);
const mpPP=c=>{const v=mpXY(c);return mpF(v.x)+','+mpF(-v.y)};
const mpPPv=v=>mpF(v.x)+','+mpF(-v.y);
const mpXmlEsc=t=>String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
// Numbers for species (and cultivars) in alphabetical order, shared by the drawing and the plant list.
function mpPlantKeys(shapes){
  const tot={};shapes.forEach(s=>{if(s.kind!=='plant'&&s.kind!=='pline')return;const k=(s.sid||'?')+'|'+(s.cultivar||'');tot[k]=(tot[k]||0)+(s.kind==='plant'?1:mpLineCount(s))});
  const nm=k=>{const [sid,cv]=k.split('|'),x=bySid.get(sid);return (x?dispName(x):sid==='?'?tr('species not chosen','art inte vald','soort niet gekozen'):sid)+(cv?' ‘'+cv+'’':'')};
  const keys=Object.keys(tot).sort((a,b)=>nm(a).localeCompare(nm(b)));
  return {num:new Map(keys.map((k,i)=>[k,i+1])),list:keys.map((k,i)=>({n:i+1,k,name:nm(k),latin:(bySid.get(k.split('|')[0])||{}).latin||'',count:tot[k]}))};
}
// Extent in metres, including crowns, strips and path widths.
function mpExtent(shapes){
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  shapes.forEach(s=>{const r=s.kind==='plant'?(mpSpread(s)||.5)/2:s.kind==='pline'?mpLineW(s)/2:s.kind==='path'?(Number(s.width)||1)/2:0;
    mpPts(s).forEach(c=>{const v=mpXY(c);x0=Math.min(x0,v.x-r);y0=Math.min(y0,v.y-r);x1=Math.max(x1,v.x+r);y1=Math.max(y1,v.y+r)})});
  if(x0===Infinity)return null;if(x1-x0<1){x0-=.5;x1+=.5}if(y1-y0<1){y0-=.5;y1+=.5}
  return {x0,y0,x1,y1,w:x1-x0,h:y1-y0,cx:(x0+x1)/2,cy:(y0+y1)/2};
}
function mpSvgShapes(shapes,o){
  const u=o.u,ill=o.ill,num=o.num||new Map(),sw=mm=>mpF(mm*u),out=[],labels=[];
  const txt=(v,t,mm,extra)=>labels.push('<text x="'+mpF(v.x)+'" y="'+mpF(-v.y)+'" font-size="'+sw(mm)+'"'+(/text-anchor/.test(extra||'')?'':' text-anchor="middle"')+' dominant-baseline="central" stroke="#fff" stroke-width="'+sw(mm*.28)+'" paint-order="stroke" stroke-linejoin="round"'+(extra||'')+'>'+mpXmlEsc(t)+'</text>');
  const order=['zone','water','bed','structure','path','pline','support','plant','measure','note'];
  shapes.slice().sort((a,b)=>order.indexOf(a.kind)-order.indexOf(b.kind)).forEach(s=>{
    const k=MPK[s.kind];if(!k)return;const pts=mpPts(s);
    if(k.g==='Polygon'&&pts.length>2){
      const st={bed:ill?['#b48c5e',1,'#6d4a2a']:['#8a5a2b',.18,'#8a5a2b'],zone:['#3a76c4',.05,'#3a76c4'],structure:ill?['#9a9a9a',1,'#4a4a4a']:['#6b6b6b',.3,'#6b6b6b'],water:ill?['#86c0e8',1,'#2f7fbf']:['#3d8fd1',.3,'#3d8fd1']}[s.kind];
      out.push('<polygon points="'+pts.map(mpPP).join(' ')+'" fill="'+st[0]+'" fill-opacity="'+st[1]+'" stroke="'+st[2]+'" stroke-width="'+sw(s.kind==='zone'?.35:.3)+'"'+(s.kind==='zone'?' stroke-dasharray="'+sw(2)+' '+sw(1.4)+'"':'')+' stroke-linejoin="round"/>');
      if(s.name)txt(mpXY(mpInner(pts)),s.name,3,' font-weight="600"');
    }else if(s.kind==='pline'&&pts.length>1){
      const P=pts.map(mpXY),w=mpLineW(s),Lf=mpOffset(P,w/2),R=mpOffset(P,-w/2).reverse(),c=MP_TYPEC[mpPlantType(s)]||'#5d8a1f';
      out.push('<polygon points="'+Lf.concat(R).map(mpPPv).join(' ')+'" fill="'+(ill?'#c9a77a':'#7cb342')+'" fill-opacity="'+(ill?.85:.25)+'" stroke="'+(ill?'#8d6a43':'#7cb342')+'" stroke-width="'+sw(.2)+'"/>');
      const rows=Number(s.rows)||1,gap=Number(s.gap)||.3,inrow=Number(s.inrow)||.3;
      for(let r=0;r<rows;r++){const Rw=mpOffset(P,(r-(rows-1)/2)*gap);out.push('<polyline points="'+Rw.map(mpPPv).join(' ')+'" fill="none" stroke="'+c+'" stroke-width="'+sw(.25)+'"'+(s.plantingId?'':' stroke-dasharray="'+sw(1)+' '+sw(.7)+'"')+'/>');
        if(inrow/u>=1.6)mpAlong(Rw,inrow,800).forEach(v=>out.push('<circle cx="'+mpF(v.x)+'" cy="'+mpF(-v.y)+'" r="'+mpF(Math.min(inrow*.35,u*1.2))+'" fill="'+c+'" fill-opacity="'+(s.plantingId?.9:.5)+'"/>'))}
      const n=num.get((s.sid||'?')+'|'+(s.cultivar||''));txt(mpXY(mpMid(pts)),(n?n+' · ':'')+mpLineCount(s)+'×',2.6,' font-weight="600"');
    }else if(s.kind==='path'&&pts.length>1){const w=Number(s.width)||1,d=pts.map(mpPP).join(' ');
      out.push('<polyline points="'+d+'" fill="none" stroke="#9e9170" stroke-width="'+mpF(w+u*.6)+'" stroke-linecap="round" stroke-linejoin="round"/><polyline points="'+d+'" fill="none" stroke="'+(ill?'#ddd2b4':'#efe8d6')+'" stroke-width="'+mpF(w)+'" stroke-linecap="round" stroke-linejoin="round"/>');
    }else if(s.kind==='support'&&pts.length>1){const d=pts.map(mpPP).join(' ');
      out.push('<polyline points="'+d+'" fill="none" stroke="'+k.c+'" stroke-width="'+sw(.9)+'"/><polyline points="'+d+'" fill="none" stroke="#f5ecd9" stroke-width="'+sw(.3)+'" stroke-dasharray="'+sw(.4)+' '+sw(1.4)+'"/>');
      if(s.name)txt(mpXY(mpMid(pts)),s.name,2.4);
    }else if(s.kind==='measure'&&pts.length>1){
      out.push('<polyline points="'+pts.map(mpPP).join(' ')+'" fill="none" stroke="'+k.c+'" stroke-width="'+sw(.3)+'" stroke-dasharray="'+sw(1.2)+' '+sw(.9)+'"/>');
      txt(mpXY(mpMid(pts)),mpM(mpLen(pts,false)),2.4,' fill="'+k.c+'"');
    }else if(s.kind==='plant'&&pts[0]){const v=mpXY(pts[0]),r=(mpSpread(s)||.5)/2,c=MP_TYPEC[mpPlantType(s)]||k.c;
      out.push('<circle cx="'+mpF(v.x)+'" cy="'+mpF(-v.y)+'" r="'+mpF(r)+'" fill="'+c+'" fill-opacity="'+(ill?(s.plantingId?.62:.4):.12)+'" stroke="'+(ill?'#2b4a26':c)+'" stroke-width="'+sw(.25)+'"'+(s.plantingId?'':' stroke-dasharray="'+sw(1)+' '+sw(.7)+'"')+'/><circle cx="'+mpF(v.x)+'" cy="'+mpF(-v.y)+'" r="'+sw(.5)+'" fill="'+c+'"/>');
      const n=num.get((s.sid||'?')+'|'+(s.cultivar||''));if(n)txt({x:v.x,y:v.y-Math.min(r*.5,u*2.2)},String(n),2.6,' font-weight="700"');
    }else if(s.kind==='note'&&pts[0]){const v=mpXY(pts[0]);
      out.push('<circle cx="'+mpF(v.x)+'" cy="'+mpF(-v.y)+'" r="'+sw(.8)+'" fill="#555"/>');txt({x:v.x+u*2,y:v.y},'✎ '+String(s.text||s.name||'').slice(0,40),2.2,' text-anchor="start" fill="#333"');
    }
  });
  return out.join('')+labels.join('');
}
// Light grid every 0.5, 1, 2, 5 … m (at least 8 mm apart on paper), for measuring off the print.
function mpSvgGrid(vb,u){
  const st=[.5,1,2,5,10,20,50,100].find(v=>v/u>=8)||100,out=[];
  for(let x=Math.ceil(vb.x/st)*st;x<=vb.x+vb.w;x+=st)out.push('<line x1="'+mpF(x)+'" y1="'+mpF(vb.y)+'" x2="'+mpF(x)+'" y2="'+mpF(vb.y+vb.h)+'"/>');
  for(let y=Math.ceil(vb.y/st)*st;y<=vb.y+vb.h;y+=st)out.push('<line x1="'+mpF(vb.x)+'" y1="'+mpF(y)+'" x2="'+mpF(vb.x+vb.w)+'" y2="'+mpF(y)+'"/>');
  return {st,svg:'<g stroke="#9aa59a" stroke-opacity=".35" stroke-width="'+mpF(u*.15)+'">'+out.join('')+'</g>'};
}
const mpNice=(v,list)=>list.reduce((b,x)=>x<=v?x:b,list[0]);
// Scale bar (bottom left) and north arrow (top right), in the drawing's metre coordinates.
function mpSvgMarks(vb,u,scaleTxt){
  const Lm=mpNice(u*40,[.5,1,2,5,10,20,25,50,100,200,500]),x=vb.x+u*6,y=vb.y+vb.h-u*8,h=u*1.6,seg=Lm/2;
  let s='<g font-size="'+mpF(u*2.6)+'" fill="#222"><rect x="'+mpF(x-u*2)+'" y="'+mpF(y-u*5.5)+'" width="'+mpF(Lm+u*14)+'" height="'+mpF(u*10)+'" fill="#fff" fill-opacity=".85"/>'+
    '<rect x="'+mpF(x)+'" y="'+mpF(y)+'" width="'+mpF(seg)+'" height="'+mpF(h)+'" fill="#222"/><rect x="'+mpF(x+seg)+'" y="'+mpF(y)+'" width="'+mpF(seg)+'" height="'+mpF(h)+'" fill="#fff" stroke="#222" stroke-width="'+mpF(u*.2)+'"/>'+
    '<text x="'+mpF(x)+'" y="'+mpF(y-u*1.2)+'" text-anchor="middle">0</text><text x="'+mpF(x+Lm)+'" y="'+mpF(y-u*1.2)+'" text-anchor="middle">'+mpXmlEsc(numTxt(Lm)+' m')+'</text>'+
    (scaleTxt?'<text x="'+mpF(x+Lm+u*3)+'" y="'+mpF(y+h)+'">'+mpXmlEsc(scaleTxt)+'</text>':'')+'</g>';
  const nx=vb.x+vb.w-u*9,ny=vb.y+u*6;
  s+='<g><circle cx="'+mpF(nx)+'" cy="'+mpF(ny+u*4)+'" r="'+mpF(u*5.2)+'" fill="#fff" fill-opacity=".85"/><path d="M'+mpF(nx)+' '+mpF(ny)+'L'+mpF(nx+u*2.4)+' '+mpF(ny+u*7)+'L'+mpF(nx)+' '+mpF(ny+u*5.4)+'L'+mpF(nx-u*2.4)+' '+mpF(ny+u*7)+'Z" fill="#222"/><text x="'+mpF(nx)+'" y="'+mpF(ny-u*.6)+'" font-size="'+mpF(u*3)+'" text-anchor="middle" font-weight="700">N</text></g>';
  return {svg:s,len:Lm};
}

/* ---------- print to scale ---------- */
const MP_PAPER={A4:[210,297],A3:[297,420]};
const MP_SCALES=[10,20,25,50,100,200,250,500,1000,2000];
MP.pr=(()=>{try{return Object.assign({paper:'A4',orient:'auto',scale:'auto',view:'',list:true,grid:true,proj:true,pngProj:false,pngName:true,pngList:true},JSON.parse(store.get('ab.mppr')||'{}'))}catch(e){return {paper:'A4',orient:'auto',scale:'auto',view:'',list:true,grid:true,proj:true,pngProj:false,pngName:true,pngList:true}}})();
const mpPrSave=()=>store.set('ab.mppr',JSON.stringify(MP.pr));
const mpVisShapes=()=>MP.shapes.filter(s=>!MP.hide[s.kind]);
// Page layout and the scale that fits (the largest standard scale that holds the whole plan), per orientation.
function mpPrintFit(o,shapes){
  const ext=mpExtent(shapes);if(!ext)return null;const pk=mpPlantKeys(shapes),list=o.list&&(pk.list.length||shapes.length);
  const lay=or=>{const pp=MP_PAPER[o.paper]||MP_PAPER.A4,W=or==='portrait'?pp[0]:pp[1],H=or==='portrait'?pp[1]:pp[0],cw=W-20,ch=H-20,
      side=list&&or!=='portrait'?64:0,bottom=list&&or==='portrait'?Math.min(70,16+pk.list.length*4.2):0,fw=cw-side,fh=ch-14-bottom-7;
    const need=Math.max(ext.w*1000/(fw-6),ext.h*1000/(fh-6)),fit=MP_SCALES.find(v=>v>=need)||null;
    const sc=o.scale==='auto'?fit:Number(o.scale);return {or,W,H,fw,fh,side,bottom,need,fit,scale:sc,ok:!!sc&&sc>=need}};
  const L=lay('landscape'),P=lay('portrait');
  let r=o.orient==='portrait'?P:o.orient==='landscape'?L:(o.scale==='auto'?((P.fit||1e9)<(L.fit||1e9)?P:L):(L.ok?L:P.ok?P:L));
  return Object.assign(r,{ext,pk});
}
function mpPrintHTML(o){
  const q=mpPlan();if(!q)return null;const shapes=mpVisShapes(),f=mpPrintFit(o,shapes);if(!f)return {err:tr('The plan is empty.','Planen är tom.','Het plan is leeg.')};
  if(!f.ok)return {err:tr('At 1:','I skala 1:','Op schaal 1:')+o.scale+tr(' the plan does not fit on ',' får planen inte plats på ',' past het plan niet op ')+o.paper+'. '+(f.fit?tr('It fits at 1:','Den får plats i 1:','Het past op 1:')+f.fit+'.':tr('Choose a larger paper.','Välj ett större papper.','Kies een groter papier.')),fit:f.fit};
  const u=f.scale/1000,vw=f.fw*u,vh=f.fh*u,vb={x:f.ext.cx-vw/2,y:-f.ext.cy-vh/2,w:vw,h:vh},ill=(o.view||MP.view)==='ill',sc='1:'+f.scale;
  const g=o.grid?mpSvgGrid(vb,u):null,mk=mpSvgMarks(vb,u,sc);
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+f.fw+'mm" height="'+f.fh+'mm" viewBox="'+[vb.x,vb.y,vb.w,vb.h].map(mpF).join(' ')+'" font-family="DejaVu Sans,Arial,sans-serif" data-scale="'+f.scale+'">'+
    '<rect x="'+mpF(vb.x)+'" y="'+mpF(vb.y)+'" width="'+mpF(vb.w)+'" height="'+mpF(vb.h)+'" fill="#fff"/>'+(g?g.svg:'')+mpSvgShapes(shapes,{u,ill,num:f.pk.num})+mk.svg+'</svg>';
  const kinds=MP_KINDS.filter(k=>shapes.some(s=>s.kind===k)),sum=mpSummary(shapes);
  const legend='<div class="lg">'+kinds.map(k=>'<span><i style="background:'+MPK[k].c+'"></i>'+esc(mpK(k))+'</span>').join('')+'</div>';
  const plist=f.pk.list.length?'<table class="pl"><tr><th>#</th><th>'+esc(tr('Plant','Växt','Plant'))+'</th><th>'+esc(tr('Count','Antal','Aantal'))+'</th></tr>'+f.pk.list.map(r=>'<tr><td>'+r.n+'</td><td>'+esc(r.name)+(r.latin&&r.latin!==r.name.split(' ‘')[0]?'<br><i>'+esc(r.latin)+'</i>':'')+'</td><td>'+r.count+'</td></tr>').join('')+'</table>':'';
  const areas='<p class="ar">'+esc(tr('Beds','Bäddar','Bedden')+' '+mpM2(sum.bed)+(sum.zone?' · '+tr('zones','zoner','zones')+' '+mpM2(sum.zone):'')+(sum.lines?' · '+tr('planting lines','planteringsrader','plantrijen')+' '+mpM(sum.lineLen):''))+'</p>';
  const title=esc(q.name+(q.year?' '+q.year:'')+(q.season?' · '+({spring:tr('spring','vår','lente'),summer:tr('summer','sommar','zomer'),autumn:tr('autumn','höst','herfst'),winter:tr('winter','vinter','winter')}[q.season]||''):''));
  const side=o.list?legend+plist+areas:'';
  const css='@page{size:'+o.paper+' '+f.or+';margin:10mm}*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:"DejaVu Sans",Arial,sans-serif;color:#1f2a22;font-size:8.5pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
    '.pg{width:'+(f.W-20)+'mm;height:'+(f.H-20)+'mm;display:grid;grid-template-columns:'+f.fw+'mm '+(f.side?f.side+'mm':'')+';grid-template-rows:14mm '+f.fh+'mm '+(f.bottom?f.bottom+'mm ':'')+'7mm;overflow:hidden}'+
    'header{grid-column:1/-1;display:flex;justify-content:space-between;align-items:flex-end;border-bottom:.4mm solid #6b8f5e;padding-bottom:1.5mm}header h1{font-size:14pt;margin:0}header .r{text-align:right;font-size:9pt}'+
    '.fr{border:.3mm solid #444;overflow:hidden}.fr svg{display:block}aside{padding:0 0 0 4mm;overflow:hidden}.bt{grid-column:1/-1;padding:2mm 0 0;overflow:hidden;columns:2;column-gap:6mm}'+
    '.lg span{display:inline-block;margin:0 3mm 1mm 0}.lg i{display:inline-block;width:3mm;height:3mm;margin-right:1mm;vertical-align:-.4mm;border-radius:.6mm}.pl{border-collapse:collapse;width:100%;margin:2mm 0}.pl th,.pl td{text-align:left;border-bottom:.2mm solid #ccc;padding:.6mm .8mm;vertical-align:top}.pl td:first-child{font-weight:700;width:6mm}.pl td:last-child{text-align:right}.ar{margin:1mm 0}'+
    'footer{grid-column:1/-1;font-size:7.5pt;color:#555;display:flex;justify-content:space-between;align-items:flex-end}';
  const html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+title+'</title><style>'+css+'</style></head><body><div class="pg">'+
    '<header><div><h1>'+title+'</h1>'+(o.proj?'<div>'+esc(pjName(q.project))+'</div>':'')+'</div><div class="r"><b>'+esc(sc)+'</b> · '+esc(o.paper)+'<br>'+esc(tr('Print at 100 % (actual size)','Skriv ut i 100 % (verklig storlek)','Afdrukken op 100 % (ware grootte)'))+'</div></header>'+
    '<div class="fr">'+svg+'</div>'+(f.side?'<aside>'+side+'</aside>':'')+(f.bottom?'<div class="bt">'+side+'</div>':'')+
    '<footer><span>'+esc(tr('Check: the scale bar is ','Kontroll: skalstocken är ','Controle: de schaalstok is ')+numTxt(Math.round(mk.len/u*10)/10)+' mm '+tr('long','lång','lang'))+(g?' · '+esc(tr('grid ','rutnät ','raster ')+numTxt(g.st)+' m'):'')+'</span><span>Skogsträdgårdens artblad · '+esc(today())+'</span></footer></div></body></html>';
  return {html,scale:f.scale,orient:f.or,paper:o.paper,barMm:mk.len/u,u};
}
function mpPrint(){
  const r=mpPrintHTML(MP.pr);if(!r)return;if(r.err){toast(r.err,'err');return}
  MP.lastPrint=r;if(window.__noPrint)return;
  const f=document.createElement('iframe');f.style.cssText='position:fixed;width:0;height:0;border:0;left:-9999px';document.body.appendChild(f);
  f.onload=()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(e){toast(tr('Printing is blocked here.','Utskrift blockeras här.','Afdrukken wordt hier geblokkeerd.'),'err')}setTimeout(()=>f.remove(),60000)};
  f.srcdoc=r.html;
}

/* ---------- a picture to share (PNG) and the archive preview ---------- */
// Privacy by default: no coordinates, no aerial photo, no planting records, no project name (can be switched on).
function mpPngSvg(o,px){
  const q=mpPlan(),shapes=mpVisShapes(),ext=mpExtent(shapes);if(!q||!ext)return null;
  const pk=mpPlantKeys(shapes),list=o.list&&pk.list.length,side=list?Math.round(px*.3):0,head=o.title?Math.round(px*.07):0,foot=Math.round(px*.03),pad=Math.round(px*.03);
  const dw=px-side-2*pad,dh0=dw*ext.h/ext.w,dh=Math.max(dh0,list?Math.min(px*1.2,pk.list.length*px*.03+px*.08):0,px*.35);
  const W=px,H=Math.round(head+dh+2*pad+foot),m=Math.max(ext.w/dw,ext.h/dh),u=m*px/400;  // 1 "mm" = px/400 of the width
  const vb={x:ext.cx-dw*m/2,y:-ext.cy-dh*m/2,w:dw*m,h:dh*m},ill=(o.view||MP.view)==='ill',fs=px/400;
  const inner='<svg x="'+pad+'" y="'+(head+pad)+'" width="'+mpF(dw)+'" height="'+mpF(dh)+'" viewBox="'+[vb.x,vb.y,vb.w,vb.h].map(mpF).join(' ')+'">'+mpSvgShapes(shapes,{u,ill,num:pk.num})+mpSvgMarks(vb,u,'').svg+'</svg>';
  let s='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" font-family="DejaVu Sans,Arial,sans-serif"><rect width="'+W+'" height="'+H+'" fill="'+(ill?'#f4f1e8':'#ffffff')+'"/>';
  if(head)s+='<text x="'+pad+'" y="'+mpF(head*.72)+'" font-size="'+mpF(fs*9)+'" font-weight="700" fill="#1f3a2c">'+mpXmlEsc(q.name+(q.year?' '+q.year:''))+'</text>'+(o.proj?'<text x="'+(W-pad)+'" y="'+mpF(head*.72)+'" font-size="'+mpF(fs*5.5)+'" text-anchor="end" fill="#555">'+mpXmlEsc(pjName(q.project))+'</text>':'');
  s+=inner;
  if(list){let y=head+pad+fs*6;const x=W-side+pad*.5;s+='<g font-size="'+mpF(fs*4.6)+'" fill="#1f2a22">';
    pk.list.forEach(r=>{s+='<text x="'+mpF(x)+'" y="'+mpF(y)+'"><tspan font-weight="700">'+r.n+'</tspan>  '+mpXmlEsc(r.name.length>34?r.name.slice(0,33)+'…':r.name)+'  ·  '+r.count+'</text>';y+=fs*6.6});s+='</g>'}
  s+='<text x="'+(W-pad)+'" y="'+(H-foot*.35)+'" font-size="'+mpF(fs*3.6)+'" text-anchor="end" fill="#7a857a">Skogsträdgårdens artblad</text></svg>';
  return s;
}
function mpSvgToPng(svg,w,h,type){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);
  if(type==='url')res(c.toDataURL('image/png'));else c.toBlob(b=>b?res(b):rej(new Error('png')),'image/png')};im.onerror=()=>rej(new Error('svg'));im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)})}
const mpSvgSize=svg=>{const m=/width="(\d+)" height="(\d+)"/.exec(svg);return m?[Number(m[1]),Number(m[2])]:[800,600]};
const mpFileName=(q,ext)=>'artblad_plan_'+String(q.name||'plan').toLowerCase().replace(/[^a-z0-9åäöéü]+/gi,'-').replace(/^-|-$/g,'')+(q.year?'_'+q.year:'')+'.'+ext;
function mpSaveBlob(name,blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)}
async function mpPng(){
  const q=mpPlan(),o=MP.pr,svg=mpPngSvg({title:o.pngName,proj:o.pngProj,list:o.pngList,view:o.view},2400);if(!svg){toast(tr('The plan is empty.','Planen är tom.','Het plan is leeg.'),'err');return}
  MP.lastPngSvg=svg;const [w,h]=mpSvgSize(svg);try{mpSaveBlob(mpFileName(q,'png'),await mpSvgToPng(svg,w,h))}catch(e){toast(tr('The picture could not be made.','Bilden kunde inte skapas.','De afbeelding kon niet worden gemaakt.'),'err')}
}
// Small picture kept with an archived plan, so it can be recognised without opening it.
async function mpPreviewURL(){const svg=mpPngSvg({title:false,proj:false,list:false,view:'ill'},320);if(!svg)return '';const [w,h]=mpSvgSize(svg);try{return await mpSvgToPng(svg,w,h,'url')}catch(e){return ''}}

/* ---------- lists (CSV) ---------- */
function mpCsvQ(v){v=v==null?'':String(v);return /[",\n;]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
const mpR=(v,d)=>v==null||v===''||!isFinite(v)?'':String(Math.round(v*Math.pow(10,d))/Math.pow(10,d));
function mpCsvShapes(){
  const head=['kind','name','species','latin','cultivar','count','length_m','area_m2','strip_width_m','in_row_m','rows','row_gap_m','mature_width_m','height_m','path_width_m','planted','text'];
  const rows=mpVisShapes().map(s=>{const x=bySid.get(s.sid),p=mpPts(s),g=MPK[s.kind].g;
    return [s.kind,s.name||'',x?dispName(x):'',x?x.latin:'',s.cultivar||'',s.kind==='plant'?1:s.kind==='pline'?mpLineCount(s):'',g==='LineString'?mpR(mpLen(p,false),2):'',g==='Polygon'?mpR(mpArea(p),2):'',
      s.kind==='pline'?mpR(mpLineW(s),2):'',s.kind==='pline'?s.inrow||'':'',s.kind==='pline'?s.rows||1:'',s.kind==='pline'?s.gap||'':'',s.kind==='plant'?mpR(mpSpread(s),2):'',s.height||'',s.kind==='path'?s.width||1:'',s.plantingId?'yes':'',s.text||'']});
  return '﻿'+[head].concat(rows).map(r=>r.map(mpCsvQ).join(',')).join('\n');
}
function mpCsvPlants(){
  const pk=mpPlantKeys(mpVisShapes());
  return '﻿'+[['no','plant','latin','cultivar','count']].concat(pk.list.map(r=>[r.n,r.name.split(' ‘')[0],r.latin,r.k.split('|')[1]||'',r.count])).map(r=>r.map(mpCsvQ).join(',')).join('\n');
}

/* ---------- GeoJSON and KML ---------- */
const MP_PROPS=['name','cultivar','spread','inrow','rowsp','rows','gap','width','height','text'];
function mpGeoJSON(){
  const q=mpPlan();
  return JSON.stringify({type:'FeatureCollection',name:q.name,artblad:{plan:q.name,year:q.year||'',season:q.season||'',app:APP_VERSION},
    features:mpVisShapes().map(s=>{const x=bySid.get(s.sid),pr={kind:s.kind};MP_PROPS.forEach(k=>{if(s[k]!=null&&s[k]!=='')pr[k]=s[k]});
      if(s.sid){pr.sid=s.sid;if(x){pr.species=dispName(x);pr.latin=x.latin}}if(s.kind==='pline')pr.count=mpLineCount(s);if(s.plantingId)pr.planted=true;
      return {type:'Feature',properties:pr,geometry:s.g}})},null,1);
}
// KML colours are aabbggrr.
const mpKmlC=(hex,a)=>{const h=hex.replace('#','');return a+h.slice(4,6)+h.slice(2,4)+h.slice(0,2)};
function mpKML(){
  const q=mpPlan(),X=mpXmlEsc,co=pts=>pts.map(c=>c[0]+','+c[1]+',0').join(' ');
  const styles=MP_KINDS.map(k=>'<Style id="'+k+'"><LineStyle><color>'+mpKmlC(MPK[k].c,'ff')+'</color><width>2</width></LineStyle><PolyStyle><color>'+mpKmlC(MPK[k].c,'55')+'</color></PolyStyle><IconStyle><color>'+mpKmlC(MPK[k].c,'ff')+'</color></IconStyle></Style>').join('');
  const pm=mpVisShapes().map(s=>{const x=bySid.get(s.sid),g=s.g,p=mpPts(s),data={kind:s.kind};MP_PROPS.forEach(k=>{if(s[k]!=null&&s[k]!=='')data[k]=s[k]});if(s.sid)data.sid=s.sid;if(x)data.latin=x.latin;if(s.kind==='pline')data.count=mpLineCount(s);
    const nm=s.name||(x?dispName(x)+(s.cultivar?' ‘'+s.cultivar+'’':''):mpK(s.kind));
    const geom=g.type==='Point'?'<Point><coordinates>'+co(p)+'</coordinates></Point>':g.type==='LineString'?'<LineString><tessellate>1</tessellate><coordinates>'+co(p)+'</coordinates></LineString>':'<Polygon><outerBoundaryIs><LinearRing><coordinates>'+co(p.concat([p[0]]))+'</coordinates></LinearRing></outerBoundaryIs></Polygon>';
    return '<Placemark><name>'+X(nm)+'</name><styleUrl>#'+s.kind+'</styleUrl><ExtendedData>'+Object.keys(data).map(k=>'<Data name="'+k+'"><value>'+X(data[k])+'</value></Data>').join('')+'</ExtendedData>'+geom+'</Placemark>'}).join('\n');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>'+X(q.name+(q.year?' '+q.year:''))+'</name>'+styles+'\n'+pm+'\n</Document></kml>';
}
// Import: GeoJSON or KML in WGS84 longitude/latitude. Artblad's own properties come back as they were; other files become
// zones (areas), measure lines (lines) and notes (points). Shapes that would make the plan larger than 300 × 300 m are
// left out and counted.
function mpParseGeo(text,name){
  const out=[],num=v=>Number(v),push=(type,coords,pr)=>out.push({type,coords,pr:pr||{}});
  const geom=(g,pr)=>{if(!g)return;const t=g.type,c=g.coordinates;
    if(t==='Point')push('Point',[c],pr);else if(t==='LineString')push('LineString',c,pr);else if(t==='Polygon')push('Polygon',(c[0]||[]).slice(),pr);
    else if(t==='MultiPoint')c.forEach(p=>push('Point',[p],pr));else if(t==='MultiLineString')c.forEach(l=>push('LineString',l,pr));else if(t==='MultiPolygon')c.forEach(p=>push('Polygon',(p[0]||[]).slice(),pr));
    else if(t==='GeometryCollection')(g.geometries||[]).forEach(x=>geom(x,pr))};
  if(/\.km[lz]$/i.test(name||'')||/^\s*<\?xml|<kml[\s>]/i.test(text)){
    const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror'))throw new Error('kml');
    const cs=el=>String(el&&el.textContent||'').trim().split(/\s+/).filter(Boolean).map(t=>t.split(',').map(num).slice(0,2));
    Array.from(doc.getElementsByTagName('Placemark')).forEach(p=>{const pr={};const n=p.getElementsByTagName('name')[0];if(n)pr.name=n.textContent.trim();
      Array.from(p.getElementsByTagName('Data')).forEach(d=>{const v=d.getElementsByTagName('value')[0];if(d.getAttribute('name'))pr[d.getAttribute('name')]=v?v.textContent:''});
      const ds=p.getElementsByTagName('description')[0];if(ds&&!pr.text&&!pr.kind)pr.text=ds.textContent.trim();
      Array.from(p.getElementsByTagName('Point')).forEach(g=>push('Point',cs(g.getElementsByTagName('coordinates')[0]).slice(0,1),pr));
      Array.from(p.getElementsByTagName('LineString')).forEach(g=>push('LineString',cs(g.getElementsByTagName('coordinates')[0]),pr));
      Array.from(p.getElementsByTagName('Polygon')).forEach(g=>{const ob=g.getElementsByTagName('outerBoundaryIs')[0]||g;push('Polygon',cs(ob.getElementsByTagName('coordinates')[0]),pr)})});
  }else{
    const j=JSON.parse(text);if(j.type==='FeatureCollection')(j.features||[]).forEach(f=>geom(f.geometry,f.properties));else if(j.type==='Feature')geom(j.geometry,j.properties);else geom(j,{});
  }
  return out;
}
function mpImportShapes(items){
  const res={added:[],far:0,bad:0},cur=MP.shapes.slice(),r8=v=>Math.round(v*1e8)/1e8;
  items.slice(0,2000).forEach(it=>{
    let c=(it.coords||[]).filter(p=>p&&isFinite(p[0])&&isFinite(p[1])).map(p=>[r8(Number(p[0])),r8(Number(p[1]))]);
    if(c.some(p=>Math.abs(p[0])>180||Math.abs(p[1])>90)){res.bad++;return}
    if(it.type==='Polygon'&&c.length>1&&c[0][0]===c[c.length-1][0]&&c[0][1]===c[c.length-1][1])c.pop();
    const need=it.type==='Point'?1:it.type==='LineString'?2:3;if(c.length<need){res.bad++;return}
    const pr=it.pr||{};let kind=MPK[pr.kind]&&MPK[pr.kind].g===it.type?pr.kind:it.type==='Polygon'?'zone':it.type==='LineString'?'measure':'note';
    const s={id:randHex(6),kind};mpSetPts(s,it.type==='Point'?[c[0]]:c);
    MP_PROPS.forEach(k=>{const v=pr[k];if(v==null||v==='')return;if(MP_NUM.indexOf(k)>=0){const n=Number(v);if(n>0)s[k]=n}else s[k]=String(v).slice(0,k==='text'?400:60)});
    if(pr.sid&&bySid.get(String(pr.sid)))s.sid=String(pr.sid);else if(pr.latin){const x=species.find(y=>String(y.latin).toLowerCase()===String(pr.latin).toLowerCase());if(x)s.sid=x.sid}
    if(kind==='note'&&!s.text&&s.name){s.text=s.name;delete s.name}
    if(kind!=='plant'&&kind!=='pline')delete s.sid;
    if(mpTooBig(cur.concat([s]))){res.far++;return}
    cur.push(s);res.added.push(s);
  });
  return res;
}
async function mpImportFile(file){
  if(!file||!mpDrawOK())return;let items;
  try{items=mpParseGeo(await file.text(),file.name)}catch(e){toast(tr('This file could not be read as GeoJSON or KML.','Filen kunde inte läsas som GeoJSON eller KML.','Dit bestand kon niet als GeoJSON of KML worden gelezen.'),'err');return}
  const r=mpImportShapes(items);MP.lastImport={added:r.added.length,far:r.far,bad:r.bad};
  if(!r.added.length){toast(tr('Nothing imported','Inget importerat','Niets geïmporteerd')+(r.far?' ('+r.far+' '+tr('outside 300 × 300 m','utanför 300 × 300 m','buiten 300 × 300 m')+')':'')+(r.bad?' ('+r.bad+' '+tr('without usable coordinates','utan användbara koordinater','zonder bruikbare coördinaten')+')':''),'err');return}
  mpPush();MP.shapes=MP.shapes.concat(r.added);MP.sel='';mpChanged();
  toast(tr('Imported ','Importerade ','Geïmporteerd: ')+r.added.length+(r.far?' · '+r.far+' '+tr('left out (the plan may cover at most 300 × 300 m)','utelämnade (planen får täcka högst 300 × 300 m)','weggelaten (het plan mag hoogstens 300 × 300 m beslaan)'):'')+(r.bad?' · '+r.bad+' '+tr('without usable coordinates (WGS84 longitude/latitude needed)','utan användbara koordinater (WGS84 longitud/latitud behövs)','zonder bruikbare coördinaten (WGS84 lengte/breedte nodig)'):''));
}

/* ---------- the panel ---------- */
function mpExportHTML(q){
  if(!q||!mpCanExport(q.project))return '';const o=MP.pr,f=mpVisShapes().length?mpPrintFit(o,mpVisShapes()):null;
  const sel=(k,opts)=>'<select data-mppr="'+k+'">'+opts.map(x=>'<option value="'+x[0]+'"'+(String(o[k])===String(x[0])?' selected':'')+'>'+esc(x[1])+'</option>').join('')+'</select>';
  const chk=(k,lab)=>'<label class="chk"><input type="checkbox" data-mppr="'+k+'"'+(o[k]?' checked':'')+'> '+esc(lab)+'</label>';
  let fit='';if(f)fit=f.ok?tr('Prints on one ','Skrivs ut på ett ','Wordt afgedrukt op één ')+o.paper+' ('+(f.or==='portrait'?tr('portrait','stående','staand'):tr('landscape','liggande','liggend'))+') '+tr('at ','i skala ','op schaal ')+'1:'+f.scale+'.':tr('Does not fit at 1:','Får inte plats i 1:','Past niet op 1:')+o.scale+(f.fit?'; '+tr('it fits at 1:','den får plats i 1:','het past op 1:')+f.fit:'')+'.';
  let h='<details class="mpexp" id="mpExport"'+(MP.expOpen?' open':'')+'><summary class="hsub">'+esc(tr('Print and export','Skriv ut och exportera','Afdrukken en exporteren'))+'</summary>'+
    '<div class="mprow"><label class="f"><span class="fl">'+esc(tr('Paper','Papper','Papier'))+'</span>'+sel('paper',[['A4','A4'],['A3','A3']])+'</label><label class="f"><span class="fl">'+esc(tr('Orientation','Riktning','Richting'))+'</span>'+sel('orient',[['auto',tr('best fit','bäst','best passend')],['landscape',tr('landscape','liggande','liggend')],['portrait',tr('portrait','stående','staand')]])+'</label></div>'+
    '<div class="mprow"><label class="f"><span class="fl">'+esc(tr('Scale','Skala','Schaal'))+'</span>'+sel('scale',[['auto',tr('largest that fits','största som får plats','grootste die past')]].concat(MP_SCALES.filter(v=>v>=20).map(v=>[String(v),'1:'+v])))+'</label><label class="f"><span class="fl">'+esc(tr('View','Vy','Weergave'))+'</span>'+sel('view',[['',tr('as on screen','som på skärmen','zoals op het scherm')],['ill',tr('illustrated','illustrerad','geïllustreerd')],['tech',tr('technical','teknisk','technisch')]])+'</label></div>'+
    chk('list',tr('Plant list and legend','Växtlista och teckenförklaring','Plantenlijst en legenda'))+chk('grid',tr('Measuring grid','Rutnät för mätning','Meetraster'))+chk('proj',tr('Project name','Projektets namn','Projectnaam'))+
    '<p class="mpsmall muted" id="mpFit">'+esc(fit)+' '+esc(tr('Print at 100 % (“actual size”); the scale bar tells you if the printer shrank it.','Skriv ut i 100 % (”verklig storlek”); skalstocken visar om skrivaren förminskade.','Druk af op 100 % (“ware grootte”); de schaalstok laat zien of de printer verkleinde.'))+'</p>'+
    '<div class="acts"><button type="button" class="btn sm primary" data-act="mp-print">'+esc(tr('Print…','Skriv ut…','Afdrukken…'))+'</button></div>'+
    '<h4 class="mph4">'+esc(tr('Picture to share','Bild att dela','Afbeelding om te delen'))+'</h4>'+chk('pngName',tr('Plan name','Planens namn','Naam van het plan'))+chk('pngList',tr('Plant list','Växtlista','Plantenlijst'))+chk('pngProj',tr('Project name','Projektets namn','Projectnaam'))+
    '<p class="mpsmall muted">'+esc(tr('Never in the picture: the position of the garden, the aerial photo, planting records.','Aldrig med i bilden: trädgårdens läge, flygbilden, planteringar.','Nooit in de afbeelding: de ligging van de tuin, de luchtfoto, aanplantingen.'))+'</p>'+
    '<div class="acts"><button type="button" class="btn sm" data-act="mp-png">'+esc(tr('Save picture (PNG)','Spara bild (PNG)','Afbeelding opslaan (PNG)'))+'</button></div>'+
    '<h4 class="mph4">'+esc(tr('Lists and map files','Listor och kartfiler','Lijsten en kaartbestanden'))+'</h4><div class="acts">'+
    '<button type="button" class="btn sm" data-act="mp-csv-plants">'+esc(tr('Plant list (CSV)','Växtlista (CSV)','Plantenlijst (CSV)'))+'</button><button type="button" class="btn sm" data-act="mp-csv">'+esc(tr('All shapes (CSV)','Alla former (CSV)','Alle vormen (CSV)'))+'</button>'+
    '<button type="button" class="btn sm" data-act="mp-geojson">GeoJSON</button><button type="button" class="btn sm" data-act="mp-kml">KML</button></div>'+
    '<p class="mpsmall muted">'+esc(tr('GeoJSON and KML contain the exact position of the garden (for QGIS, Google Earth); share them with care.','GeoJSON och KML innehåller trädgårdens exakta läge (för QGIS, Google Earth); dela dem med eftertanke.','GeoJSON en KML bevatten de exacte ligging van de tuin (voor QGIS, Google Earth); deel ze met zorg.'))+'</p>';
  if(mpDrawOK())h+='<label class="f"><span class="fl">'+esc(tr('Import GeoJSON or KML (WGS84)','Importera GeoJSON eller KML (WGS84)','GeoJSON of KML importeren (WGS84)'))+'</span><input type="file" id="mpImport" data-mpimp="1" accept=".geojson,.json,.kml,application/geo+json,application/vnd.google-earth.kml+xml"></label>';
  return h+'</details>';
}
function mpArchivedHTML(q){
  const list=mpPlans(MP.pid).filter(x=>x.status==='archived');if(!list.length)return '';
  return '<h3 class="hsub">'+esc(tr('Archived plans','Arkiverade planer','Gearchiveerde plannen'))+'</h3><div class="mparch">'+list.map(x=>'<button type="button" class="mparc'+(x.id===MP.id?' on':'')+'" data-act="mp-openplan" data-k="'+esc(x.id)+'">'+
    (x.preview?'<img src="'+esc(x.preview)+'" alt="">':'<span class="mparc0">'+esc(tr('no picture','ingen bild','geen afbeelding'))+'</span>')+'<span>'+esc(x.name+(x.year?' '+x.year:''))+'</span></button>').join('')+'</div>';
}
// An archived plan from before 2.14 gets its picture the first time an editor opens it.
async function mpPreviewMaybe(){
  const q=mpPlan();if(!q||q.status!=='archived'||q.preview||!projCanEdit(q.project)||MP.prevBusy===q.id||!MP.shapes.length)return;
  MP.prevBusy=q.id;const url=await mpPreviewURL();if(url&&MP.id===q.id)await mpSaveMeta({preview:url});
}
async function mpArchive2(){
  const q=mpPlan();if(!q||!confirm(tr('Archive this plan? It becomes read-only; you can copy it to a new plan later.','Arkivera planen? Den blir skrivskyddad; du kan kopiera den till en ny plan senare.','Dit plan archiveren? Het wordt alleen-lezen; je kunt het later naar een nieuw plan kopiëren.')))return;
  const preview=await mpPreviewURL();
  await mpSaveMeta(Object.assign({status:'archived',lock:undefined,summary:mpSummary(MP.shapes),archivedAt:Date.now()},preview?{preview}:{}),tr('Plan archived','Planen arkiverad','Plan gearchiveerd'));
}

/* ---------- events ---------- */
function mpClick3(act,a){
  const q=mpPlan();
  if(act==='mp-tape-set'){MP.tape.pick=a.dataset.k;mpSide();return true}
  if(act==='mp-tape-clear'){MP.tape=Object.assign(MP.tape,{a:null,b:null,da:'',db:'',pick:'a'});mpDraw();mpSide();return true}
  if(act==='mp-openplan'){const el=$('#mpPlanSel');if(el){el.value=a.dataset.k;mpChange(el)}return true}
  if(!q||!/^mp-(print|png|csv|csv-plants|geojson|kml)$/.test(act))return false;
  if(!mpCanExport(q.project)){toast(tr('Only owners and editors of the project can export.','Bara projektets ägare och redaktörer kan exportera.','Alleen eigenaars en bewerkers van het project kunnen exporteren.'),'err');return true}
  if(act==='mp-print')mpPrint();
  if(act==='mp-png')mpPng();
  if(act==='mp-csv')saveFile(mpFileName(q,'csv').replace('.csv','_shapes.csv'),mpCsvShapes());
  if(act==='mp-csv-plants')saveFile(mpFileName(q,'csv').replace('.csv','_plants.csv'),mpCsvPlants());
  if(act==='mp-geojson')mpSaveBlob(mpFileName(q,'geojson'),new Blob([mpGeoJSON()],{type:'application/geo+json'}));
  if(act==='mp-kml')mpSaveBlob(mpFileName(q,'kml'),new Blob([mpKML()],{type:'application/vnd.google-earth.kml+xml'}));
  return true;
}
function mpChange3(t){
  const d=t.dataset||{};
  if(d.mptape){const k=d.mptape;if(k==='what')MP.tape.what=t.value;else{const v=Number(t.value);MP.tape[k]=v>0?v:''}mpDraw();mpSide();return true}
  if(d.mppr){const k=d.mppr;MP.pr[k]=t.type==='checkbox'?t.checked:t.value;mpPrSave();MP.expOpen=true;mpSide();return true}
  if(d.mpimp){const f=t.files&&t.files[0];t.value='';mpImportFile(f);return true}
  return false;
}
document.addEventListener('toggle',e=>{if(e.target&&e.target.id==='mpExport')MP.expOpen=e.target.open},true);
