// Artblad: SERVICE: Latin name check while typing (GBIF name service).
// Part 9 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- Latin name check while typing (GBIF name service, free, no key) ---------- */
const GBIF_C=new Map();let gbifT=0;
function gbifCheck(){
  clearTimeout(gbifT);const el=$('#gbifHint');if(!el)return;
  const latin=canon(draft.latin||'');if(latin.split(' ').length<2||latin.length<5){el.hidden=true;return}
  gbifT=setTimeout(async()=>{
    let r=GBIF_C.get(latin);
    if(!r){try{const q=await fetch('https://api.gbif.org/v1/species/match?kingdom=Plantae&name='+encodeURIComponent(latin));if(!q.ok)throw 0;r=await q.json();GBIF_C.set(latin,r)}catch(e){el.hidden=true;return}}
    if(canon(draft.latin||'')!==latin)return;
    const fam=r.family||'',acc=r.species||'',st=r.status||'',mt=r.matchType||'NONE';let h='';
    if(mt==='NONE')h=esc(tr('Not found in GBIF: check the spelling.','Hittades inte i GBIF: kontrollera stavningen.','Niet gevonden in GBIF: controleer de spelling.'));
    else if(st==='SYNONYM'&&acc&&acc!==latin)h=esc(tr('GBIF: a synonym of ','GBIF: synonym till ','GBIF: synoniem van '))+'<i>'+esc(acc)+'</i> <button type="button" class="btn sm" data-act="gbif-use" data-latin="'+esc(acc)+'">'+esc(tr('Use the accepted name','Använd det godkända namnet','Geaccepteerde naam gebruiken'))+'</button>';
    else if(mt==='FUZZY'&&r.canonicalName&&r.canonicalName!==latin)h=esc(tr('GBIF: did you mean ','GBIF: menade du ','GBIF: bedoelde je '))+'<i>'+esc(r.canonicalName)+'</i>? <button type="button" class="btn sm" data-act="gbif-use" data-latin="'+esc(r.canonicalName)+'">'+esc(tr('Use it','Använd','Gebruiken'))+'</button>';
    else h='✓ '+esc(tr('GBIF: accepted name','GBIF: godkänt namn','GBIF: geaccepteerde naam'))+(fam?' · '+esc(tr('family ','familj ','familie '))+esc(fam):'');
    if(fam&&isEmpty(draft.family)&&mt!=='NONE'){draft.family=fam;const fi=$('#form [data-k=family]');if(fi)fi.value=fam;h+=' · '+esc(tr('family filled in','familj ifylld','familie ingevuld'))}
    el.innerHTML=h;el.hidden=false;
  },700);
}
