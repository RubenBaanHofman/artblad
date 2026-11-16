// Artblad: Pictograms, layer diagram, year wheel, genus, grid, display, season, shields, bulk fill, admin extras.
// Part 10 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- pictograms (light, moisture, layer, main uses) ---------- */
const PIC={
  'light:sun':'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  'light:part':'<circle cx="10" cy="10" r="4"/><path d="M10 2.5v2M2.5 10h2M4.7 4.7l1.4 1.4M15.3 4.7l-1.4 1.4"/><path d="M8.5 19.5h10a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6 1.3A2.9 2.9 0 0 0 8.5 19.5z" fill="var(--surface)"/>',
  'light:shade':'<path d="M12 3c-4 0-7 3-7 6.5 0 2.5 1.6 4.6 3.9 5.5H12h3.1c2.3-.9 3.9-3 3.9-5.5C19 6 16 3 12 3z"/><path d="M12 15v6"/>',
  'moist:1':'<path d="M12 3.5c3 4 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.5-6 5.5-10z"/>',
  'moist:3':'<path d="M12 3.5c3 4 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.5-6 5.5-10z"/><path d="M6.7 14.2h10.6a5.5 5.5 0 0 1-10.6 0z" fill="currentColor"/>',
  'moist:5':'<path d="M12 3.5c3 4 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.5-6 5.5-10z" fill="currentColor"/>',
  'layer:canopy':'<path d="M12 2.5c4.5 0 8 2.8 8 6.7 0 2.7-2.3 4.5-5 4.5H9c-2.7 0-5-1.8-5-4.5C4 5.3 7.5 2.5 12 2.5z"/><path d="M12 13.7V21.5M9 21.5h6"/>',
  'layer:sub':'<circle cx="12" cy="9" r="5.5"/><path d="M12 14.5v7M9.5 21.5h5"/>',
  'layer:shrub':'<path d="M4 18c0-4 2.5-7 5-7 .8-2.5 3-4 5-3.5 2.5.5 4 3 4 5 1.5 1 2 2.5 2 5.5z"/><path d="M3 21h18"/>',
  'layer:herb':'<path d="M12 21V10M12 13c-3 0-5-2-5-5 3 0 5 2 5 5zM12 11c3 0 5-2 5-5-3 0-5 2-5 5z"/><path d="M6 21h12"/>',
  'layer:ground':'<path d="M3 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 21h18"/>',
  'layer:root':'<path d="M3 9h18"/><path d="M12 9c-1 4-1 8 0 12M12 13c-2 1-3 3-3 5M12 14c2 1 3 2.5 3.5 4.5"/>',
  'layer:vert':'<path d="M7 21V3"/><path d="M7 17c3 0 5-1.5 5-4M7 11c3 0 5-1.5 5-4M12 13c2.5 0 4-1 4-3"/>',
  'uses:fruit':'<circle cx="12" cy="13.5" r="6.5"/><path d="M12 7c0-2 1-3.5 3-4"/>',
  'uses:seed':'<path d="M12 3c4 2.5 5.5 7 4.3 11-.8 2.6-2.5 4-4.3 4s-3.5-1.4-4.3-4C6.5 10 8 5.5 12 3z"/>',
  'uses:leaf':'<path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14z"/><path d="M5 19 13 11"/>',
  'uses:flower':'<circle cx="12" cy="12" r="2.4"/><path d="M12 9.6c-1.6-3-1-6 0-6.6 1 .6 1.6 3.6 0 6.6zM14.4 12c3-1.6 6-1 6.6 0-.6 1-3.6 1.6-6.6 0zM12 14.4c1.6 3 1 6 0 6.6-1-.6-1.6-3.6 0-6.6zM9.6 12c-3 1.6-6 1-6.6 0 .6-1 3.6-1.6 6.6 0z"/>',
  'uses:root':'<path d="M9 3l3 3 3-3M12 6c3 0 4.5 2 4 5-.6 3.5-2.5 7-4 10-1.5-3-3.4-6.5-4-10-.5-3 1-5 4-5z"/>',
  'uses:medicinal':'<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/>',
  'uses:herb':'<path d="M12 21V8M12 12c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4zM12 16c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4z"/>',
  'uses:tea':'<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M9 3c0 1.5 1.5 1.5 1.5 3"/>'
};
const picSvg=(k,t)=>PIC[k]?'<svg class="pic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="'+esc(t)+'"><title>'+esc(t)+'</title>'+PIC[k]+'</svg>':'';
function pictos(s,max){
  const m=s.m,out=[],lab=(opts,k)=>{const o=opts.find(x=>x.k===k);return o?trs(o.en,o.sv):k};
  (m.light||[]).forEach(k=>out.push(picSvg('light:'+k,trs('Light','Ljus')+': '+lab(LIGHT,k))));
  if(m.moist){const lv=m.moist<=2?1:m.moist>=4?5:3;out.push(picSvg('moist:'+lv,trs('Moisture','Fukt')+' '+m.moist+'/5'))}
  (m.layer||[]).forEach(k=>out.push(picSvg('layer:'+k,trs('Layer','Skikt')+': '+lab(LAYER,k))));
  (m.uses||[]).filter(k=>PIC['uses:'+k]).slice(0,4).forEach(k=>out.push(picSvg('uses:'+k,trs('Use','Användning')+': '+lab(USES_ALL,k))));
  const h=out.filter(Boolean).slice(0,max||12);
  return h.length?'<span class="pics">'+h.join('')+'</span>':'';
}

/* ---------- food-forest layer diagram ---------- */
function layerDiagram(s,print){
  const L=s.m.layer||[];if(!L.length)return '';
  const on=k=>L.indexOf(k)>=0,c=k=>on(k)?'var(--accent)':'var(--line)',f=k=>on(k)?'color-mix(in srgb,var(--accent) 30%,transparent)':'transparent';
  const lab=k=>{const o=LAYER.find(x=>x.k===k);return o?trs(o.en,o.sv):k};
  return '<figure class="laydia"><svg viewBox="0 0 300 120" role="img" aria-label="'+esc(trs('Layer','Skikt')+': '+L.map(lab).join(', '))+'"><title>'+esc(L.map(lab).join(', '))+'</title>'+
    '<path d="M0 96h300" stroke="var(--muted)" stroke-width="1.2"/>'+
    '<g stroke-width="1.6" stroke-linejoin="round">'+
    '<path d="M18 50c0-20 16-34 34-34s34 14 34 34c0 9-8 14-17 14H35c-9 0-17-5-17-14z" stroke="'+c('canopy')+'" fill="'+f('canopy')+'"/><path d="M52 64v32" stroke="'+c('canopy')+'"/>'+
    '<circle cx="112" cy="58" r="16" stroke="'+c('sub')+'" fill="'+f('sub')+'"/><path d="M112 74v22" stroke="'+c('sub')+'"/>'+
    '<path d="M144 96c0-14 7-24 15-24 3-7 10-10 16-8 7 2 11 9 11 15 4 3 6 8 6 17z" stroke="'+c('shrub')+'" fill="'+f('shrub')+'"/>'+
    '<path d="M214 96V72M214 80c-8 0-12-5-12-12 8 0 12 5 12 12zM214 77c8 0 12-5 12-12-8 0-12 5-12 12z" stroke="'+c('herb')+'" fill="'+f('herb')+'"/>'+
    '<path d="M236 94c5-5 10-5 15 0s10 5 15 0" stroke="'+c('ground')+'" fill="none"/>'+
    '<path d="M282 96V30M282 84c8 0 12-4 12-10M282 66c8 0 12-4 12-10M282 48c8 0 12-4 12-10" stroke="'+c('vert')+'" fill="none"/>'+
    '<path d="M240 96c-2 8-2 14 0 20M240 102c-5 2-8 6-8 12M240 104c5 2 8 5 9 10" stroke="'+c('root')+'" fill="none"/>'+
    '</g></svg>'+(print?'':'<figcaption>'+esc(L.map(lab).join(' · '))+'</figcaption>')+'</figure>';
}

/* ---------- year wheel: the four calendar rows as rings ---------- */
const CAL_COL={cal1:'#6b8f3a',cal2:'#d98bb0',cal3:'#c06a1f',cal4:'#7d8a93'};
function yearWheel(s,size,print){
  const m=s.m,rows=['cal1','cal2','cal3','cal4'].filter(k=>(m[k]||[]).length);if(!rows.length)return '';
  const R=50,cx=60,cy=60,arc=(r0,r1,i)=>{const a0=(i/12)*2*Math.PI-Math.PI/2,a1=((i+1)/12)*2*Math.PI-Math.PI/2,p=(r,a)=>(cx+r*Math.cos(a)).toFixed(2)+' '+(cy+r*Math.sin(a)).toFixed(2);
    return 'M'+p(r1,a0)+' A'+r1+' '+r1+' 0 0 1 '+p(r1,a1)+' L'+p(r0,a1)+' A'+r0+' '+r0+' 0 0 0 '+p(r0,a0)+'Z'};
  let g='';const w=(R-14)/rows.length;
  rows.forEach((k,ri)=>{const r1=R-ri*w,r0=r1-w+1.5;for(let i=0;i<12;i++)g+='<path d="'+arc(r0,r1,i)+'" fill="'+((m[k]||[]).indexOf(i+1)>=0?CAL_COL[k]:'var(--soft)')+'" stroke="var(--surface)" stroke-width="1"/>'});
  const mon=MONTHS.map((x,i)=>{const a=((i+.5)/12)*2*Math.PI-Math.PI/2;return '<text x="'+(cx+(R+6)*Math.cos(a)).toFixed(1)+'" y="'+(cy+(R+6)*Math.sin(a)+2.5).toFixed(1)+'" text-anchor="middle" font-size="7" fill="var(--muted)">'+x+'</text>'}).join('');
  const nowA=((new Date().getMonth()+.5)/12)*2*Math.PI-Math.PI/2;
  if(print)return '<svg viewBox="-4 -4 128 128" aria-hidden="true">'+g+mon+'</svg>';
  return '<figure class="wheel" style="--ws:'+(size||132)+'px"><svg viewBox="-4 -4 128 128" role="img" aria-label="'+esc(rows.map(k=>trs(CAL_LAB[k][s.form][0],CAL_LAB[k][s.form][1])).join(', '))+'">'+g+mon+
    '<path d="M60 60L'+(60+16*Math.cos(nowA)).toFixed(1)+' '+(60+16*Math.sin(nowA)).toFixed(1)+'" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/><circle cx="60" cy="60" r="2.2" fill="var(--ink)"/></svg>'+
    '<figcaption>'+rows.map(k=>'<span><i style="background:'+CAL_COL[k]+'"></i>'+esc(trs(CAL_LAB[k][s.form][0],CAL_LAB[k][s.form][1]))+'</span>').join('')+'</figcaption></figure>';
}

/* ---------- species in the same genus ---------- */
const genusOf=l=>String(l||'').trim().split(/\s+/)[0]||'';
const genusList=s=>species.filter(x=>genusOf(x.latin)===genusOf(s.latin));
function genusTableHTML(s,lang,print,only){
  const all=genusList(s);if(all.length<2)return '';const list=only||all;
  const L=(en,sv)=>esc(lang==='sv'?sv:lang==='nl'?nl(en):en),dash='–';
  const zone=m=>[m.szone?'SE '+m.szone:'',m.usda?'USDA '+m.usda:'',m.rhs?'RHS '+m.rhs:''].filter(Boolean).join(' · ')||dash;
  const opt=(o,v)=>{const a=[].concat(v||[]);return a.length?a.map(k=>{const x=o.find(z=>z.k===k);return x?(lang==='sv'?x.sv:lang==='nl'?nl(x.en):x.en):k}).join(', '):dash};
  const typ=m=>{const o=TYPES_ALL.find(x=>x.k===m.type);return o?(lang==='sv'?o.sv:lang==='nl'?nl(o.en):o.en):dash};
  const cols=[['Species','Art',x=>print?'<i>'+esc(x.latin)+'</i>':'<button type="button" class="lnk" data-open="'+esc(x.sid)+'"><i>'+esc(x.latin)+'</i></button>'+(commonName(x)?'<br><small>'+esc(commonName(x))+'</small>':'')],
    ['Type','Typ',x=>esc(typ(x.m))],['Height','Höjd',x=>x.m.height!=null?esc(x.m.height+' '+(unitOf(DEF.height,x.form)||'')):dash],['Light','Ljus',x=>esc(opt(LIGHT,x.m.light))],
    ['Moisture','Fukt',x=>x.m.moist?esc(x.m.moist+'/5'):dash],['Hardiness','Härdighet',x=>esc(zone(x.m))],['Edibility','Ätlighet',x=>isEmpty(x.m.edibility)?dash:Number(x.m.edibility)===0?L('Inedible','Oätlig'):esc(x.m.edibility+'/5')],
    ['Layer','Skikt',x=>esc(opt(LAYER,x.m.layer))],['Use it?','Använda?',x=>x.m.verdict?esc(x.m.verdict+'/5'):dash]];
  return '<table class="'+(print?'gtab':'cmpt gentab')+'"><thead><tr>'+cols.map(c=>'<th scope="col">'+L(c[0],c[1])+'</th>').join('')+'</tr></thead><tbody>'+
    list.map(x=>'<tr'+(x.sid===s.sid?' class="me"':'')+'>'+cols.map(c=>'<td>'+c[2](x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
}
// Split a printed table over as many A5 backs as needed, filling each page until it is full: the rows are measured
// in a hidden sheet (row heights depend on how much text each row has). Without a page to measure in: fixed counts.
function fitPages(rows,page,fallback){
  const out=[];let i=0;
  const host=document.body&&document.createElement('div');
  if(host){host.className='sheetfit';host.setAttribute('aria-hidden','true');host.style.cssText='position:absolute;left:-10000px;top:0;visibility:hidden;transform:none;width:auto;height:auto';document.body.appendChild(host)}
  try{
    while(i<rows.length){
      let n=fallback;
      if(host){
        host.innerHTML=page(rows.slice(i));
        const w=host.querySelector('.gwrap'),trs=host.querySelectorAll('.gtab tbody tr'),note=host.querySelector('.gnote');
        if(w&&w.clientHeight>0&&trs.length){
          const lim=w.getBoundingClientRect().top+w.clientHeight-(note?note.getBoundingClientRect().height+4:0);
          n=0;trs.forEach(tr=>{if(tr.getBoundingClientRect().bottom<=lim+0.5)n++});
        }
      }
      n=Math.max(1,Math.min(n,rows.length-i));out.push(page(rows.slice(i,i+n)));i+=n;
    }
  }finally{if(host)host.remove()}
  return out.join('');
}
function sheetGenus(s,lang){
  const t=genusTableHTML(s,lang,true);if(!t)return '';
  const L=(en,sv)=>esc(lang==='sv'?sv:lang==='nl'?nl(en):en);
  return fitPages(genusList(s),pg=>'<section class="sheet back tblp'+(s.form==='w'?'':' herb')+'"><div class="band"><span>'+L('SAME GENUS','SAMMA SLÄKTE')+': <i>'+esc(genusOf(s.latin))+'</i></span><small><i>'+esc(s.latin)+'</i> · '+esc(s.no)+'</small></div><div class="gwrap">'+genusTableHTML(s,lang,true,pg)+'</div></section>',14);
}

/* ---------- species list as a photo grid ---------- */
function spTile(s){
  return '<div class="spt"><button type="button" class="sp tile" data-sid="'+esc(s.sid)+'"><span class="tph" style="--c:'+FCOL[s.form]+'">'+phInner(s,1)+'</span><span class="tnm"><span class="lat">'+names(s).main+'</span><span class="nm">'+(commonName(s)?'<i>'+esc(s.latin)+'</i>':'')+'</span></span></button>'+starBtn(s.sid)+'</div>';
}

/* ---------- display: text size and compact list (this device only) ---------- */
const ZOOMS=[0.9,1,1.12,1.25];
function dispApply(){
  const z=Number(store.get('ab.zoom')||1);document.documentElement.style.zoom=z===1?'':String(z);
  document.body.classList.toggle('compact',store.get('ab.compact')==='1');
  document.body.classList.toggle('gridview',store.get('ab.view')==='grid');
  $$('[data-zoom]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.zoom)===z)));
  $$('#dispCompact').forEach(c=>c.checked=store.get('ab.compact')==='1');
  $$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String((store.get('ab.view')||'list')===b.dataset.view)));
}

/* ---------- season: background drawings, label and the loading screen ---------- */
const seasonOf=d=>{const mo=(d||new Date()).getMonth()+1;return mo>=3&&mo<=5?'spring':mo>=6&&mo<=8?'summer':mo>=9&&mo<=10?'autumn':'winter'};
const SEASON_PLANT={spring:'Malus domestica',summer:'Ribes nigrum',autumn:'Sorbus aucuparia',winter:'Betula pendula'};
function bgDraw(season){
  const leaves=season!=='winter';
  const a='<svg class="bgsprig r" viewBox="0 0 200 320" aria-hidden="true" fill="none" stroke="var(--bgink)" stroke-width="1.3" stroke-linecap="round"><path d="M100 310C98 240 102 160 96 20"/>'+
    (leaves?'<g fill="var(--bgleaf)"><path d="M99 250C70 240 50 222 42 196C68 200 88 220 99 250Z"/><path d="M100 210C128 200 150 182 160 154C132 160 112 180 100 210Z"/><path d="M98 165C72 156 56 138 50 112C74 118 92 138 98 165Z"/><path d="M99 120C124 110 140 92 146 66C122 74 106 94 99 120Z"/></g><path d="M42 196L99 250M160 154L100 210M50 112L98 165M146 66L99 120" stroke-width=".7"/>'
      :'<path d="M99 250L64 214M80 232L70 238M100 210L138 176M122 190L132 196M98 165L62 128M99 120L132 84M97 70L84 44"/><g fill="var(--bgink)" stroke="none"><circle cx="64" cy="214" r="1.6"/><circle cx="138" cy="176" r="1.6"/><circle cx="62" cy="128" r="1.6"/><circle cx="132" cy="84" r="1.6"/><circle cx="84" cy="44" r="1.6"/><circle cx="110" cy="150" r="1.1"/><circle cx="86" cy="190" r="1.1"/></g><path d="M160 40v16M152 48h16M154.5 42.5l11 11M165.5 42.5l-11 11" stroke-width="1"/>')+
    (season==='spring'?'<g fill="#f3d6dc" stroke="var(--bgink)" stroke-width=".9"><circle cx="97" cy="14" r="4"/><circle cx="104" cy="18" r="4"/><circle cx="101" cy="25" r="4"/><circle cx="93" cy="25" r="4"/><circle cx="90" cy="18" r="4"/></g><circle cx="97" cy="20" r="1.8" fill="#d9b23c" stroke="none"/>':'')+
    (season==='summer'?'<g fill="#c4505a" stroke="var(--bgink)" stroke-width=".8"><circle cx="96" cy="14" r="4.5"/><circle cx="104" cy="20" r="4.5"/><circle cx="92" cy="22" r="4.5"/></g>':'')+
    (season==='autumn'?'<path d="M150 300C136 292 132 278 138 264C150 270 156 284 150 300Z" fill="#e3b08a" transform="rotate(28 145 282)"/>':'')+'</svg>';
  const b='<svg class="bgsprig l" viewBox="0 0 160 200" aria-hidden="true" fill="none" stroke="var(--bgink)" stroke-width="1.2" stroke-linecap="round"><path d="M80 195C82 140 78 90 84 10"/>'+
    '<g fill="'+(season==='autumn'?'#e8c48f':'none')+'"><circle cx="84" cy="22" r="9"/><circle cx="70" cy="40" r="7"/><circle cx="96" cy="44" r="7"/></g>'+
    (leaves?'<g fill="var(--bgleaf)"><path d="M81 120C60 112 48 96 46 76C64 82 76 98 81 120Z"/><path d="M82 150C104 142 116 126 118 106C100 112 88 128 82 150Z"/></g>':'')+'</svg>';
  return a+b;
}
function seasonApply(){
  const se=seasonOf();document.documentElement.dataset.season=se;
  const bg=$('#bgdeco');if(bg)bg.innerHTML=bgDraw(se);
  const lb=$('#herbLabel');if(lb)lb.innerHTML='Herb. Björksjön · <i>'+esc(SEASON_PLANT[se])+'</i> · leg. '+esc(new Date().toLocaleDateString(state.lang==='sv'?'sv-SE':state.lang==='nl'?'nl-NL':'en-GB',{month:'long',year:'numeric'}));
  const fx=$('#splash .spfx');if(fx&&!fx.childNodes.length){fx.className='spfx '+se;let h='';for(let i=0;i<22;i++)h+='<i style="--x:'+(Math.random()*100).toFixed(1)+'vw;--d:'+(3+Math.random()*3).toFixed(2)+'s;--l:'+(-Math.random()*4).toFixed(2)+'s;--s:'+(0.6+Math.random()*0.9).toFixed(2)+'"></i>';fx.innerHTML=h}
}

/* ---------- shields: a short celebration when one reaches a new stage ---------- */
function shieldCelebrate(t){
  const uid=meUid();if(!uid)return;const key='ab.stages.'+uid;let old={};try{old=JSON.parse(store.get(key)||'{}')}catch(e){}
  const now={};LADDERS.forEach(L=>now[L.k]=stageOf(L,t[L.k]));
  const up=LADDERS.filter(L=>old[L.k]!=null&&now[L.k]>old[L.k]);
  try{store.set(key,JSON.stringify(now))}catch(e){}
  up.forEach(L=>{const card=$('#meBody [data-ladder="'+L.k+'"]');if(card){card.classList.remove('lvlup');void card.offsetWidth;card.classList.add('lvlup')}});
  if(up.length){const L=up[0];toast(tr('New stage: ','Nytt steg: ','Nieuwe stap: ')+stName(STAGES[now[L.k]-1])+' · '+tr(L.t[0],L.t[1],L.t[2]))}
}

/* ---------- bulk fill on Help fill the gaps ---------- */
// Gap filters that can be filled for many species at once: one value for every ticked species.
const BULK={type:'type',light:'light',moist:'moist',soil:'soil',uses:'uses',eco:'eco',layer:'layer',struct:'struct',edibility:'edibility',hardy:'szone',verdict:'verdict',family:'family',region:'region',months:'months'};
const bulkState={sel:new Set(),val:null,cal:'cal1',zfield:'szone'};
function bulkField(){const k=BULK[gapState.only];return k==='months'?bulkState.cal:k==='szone'?bulkState.zfield:k}
function bulkOpts(d){if(!d||!d.o)return [];if(Array.isArray(d.o))return d.o;return uniqOpts(d.o.w||[],d.o.h||[])}
function bulkBarHTML(){
  if(!CANW||!SB||!BULK[gapState.only])return '';
  const k=bulkField(),d=k==='type'?{k:'type',t:'single',o:TYPES_ALL}:DEF[k];if(!d)return '';
  let ctl='';const v=bulkState.val;
  if(gapState.only==='months')ctl='<select id="bulkCal">'+['cal1','cal2','cal3','cal4'].map(c=>'<option value="'+c+'"'+(bulkState.cal===c?' selected':'')+'>'+esc(trs(CAL_LAB[c].w[0]+' (woody) / '+CAL_LAB[c].h[0],CAL_LAB[c].w[1]+' / '+CAL_LAB[c].h[1]))+'</option>').join('')+'</select><span class="chips">'+MONTHS.map((x,i)=>'<button type="button" class="chip sm" data-bulkm="'+(i+1)+'" aria-pressed="'+((v||[]).indexOf(i+1)>=0)+'"><span>'+esc(MON_SV&&state.lang==='sv'?MON_SV[i]:MONTH_NAMES[i].slice(0,3))+'</span></button>').join('')+'</span>';
  else if(gapState.only==='hardy')ctl='<select id="bulkZf"><option value="szone"'+(bulkState.zfield==='szone'?' selected':'')+'>'+esc(trs('Swedish zone','Svensk zon'))+'</option><option value="usda"'+(bulkState.zfield==='usda'?' selected':'')+'>USDA</option><option value="rhs"'+(bulkState.zfield==='rhs'?' selected':'')+'>RHS</option></select><input id="bulkText" type="text" maxlength="12" value="'+esc(v||'')+'" placeholder="'+esc(bulkState.zfield==='rhs'?'H5':bulkState.zfield==='usda'?'5 or 4-7':'1-5')+'">';
  else if(d.t==='text')ctl='<input id="bulkText" type="text" maxlength="60" value="'+esc(v||'')+'">';
  else if(d.t==='scale')ctl='<span class="chips">'+(d.none?'<button type="button" class="chip sm" data-bulkv="0" aria-pressed="'+(v===0)+'"><span>'+esc(trs(d.none[0],d.none[1]))+'</span></button>':'')+[1,2,3,4,5].map(n=>'<button type="button" class="chip sm" data-bulkv="'+n+'" aria-pressed="'+(v===n)+'"><span>'+n+'</span></button>').join('')+'</span>';
  else ctl='<span class="chips">'+bulkOpts(d).map(o=>'<button type="button" class="chip sm" data-bulko="'+esc(o.k)+'" aria-pressed="'+(d.t==='multi'?(v||[]).indexOf(o.k)>=0:v===o.k)+'"><span>'+esc(trs(o.en,o.sv))+'</span></button>').join('')+'</span>';
  const n=bulkState.sel.size;
  return '<div class="bulkbar"><b>'+esc(tr('Fill in for several species at once','Fyll i för flera arter på en gång','Voor meerdere soorten tegelijk invullen'))+'</b><p class="hint" style="margin:0">'+esc(tr('Choose one value, tick the species below it applies to, then press Apply. Each species gets a new entry in your name; nothing already filled in is changed.','Välj ett värde, kryssa för arterna nedan som det gäller och tryck på Tillämpa. Varje art får en ny post i ditt namn; inget som redan är ifyllt ändras.','Kies één waarde, vink de soorten hieronder aan waarvoor die geldt en druk op Toepassen. Elke soort krijgt een nieuwe invoer op jouw naam; wat al is ingevuld, verandert niet.'))+'</p>'+
    '<div class="bulkctl">'+ctl+'</div><div class="acts"><button type="button" class="btn sm" data-act="bulk-all">'+esc(tr('Tick all shown','Kryssa för alla','Alles aanvinken'))+'</button><button type="button" class="btn sm" data-act="bulk-none">'+esc(tr('Untick all','Avmarkera alla','Alles uitvinken'))+'</button>'+
    '<button type="button" class="btn sm primary" data-act="bulk-apply"'+(n&&!isEmpty(v)?'':' disabled')+'>'+esc(tr('Apply to '+n+' species','Tillämpa på '+n+' arter','Toepassen op '+n+' soorten'))+'</button></div></div>';
}
async function bulkApply(){
  const k=bulkField(),d=k==='type'?{k:'type',t:'single',o:TYPES_ALL}:DEF[k];let v=bulkState.val;if(!d||isEmpty(v))return;
  if(d.zone)v=zoneNorm(v,d.zone);
  const now=Date.now(),ents=[],skipped=[];
  [...bulkState.sel].forEach((sid,i)=>{const s=bySid.get(sid);if(!s)return;let val=v;
    if(d.o&&!Array.isArray(d.o)&&k!=='type'){const ok=optsOf(d,s.form).map(o=>o.k);val=[].concat(v).filter(x=>ok.indexOf(x)>=0);if(!val.length){skipped.push(s.latin);return}if(d.t==='single')val=val[0]}
    if(d.only&&d.only!==s.form){skipped.push(s.latin);return}
    const form=k==='type'?formOf(v):s.form;
    ents.push({id:newId(),data:{sid:s.sid,latin:s.latin,date:today(),form,fields:{[k]:Array.isArray(val)?val.slice():val},createdAt:now+i,updatedAt:now+i,bulk:true}})});
  if(!ents.length){toast(tr('Nothing to apply: the value does not fit the ticked species.','Inget att tillämpa: värdet passar inte de valda arterna.','Niets toe te passen: de waarde past niet bij de aangevinkte soorten.'),'err');return}
  try{await Data.saveMany(ents,[]);bulkState.sel.clear();bulkState.val=null;
    toast(tr('Added to '+ents.length+' species','Tillagt för '+ents.length+' arter','Toegevoegd aan '+ents.length+' soorten')+(skipped.length?' · '+tr('skipped: ','hoppade över: ','overgeslagen: ')+skipped.join(', '):''))}
  catch(e){toast(errMsg(e),'err')}
}

/* ---------- admin dashboard extras: usage, possible problems, charts, thumbnails ---------- */
function photoIds(){const ids=new Set();state.entries.forEach(e=>{if(e.fields&&e.fields.photo)ids.add(e.fields.photo)});state.obs.forEach(o=>{if(o.photo)ids.add(o.photo)});return [...ids]}
function usageHTML(){
  const n=photoIds().length,data=JSON.stringify([state.entries,state.obs,state.plantings,state.lists,state.comments]).length;
  const mb=x=>x<1?(Math.round(x*10)/10).toString():Math.round(x).toString();
  return '<p>'+esc(tr(n+' photos, about '+mb(n*0.37)+' MB of the free 1 GB (estimate). All sheet data: about '+Math.max(1,Math.round(data/1024))+' KB, loaded each time the app opens.',n+' foton, cirka '+mb(n*0.37)+' MB av gratis 1 GB (uppskattning). Alla bladdata: cirka '+Math.max(1,Math.round(data/1024))+' KB, som laddas varje gång appen öppnas.',n+' foto’s, ongeveer '+mb(n*0.37)+' MB van de gratis 1 GB (schatting). Alle bladgegevens: ongeveer '+Math.max(1,Math.round(data/1024))+' KB, geladen bij elke start van de app.'))+'</p>'+
    '<p class="muted" style="font-size:13.5px">'+esc(tr('The free plan allows 5 GB of traffic a month; photos are most of it. Check it once a month: Supabase dashboard → your project → Usage.','Gratisplanen tillåter 5 GB trafik i månaden; foton står för det mesta. Kontrollera en gång i månaden: Supabase → ditt projekt → Usage.','Het gratis plan staat 5 GB verkeer per maand toe; foto’s zijn het grootste deel. Controleer maandelijks: Supabase → je project → Usage.'))+'</p>'+
    '<div class="acts"><button type="button" class="btn sm" data-act="thumbs-make">'+esc(tr('Create missing photo thumbnails','Skapa saknade miniatyrbilder','Ontbrekende miniaturen maken'))+'</button><span id="thumbMsg" class="muted" style="font-size:13px"></span></div>';
}
async function thumbsMake(btn){
  if(!ASSETS||!ASSETS.thumb)return;btn.disabled=true;const ids=photoIds(),msg=$('#thumbMsg');let made=0,had=0,fail=0;
  for(let i=0;i<ids.length;i++){const id=ids[i];msg.textContent=(i+1)+' / '+ids.length;
    try{const h=await fetch(thumbSrc(id),{method:'HEAD'});if(h.ok){had++;continue}
      const r=await fetch(blobSrc(id));if(!r.ok)throw 0;await ASSETS.thumb(id,await shrink(await r.blob(),360,.72));made++}catch(e){fail++}}
  msg.textContent=tr('Done: '+made+' made, '+had+' already there'+(fail?', '+fail+' failed':''),'Klart: '+made+' skapade, '+had+' fanns redan'+(fail?', '+fail+' misslyckades':''),'Klaar: '+made+' gemaakt, '+had+' bestonden al'+(fail?', '+fail+' mislukt':''));btn.disabled=false;
}
function problemsHTML(){
  const rows=species.map(s=>({s,c:liveChecks(s)})).filter(x=>x.c.length).sort((a,b)=>b.c.length-a.c.length);
  const dn=REV.v5?species.map(s=>({s,c:dismissedChecks(s)})).filter(x=>x.c.length):[],nd=dn.reduce((t,x)=>t+x.c.length,0);
  const dis=nd?'<details class="disd"><summary>'+esc(nd+' '+tr('dismissed warnings','avfärdade varningar','genegeerde waarschuwingen'))+'</summary><div class="stack">'+dn.map(x=>'<div class="ent probrow"><span><button type="button" class="lnk" data-open="'+esc(x.s.sid)+'">'+esc(dispName(x.s))+'</button><ul class="probs">'+x.c.map(c=>'<li class="muted">'+esc(c.txt)+undoBtn(x.s.sid,c)+'</li>').join('')+'</ul></span></div>').join('')+'</div></details>':'';
  if(!rows.length)return '<p class="muted">'+esc(tr('No possible problems found.','Inga möjliga problem hittades.','Geen mogelijke problemen gevonden.'))+'</p>'+dis;
  return '<div class="stack">'+rows.slice(0,60).map(x=>'<div class="ent probrow"><span><button type="button" class="lnk" data-open="'+esc(x.s.sid)+'">'+esc(dispName(x.s))+'</button><ul class="probs">'+x.c.map(c=>'<li>'+esc(c.txt)+disBtn(x.s.sid,c)+'</li>').join('')+'</ul></span></div>').join('')+'</div>'+
    (rows.length>60?'<p class="muted">'+esc(tr('Showing the first 60 species.','Visar de första 60 arterna.','De eerste 60 soorten worden getoond.'))+'</p>':'')+dis;
}
function chartsHTML(){
  const bar=(lab,n,max)=>'<div class="hbar"><span>'+esc(lab)+'</span><i style="width:'+(max?Math.round(100*n/max):0)+'%"></i><b>'+n+'</b></div>';
  const cnt=(opts,k)=>opts.map(o=>[trs(o.en,o.sv),species.filter(s=>[].concat(s.m[k]||[]).indexOf(o.k)>=0).length]).filter(x=>x[1]);
  const lay=cnt(LAYER,'layer'),typ=cnt(TYPES_ALL,'type'),mx=a=>Math.max(1,...a.map(x=>x[1]));
  // Completeness at the end of each of the last 12 months, from the entries that existed then.
  const pts=[];const now=new Date();
  for(let i=11;i>=0;i--){const end=new Date(now.getFullYear(),now.getMonth()-i+1,1).getTime();const by=new Map();
    state.entries.forEach(e=>{if((e.createdAt||0)<end&&e.sid){(by.get(e.sid)||by.set(e.sid,[]).get(e.sid)).push(e)}});
    const vals=[...by.entries()].map(([sid,es])=>{const s=bySid.get(sid);const m=mergeEntries(es.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||''))).m;return complOf(m,m.type?formOf(m.type):(s?s.form:'h'),!!m.photo)});
    pts.push({lab:new Date(end-864e5).toLocaleDateString(state.lang==='sv'?'sv-SE':state.lang==='nl'?'nl-NL':'en-GB',{month:'short'}),n:by.size,avg:vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0})}
  return '<div class="charts"><div><h3>'+trh('Species by layer','Arter per skikt','Soorten per laag')+'</h3>'+lay.map(x=>bar(x[0],x[1],mx(lay))).join('')+'</div>'+
    '<div><h3>'+trh('Species by type','Arter per typ','Soorten per type')+'</h3>'+typ.map(x=>bar(x[0],x[1],mx(typ))).join('')+'</div>'+
    '<div class="wide"><h3>'+trh('Average completeness, last 12 months','Genomsnittlig fullständighet, senaste 12 månaderna','Gemiddelde volledigheid, laatste 12 maanden')+'</h3><div class="vbars">'+pts.map(p=>'<div class="vb" title="'+esc(p.lab+': '+p.avg+' % · '+p.n+' '+trs('species','arter'))+'"><b>'+p.avg+'%</b><i style="height:'+p.avg+'%"></i><span>'+esc(p.lab)+'</span></div>').join('')+'</div></div></div>';
}
