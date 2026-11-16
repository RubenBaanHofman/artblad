// Artblad: Outside sources pre-filled by Artie (the bot): labels and rules.
// Part 3 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- outside sources (auto-fill by Artie, the bot) ----------
   An entry with "by" (e.g. by:'wcvp') was filled in automatically from an outside source. People always win:
   source values only fill fields that no person has filled in, and differences are listed separately.
   Text fields that collect notes (habitat, sources, ...) add the source text after the people's text. */
const SRC={
  rules:{en:'Artie (rule)',url:''},gbif:{en:'GBIF',url:'https://www.gbif.org'},wikidata:{en:'Wikidata',url:'https://www.wikidata.org'},
  wcvp:{en:'WCVP (Kew)',short:'WCVP',url:'https://powo.science.kew.org'},
  usda:{en:'USDA PLANTS',short:'USDA',url:'https://plants.usda.gov'},
  ellenberg:{en:'Ellenberg values (Tichý et al. 2023)',short:'Ellenberg',url:'https://doi.org/10.5281/zenodo.7427088'},
  grin:{en:'GRIN Taxonomy',short:'GRIN',url:'https://npgsweb.ars-grin.gov/gringlobal/taxon/taxonomysearch'},
  'slu-risk':{en:'SLU Artdatabanken risk list',short:'SLU',url:'https://doi.org/10.15468/apnp2q'},
  'eu-ias':{en:'EU invasive species list',short:'EU list',url:'https://doi.org/10.15468/7sk8se'}
};
// Later in this list wins when two sources give a different single value (people always win over all of them).
const SRC_ORDER=['rules','gbif','wikidata','usda','ellenberg','wcvp','grin','slu-risk','eu-ias'];
const srcRank=b=>{const i=SRC_ORDER.indexOf(b);return i<0?SRC_ORDER.length:i};
const srcName=b=>(SRC[b]&&SRC[b].en)||String(b||'');
const srcShort=b=>(SRC[b]&&(SRC[b].short||SRC[b].en))||String(b||'');
const isSrcEnt=e=>!!(e&&e.by);
const sameVal=(a,b)=>JSON.stringify(Array.isArray(a)?a.slice().sort():a)===JSON.stringify(Array.isArray(b)?b.slice().sort():b);
// base: values merged from people's entries. Returns the combined values, which source filled what, and differences.
function addSources(base,ents,keep){
  const m=Object.assign({},base),from={},diff=[],had={};
  ents.slice().sort((a,b)=>srcRank(a.by)-srcRank(b.by)||(a.date||'').localeCompare(b.date||'')).forEach(e=>{
    Object.keys(e.fields||{}).forEach(k=>{
      const d=DEF[k],v=e.fields[k];if(!d||k==='cultivar'||!keep(k)||isEmpty(v))return;
      const tag=()=>{(from[k]=from[k]||[]);if(from[k].indexOf(e.by)<0)from[k].push(e.by)};
      if(d.t==='text'&&d.cat){const p=m[k]?m[k].split(' · '):[];if(p.indexOf(v)<0){p.push(v);m[k]=p.join(' · ');tag()}return}
      if(!isEmpty(base[k])){if(!sameVal(base[k],v)&&!NOCONF[k])diff.push({k,v,by:e.by,people:true});return}
      if(d.t==='multi'||d.t==='cal'){m[k]=[...new Set((m[k]||[]).concat(v))];if(d.t==='cal')m[k].sort((a,b)=>a-b);tag();return}
      if(had[k]&&!sameVal(had[k].v,v)&&!NOCONF[k])diff.push({k,v:had[k].v,by:had[k].by,people:false});
      had[k]={v,by:e.by};m[k]=v;from[k]=[e.by];
    });
  });
  return{m,from,diff};
}
const labOf=(d,f,v)=>{if(!d||!d.o)return String(v);const all=Array.isArray(d.o)?d.o:[].concat(...Object.values(d.o));const o=optsOf(d,f).find(x=>x.k===v)||all.find(x=>x.k===v);return o?trs(o.en,o.sv):String(v)};
const srcPill=e=>{const u=safeUrl((e.src&&e.src.url)||(SRC[e.by]||{}).url);return '<span class="pill srcp" title="'+esc(tr('Filled in automatically by Artie (bot). People’s entries always take priority.','Ifyllt automatiskt av Artie (bot). Personers poster går alltid före.','Automatisch ingevuld door Artie (bot). Invoer van mensen gaat altijd voor.'))+'">'+esc(tr('From ','Från ','Uit '))+(u?'<a href="'+esc(u)+'" target="_blank" rel="noopener">'+esc(srcName(e.by))+'</a>':esc(srcName(e.by)))+'</span>'};
const artieBtn=s=>(SB&&CANW&&!s.isCv&&!s.nSrc)?'<p class="artie w-only"><button type="button" class="btn sm" data-act="artie-req" data-sid="'+esc(s.sid)+'" data-latin="'+esc(s.latin)+'">'+esc(tr('Ask Artie (bot) to pre-fill this species','Be Artie (bot) att förifylla arten','Vraag Artie (bot) deze soort vooraf in te vullen'))+'</button></p>':'';
// Split one entry into the part for the species and the part for its cultivar (if any).
const entCv=e=>cvNorm(e.fields&&e.fields.cultivar);
const pickFields=(f,keep)=>{const o={};Object.keys(f||{}).forEach(k=>{if(k!=='cultivar'&&keep(k))o[k]=f[k]});return o};
function derive(){
  const by=new Map();
  state.entries.forEach(e=>{if(!e.sid)return;let s=by.get(e.sid);if(!s){s={sid:e.sid,entries:[],obs:[],src:[],plantings:[]};by.set(e.sid,s)}s.entries.push(e)});
  state.obs.forEach(o=>{const s=by.get(o.sid);if(s)(o.kind==='source'?s.src:s.obs).push(o)});
  (state.plantings||[]).forEach(p=>{const s=by.get(p.sid);if(s)s.plantings.push(p)});
  by.forEach(s=>{
    s.entries.sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.createdAt||0)-(b.createdAt||0));
    s.obs.sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.createdAt||0)-(a.createdAt||0));
    s.src.sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.createdAt||0)-(a.createdAt||0));
    // Species values: entries without a cultivar, plus the species-only fields (names, type, origin) of cultivar entries.
    const human=s.entries.filter(e=>!isSrcEnt(e)),srcE=s.entries.filter(isSrcEnt);
    const spPart=human.map(e=>entCv(e)?{date:e.date,fields:pickFields(e.fields,k=>SPECIES_ONLY.indexOf(k)>=0)}:{date:e.date,snapshot:e.snapshot,fields:pickFields(e.fields,()=>true)});
    const r=mergeEntries(spPart);s.hm=r.m;s.conf=r.conf;
    const sx=addSources(r.m,srcE,()=>true);s.m=sx.m;s.srcOf=sx.from;s.sconf=sx.diff;s.nSrc=srcE.length;
    const last=human.length?human[human.length-1]:s.entries[s.entries.length-1];
    s.latin=last.latin;s.form=s.m.type?formOf(s.m.type):(last.form||'h');
    s.created=Math.min.apply(null,s.entries.map(e=>e.createdAt||0));
    s.updated=Math.max.apply(null,s.entries.map(e=>e.updatedAt||e.createdAt||0).concat(s.obs.map(o=>o.createdAt||0)));
    s.updatedDate=[last.date||''].concat(s.obs.map(o=>o.date||'')).sort().pop();
    s.ex=s.entries.every(e=>e.ex);
    // Cultivars: from entries, and from observations, sources, plantings and comments that name one.
    const cv=new Map(),addCv=(name,e)=>{const n=cvNorm(name),k=cvKey(n);if(!k)return null;let c=cv.get(k);if(!c){c={ck:k,cv:n,ents:[]};cv.set(k,c)}if(e){c.ents.push(e);c.cv=n}return c};
    s.entries.forEach(e=>{const n=entCv(e);if(n)addCv(n,e)});
    s.obs.concat(s.src,s.plantings,(state.comments||[]).filter(c=>c.sid===s.sid)).forEach(o=>{if(o.cultivar)addCv(o.cultivar)});
    s.cvs=[...cv.values()].map(c=>{
      const own=mergeEntries(c.ents.map(e=>({date:e.date,snapshot:e.snapshot,fields:pickFields(e.fields,k=>SPECIES_ONLY.indexOf(k)<0)})));
      const mine=x=>cvKey(x.cultivar)===c.ck;
      const srcOf={};Object.keys(s.srcOf).forEach(k=>{if(isEmpty(own.m[k]))srcOf[k]=s.srcOf[k]});
      const p={sid:s.sid,ck:c.ck,cv:c.cv,ref:s.sid+'--'+c.ck,isCv:true,parent:s,latin:s.latin,form:s.form,no:s.no,ex:s.ex,
        own:own.m,conf:own.conf,srcOf,sconf:[],m:Object.assign({},s.m,own.m,{cultivar:c.cv}),entries:c.ents,
        obs:s.obs.filter(mine),src:s.src.filter(mine),plantings:s.plantings.filter(mine),created:s.created,updated:s.updated};
      p.updatedDate=c.ents.map(e=>e.date||'').concat(p.obs.map(o=>o.date||'')).sort().pop()||s.updatedDate;
      const po=p.obs.find(o=>o.photo);p.cover=own.m.photo||(po&&po.photo)||null;
      return p;
    }).sort((a,b)=>a.cv.localeCompare(b.cv,'sv'));
    const po=s.obs.find(o=>!o.cultivar&&o.photo)||s.obs.find(o=>o.photo);
    s.cover=s.m.photo||(po&&po.photo)||(s.cvs.find(c=>c.cover)||{}).cover||null;
    s.cvs.forEach(c=>{if(!c.cover)c.cover=s.cover});
    s.ref=s.sid;
  });
  species=[...by.values()].sort((a,b)=>a.created-b.created||a.sid.localeCompare(b.sid));
  // Species numbers: fixed numbers from the database (v8). Without them, the position in the list (as before 2.5.1).
  // A species saved since the last reload may not have its number yet: it shows the next one until then.
  {let next=SPNO?Math.max(0,...SPNO.values()):0;
   species.forEach((s,i)=>{const n=SPNO?(SPNO.get(s.sid)||++next):i+1;s.no=String(n).padStart(3,'0');s.cvs.forEach(c=>c.no=s.no)})}
  bySid=by;
  // After signing in again, the species named in the address comes back (not simply the first one).
  if(!selected||!bySid.has(selected)){const h=/^#s-(.+)$/.exec(location.hash||'');if(h)setSel(decodeURIComponent(h[1]));if(!selected||!bySid.has(selected)){selected=species.length?species[0].sid:null;selCv=''}}
  if(selCv&&!(bySid.get(selected).cvs||[]).some(c=>c.ck===selCv))selCv='';
}
// A reference is a species id, or "species--cultivar" for one cultivar.
function byRef(ref){const i=String(ref||'').indexOf('--');if(i<0)return bySid.get(ref)||null;const s=bySid.get(ref.slice(0,i));return s?(s.cvs.find(c=>c.ck===ref.slice(i+2))||null):null}
function setSel(ref){ref=String(ref||'');const i=ref.indexOf('--');selected=i<0?ref:ref.slice(0,i);selCv=i<0?'':ref.slice(i+2)}
const cur=()=>{const s=selected&&bySid.get(selected);if(!s)return null;return selCv&&s.cvs.find(c=>c.ck===selCv)||s};
