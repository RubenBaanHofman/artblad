(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const O=s=>s.split('|').map(x=>{const p=x.split(':');return{k:p[0],en:p[1],sv:p[2]}});
const D=(k,t,en,sv,x)=>Object.assign({k,t,en,sv},x||{});

/* ---------- option lists (key:English:Svenska) ---------- */
const REGIONS=O('eur:Europe:Europa|nas:N Asia:Norra Asien|eas:E Asia:Östasien|sas:S/SE Asia:Syd-/Sydostasien|was:W/C Asia:Väst-/Centralasien|nam:N America:Nordamerika|sam:C/S America:Central-/Sydamerika|afr:Africa:Afrika|oce:Australasia:Oceanien');
const SUCC=O('pio:Pioneer:Pionjär|mid:Mid:Mellan|cli:Climax:Klimax');
const TYPES_W=O('tree:Tree:Träd|shrub:Shrub:Buske|climber:Climber:Klätterväxt|subshrub:Subshrub:Halvbuske');
// Herbaceous type = life cycle only. Bulb/tuber, root crop and groundcover were moved: see normFields().
const TYPES_H=O('annual:Annual:Ettårig|biennial:Biennial:Tvåårig|perennial:Perennial:Flerårig');
const TYPES_ALL=TYPES_W.concat(TYPES_H);
const STATUS=O('wish:Wish:Önskelista|seed:Have seed:Har frö|planted:Planted:Planterad|thriving:Thriving:Trivs|failed:Failed:Misslyckad');
const CROWN=O('columnar:Columnar:Kolumnär|round:Round:Rund|spreading:Spreading:Utbredd|vase:Vase:Vasformad|weeping:Weeping:Hängande|multistem:Multi-stem:Flerstammig|suckering:Suckering:Rotskott|climbing:Climbing:Klättrande');
const HABIT=O('clump:Clump:Tuva|runner:Runner:Utlöpare|rosette:Rosette:Rosett|upright:Upright:Upprätt|trailing:Trailing:Krypande|bulbous:Bulb/tuber:Lök/knöl|selfseeds:Self-seeds:Sår sig|diesback:Dies back:Vissnar');
const ROOTS_W=O('tap:Tap:Pålrot|fibrous:Fibrous:Finrot|shallow:Shallow:Ytlig|suckering:Suckering:Rotskott');
const ROOTS_H=O('shallow:Shallow:Ytlig|medium:Medium:Medel|deep:Deep:Djup|tuber:Tuber:Knöl');
const LEAF=O('decid:Deciduous:Lövfällande|everg:Evergreen:Städsegrön|semi:Semi:Halv');
const DORM=O('winter:Winter:Vinter|summer:Summer:Sommar|everg:Evergreen:Städsegrön');
const LIGHT=O('sun:Sun:Sol|part:Part shade:Halvskugga|shade:Shade:Skugga');
const SOIL=O('sand:Sand:Sand|loam:Loam:Mojord|clay:Clay:Lera|humus:Humus:Mull');
const PH=O('acid:Acid:Sur|neutral:Neutral:Neutral|alk:Alkaline:Basisk');
const TOL=O('wind:Wind:Vind|frost:Frost:Frost|drought:Drought:Torka|wet:Wet feet:Blöt jord|salt:Salt:Salt|shade:Shade:Skugga');
const PROP_W=O('seed:Seed:Frö|cutting:Cutting:Stickling|graft:Graft:Ympning|layer:Layer:Avläggare|sucker:Sucker:Rotskott|division:Division:Delning');
const PROP_H=O('seed:Seed:Frö|division:Division:Delning|cutting:Cutting:Stickling|bulbs:Bulb/tuber:Lök/knöl|runner:Runner:Utlöpare|selfsows:Self-sows:Sår sig');
const POLL=O('selff:Self-fertile:Självfertil|partner:Partner needed:Behöver partner|dioec:Dioecious:Tvåbyggare');
const SOWING=O('direct:Direct:Direkt|indoors:Indoors:Inomhus|cold:Cold strat.:Kallstrat.|succ:Succession:Succession');
const EFFORT=O('low:Low:Låg|med:Medium:Medel|high:High:Hög');
const ESTAB=O('easy:Easy:Lätt|fussy:Fussy:Kinkig');
const USES_W=O('fruit:Fruit:Frukt|seed:Nut/seed:Nöt/frö|leaf:Leaf:Blad|shoot:Shoot/bud:Skott/knopp|flower:Flower:Blomma|root:Root/tuber:Rot/knöl|sap:Sap:Sav|medicinal:Medicinal:Medicinsk|fibre:Fibre:Fiber|dye:Dye:Färg|timber:Timber/fuel:Virke/ved|craft:Craft:Slöjd|fodder:Fodder:Foder|soap:Soap:Tvål|ornamental:Ornamental:Prydnad|other:Other:Annat');
const USES_H=O('fruit:Fruit:Frukt|seed:Seed/grain:Frö/spannmål|leaf:Leaf:Blad|shoot:Shoot/stem:Skott/stjälk|flower:Flower:Blomma|root:Root/tuber:Rot/knöl|bulb:Bulb:Lök|herb:Culinary herb:Kryddväxt|tea:Tea/infusion:Te|medicinal:Medicinal:Medicinsk|fibre:Fibre:Fiber|dye:Dye:Färg|craft:Craft:Slöjd|fodder:Fodder:Foder|soap:Soap:Tvål|ornamental:Ornamental:Prydnad');
const YIELD=O('low:Low:Låg|med:Medium:Medel|high:High:Hög');
const ECO_W=O('nfix:N-fixer:Kvävefixerare|accum:Dyn. accumulator:Dyn. ackumulator|nec1:Nectar early:Nektar tidigt|nec2:Nectar mid:Nektar mitt|nec3:Nectar late:Nektar sent|host:Host plant:Värdväxt|food:Bird food:Fågelföda|habitat:Habitat:Livsmiljö|mulch:Chop & drop:Hacka & släpp|erosion:Erosion control:Erosionsskydd|riparian:Wet/riparian:Våtmark/strand|deadwood:Deadwood:Död ved|redlist:Red-list support:Rödlistade');
// Structure: the physical job a plant does in a design (moved here from ecosystem functions and plant types).
const STRUCT=O('screen:Screen / hedge:Insynsskydd / häck|wind:Windbreak:Vindskydd|shade:Shade provider:Skuggivare|climb:Climbing cover:Klätterväxt för spaljé/vägg|ground:Ground cover:Marktäckare|edge:Edging:Kantväxt');
const fmtC=t=>String(Math.round(t)).replace('-','−')+' °C';
// British hardiness ratings (RHS), each with its minimum winter temperature in °C.
const RHS=[['H1a',15,null],['H1b',10,15],['H1c',5,10],['H2',1,5],['H3',-5,1],['H4',-10,-5],['H5',-15,-10],['H6',-20,-15],['H7',null,-20]].map(r=>{const t=r[1]==null?'< '+fmtC(r[2]):r[2]==null?'> '+fmtC(r[1]):String(r[1]).replace('-','−')+'…'+fmtC(r[2]);return{k:r[0],lo:r[1],hi:r[2],en:r[0]+' · '+t,sv:r[0]+' · '+t}});
const ECO_H=O('nfix:N-fixer:Kvävefixerare|accum:Dyn. accumulator:Dyn. ackumulator|nec1:Nectar early:Nektar tidigt|nec2:Nectar mid:Nektar mitt|nec3:Nectar late:Nektar sent|host:Host plant:Värdväxt|food:Bird/seed food:Fågel/fröföda|habitat:Habitat:Livsmiljö|mulch:Chop & drop:Hacka & släpp|weeds:Weed suppressor:Ogräshämmare|erosion:Erosion control:Erosionsskydd|pest:Pest confuser:Skadedjursförvirr.|riparian:Wet/riparian:Våtmark/strand|soil:Soil builder:Jordbyggare|redlist:Red-list support:Rödlistade|cover:Winter cover:Vinterskydd');
const uniqOpts=(...ls)=>{const m=new Map();ls.forEach(l=>l.forEach(o=>{if(!m.has(o.k))m.set(o.k,o)}));return[...m.values()]};
const ECO_ALL=uniqOpts(ECO_W,ECO_H), USES_ALL=uniqOpts(USES_W,USES_H);
const LAYER=O('canopy:Canopy:Krontak|sub:Sub-canopy:Undervåning|shrub:Shrub:Buskskikt|herb:Herb:Fältskikt|ground:Groundcover:Marktäckare|root:Root:Rotskikt|vert:Vertical:Vertikal');
const ROLE=O('yield:Yield:Skörd|support:Support:Stöd|pioneer:Pioneer:Pionjär|nurse:Nurse:Ammaväxt');
const INV=O('none:None:Ingen|low:Low:Låg|high:High:Hög');
const CAUT=O('thorns:Thorns:Taggar|toxic:Toxic:Giftig|allelo:Allelopathic:Allelopatisk|aggr:Aggressive:Aggressiv|partner:Needs partner:Behöver partner');
const MONTHS='JFMAMJJASOND'.split('');
const MONTH_NAMES=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ---------- field schema ---------- */
const CAL_LAB={
  cal1:{w:['Plant / graft','Plantera / ympa'],h:['Sow / plant','Så / plantera']},
  cal2:{w:['Flower','Blomning'],h:['Flower','Blomning']},
  cal3:{w:['Fruit / harvest','Frukt / skörd'],h:['Harvest','Skörd']},
  cal4:{w:['Prune','Beskärning'],h:['Cut / divide','Skär / dela']}
};
const IDENT=[
  D('en','text','English name','Engelskt namn'),
  D('sv','text','Swedish name','Svenskt namn'),
  D('nl','text','Dutch name','Nederländskt namn'),
  D('family','text','Family','Familj'),
  D('cultivar','text','Cultivar / variety','Sort'),
  D('type','single','Type','Typ',{o:TYPES_ALL}),
  D('status','single','Status','Status',{o:STATUS})
];
const SEC=[
 {id:'origin',en:'Origin & native form',sv:'Ursprung & naturlig form',f:[
  D('region','multi','Native region','Ursprungsregion',{o:REGIONS}),
  D('succession','single','Succession role','Succession',{o:SUCC}),
  D('habitat','text','Native habitat','Naturlig miljö',{cat:1}),
  D('nativeH','num','Native height','Naturlig höjd',{unit:'m'}),
  D('nativeW','num','Native width','Naturlig bredd',{unit:'m'}),
  D('range','text','Range / notes','Utbredning / anm.',{cat:1})]},
 {id:'size',en:'Size & form',sv:'Storlek & form',f:[
  D('crown','multi','Crown / habit','Kronform',{o:CROWN,only:'w'}),
  D('habit','multi','Habit','Växtsätt',{o:HABIT,only:'h'}),
  D('height','num','Height','Höjd',{unit:{w:'m',h:'cm'}}),
  D('spread','num','Spread','Bredd',{unit:{w:'m',h:'cm'}}),
  D('spacing','num','Planting spacing','Plantavstånd',{unit:'cm',only:'h'}),
  D('roots','multi','Roots','Rötter',{o:{w:ROOTS_W,h:ROOTS_H}}),
  D('leaf','single','Foliage','Lövverk',{o:LEAF,only:'w'}),
  D('dormant','single','Dormant in','Vilar',{o:DORM,only:'h'}),
  D('lifespan','num','Lifespan','Livslängd',{unit:'yr'}),
  D('firstYield','num','First yield after','Första skörd efter',{unit:'yr',only:'w'}),
  D('sowHarvest','num','Sow to harvest','Sådd till skörd',{unit:'days',only:'h'}),
  D('product','text','Main product','Huvudprodukt')]},
 {id:'site',en:'Site & tolerance',sv:'Plats & tålighet',f:[
  D('light','multi','Light','Ljus',{o:LIGHT}),
  D('moist','scale','Moisture','Fuktighet',{cap:[['dry','torr'],['wet','blöt']]}),
  D('soil','multi','Soil','Jord',{o:SOIL}),
  D('ph','multi','pH','pH',{o:PH}),
  D('tol','multi','Tolerates','Tål',{o:TOL}),
  D('usda','text','USDA zone','USDA-zon',{zone:'usda'}),
  D('szone','text','Swedish zone','Växtzon',{zone:'se'}),
  D('rhs','text','British hardiness (RHS)','Brittisk härdighet (RHS)',{zone:'rhs'})]},
 {id:'cal',en:'Calendar & care',sv:'Kalender & skötsel',f:[
  D('cal1','cal','','',{lab:CAL_LAB.cal1}),D('cal2','cal','','',{lab:CAL_LAB.cal2}),
  D('cal3','cal','','',{lab:CAL_LAB.cal3}),D('cal4','cal','','',{lab:CAL_LAB.cal4}),
  D('prop','multi','Propagation','Förökning',{o:{w:PROP_W,h:PROP_H}}),
  D('poll','multi','Pollination','Pollinering',{o:POLL,only:'w'}),
  D('sowing','multi','Sowing','Sådd',{o:SOWING,only:'h'}),
  D('effort','single','Effort','Arbetsinsats',{o:EFFORT}),
  D('estab','single','Establishes','Etablering',{o:ESTAB}),
  D('watch','text','Watch-outs (pests, disease)','Att se upp med',{cat:1})]},
 {id:'uses',en:'Uses',sv:'Användning',f:[
  D('uses','multi','Uses','Användning',{o:{w:USES_W,h:USES_H}}),
  D('yield','single','Yield','Skörd',{o:YIELD}),
  D('edibility','scale','Edibility','Ätlighet',{cap:[['barely edible','knappt ätlig'],['excellent food','utmärkt föda']],none:['Inedible','Oätlig']}),
  D('edible','text','Edible part / notes','Ätlig del / anm.',{cat:1})]},
 {id:'eco',en:'Ecosystem functions',sv:'Ekosystemfunktioner',f:[
  D('eco','multi','Functions','Funktioner',{o:{w:ECO_W,h:ECO_H}}),
  D('ecoNotes','text','Notes','Anteckningar',{cat:1})]},
 {id:'place',en:'Placement',sv:'Placering',f:[
  D('layer','multi','Layer','Skikt',{o:LAYER}),
  D('role','multi','Role','Roll',{o:ROLE}),
  D('struct','multi','Structure','Struktur',{o:STRUCT}),
  D('goodWith','text','Good with','Passar med',{cat:1}),
  D('avoid','text','Avoid near','Undvik nära',{cat:1}),
  D('plantedAt','text','Planted at (map ref)','Planterad vid',{cat:1,hide:1})]},
 {id:'verdict',en:'Verdict & cautions',sv:'Omdöme & varningar',f:[
  D('verdict','scale','Use it?','Använda?',{cap:[['skip','hoppa över'],['must-have','måste ha']]}),
  D('invasive','single','Invasive risk (Sweden)','Invasionsrisk (Sverige)',{o:INV}),
  D('caut','multi','Cautions','Varningar',{o:CAUT}),
  D('sources','text','Sources','Källor',{cat:1})]}
];
const DEF={};
IDENT.concat(...SEC.map(s=>s.f)).forEach(d=>DEF[d.k]=d);
DEF.photo=D('photo','single','Photo','Foto');
const formOf=t=>TYPES_W.some(o=>o.k===t)?'w':'h';
const FCOL={w:'var(--woody)',h:'var(--herb)'};
const optsOf=(d,f)=>Array.isArray(d.o)?d.o:(d.o?d.o[f]:[]);
const unitOf=(d,f)=>d.unit&&typeof d.unit==='object'?d.unit[f]:d.unit;
const isEmpty=v=>v==null||v===''||(Array.isArray(v)&&!v.length);
const canon=s=>{const w=String(s||'').trim().replace(/\s+/g,' ').split(' ').filter(Boolean);return w.map((x,i)=>i===0?x.charAt(0).toUpperCase()+x.slice(1).toLowerCase():x.toLowerCase()).join(' ')};
const slug=s=>canon(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
/* ---------- cultivars ----------
   An entry with fields.cultivar belongs to that cultivar. Names, family, type and origin always describe the whole species;
   every other field in a cultivar entry applies only to that cultivar. A cultivar shows its own values and inherits the rest
   from the species. Names follow the cultivated-plant code: written in single quotes, never translated. */
const SPECIES_ONLY=['en','sv','nl','family','type','region','succession','habitat','nativeH','nativeW','range'];
const cvNorm=s=>{let v=String(s||'').replace(/[‘’'"“”]/g,'').replace(/^\s*cv\.?\s+/i,'').replace(/\s+/g,' ').trim();if(v&&v===v.toLowerCase())v=v.replace(/(^|[\s-])(\S)/g,(a,b,c)=>b+c.toUpperCase());return v.slice(0,80)};
const cvKey=s=>cvNorm(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const cvQ=n=>'‘'+n+'’';
const lev=(a,b)=>{const m=[];for(let i=0;i<=a.length;i++){m[i]=[i]}for(let j=1;j<=b.length;j++)m[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return m[a.length][b.length]};

/* ---------- state ---------- */
const LAYOUTS_OK=v=>['card','form'].indexOf(v)>=0?v:'card';
const state={plantings:[],lists:[],comments:[],listId:'',withLog:store.get('ab.withlog')!=='0',entries:[],obs:[],layout:LAYOUTS_OK(store.get('ab.layout')),lang:(['en','sv','nl'].indexOf(store.get('ab.lang'))>=0?store.get('ab.lang'):'en'),side:'front',q:'',fForm:'',flt:new Set(),favOnly:false,sort:'name'};
const cfg=Object.assign({},window.ARTBLAD_CONFIG||{});
try{cfg.SUPABASE_URL=new URL(String(cfg.SUPABASE_URL||'').trim()).origin}catch(e){}
cfg.SUPABASE_ANON_KEY=String(cfg.SUPABASE_ANON_KEY||'').trim();
let species=[],bySid=new Map(),selected=null,selCv='',SB=null,SESSION=null,ASSETS=null,CANW=true,MYROLE='viewer',loaded=false,curUid=undefined,RT=null;
// Row metadata kept by the database (who added, who changed, trash). Kept apart from the documents so exports and saves are unchanged.
const META=new Map(),PROFILES=new Map();
const isAdmin=()=>MYROLE==='admin',meUid=()=>SESSION&&SESSION.user?SESSION.user.id:null;
const canEdit=id=>!SB?true:isAdmin()||(CANW&&!!meUid()&&(META.get(id)||{}).author===meUid());
const mem={entries:[],obs:[],n:0};
const errMsg=e=>{const c=e&&(e.code||e.statusCode),m=String((e&&e.message)||'');if(c==='42501'||/row-level security|not authorized|unauthorized|permission/i.test(m))return trs('You do not have permission to change this.','Du har inte behörighet att ändra detta.');if(/exceeded|too large|payload|413|quota/i.test(m))return trs('That file is too large or storage is full.','Filen är för stor eller lagringen är full.');if(/mime|not supported|invalid.*type/i.test(m))return trs('That file type is not supported.','Filtypen stöds inte.');if(c==='23505'&&/profiles/.test(m))return trs('That username is already taken. Choose another.','Användarnamnet är redan upptaget. Välj ett annat.');if(/profiles_reserved/.test(m))return trs('That username is reserved. Choose another.','Användarnamnet är reserverat. Välj ett annat.','Die gebruikersnaam is gereserveerd. Kies een andere.');if(/profiles_not_email/.test(m))return trs('Use a name, not an email address.','Använd ett namn, inte en e-postadress.');return m||trs('Something went wrong.','Något gick fel.')};
let lastLoad=0;
let tt;function toast(msg,kind){const t=$('#toast');t.textContent=msg;t.className='toast show'+(kind?' '+kind:'');clearTimeout(tt);tt=setTimeout(()=>{t.className='toast'},3800)}

/* ---------- data layer: Supabase (each document is one jsonb row; no database means in-memory demo mode) ---------- */
const randHex=n=>{const a=new Uint8Array(n);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,'0')).join('')};
const newId=()=>randHex(10);
const COLS='id,data,author,updated_by,updated_at,deleted_at,deleted_by,created_at';
async function fetchAll(t,cols){let out=[],from=0;for(;;){const r=await SB.from(t).select(cols||COLS).order('id').range(from,from+999);if(r.error)throw r.error;out=out.concat(r.data);if(r.data.length<1000)break;from+=1000}return out}
async function loadAll(){
  if(!SB)return;
  try{
    const adm=isAdmin(),soft=q=>Promise.resolve(q).then(x=>x,e=>({error:e}));
    const r=await Promise.all([fetchAll('entries'),fetchAll('obs'),SB.from('profiles').select('user_id,display_name'),CANW?fetchAll('plantings').catch(()=>[]):[],CANW?fetchAll('lists').catch(()=>[]):[],fetchAll('comments').catch(()=>[]),
      adm?soft(SB.rpc('review_state')):null,adm?soft(SB.from('autofill_requests').select('sid,latin,n,status,first_requested_at,last_requested_at,sent_at').order('first_requested_at')):null]);
    META.clear();PROFILES.clear();
    (r[2].data||[]).forEach(p=>PROFILES.set(p.user_id,p.display_name));
    const keep=(rows,kind)=>rows.map(x=>{META.set(x.id,{kind,author:x.author,updatedBy:x.updated_by,updatedAt:x.updated_at,deletedAt:x.deleted_at,deletedBy:x.deleted_by,createdAt:x.created_at});return Object.assign({id:x.id},x.data)});
    const E=keep(r[0],'entry').map(e=>e.fields?Object.assign(e,{fields:normFields(e.fields)}):e),O=keep(r[1],'obs'),live=x=>!META.get(x.id).deletedAt;
    state.entries=E.filter(live);state.obs=O.filter(live);state.trashE=E.filter(x=>!live(x));state.trashO=O.filter(x=>!live(x));
    const Pl=keep(r[3],'planting'),Li=keep(r[4],'list');state.plantings=Pl.filter(live);state.lists=Li.filter(live);state.trashP=Pl.filter(x=>!live(x));state.trashL=Li.filter(x=>!live(x));
    const Cm=keep(r[5],'comment');state.comments=Cm.filter(live);state.trashC=Cm.filter(x=>!live(x));
    revSet(adm&&r[6]&&!r[6].error?r[6].data:null);if(adm&&r[7]&&!r[7].error)afRows=r[7].data||[];
    $('#banner').hidden=true;loaded=true;lastLoad=Date.now();renderAcct();refresh();
  }catch(e){
    loaded=true;const b=$('#banner');b.hidden=false;b.textContent='Could not read the species data ('+((e&&(e.code||e.message))||'error')+'). Check your connection and reload.';refresh();
  }
}
async function loadFav(uid){const r=await SB.from('favorites').select('sids').eq('user_id',uid).maybeSingle();if(!r.error)Fav.set=new Set((r.data&&r.data.sids)||[])}
const gone=()=>({code:'42501',message:'Nothing was deleted: you may not have permission.'});
const Data={
  async saveEntry(id,doc){
    if(SB){const r=await SB.from('entries').upsert({id:id||newId(),data:doc});if(r.error)throw r.error;await loadAll()}
    else{const i=id||('local'+(++mem.n));const k=mem.entries.findIndex(x=>x.id===i);const o=Object.assign({id:i},doc);if(k<0)mem.entries.push(o);else mem.entries[k]=o;state.entries=mem.entries.slice();refresh()}
  },
  async saveMany(ents,obs){
    if(SB){
      if(ents.length){const r=await SB.from('entries').upsert(ents);if(r.error)throw r.error}
      if(obs.length){const r=await SB.from('obs').upsert(obs);if(r.error)throw r.error}
      await loadAll();
    }else{
      ents.forEach(x=>{const k=mem.entries.findIndex(e=>e.id===x.id);const o=Object.assign({id:x.id},x.data);if(k<0)mem.entries.push(o);else mem.entries[k]=o});
      obs.forEach(x=>{const k=mem.obs.findIndex(e=>e.id===x.id);const o=Object.assign({id:x.id},x.data);if(k<0)mem.obs.push(o);else mem.obs[k]=o});
      state.entries=mem.entries.slice();state.obs=mem.obs.slice();refresh();
    }
  },
  async trash(table,id,on){
    const r=await SB.from(table).update({deleted_at:on?new Date().toISOString():null}).eq('id',id).select('id');
    if(r.error)throw r.error;if(!r.data||!r.data.length)throw gone();await loadAll();
  },
  async trashMany(table,ids){for(const id of ids){const r=await SB.from(table).update({deleted_at:new Date().toISOString()}).eq('id',id).select('id');if(r.error)throw r.error}await loadAll()},
  async purge(table,id){const r=await SB.from(table).delete().eq('id',id).select('id');if(r.error)throw r.error;if(!r.data||!r.data.length)throw gone();await loadAll()},
  async rename(oldSid,newSid,newLatin){const r=await SB.rpc('rename_species',{old_sid:oldSid,new_sid:newSid,new_latin:newLatin});if(r.error)throw r.error;if(meUid())await loadFav(meUid());await loadAll()},
  async setName(name){const r=await SB.from('profiles').upsert({user_id:meUid(),display_name:name,updated_at:new Date().toISOString()});if(r.error)throw r.error;await loadAll()},
  async saveRows(table,rows){
    if(!rows.length)return;
    if(SB){const r=await SB.from(table).upsert(rows);if(r.error)throw r.error;await loadAll()}
    else{const a=(state[table]||[]).slice();rows.forEach(x=>{const i=a.findIndex(y=>y.id===x.id),o=Object.assign({id:x.id},x.data);if(i<0)a.push(o);else a[i]=o});state[table]=a;refresh()}
  },
  async saveRow(table,id,doc){
    const rid=id||newId();
    if(SB){const r=await SB.from(table).upsert({id:rid,data:doc});if(r.error)throw r.error;await loadAll()}
    else{const k=table;const a=state[k]||[];const i=a.findIndex(x=>x.id===rid);const o=Object.assign({id:rid},doc);if(i<0)a.push(o);else a[i]=o;state[k]=a.slice();refresh()}
    return rid;
  },
  async delEntry(id){
    if(SB){await this.trash('entries',id,true)}
    else{mem.entries=mem.entries.filter(x=>x.id!==id);state.entries=mem.entries.slice();refresh()}
  },
  async saveObs(doc){
    if(SB){const r=await SB.from('obs').insert({id:newId(),data:doc});if(r.error)throw r.error;await loadAll()}
    else{mem.obs.push(Object.assign({id:'local'+(++mem.n)},doc));state.obs=mem.obs.slice();refresh()}
  },
  async delObs(id){
    if(SB){await this.trash('obs',id,true)}
    else{mem.obs=mem.obs.filter(x=>x.id!==id);state.obs=mem.obs.slice();refresh()}
  }
};
/* photos live in a public Supabase Storage bucket named "photos"; the file name is the random id */
const PHOTOS={
  async upload(blob){const id=randHex(16);const r=await SB.storage.from('photos').upload(id+'.jpg',blob,{contentType:'image/jpeg'});if(r.error)throw r.error;return{id}},
  async delete(id){const r=await SB.storage.from('photos').remove([id+'.jpg']);if(r.error)throw r.error;return{deleted:true}}
};
/* ---------- favourites: per user (synced) when signed in and allowed to write, else per device ---------- */
const Fav={set:new Set(),ref:null,busy:Promise.resolve(),
  has(sid){return this.set.has(sid)},
  loadLocal(){try{const a=JSON.parse(store.get('ab.favs')||'[]');this.set=new Set(Array.isArray(a)?a:[])}catch(e){this.set=new Set()}},
  saveLocal(){store.set('ab.favs',JSON.stringify([...this.set]))},
  toggle(sid){
    this.set.has(sid)?this.set.delete(sid):this.set.add(sid);
    refresh();
    if(!this.ref){this.saveLocal();return Promise.resolve()}
    const doc={sids:[...this.set],updatedAt:Date.now()};
    this.busy=this.busy.then(()=>this.ref&&this.ref.set(doc)).catch(()=>{this.ref=null;this.saveLocal();toast(tr('Favourites saved on this device only','Favoriter sparade bara på den här enheten'),'err')});
    return this.busy;
  }
};
const STAR='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.8l6-.8z"/></svg>';
const starBtn=sid=>'<button type="button" class="star" data-fav="'+esc(sid)+'" aria-pressed="'+Fav.has(sid)+'" aria-label="'+tr('Favourite','Favorit')+'" title="'+tr('Favourite','Favorit')+'">'+STAR+'</button>';
const photoUsed=(id,exceptDoc)=>state.entries.some(e=>e.id!==exceptDoc&&e.fields&&e.fields.photo===id)||state.obs.some(o=>o.id!==exceptDoc&&o.photo===id);
function dropPhoto(id,exceptDoc){if(ASSETS&&id&&(!SB||isAdmin())&&!photoUsed(id,exceptDoc))ASSETS.delete(id).catch(()=>{})}

/* ---------- photos ---------- */
async function shrink(blob,max,q){
  let bmp;
  try{bmp=await createImageBitmap(blob,{imageOrientation:'from-image'})}
  catch(e){bmp=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=URL.createObjectURL(blob)})}
  const w0=bmp.width||bmp.naturalWidth,h0=bmp.height||bmp.naturalHeight,k=Math.min(1,max/Math.max(w0,h0));
  const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w0*k));c.height=Math.max(1,Math.round(h0*k));
  c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
  return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('Could not read that image.')),'image/jpeg',q));
}
async function uploadPhoto(file){if(!ASSETS)throw new Error('Photos can be added by people with edit access.');const b=await shrink(file,1600,.82);const r=await ASSETS.upload(b);return r.id}
const blobSrc=id=>String(cfg.SUPABASE_URL||'').replace(/\/+$/,'')+'/storage/v1/object/public/photos/'+id+'.jpg';
async function dataUrl(id){
  try{const r=await fetch(blobSrc(id));if(!r.ok)return null;const b=await shrink(await r.blob(),640,.74);
    return await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>res(null);fr.readAsDataURL(b)})}
  catch(e){return null}
}

/* ---------- merge + derive ---------- */
const NOCONF={photo:1,status:1,verdict:1};
function mergeEntries(es){
  const m={},hist={};
  es.forEach(e=>{
    // An admin "sheet edit" is a complete snapshot: everything before it is replaced, later entries add on top.
    if(e.snapshot){Object.keys(m).forEach(k=>delete m[k]);Object.keys(hist).forEach(k=>delete hist[k])}
    Object.keys(e.fields||{}).forEach(k=>{
    const d=DEF[k],v=e.fields[k];if(!d||isEmpty(v))return;
    if(d.t==='multi'||d.t==='cal'){m[k]=[...new Set((m[k]||[]).concat(v))];if(d.t==='cal')m[k].sort((a,b)=>a-b)}
    else if(d.t==='text'&&d.cat){const p=m[k]?m[k].split(' · '):[];if(p.indexOf(v)<0)p.push(v);m[k]=p.join(' · ')}
    else{(hist[k]=hist[k]||[]).push({v,date:e.date});m[k]=v}
  })});
  const conf=[];
  Object.keys(hist).forEach(k=>{if(NOCONF[k])return;const olds=hist[k].filter(h=>h.v!==m[k]);if(olds.length)conf.push({k,cur:m[k],olds})});
  return{m,conf};
}
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
  species.forEach((s,i)=>{s.no=String(i+1).padStart(3,'0');s.cvs.forEach(c=>c.no=s.no)});
  bySid=by;
  if(!selected||!bySid.has(selected)){selected=species.length?species[0].sid:null;selCv=''}
  if(selCv&&!(bySid.get(selected).cvs||[]).some(c=>c.ck===selCv))selCv='';
}
// A reference is a species id, or "species--cultivar" for one cultivar.
function byRef(ref){const i=String(ref||'').indexOf('--');if(i<0)return bySid.get(ref)||null;const s=bySid.get(ref.slice(0,i));return s?(s.cvs.find(c=>c.ck===ref.slice(i+2))||null):null}
function setSel(ref){ref=String(ref||'');const i=ref.indexOf('--');selected=i<0?ref:ref.slice(0,i);selCv=i<0?'':ref.slice(i+2)}
const cur=()=>{const s=selected&&bySid.get(selected);if(!s)return null;return selCv&&s.cvs.find(c=>c.ck===selCv)||s};

/* ---------- label helpers ---------- */
/* ---------- language ---------- */
// state.lang: 'en' | 'sv' | 'nl' | 'both' (EN+SV). It sets the interface, the data labels, the printed sheets and which name leads.
// 'nl' shows the Dutch interface: Dutch text comes from nl.js (window.ARTBLAD_NL, keyed by the English text),
// or from a third argument for sentences built from numbers or names. Anything missing falls back to English.
const NLD=window.ARTBLAD_NL||{};
const nl=en=>{let v=NLD[en];if(v!=null)return v;const t=String(en==null?'':en).trim();v=NLD[t];if(v==null&&window.__nlMiss&&t)window.__nlMiss.add(t);return v==null?en:String(en).replace(t,v)};
const tr=(en,sv,n)=>state.lang==='sv'?sv:state.lang==='en'?en:state.lang==='nl'?(n!=null?n:nl(en)):en+' · '+sv;
const trh=(en,sv,n)=>state.lang==='sv'?esc(sv):state.lang==='en'?esc(en):state.lang==='nl'?esc(n!=null?n:nl(en)):esc(en)+(sv&&sv!==en?' <em>'+esc(sv)+'</em>':'');
// One language only (English in EN+SV mode).
const trs=(en,sv,n)=>state.lang==='sv'?sv:state.lang==='nl'?(n!=null?n:nl(en)):en;
const labUI=o=>trh(o.en,o.sv);
// Main name: the common name in the chosen language if there is one, otherwise the Latin name.
const commonName=s=>state.lang==='en'?s.m.en:state.lang==='sv'?s.m.sv:state.lang==='nl'?s.m.nl:'';
const dispName=s=>(commonName(s)||s.latin)+(s.isCv?' '+cvQ(s.cv):'');
function names(s){
  const m=s.m,cn=commonName(s),others=[m.en,m.sv,m.nl].filter(x=>x&&x!==cn),cvh=s.isCv?' <span class="cvn">'+esc(cvQ(s.cv))+'</span>':'';
  if(cn)return{main:'<span class="cn">'+esc(cn)+'</span>'+cvh+vmark(s.sid),sub:'<i>'+esc(s.latin)+'</i>'+(others.length?' · '+others.map(esc).join(' · '):'')};
  return{main:esc(s.latin)+cvh+vmark(s.sid),sub:others.map(esc).join(' · ')};
}
const LOC=()=>state.lang==='sv'?'sv':state.lang==='nl'?'nl':'en';
const byName=(a,b)=>dispName(a).localeCompare(dispName(b),LOC());
function applyLang(){
  document.documentElement.lang=LOC();
  $$('[data-t]').forEach(el=>{const p=el.dataset.t.split('|');el.textContent=tr(p[0],p[1],p[2])});
  $$('[data-th]').forEach(el=>{const p=el.dataset.th.split('|');el.innerHTML=trh(p[0],p[1],p[2])});
  $$('[data-tp]').forEach(el=>{const p=el.dataset.tp.split('|');el.placeholder=tr(p[0],p[1],p[2])});
  $$('[data-tab]').forEach(el=>{const p=el.dataset.tab.split('|');el.querySelector('span').textContent=trs(p[0],p[1]);const sm=el.querySelector('small');sm.textContent=p[1];sm.hidden=state.lang!=='both'});
  $$('[data-ta]').forEach(el=>{const p=el.dataset.ta.split('|');el.title=tr(p[0],p[1]);el.setAttribute('aria-label',tr(p[0],p[1]))});
  $$('#langSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===state.lang));
  const ml=$('#mLang');if(ml)ml.textContent=state.lang.toUpperCase();
}
function setLang(l){
  state.lang=l;store.set('ab.lang',l);applyLang();mmenu(false);
  formBuilt=false;if(!$('#v-add').hidden)buildForm();
  buildFilters();refresh();renderAcct();
}
const dots=(n,max)=>{max=max||5;let h='';for(let i=1;i<=max;i++)h+='<i'+(i<=n?' class="on"':'')+'></i>';return '<span class="dots" aria-label="'+(n||0)+' of '+max+'">'+h+'</span>'};

/* ---------- printable A5 sheet ---------- */
const SHEET_CSS=`
.sheet{--col:#2f5d3a;box-sizing:border-box;width:210mm;height:148mm;padding:4mm 5mm 3.5mm;background:#fff;color:#1a1a1a;font:5.6pt/1.15 Helvetica,Arial,sans-serif;display:grid;grid-template-rows:5.4mm 15mm 40mm 21mm 1fr 9.5mm;gap:1.1mm;overflow:hidden;position:relative;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.sheet *{box-sizing:border-box}.sheet.herb{--col:#a85a0c}
.sheet .band{background:var(--col);color:#fff;display:flex;justify-content:space-between;align-items:center;padding:0 2mm;font-weight:700;font-size:7pt;border-radius:.6mm}
.sheet .band small{font-weight:400;font-size:5.4pt}
.sheet .idb{display:grid;grid-template-columns:1fr 25mm;gap:2mm;min-height:0}
.sheet .idl{display:flex;flex-direction:column;justify-content:space-between;min-width:0}
.sheet .row{display:flex;gap:2mm;align-items:baseline}
.sheet .fl{display:flex;gap:1mm;align-items:baseline;min-width:0;flex:var(--w,1)}
.sheet .fl u{text-decoration:none;color:#6b6b6b;font-size:4.8pt;white-space:nowrap}
.sheet u s,.sheet h4 s{text-decoration:none;margin-left:.8mm;opacity:.75;font-weight:400}
.sheet .fl b{flex:1;min-width:0;border-bottom:.25pt solid #b5b5b5;min-height:3.1mm;font-weight:600;font-size:6.2pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sheet .fl.latin b{font-style:italic;font-size:7.6pt}
.sheet .pic{border:.4pt solid var(--col);border-radius:.8mm;overflow:hidden;background:#f2f2f2;display:flex;align-items:center;justify-content:center;color:#9a9a9a;font-size:4.6pt;text-align:center}
.sheet .pic img{width:100%;height:100%;object-fit:cover;display:block}
.sheet .bx{border:.5pt solid var(--col);border-radius:1.2mm;padding:.9mm 1.6mm;overflow:hidden;display:flex;flex-direction:column;gap:.7mm;min-width:0}
.sheet .bx h4{margin:0;font-size:5.6pt;color:var(--col);font-weight:700;white-space:nowrap}
.sheet .bx h4 s{color:#6b6b6b}
.sheet .tri{display:grid;grid-template-columns:60fr 76fr 62fr;gap:1.4mm;min-height:0}
.sheet .cg{display:grid;grid-template-columns:repeat(var(--n,2),minmax(0,1fr));gap:.5mm 1.2mm;flex:1;min-width:0}
.sheet .c{display:flex;align-items:center;gap:.9mm;min-width:0;white-space:nowrap}
.sheet .c i{flex:none;width:2.4mm;height:2.4mm;border:.4pt solid #1a1a1a;border-radius:50%}
.sheet .c.on i{background:var(--col);border-color:var(--col);box-shadow:inset 0 0 0 .5mm #fff}
.sheet .c .t{overflow:hidden;text-overflow:ellipsis;min-width:0}
.sheet .c.on .t{font-weight:700}
.sheet .t s{text-decoration:none;color:#7a7a7a;font-weight:400;margin-left:.7mm;font-size:5pt}
.sheet .lr{display:flex;gap:1mm;align-items:flex-start;min-width:0}
.sheet .lr>u{text-decoration:none;color:#6b6b6b;font-size:4.8pt;flex:none;min-width:8mm;padding-top:.3mm}
.sheet .two{display:flex;gap:2mm}.sheet .two>*{flex:1;min-width:0}
.sheet .calbx{display:grid;grid-template-columns:100fr 98fr;gap:2mm}
.sheet .mt{display:grid;grid-template-columns:20mm repeat(12,1fr);gap:.4mm;align-items:center}
.sheet .mt u{text-decoration:none;font-size:5pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sheet .mh{text-align:center;font-weight:700;color:var(--col);font-size:5pt}
.sheet .mo{height:3.3mm;border:.3pt solid #b5b5b5}.sheet .mo.on{background:var(--col);border-color:var(--col)}
.sheet .ft{display:flex;flex-direction:column;justify-content:space-between}
.sheet .ft .r{display:flex;gap:3mm;align-items:center;min-width:0}
.sheet .dd{display:flex;gap:.9mm}.sheet .dd i{width:2.4mm;height:2.4mm;border:.4pt solid #1a1a1a;border-radius:50%}.sheet .dd i.on{background:var(--col);border-color:var(--col);box-shadow:inset 0 0 0 .5mm #fff}
.sheet .lgh,.sheet .lgr{display:grid;grid-template-columns:19mm 34mm 1fr 18mm;gap:0 1.5mm;align-items:center}
.sheet .lgh{font-weight:700;color:var(--col);border-bottom:.5pt solid var(--col);padding-bottom:.6mm}
.sheet .lgr{border-bottom:.25pt solid #c4c4c4;height:8.2mm;font-size:6.2pt;overflow:hidden}
.sheet .lgr .tx{overflow:hidden;max-height:7.6mm;line-height:1.2}
.sheet .lgr img{width:17mm;height:7mm;object-fit:cover;display:block}
.sheet.back{grid-template-rows:5.4mm 5mm 1fr}
.sheet .lg{display:flex;flex-direction:column;min-height:0;overflow:hidden}
.acs{--col:#1f3a2c;--soft:#eef1ec;box-sizing:border-box;width:210mm;height:148mm;padding:5mm 6mm 4mm;background:#fff;color:#1a1a1a;font:7pt/1.3 Helvetica,Arial,sans-serif;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto auto auto 1fr auto;gap:2.4mm;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.acs *{box-sizing:border-box}.acs.herb{--col:#7a4508;--soft:#f5efe6}
.acs .band2{display:flex;justify-content:space-between;align-items:center;border-bottom:.7pt solid var(--col);padding-bottom:1mm;font-size:6.2pt;font-weight:700;color:var(--col);letter-spacing:.08em}
.acs .hd{display:grid;grid-template-columns:24mm minmax(0,1fr) 21mm;gap:4mm;align-items:center}
.acs .pic{width:24mm;height:24mm;border-radius:2mm;background:var(--soft);overflow:hidden;display:flex;align-items:center;justify-content:center;color:var(--col)}
.acs .pic img{width:100%;height:100%;object-fit:cover;display:block}.acs .pic svg{width:62%;height:62%}
.acs .nm1{font:700 17pt/1.05 Helvetica,Arial,sans-serif;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.acs .nm2{font-size:8pt;margin-top:.8mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.acs .nm2 i{font-size:9pt}
.acs .tags{display:flex;flex-wrap:wrap;gap:1.2mm;margin-top:1.6mm;align-items:center}
.acs .tag{border:.4pt solid var(--col);color:var(--col);border-radius:3mm;padding:.2mm 1.8mm;font-size:6.6pt;font-weight:700}
.acs .tag.soft{border-color:#c9cfc6;color:#333;font-weight:400}
.acs .dots{letter-spacing:.3mm;color:var(--col);font-size:8pt}
.acs .qrw{text-align:center;font-size:5pt;line-height:1.2;color:#666}.acs .qr{width:19mm;height:19mm;display:block;margin:0 auto .7mm}
.acs .kf{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:1.6mm}
.acs .k{background:var(--soft);border-radius:1.4mm;padding:1.3mm 1.8mm;min-width:0}
.acs .k u{display:block;text-decoration:none;font-size:5.4pt;color:#59625b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5mm}
.acs .k b{font-size:7.6pt;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.acs .k svg{width:3.4mm;height:3.4mm;vertical-align:-.8mm;margin-right:.3mm}
.acs .cal{display:grid;grid-template-columns:26mm repeat(12,minmax(0,1fr));gap:.6mm;align-items:center}
.acs .cal .mh{font-size:5.6pt;text-align:center;color:#59625b;font-weight:700}
.acs .cal u{text-decoration:none;font-size:6.4pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.acs .cal .mo{height:3.2mm;border-radius:.6mm;background:#ecefe9}.acs .cal .mo.on{background:var(--col)}
.acs .cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4mm;min-height:0;overflow:hidden}
.acs .cols>div{min-width:0;overflow:hidden}
.acs h5{margin:0 0 1.2mm;font-size:6.2pt;color:var(--col);text-transform:uppercase;letter-spacing:.07em}
.acs .chs{display:flex;flex-wrap:wrap;gap:.8mm}.acs .ch{background:var(--soft);border-radius:2mm;padding:.3mm 1.6mm;font-size:6.6pt}
.acs p{margin:1mm 0 0}.acs .lb{color:#59625b}
.acs .ft{display:flex;justify-content:space-between;gap:4mm;font-size:5.8pt;color:#59625b;border-top:.4pt solid #d4d8d2;padding-top:1.2mm}
.acs .ft span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.acs .none{color:#9a9f9b}
.sl{grid-template-rows:auto auto 1fr auto}
.sl .lst{column-count:3;column-gap:5mm;column-fill:auto;min-height:0;overflow:hidden;font-size:6.6pt}
.sl .lst h5{break-after:avoid;margin-top:1.4mm}.sl .lst h5:first-child{margin-top:0}
.sl .lst div{break-inside:avoid;margin:0 0 .7mm}.sl .lst div u{text-decoration:none;color:#59625b}
`;
/* ---------- QR code and links to a species ---------- */
const siteUrl=()=>String(cfg.SITE_URL||(location.origin+location.pathname)).replace(/#.*$/,'');
const speciesUrl=s=>siteUrl()+'#s-'+(s.ref||s.sid);
function qrSvg(text){
  if(typeof qrcode!=='function')return '';
  const q=qrcode(0,'M');q.addData(text);q.make();const n=q.getModuleCount();let d='';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+='M'+c+' '+r+'h1v1h-1z';
  return '<svg class="qr" viewBox="-2 -2 '+(n+4)+' '+(n+4)+'" shape-rendering="crispEdges" aria-hidden="true"><rect x="-2" y="-2" width="'+(n+4)+'" height="'+(n+4)+'" fill="#fff"/><path d="'+d+'" fill="#000"/></svg>';
}
/* ---------- value text in the chosen language ---------- */
const MON_SV=['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
const MON_NL=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
function vtl(d,v,form,lang){
  const pick=o=>lang==='sv'?o.sv:lang==='en'?o.en:lang==='nl'?nl(o.en):o.en+' / '+o.sv;
  if(Array.isArray(v)){
    if(d.t==='cal')return v.slice().sort((a,b)=>a-b).map(n=>lang==='sv'?MON_SV[n-1]:lang==='nl'?MON_NL[n-1]:MONTH_NAMES[n-1]).join(', ');
    const o=optsOf(d,form);return v.map(k=>{const x=o.find(z=>z.k===k);return x?pick(x):k}).join(', ');
  }
  if(d.t==='single'){const x=optsOf(d,form).find(z=>z.k===v);return x?pick(x):String(v)}
  if(d.t==='scale')return d.none&&Number(v)===0?(lang==='sv'?d.none[1]:lang==='nl'?nl(d.none[0]):d.none[0]):v+'/5';
  if(d.t==='num'){const u=unitOf(d,form);return v+(u?' '+u:'')}
  return String(v);
}
const SIC={
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>',
  part:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="7"/><path d="M12 5a7 7 0 0 1 0 14z" fill="currentColor"/></svg>',
  shade:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5" fill="currentColor"/></svg>',
  drop:'<svg viewBox="0 0 24 24"><path d="M12 3c3 4.5 6 7.8 6 11a6 6 0 0 1-12 0c0-3.2 3-6.5 6-11z" fill="currentColor"/></svg>',
  dropo:'<svg viewBox="0 0 24 24"><path d="M12 3c3 4.5 6 7.8 6 11a6 6 0 0 1-12 0c0-3.2 3-6.5 6-11z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>'
};
function sheetHead(s,lang,src,band){
  const m=s.m,w=s.form==='w',L=(en,sv)=>esc(lang==='sv'?sv:lang==='en'?en:lang==='nl'?nl(en):en+' · '+sv);
  const typeO=TYPES_ALL.find(o=>o.k===m.type),statO=STATUS.find(o=>o.k===m.status),invO=INV.find(o=>o.k===m.invasive);
  const cn=lang==='sv'?m.sv:lang==='en'?m.en:lang==='nl'?m.nl:'';const main=cn||s.latin;
  const others=[m.en,m.sv,m.nl].filter(x=>x&&x!==main);
  const pic=s.cover&&src(s.cover)?'<img src="'+src(s.cover)+'" alt="">':phIcon(s);
  const v=m.verdict?'<span class="dots">'+'●'.repeat(m.verdict)+'<span style="opacity:.25">'+'●'.repeat(5-m.verdict)+'</span></span>':'';
  return '<div class="band2"><span>'+(typeO?L(typeO.en,typeO.sv).toUpperCase():(w?L('Woody plant','Vedartad växt'):L('Herbaceous plant','Örtartad växt')).toUpperCase())+'</span><span>SKOGSTRÄDGÅRDENS ARTBLAD · '+esc(s.no)+'</span></div>'+
    '<div class="hd"><div class="pic">'+pic+'</div><div style="min-width:0"><div class="nm1"'+(cn?'':' style="font-style:italic"')+'>'+esc(main)+(m.cultivar?' ‘'+esc(m.cultivar)+'’':'')+'</div>'+
    '<div class="nm2">'+(cn?'<i>'+esc(s.latin)+'</i>'+(others.length?' · ':''):'')+others.map(esc).join(' · ')+(m.family?' · '+esc(m.family):'')+'</div>'+
    '<div class="tags">'+(statO?'<span class="tag soft">'+L(statO.en,statO.sv)+'</span>':'')+(v?'<span class="tag soft">'+L('Use it?','Använda?')+' '+v+'</span>':'')+(invO&&invO.k!=='none'?'<span class="tag">'+L('Invasive risk','Invasionsrisk')+': '+L(invO.en,invO.sv)+'</span>':'')+'</div></div>'+
    '<div class="qrw">'+qrSvg(speciesUrl(s))+L('Scan for the latest version','Skanna för senaste versionen')+'</div></div>';
}
function sheetCard(s,lang,src){
  const m=s.m,w=s.form==='w',L=(en,sv)=>esc(lang==='sv'?sv:lang==='en'?en:lang==='nl'?nl(en):en+' · '+sv);
  const has=k=>!isEmpty(m[k]),V=k=>esc(vtl(DEF[k],m[k],s.form,lang)),none='<span class="none">–</span>';
  const pick=o=>esc(lang==='sv'?o.sv:lang==='nl'?nl(o.en):o.en);
  const chips=(k)=>has(k)?'<div class="chs">'+optsOf(DEF[k],s.form).filter(o=>[].concat(m[k]).indexOf(o.k)>=0).map(o=>'<span class="ch">'+pick(o)+'</span>').join('')+'</div>':'';
  const K=(en,sv,val)=>'<div class="k"><u>'+L(en,sv)+'</u><b>'+(val||none)+'</b></div>';
  const size=has('height')?esc(m.height+(has('spread')?' × '+m.spread:'')+' '+(unitOf(DEF.height,s.form)||'')):'';
  const light=has('light')?LIGHT.filter(o=>m.light.indexOf(o.k)>=0).map(o=>SIC[o.k]+pick(o)).join(' '):'';
  const moist=has('moist')?[1,2,3,4,5].map(n=>n<=m.moist?SIC.drop:SIC.dropo).join('')+' '+(m.moist<=2?L('dry','torr'):m.moist>=4?L('moist','fuktig'):L('medium','medel')):'';
  const zone=[has('usda')?'USDA '+esc(m.usda):'',has('szone')?'SE '+esc(m.szone):'',has('rhs')?'RHS '+esc(m.rhs):''].filter(Boolean).join(' · ');
  const calRows=['cal1','cal2','cal3','cal4'].filter(has);
  const cal=calRows.length?'<div class="cal"><span></span>'+MONTHS.map(x=>'<span class="mh">'+x+'</span>').join('')+calRows.map(k=>'<u>'+L(CAL_LAB[k][s.form][0],CAL_LAB[k][s.form][1])+'</u>'+MONTHS.map((_,i)=>'<span class="mo'+(m[k].indexOf(i+1)>=0?' on':'')+'"></span>').join('')).join('')+'</div>'
    :'<div class="none">'+L('No calendar months recorded yet.','Inga kalendermånader registrerade ännu.')+'</div>';
  const P=(en,sv,txt)=>txt?'<p><span class="lb">'+L(en,sv)+':</span> '+txt+'</p>':'';
  const c1='<div><h5>'+L('Uses','Användning')+'</h5>'+(chips('uses')||none)+P('Edibility','Ätlighet',has('edibility')?V('edibility'):'')+P('Yield','Skörd',has('yield')?V('yield'):'')+P('Edible','Ätligt',has('edible')?esc(m.edible):'')+P('Main product','Produkt',has('product')?esc(m.product):'')+'</div>';
  const c2='<div><h5>'+L('Ecosystem','Ekosystem')+'</h5>'+(chips('eco')||none)+P('Notes','Anteckningar',has('ecoNotes')?esc(m.ecoNotes):'')+(has('role')?'<h5 style="margin-top:2mm">'+L('Role','Roll')+'</h5>'+chips('role'):'')+(has('struct')?'<h5 style="margin-top:2mm">'+L('Structure','Struktur')+'</h5>'+chips('struct'):'')+'</div>';
  const care=[P('Propagate','Förökning',has('prop')?V('prop'):''),w?P('Pollination','Pollinering',has('poll')?V('poll'):''):P('Sowing','Sådd',has('sowing')?V('sowing'):''),
    P('Effort','Insats',has('effort')?V('effort'):''),P('Establish','Etablering',has('estab')?V('estab'):''),P('Good with','Passar med',has('goodWith')?esc(m.goodWith):''),P('Avoid near','Undvik nära',has('avoid')?esc(m.avoid):''),
    P('Watch out','Se upp',has('watch')?esc(m.watch):''),P('Planted','Planterad',s.plantings&&s.plantings.length?esc(plSummary(s.plantings).replace(/^[^:]*: /,'')+' · '+[...new Set(s.plantings.map(p=>p.place).filter(Boolean))].slice(0,3).join(', ')):''),P('Get it from','Finns hos',s.src.length?s.src.slice(0,3).map(o=>esc(o.supplier||'')).join(', '):''),P('Cautions','Varningar',has('caut')?V('caut'):'')].join('');
  const c3='<div><h5>'+L('Growing','Odling')+'</h5>'+(care||none)+'</div>';
  const origin=[has('region')?V('region'):'',has('habitat')?esc(m.habitat):''].filter(Boolean).join(' · ');
  return '<section class="acs'+(w?'':' herb')+'">'+sheetHead(s,lang,src)+
    '<div class="kf">'+K('Size','Storlek',size)+K('Light','Ljus',light)+K('Moisture','Fukt',moist)+K('Soil','Jord',has('soil')?V('soil'):'')+K('Hardiness','Härdighet',zone)+K('Layer','Skikt',has('layer')?V('layer'):'')+'</div>'+
    cal+'<div class="cols">'+c1+c2+c3+'</div>'+
    '<div class="ft"><span>'+(origin?L('Origin','Ursprung')+': '+origin:'')+'</span><span>'+(has('sources')?L('Sources','Källor')+': '+esc(m.sources):'')+'</span><span>'+L('Updated','Uppdaterad')+' '+esc(s.updatedDate||'')+'</span></div></section>';
}
function sheetList(s,lang,src){
  const m=s.m,w=s.form==='w',L=(en,sv)=>esc(lang==='sv'?sv:lang==='en'?en:lang==='nl'?nl(en):en+' · '+sv);
  const skip=['en','sv','nl','cultivar','status','photo','type','verdict','invasive','family'];
  const secs=SEC.map(sec=>{const rows=sec.f.filter(d=>(!d.only||d.only===s.form)&&skip.indexOf(d.k)<0&&!isEmpty(m[d.k])).map(d=>{
      const lab=d.t==='cal'?CAL_LAB[d.k][s.form]:[d.en,d.sv||d.en];
      return '<div><u>'+L(lab[0],lab[1])+':</u> '+esc(vtl(d,m[d.k],s.form,lang))+'</div>'}).join('');
    return rows?'<h5>'+L(sec.en,sec.sv)+'</h5>'+rows:''}).join('');
  return '<section class="acs sl'+(w?'':' herb')+'">'+sheetHead(s,lang,src)+'<div class="lst">'+(secs||'<span class="none">'+L('Nothing recorded yet.','Inget registrerat ännu.')+'</span>')+'</div>'+
    '<div class="ft"><span>'+L('Only filled-in facts are shown.','Endast ifyllda uppgifter visas.')+'</span><span>'+L('Updated','Uppdaterad')+' '+esc(s.updatedDate||'')+'</span></div></section>';
}
// Layouts: Card (only what is filled in) and Form (every option, for filling in by hand). sheetList is kept but not offered.
function sheetFor(s,lang,src){return state.layout==='form'?sheetFront(s,lang,src):sheetCard(s,lang,src)}
const wantBack=s=>state.withLog&&(state.layout==='form'||s.obs.length>0);

function sheetFront(s,lang,src){
  const m=s.m,w=s.form==='w',L=(en,sv)=>lang==='en'?esc(en):lang==='sv'?esc(sv):lang==='nl'?esc(nl(en)):esc(en)+'<s>'+esc(sv)+'</s>';
  const sel=(k,o)=>{const v=m[k];return Array.isArray(v)?v.indexOf(o.k)>=0:v===o.k};
  const C=(o,on)=>'<span class="c'+(on?' on':'')+'"><i></i><span class="t">'+L(o.en,o.sv)+'</span></span>';
  const G=(k,opts,n)=>'<div class="cg" style="--n:'+n+'">'+opts.map(o=>C(o,sel(k,o))).join('')+'</div>';
  const F=(en,sv,val,unit,wt,cls)=>'<div class="fl'+(cls?' '+cls:'')+'" style="--w:'+(wt||1)+'"><u>'+L(en,sv)+'</u><b>'+esc(val==null?'':val)+'</b>'+(unit?'<u>'+unit+'</u>':'')+'</div>';
  const LR=(en,sv,inner)=>'<div class="lr"><u>'+L(en,sv)+'</u>'+inner+'</div>';
  const H=(en,sv)=>'<h4>'+esc((lang==='nl'?nl(en):en).toUpperCase())+(lang==='en'||lang==='nl'?'':'<s>'+esc(sv)+'</s>')+'</h4>';
  const U=k=>unitOf(DEF[k],s.form);
  const types=w?TYPES_W:TYPES_H, ent=s.entries.length;
  const pic=s.cover&&src(s.cover)?'<img src="'+src(s.cover)+'" alt="">':'Photo<br>Foto';
  const dd=(n,max)=>{let h='';for(let i=1;i<=max;i++)h+='<i'+(i<=n?' class="on"':'')+'></i>';return '<span class="dd">'+h+'</span>'};
  const mo=k=>'<u>'+L(CAL_LAB[k][s.form][0],CAL_LAB[k][s.form][1])+'</u>'+MONTHS.map((_,i)=>'<span class="mo'+((m[k]||[]).indexOf(i+1)>=0?' on':'')+'"></span>').join('');
  const ocr=SEC[1].f;
  const b1='<div class="bx">'+H('1 Origin & native form','Ursprung')+
    LR('Region','Region',G('region',REGIONS,3))+LR('Succession','Succession',G('succession',SUCC,3))+
    F('Native habitat','Miljö',m.habitat)+'<div class="two">'+F('Native H','Höjd',m.nativeH,'m')+F('Native W','Bredd',m.nativeW,'m')+'</div>'+F('Range / notes','Utbredning',m.range)+'</div>';
  const b2='<div class="bx">'+H('2 Size & form','Storlek & form')+
    G(w?'crown':'habit',w?CROWN:HABIT,w?3:4)+
    '<div class="two">'+F('Height','Höjd',m.height,U('height'))+F('Spread','Bredd',m.spread,U('spread'))+(w?'':F('Spacing','Avstånd',m.spacing,'cm'))+'</div>'+
    LR('Roots','Rötter',G('roots',w?ROOTS_W:ROOTS_H,4))+
    (w?LR('Foliage','Lövverk',G('leaf',LEAF,3)):LR('Dormant','Vilar',G('dormant',DORM,3)))+
    '<div class="two">'+F('Lifespan','Livslängd',m.lifespan,'yr')+(w?F('First yield','Första skörd',m.firstYield,'yr'):F('Sow→harvest','Sådd→skörd',m.sowHarvest,'d'))+'</div>'+F('Main product','Produkt',m.product)+'</div>';
  const moist='<div class="cg" style="--n:5">'+[1,2,3,4,5].map(n=>'<span class="c'+(m.moist===n?' on':'')+'"><i></i><span class="t">'+(n===1?L('dry','torr'):n===5?L('wet','blöt'):n)+'</span></span>').join('')+'</div>';
  const b3='<div class="bx">'+H('3 Site & tolerance','Plats')+
    LR('Light','Ljus',G('light',LIGHT,3))+LR('Moisture','Fukt',moist)+LR('Soil','Jord',G('soil',SOIL,4))+LR('pH','pH',G('ph',PH,3))+LR('Tolerates','Tål',G('tol',TOL,3))+
    '<div class="two">'+F('USDA','USDA',m.usda)+F('SE zone','Zon',m.szone)+F('RHS','RHS',m.rhs)+'</div></div>';
  const calL='<div class="mt"><span></span>'+MONTHS.map(x=>'<span class="mh">'+x+'</span>').join('')+['cal1','cal2','cal3','cal4'].map(mo).join('')+'</div>';
  const calR='<div style="display:flex;flex-direction:column;gap:.7mm;min-width:0">'+LR('Propagate','Förökning',G('prop',w?PROP_W:PROP_H,3))+
    (w?LR('Pollination','Pollinering',G('poll',POLL,3)):LR('Sowing','Sådd',G('sowing',SOWING,4)))+
    '<div class="two">'+LR('Effort','Insats',G('effort',EFFORT,3))+LR('Establish','Etablering',G('estab',ESTAB,2))+'</div>'+F('Watch-outs','Att se upp med',m.watch)+'</div>';
  const b4='<div class="bx">'+H('4 Calendar & propagation','Kalender & förökning')+'<div class="calbx">'+calL+calR+'</div></div>';
  const b5='<div class="bx">'+H('5 Uses','Användning')+G('uses',w?USES_W:USES_H,3)+LR('Edibility','Ätlighet','<span class="c'+(m.edibility===0?' on':'')+'"><i></i><span class="t">'+L('No','Nej')+'</span></span>'+dd(m.edibility||0,5))+LR('Yield','Skörd',G('yield',YIELD,3))+F('Edible part / notes','Ätlig del',m.edible)+'</div>';
  const b6='<div class="bx">'+H('6 Ecosystem functions','Ekosystemfunktioner')+G('eco',w?ECO_W:ECO_H,2)+F('Notes','Anteckningar',m.ecoNotes)+'</div>';
  const b7='<div class="bx">'+H('7 Placement','Placering')+LR('Layer','Skikt',G('layer',LAYER,2))+LR('Role','Roll',G('role',ROLE,2))+LR('Structure','Struktur',G('struct',STRUCT,2))+F('Good with','Passar med',m.goodWith)+F('Avoid near','Undvik nära',m.avoid)+F('Planted at','Planterad vid',m.plantedAt)+'</div>';
  const ft='<div class="bx ft"><div class="r"><span class="lr"><u>'+L('Use it?','Använda?')+'</u>'+dd(m.verdict||0,5)+'</span>'+
    '<span class="lr" style="flex:1"><u>'+L('Invasive risk (SE)','Invasionsrisk')+'</u>'+G('invasive',INV,3)+'</span><div style="flex:1">'+F('Updated','Uppdaterad',s.updatedDate)+'</div></div>'+
    '<div class="r"><span class="lr" style="flex:1.4"><u>'+L('Cautions','Varningar')+'</u>'+G('caut',CAUT,5)+'</span><div style="flex:1">'+F('Sources','Källor',m.sources)+'</div></div></div>';
  return '<section class="sheet'+(w?'':' herb')+'"><div class="band"><span>'+(lang==='en'?(w?'WOODY PLANT':'HERBACEOUS PLANT'):lang==='nl'?(w?'HOUTIGE PLANT':'KRUIDACHTIGE PLANT'):lang==='sv'?(w?'VEDARTAD VÄXT':'ÖRTARTAD VÄXT'):(w?'WOODY PLANT · VEDARTAD VÄXT':'HERBACEOUS PLANT · ÖRTARTAD VÄXT'))+'</span><small>SKOGSTRÄDGÅRDENS ARTBLAD</small></div>'+
    '<div class="idb"><div class="idl"><div class="row">'+F('Common name','Namn',m.en,'',1.1)+F('Latin name','Latinskt namn',s.latin+(m.cultivar?" ‘"+m.cultivar+"’":''),'',1.4,'latin')+F('Swedish name','Svenskt namn',m.sv,'',1)+'</div>'+
    '<div class="row">'+F('Family','Familj',m.family,'',1.4)+F('Dutch name','Nederländskt namn',m.nl,'',1.6)+F('No.','Nr',s.no,'',.6)+'</div>'+
    '<div class="row"><span class="lr" style="flex:1.6"><u>'+L('Type','Typ')+'</u>'+G('type',types,types.length)+'</span><span class="lr" style="flex:1"><u>'+L('Status','Status')+'</u>'+G('status',STATUS,5)+'</span></div></div>'+
    '<div class="pic">'+pic+'</div></div>'+
    '<div class="tri">'+b1+b2+b3+'</div>'+b4+'<div class="tri">'+b5+b6+b7+'</div>'+ft+'</section>';
}
function sheetBacks(s,lang,src){
  const L=(en,sv)=>lang==='en'?esc(en):lang==='sv'?esc(sv):lang==='nl'?esc(nl(en)):esc(en)+'<s>'+esc(sv)+'</s>';
  const rows=s.obs.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.createdAt||0)-(b.createdAt||0));
  const per=14,pages=[];
  for(let i=0;i<Math.max(1,rows.length);i+=per)pages.push(rows.slice(i,i+per));
  return pages.map(ch=>{
    let h='';
    ch.forEach(o=>{const u=o.photo&&src(o.photo);h+='<div class="lgr"><span>'+esc(o.date||'')+'</span><span>'+esc([o.plot,!s.isCv&&o.cultivar?cvQ(o.cultivar):''].filter(Boolean).join(' · '))+'</span><span class="tx">'+esc(o.text||'')+'</span><span>'+(u?'<img src="'+u+'" alt="">':'')+'</span></div>'});
    for(let i=ch.length;i<per;i++)h+='<div class="lgr"><span></span><span></span><span></span><span></span></div>';
    return '<section class="sheet back'+(s.form==='w'?'':' herb')+'"><div class="band"><span>'+L('OBSERVATIONS LOG','OBSERVATIONSLOGG')+'</span><small><i>'+esc(s.latin)+'</i>'+(s.isCv?' '+esc(cvQ(s.cv)):'')+' · '+esc(s.no)+'</small></div>'+
      '<div class="lgh"><span>'+L('Date','Datum')+'</span><span>'+L('Plot','Plats')+'</span><span>'+L('Observation','Observation')+'</span><span>'+L('Photo','Foto')+'</span></div><div class="lg">'+h+'</div></section>';
  }).join('');
}
function docShell(title,body){
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>@page{size:210mm 148mm;margin:0}html,body{margin:0;background:#8d948c}body{display:flex;flex-direction:column;align-items:center;gap:6mm;padding:6mm 0}'+SHEET_CSS+'@media print{html,body{background:#fff;display:block;padding:0}.sheet{break-after:page;page-break-after:always}}</style></head><body>'+body+'</body></html>';
}

/* ---------- species card ---------- */
function cardHTML(s){
  const m=s.m,w=s.form==='w',lang=state.lang;
  const L=(en,sv)=>lang==='en'?esc(en):lang==='sv'?esc(sv):lang==='nl'?esc(nl(en)):esc(en)+' <em>'+esc(sv)+'</em>';
  const arr=k=>Array.isArray(m[k])?m[k]:(m[k]?[m[k]]:[]);
  const inh=k=>!!s.isCv&&[].concat(k).every(x=>isEmpty(s.own[x]));
  const sTag=k=>{const bs=[...new Set([].concat(k||[]).flatMap(x=>(s.srcOf||{})[x]||[]))];return bs.length?' <span class="srct" title="'+esc(tr('Filled in by Artie (bot) from ','Ifyllt av Artie (bot) från ','Ingevuld door Artie (bot) uit ')+bs.map(srcName).join(', '))+'">'+esc(bs.map(srcShort).join(', '))+'</span>':''};
  const P=(opts,k)=>{const a=arr(k),h=opts.filter(o=>a.indexOf(o.k)>=0);return h.length?'<div class="pills'+(inh(k)?' inh':'')+'">'+h.map(o=>'<span class="pill">'+L(o.en,o.sv)+'</span>').join('')+sTag(k)+'</div>':''};
  const KV=(en,sv,v,k)=>v?'<div class="kv'+(k&&inh(k)?' inh':'')+'"><div class="k">'+L(en,sv)+'</div><div class="v">'+v+sTag(k)+'</div></div>':'';
  const T=k=>m[k]?esc(m[k]):'';
  const N=(k,u)=>m[k]!=null?esc(m[k])+' '+(u||unitOf(DEF[k],s.form)||''):'';
  const B=(en,sv,inner)=>inner.trim()?'<section class="blk"><h3>'+L(en,sv)+'</h3>'+inner+'</section>':'';
  const typeO=TYPES_ALL.find(o=>o.k===m.type),statO=STATUS.find(o=>o.k===m.status),invO=INV.find(o=>o.k===m.invasive);
  const size=(m.height!=null||m.spread!=null)?esc(m.height!=null?m.height:'?')+' × '+esc(m.spread!=null?m.spread:'?')+' '+unitOf(DEF.height,s.form):'';
  const nat=(m.nativeH!=null||m.nativeW!=null)?esc(m.nativeH!=null?m.nativeH:'?')+' × '+esc(m.nativeW!=null?m.nativeW:'?')+' m':'';
  const blocks=[
   ['Origin','Ursprung',P(REGIONS,'region')+KV('Native size','Naturlig storlek',nat,['nativeH','nativeW'])+KV('Habitat','Miljö',T('habitat'),'habitat')+P(SUCC,'succession')+KV('Notes','Anm.',T('range'),'range')],
   ['Size & form','Storlek & form',KV('Size','Storlek',size,['height','spread'])+KV('Spacing','Avstånd',m.spacing!=null?N('spacing'):'','spacing')+P(w?CROWN:HABIT,w?'crown':'habit')+P(w?ROOTS_W:ROOTS_H,'roots')+P(w?LEAF:DORM,w?'leaf':'dormant')+KV('Lifespan','Livslängd',N('lifespan'),'lifespan')+KV(w?'First yield':'Sow→harvest',w?'Första skörd':'Sådd→skörd',w?N('firstYield'):N('sowHarvest'),['firstYield','sowHarvest'])+KV('Product','Produkt',T('product'),'product')],
   ['Site','Plats',P(LIGHT,'light')+(m.moist?KV('Moisture','Fukt',dots(m.moist,5)+' <em>'+L('dry→wet','torr→blöt').replace(/<[^>]+>/g,'')+'</em>','moist'):'')+P(SOIL,'soil')+P(PH,'ph')+P(TOL,'tol')+KV('Zones','Zoner',[m.usda&&'USDA '+esc(m.usda),m.szone&&'SE '+esc(m.szone),m.rhs&&'RHS '+esc(m.rhs)].filter(Boolean).join(' · '),['usda','szone','rhs'])],
   ['Calendar & care','Kalender & skötsel',(()=>{const rows=['cal1','cal2','cal3','cal4'].filter(k=>(m[k]||[]).length);if(!rows.length)return '';return rows.map(k=>'<div class="fl" style="margin-top:4px">'+L(CAL_LAB[k][s.form][0],CAL_LAB[k][s.form][1])+'</div><div class="cal'+(inh(k)?' inh':'')+'">'+MONTHS.map((x,i)=>'<span class="'+(m[k].indexOf(i+1)>=0?'on':'')+'">'+x+'</span>').join('')+'</div>').join('')})()+P(w?PROP_W:PROP_H,'prop')+P(w?POLL:SOWING,w?'poll':'sowing')+P(EFFORT,'effort')+P(ESTAB,'estab')+KV('Watch-outs','Se upp',T('watch'),'watch')],
   ['Uses','Användning',P(w?USES_W:USES_H,'uses')+P(YIELD,'yield')+KV('Edibility','Ätlighet',isEmpty(m.edibility)?'':Number(m.edibility)===0?L('Inedible','Oätlig'):dots(m.edibility,5),'edibility')+KV('Edible / notes','Ätligt',T('edible'),'edible')],
   ['Ecosystem functions','Ekosystemfunktioner',P(w?ECO_W:ECO_H,'eco')+KV('Notes','Anm.',T('ecoNotes'),'ecoNotes')],
   ['Placement','Placering',P(LAYER,'layer')+P(ROLE,'role')+P(STRUCT,'struct')+KV('Good with','Passar med',T('goodWith'),'goodWith')+KV('Avoid near','Undvik nära',T('avoid'),'avoid')],
   ['Cautions & sources','Varningar & källor',P(CAUT,'caut')+KV('Sources','Källor',T('sources'),'sources')]
  ];
  const missing=blocks.filter(b=>!b[2].trim()).map(b=>b[0]);
  const conf=s.conf.length?'<p class="note"><b>'+L('Entries disagree','Posterna skiljer sig')+'.</b> '+s.conf.map(c=>{const d=DEF[c.k];const f=v=>d.t==='single'?((optsOf(d,s.form).find(o=>o.k===v)||{}).en||v):v;return esc(d.en)+': '+esc(f(c.cur))+' (newest), earlier '+c.olds.map(o=>esc(f(o.v))+' '+esc(o.date||'')).join(', ')}).join('; ')+'. The newest entry is used.</p>':'';
  // Outside sources that differ: one closed line (click to open), then one short line per field.
  const sconf=(()=>{const list=s.sconf||[];if(!list.length)return '';
    const f=(d,v)=>Array.isArray(v)?v.map(x=>labOf(d,s.form,x)).join(', '):labOf(d,s.form,v);
    const keys=[...new Set(list.map(c=>c.k))],lab=k=>trs(DEF[k].en,DEF[k].sv);
    const head=tr('Outside sources differ on ','Externa källor skiljer sig för ','Externe bronnen wijken af bij ')+keys.length+' '+(keys.length===1?tr('field','fält','veld'):tr('fields','fält','velden'))+' ('+keys.map(lab).join(', ')+')';
    return '<details class="note srcnote"><summary>'+esc(head)+'</summary><ul>'+list.map(c=>'<li>'+esc(lab(c.k))+': '+esc(srcShort(c.by))+' '+esc(f(DEF[c.k],c.v))+'</li>').join('')+'</ul><small class="muted">'+esc(tr('The values shown above are used: people’s entries always come first.','Värdena ovan används: personers poster går alltid först.','De waarden hierboven worden gebruikt: invoer van mensen gaat altijd voor.'))+'</small></details>'})();
  const img=s.cover?'<img src="'+blobSrc(s.cover)+'" alt="" data-lb="'+s.cover+'">':phIcon(s);
  return '<article class="card" style="--c:'+FCOL[s.form]+'">'+starBtn(s.sid)+'<div class="chead"><div class="ph" style="--c:'+FCOL[s.form]+'">'+img+'</div><div style="min-width:0"><div class="lat">'+names(s).main+'</div>'+
    '<div class="nm">'+names(s).sub+(m.family?' · '+esc(m.family):'')+'</div>'+
    '<div class="meta"><span class="pill t" style="--c:'+FCOL[s.form]+'">'+(typeO?L(typeO.en,typeO.sv):(w?L('Woody','Vedartad'):L('Herbaceous','Örtartad')))+'</span>'+(statO?'<span class="pill">'+L(statO.en,statO.sv)+'</span>':'')+(s.ex?'<span class="pill ex">'+L('Example','Exempel')+'</span>':'')+
    (m.verdict?'<span>'+dots(m.verdict,5)+'</span>':'')+(invO?'<span>'+L('Invasive risk','Invasionsrisk')+': '+L(invO.en,invO.sv)+sTag('invasive')+'</span>':'')+'<span>'+L('No.','Nr')+' '+esc(s.no)+' · '+s.entries.length+' '+(s.entries.length===1?L('entry','post'):L('entries','poster'))+'</span></div></div></div>'+
    (s.isCv?'<p class="cvnote">'+tr('Cultivar of ','Sort av ','Cultivar van ')+'<button type="button" class="lnk" data-open="'+esc(s.sid)+'"><i>'+esc(s.latin)+'</i></button>. '+tr('Grey values come from the species; the others are this cultivar’s own.','Grå värden kommer från arten; de andra gäller just den här sorten.','Grijze waarden komen van de soort; de andere zijn van deze cultivar zelf.')+'</p>':'')+'<div class="cbody">'+blocks.map(b=>B(b[0],b[1],b[2])).join('')+'</div>'+extLinks(s)+artieBtn(s)+speciesStamp(s)+conf+sconf+(missing.length?'<div class="missing">'+L('Not yet filled','Saknas')+': '+missing.join(', ')+'</div>':'')+'</article>';
}

/* ---------- overview ---------- */
const FILTERS=[['type','Type','Typ',TYPES_ALL],['status','Status','Status',STATUS],['light','Light','Ljus',LIGHT],['layer','Layer','Skikt',LAYER],['struct','Structure','Struktur',STRUCT],['eco','Functions','Funktioner',ECO_ALL],['uses','Uses','Användning',USES_ALL],['tol','Tolerates','Tål',TOL]];
function buildFilters(){
  $('#fltBody').innerHTML='<div class="fgrp"><span class="fl">'+trh('Favourites','Favoriter')+'</span><div class="chips"><button type="button" class="chip sm" data-favonly aria-pressed="false"><i></i><span>'+trh('Only my favourites','Endast mina')+'</span></button></div></div><div class="fgrp"><span class="fl">'+trh('Form','Typ av växt')+'</span><div class="chips">'+
    [['',trh('All','Alla')],['w',trh('Woody','Vedartad')],['h',trh('Herbaceous','Örtartad')]].map(a=>'<button type="button" class="chip sm" data-form="'+a[0]+'" aria-pressed="'+(a[0]===state.fForm)+'"><i></i><span>'+a[1]+'</span></button>').join('')+'</div></div>'+
    FILTERS.map(f=>'<div class="fgrp"><span class="fl">'+trh(f[1],f[2])+'</span><div class="chips">'+f[3].map(o=>'<button type="button" class="chip sm" data-fk="'+f[0]+'" data-fv="'+o.k+'" aria-pressed="false"><i></i><span>'+labUI(o)+'</span></button>').join('')+'</div></div>').join('')+
    '<button type="button" class="btn sm" id="fltClear">'+tr('Clear filters','Rensa filter')+'</button><div style="height:12px"></div>';
}
function matches(s){
  if(state.fForm&&s.form!==state.fForm)return false;
  if(state.favOnly&&!Fav.has(s.sid))return false;
  if(state.q&&!textHit(s,state.q))return false;
  if(state.listId){const L=(state.lists||[]).find(l=>l.id===state.listId);if(!L||(L.sids||[]).indexOf(s.sid)<0)return false}
  for(const t of state.flt){const i=t.indexOf(':'),k=t.slice(0,i),v=t.slice(i+1),x=s.m[k];if(!(Array.isArray(x)?x.indexOf(v)>=0:x===v))return false}
  return true;
}
function spRow(s){
  const m=s.m,w=s.form==='w',typeO=TYPES_ALL.find(o=>o.k===m.type);
  const ecoO=(w?ECO_W:ECO_H).filter(o=>(m.eco||[]).indexOf(o.k)>=0);
  const size=m.height!=null?m.height+(m.spread!=null?'×'+m.spread:'')+' '+unitOf(DEF.height,s.form):'';
  const lights=LIGHT.filter(o=>(m.light||[]).indexOf(o.k)>=0).map(o=>trs(o.en,o.sv)).join('/');
  const sel=cmpMode?'<label class="cmpchk" title="'+esc(tr('Select to compare','Välj för jämförelse'))+'"><input type="checkbox" data-cmpsel="'+esc(s.sid)+'"'+(cmp.indexOf(s.sid)>=0?' checked':'')+' aria-label="'+esc(tr('Compare','Jämför')+' '+dispName(s))+'"></label>':'';
  return '<div class="spw'+(cmpMode?' sel':'')+'">'+sel+'<button type="button" class="sp" data-sid="'+esc(s.sid)+'"><div class="ph" style="--c:'+FCOL[s.form]+'">'+phInner(s,1)+'</div>'+
    '<div style="min-width:0"><div class="lat">'+names(s).main+'</div><div class="nm">'+names(s).sub+'</div>'+
    (()=>{const c=state.q&&!textHit(Object.assign({},s,{cvs:[]}),state.q)&&cvHit(s,state.q);return c?'<div class="nm cvmatch">'+esc(tr('matches ','träff: ','komt overeen: '))+'<b>'+esc(cvQ(c.cv))+'</b></div>':''})()+
    '<div class="meta"><span class="pill t" style="--c:'+FCOL[s.form]+'">'+(typeO?trh(typeO.en,typeO.sv):(w?trh('Woody','Vedartad'):trh('Herbaceous','Örtartad')))+'</span>'+(size?'<span>'+esc(size)+'</span>':'')+(lights?'<span>'+esc(lights)+'</span>':'')+(s.ex?'<span class="pill ex">'+tr('Example','Exempel')+'</span>':'')+(s.cvs.length?'<span class="pill cvp">'+s.cvs.length+' '+esc(s.cvs.length===1?tr('cultivar','sort','cultivar'):tr('cultivars','sorter','cultivars'))+'</span>':'')+'</div>'+
    (ecoO.length?'<div class="pills" style="margin-top:6px">'+ecoO.slice(0,4).map(o=>'<span class="pill">'+esc(trs(o.en,o.sv))+'</span>').join('')+(ecoO.length>4?'<span class="pill">+'+(ecoO.length-4)+'</span>':'')+'</div>':'')+'</div>'+
    '<div class="side">'+(m.verdict?dots(m.verdict,5):'')+'<span class="cline">'+cbar(s)+'</span><span>'+s.entries.length+'×'+(s.obs.length?' · '+s.obs.length+' obs':'')+'</span></div></button>'+starBtn(s.sid)+'</div>';
}
function updateOverview(){
  const exN=species.filter(s=>s.ex).length;
  $('#rmEx').hidden=!exN;
  const photos=state.obs.filter(o=>o.photo).length+species.filter(s=>s.m.photo).length;
  $('#ovStats').textContent=!loaded?tr('Loading…','Laddar…'):[species.length+' '+trs('species','arter'),state.entries.length+' '+trs('entries','poster'),state.obs.length+' '+trs('observations','observationer'),photos+' '+trs('photos','foton')].join(' · ');
  const n=state.flt.size+(state.fForm?1:0)+(state.favOnly?1:0);const b=$('#fltN');b.hidden=!n;b.textContent=n;
  $$('#fltBody [data-fk]').forEach(el=>el.setAttribute('aria-pressed',state.flt.has(el.dataset.fk+':'+el.dataset.fv)));
  $$('#fltBody [data-form]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.form===state.fForm));
  $$('#fltBody [data-favonly]').forEach(el=>el.setAttribute('aria-pressed',state.favOnly));
  let list=species.filter(matches);
  const so=state.sort;
  list.sort((a,b)=>so==='fav'?(Number(Fav.has(b.sid))-Number(Fav.has(a.sid)))||a.latin.localeCompare(b.latin):so==='recent'?b.updated-a.updated:so==='verdict'?(b.m.verdict||0)-(a.m.verdict||0)||a.latin.localeCompare(b.latin):so==='no'?a.created-b.created:byName(a,b));
  updateCmpBar();
  const LF=state.listId&&listById(state.listId);$('#listFilter').hidden=!LF;if(LF)$('#listFilterName').textContent=LF.name;
  const el=$('#ovList');
  const nList=list.length;$$('[data-act=export-sheets],[data-act=print-sheets]').forEach(b=>{b.disabled=!nList;const c=b.querySelector('.n');if(c)c.textContent=nList});
  if(!loaded){el.innerHTML='<div class="empty"><p>Loading species…</p></div>';return}
  if(!species.length){el.innerHTML='<div class="empty"><h2>No species yet <em>Inga arter ännu</em></h2><p>Add a species with the form. Entries for the same Latin name are merged into one fact sheet, so you can come back and add information over time.</p><button class="btn primary w-only" data-act="goto-add">Add the first species · Lägg till</button></div>';return}
  el.innerHTML=list.length?list.map(spRow).join(''):'<div class="empty"><p>'+(state.favOnly&&!species.some(s=>Fav.has(s.sid))?tr('No favourites yet. Tap the star on a species to add one.','Inga favoriter ännu. Tryck på stjärnan vid en art för att lägga till.'):tr('No species match these filters.','Inga arter matchar filtren.'))+'</p></div>';
}

/* ---------- form ---------- */
let draft={},draftForm='w',editId=null,pendingPhoto=null,formBuilt=false;
const isOn=(d,k)=>{const v=draft[d.k];return d.t==='multi'||d.t==='cal'?(v||[]).indexOf(k)>=0:v===k};
const chipBtn=(d,o)=>'<button type="button" class="chip" data-k="'+d.k+'" data-v="'+o.k+'" aria-pressed="'+isOn(d,o.k)+'"><i></i><span>'+labUI(o)+'</span></button>';
function fieldHTML(d){
  const lbl=trh(d.en,d.sv||d.en),v=draft[d.k],u=unitOf(d,draftForm);
  if(d.t==='text'&&d.zone)return '<label class="f"><span class="fl">'+lbl+'</span><input type="text" data-k="'+d.k+'" value="'+esc(v||'')+'" inputmode="text" autocomplete="off"><span class="hint" data-zh="'+d.k+'">'+esc(zoneHint(d,v))+'</span></label>';
  if(d.t==='text')return d.cat?'<label class="f wide"><span class="fl">'+lbl+'</span><textarea rows="2" data-k="'+d.k+'">'+esc(v||'')+'</textarea></label>':'<label class="f"><span class="fl">'+lbl+'</span><input type="text" data-k="'+d.k+'" value="'+esc(v||'')+'"></label>';
  if(d.t==='num')return '<label class="f"><span class="fl">'+lbl+(u?' <b>('+u+')</b>':'')+'</span><input type="number" inputmode="decimal" step="any" data-k="'+d.k+'" value="'+esc(v==null?'':v)+'">'+(d.unit&&typeof d.unit==='object'?'<span class="hint">'+esc(tr('Woody plants in metres, herbaceous in centimetres.','Vedartade växter i meter, örtartade i centimeter.','Houtige planten in meter, kruidachtige in centimeter.'))+'</span>':'')+'</label>';
  if(d.t==='scale')return '<div class="fg"><div class="fl">'+lbl+'</div><div class="scale">'+[1,2,3,4,5].map(n=>'<button type="button" class="sc" data-k="'+d.k+'" data-v="'+n+'" aria-pressed="'+(Number(v)===n)+'">'+n+'</button>').join('')+(d.none?'<button type="button" class="chip sm scnone" data-k="'+d.k+'" data-v="0" aria-pressed="'+(v!=null&&v!==''&&Number(v)===0)+'"><i></i><span>'+trh(d.none[0],d.none[1])+'</span></button>':'')+'</div><div class="scap"><span>'+trh(d.cap[0][0],d.cap[0][1])+'</span><span>'+trh(d.cap[1][0],d.cap[1][1])+'</span></div></div>';
  if(d.t==='cal'){const lb=d.lab[draftForm];return '<div class="fg"><div class="fl">'+trh(lb[0],lb[1])+'</div><div class="months">'+MONTHS.map((x,i)=>'<button type="button" class="mc" style="--c:'+FCOL[draftForm]+'" data-k="'+d.k+'" data-v="'+(i+1)+'" aria-label="'+MONTH_NAMES[i]+'" aria-pressed="'+((v||[]).indexOf(i+1)>=0)+'">'+x+'</button>').join('')+'</div></div>'}
  return '<div class="fg"><div class="fl">'+lbl+'</div><div class="chips">'+optsOf(d,draftForm).map(o=>chipBtn(d,o)).join('')+'</div></div>';
}
function secCount(sec){return sec.f.filter(d=>(!d.only||d.only===draftForm)&&!isEmpty(draft[d.k])).length}
function buildForm(){
  formBuilt=true;
  const wide=window.matchMedia('(min-width:720px)').matches;
  const id='<div class="idbox"><div class="fields">'+
    '<label class="f wide"><span class="fl">'+trh('Latin name','Latinskt namn')+' *</span><input id="latin" type="text" data-k="latin" list="spNames" autocapitalize="off" spellcheck="false" placeholder="'+tr('e.g.','t.ex.').replace(/ · .*/,'')+' Hippophae rhamnoides" value="'+esc(draft.latin||'')+'"'+(draft._snap?' readonly title="'+esc(tr('Use Rename to change the name','Använd Byt namn för att ändra namnet'))+'"':'')+'><span id="latHint" class="hint"></span></label>'+
    ['en','sv','nl','family'].map(k=>fieldHTML(DEF[k])).join('')+
    '<div class="f wide cvf"><label class="fl" for="cvSel">'+trh('Cultivar','Sort','Cultivar')+'</label><select id="cvSel"></select><input id="cvNew" type="text" maxlength="80" autocomplete="off" spellcheck="false" hidden placeholder="'+esc(tr('Cultivar name, e.g. Ingrid Marie','Sortnamn, t.ex. Ingrid Marie','Cultivarnaam, bijv. Ingrid Marie'))+'"><span id="cvHint" class="hint"></span></div>'+
    '<label class="f"><span class="fl">'+trh('Entry date','Datum')+'</span><input type="date" id="entDate" value="'+esc(draft._date||today())+'"></label>'+
    '<div class="fg"><div class="fl">'+trh('Type · woody','Typ · vedartad')+'</div><div class="chips">'+TYPES_W.map(o=>chipBtn(DEF.type,o)).join('')+'</div></div>'+
    '<div class="fg"><div class="fl">'+trh('Type · herbaceous','Typ · örtartad')+'</div><div class="chips">'+TYPES_H.map(o=>chipBtn(DEF.type,o)).join('')+'</div></div>'+
    fieldHTML(DEF.status)+
    '<div class="f wide ph-only"><label class="fl" for="entPhoto">'+trh('Photo','Foto')+'</label><input id="entPhoto" type="file" accept="image/*"><span class="hint" id="photoHint">'+(draft.photo?tr('A photo is already attached to this entry.','Ett foto finns redan på den här posten.'):tr('Shown on the card and the printed sheet.','Visas på kortet och det utskrivna bladet.'))+'</span></div>'+
    '</div></div>';
  $('#form').innerHTML=id+SEC.map((sec,i)=>'<details class="sec" data-sec="'+sec.id+'"'+(wide||i===0?' open':'')+'><summary>'+(state.lang==='both'?esc(sec.en)+' <em style="font:400 13px var(--ui)">'+esc(sec.sv)+'</em>':esc(trs(sec.en,sec.sv)))+(SPECIES_ONLY.indexOf(sec.f[0].k)>=0?'<small class="sponly">'+esc(tr('always for the whole species','gäller alltid hela arten','geldt altijd voor de hele soort'))+'</small>':'')+'<span class="n" data-n="'+sec.id+'"></span></summary><div class="fields">'+sec.f.filter(d=>(!d.only||d.only===draftForm)&&!d.hide).map(fieldHTML).join('')+'</div></details>').join('');
  updateCounts();updateHint();
}
// The cultivar picker on the form: the species, its known cultivars, or a new name.
function updateCvField(){
  const sel=$('#cvSel');if(!sel)return;
  const s=bySid.get(slug(canon(draft.latin||''))),k=draft.cultivar?cvKey(draft.cultivar):'',known=s&&s.cvs.find(c=>c.ck===k),inp=$('#cvNew');
  sel.innerHTML=cvOptions(s,'',tr('Species (all cultivars)','Arten (alla sorter)','Soort (alle cultivars)'));
  sel.value=known&&!draft._cvNew?k:(k||draft._cvNew?'__new':'');
  if(sel.value==='__new'){draft._cvNew=true;inp.hidden=false;if(document.activeElement!==inp)inp.value=draft.cultivar||''}else inp.hidden=true;
  cvHint();
}
function cvHint(){
  const el=$('#cvHint');if(!el)return;const n=cvNorm(draft.cultivar||''),s=bySid.get(slug(canon(draft.latin||'')));
  $('#form').classList.toggle('hascv',!!n);
  if(!n){el.className='hint';el.textContent=draft._cvNew?tr('Type the cultivar name without quotes.','Skriv sortnamnet utan citattecken.','Typ de cultivarnaam zonder aanhalingstekens.'):tr('Leave on “Species” for facts that hold for every cultivar.','Låt ”Arten” stå kvar för uppgifter som gäller alla sorter.','Laat op “Soort” staan voor feiten die voor elke cultivar gelden.');return}
  const k=cvKey(n),ex=s&&s.cvs.find(c=>c.ck===k),near=!ex&&s&&s.cvs.map(c=>[c,lev(k,c.ck)]).filter(a=>a[1]<=2).sort((a,b)=>a[1]-b[1])[0];
  el.className=near?'hint warn':'hint ok';
  el.innerHTML=esc(tr('What you fill in applies only to '+cvQ(n)+'. Names, family, type and origin always describe the whole species.','Det du fyller i gäller bara '+cvQ(n)+'. Namn, familj, typ och ursprung gäller alltid hela arten.','Wat je invult geldt alleen voor '+cvQ(n)+'. Namen, familie, type en herkomst gelden altijd voor de hele soort.'))+
    (!ex&&draft._cvNew?' '+esc(tr('New cultivar.','Ny sort.','Nieuwe cultivar.')):'')+
    (near?' '+esc(tr('Similar existing cultivar:','Liknande befintlig sort:','Vergelijkbare bestaande cultivar:'))+' <button type="button" class="lnk" data-cvfill="'+esc(near[0].ck)+'">'+esc(cvQ(near[0].cv))+'</button>?':'');
}
function updateCounts(){draftKeep();SEC.forEach(sec=>{const el=$('[data-n="'+sec.id+'"]');if(el){const n=secCount(sec);el.textContent=n?n+' '+tr('filled','ifyllda'):''}})}
function updateHint(){
  updateCvField();
  {const a=$('.artie-hint a'),l=canon(draft.latin||'');if(a){const nw=l.split(' ').length>=2&&!bySid.get(slug(l));a.textContent=nw?tr('New species? Ask Artie (bot) to pre-fill '+l+'.','Ny art? Be Artie (bot) att förifylla '+l+'.','Nieuwe soort? Vraag Artie (bot) om '+l+' vooraf in te vullen.'):tr(...a.dataset.t.split('|'))}}
  const el=$('#latHint');if(!el)return;const v=(draft.latin||'').trim();
  if(!v){el.className='hint';el.textContent=tr('Genus and species, e.g. Malus domestica. Entries with the same name are merged.','Släkte och art, t.ex. Malus domestica. Poster med samma namn slås ihop.');return}
  const sid=slug(v),s=bySid.get(sid);
  if(s){el.className='hint ok';el.innerHTML=tr('Adds to','Läggs till')+' <i>'+esc(s.latin)+'</i> ('+s.entries.length+' '+(s.entries.length===1?tr('entry so far','post hittills'):tr('entries so far','poster hittills'))+')';return}
  const near=nearMatch(sid);
  el.className=near?'hint warn':'hint';el.innerHTML=tr('New species.','Ny art.')+(near?' '+tr('Similar existing name:','Liknande befintligt namn:')+' <button type="button" class="lnk" data-fill="'+esc(near.latin)+'"><i>'+esc(near.latin)+'</i></button>?':'');
}
function resetDraft(){draft={};draftBase='{}';draftForm='w';editId=null;pendingPhoto=null;$('#editBanner').hidden=true;draftClear();buildForm()}
/* ---------- the Add-form draft is kept on this device until it is saved or cleared ---------- */
const DKEY='ab.draft';
let draftBase='{}';
const draftFilled=()=>Object.keys(draft).some(k=>k[0]!=='_'&&k!=='latin'&&!isEmpty(draft[k])&&String(draft[k]).trim()!=='');
// Dirty = something was filled in that differs from how the form was opened.
const draftDirty=()=>!!pendingPhoto||(draftFilled()&&JSON.stringify(draft)!==draftBase);
let draftT;
function draftKeep(){clearTimeout(draftT);draftT=setTimeout(()=>{try{if(draftDirty())store.set(DKEY,JSON.stringify({draft,draftForm,editId,at:Date.now()}));}catch(e){}},300)}
function draftClear(){clearTimeout(draftT);try{localStorage.removeItem(DKEY)}catch(e){}$('#draftBox').hidden=true}
function draftOffer(){
  const box=$('#draftBox');if(!box)return;let d=null;try{d=JSON.parse(store.get(DKEY)||'null')}catch(e){}
  if(!d||!d.draft||draftDirty()){box.hidden=true;return}
  const nm=canon(d.draft.latin||'')||tr('a species without a name','en art utan namn','een soort zonder naam');
  box.hidden=false;box.innerHTML='<p>'+esc(tr('You have an unsaved draft for ','Du har ett osparat utkast för ','Je hebt een niet-opgeslagen concept voor '))+'<i>'+esc(nm)+'</i> ('+esc(fmtDate(d.at))+').</p><div class="acts"><button type="button" class="btn primary sm" data-act="draft-restore">'+esc(tr('Continue with it','Fortsätt med det','Ga ermee verder'))+'</button><button type="button" class="btn sm" data-act="draft-discard">'+esc(tr('Discard it','Släng det','Weggooien'))+'</button></div>';
}
function draftRestore(){let d=null;try{d=JSON.parse(store.get(DKEY)||'null')}catch(e){}if(!d)return;draft=d.draft||{};draftForm=d.draftForm||'w';editId=d.editId&&state.entries.some(e=>e.id===d.editId)?d.editId:null;
  $('#editBanner').hidden=!editId;if(editId){const e=state.entries.find(x=>x.id===editId);$('#editBanner').innerHTML='<span>'+esc(tr('Editing the entry from ','Redigerar posten från ','Bewerkt de invoer van '))+'<b>'+esc(e.date||'')+'</b> · <i>'+esc(e.latin)+'</i>.</span><button class="btn sm" type="button" data-act="cancel-edit">'+tr('Cancel','Avbryt')+'</button>'}
  $('#draftBox').hidden=true;buildForm();toast(tr('Draft restored. A photo has to be chosen again.','Utkastet återställt. Ett foto måste väljas igen.','Concept teruggezet. Een foto moet opnieuw gekozen worden.'))}
addEventListener('beforeunload',e=>{if(!$('#v-add').hidden&&draftDirty()){e.preventDefault();e.returnValue=''}});
function openAdd(opts){
  opts=opts||{};
  if(opts.entry){const e=opts.entry;draft={latin:e.latin,_date:e.date};draftForm=e.form||'h';editId=e.id;Object.keys(e.fields||{}).forEach(k=>{const v=e.fields[k];draft[k]=DEF[k]&&DEF[k].t==='num'?String(v):v});
    $('#editBanner').hidden=false;$('#editBanner').innerHTML='<span>Editing the entry from <b>'+esc(e.date||'')+'</b> for <i>'+esc(e.latin)+'</i>.</span><button class="btn sm" type="button" data-act="cancel-edit">'+tr('Cancel','Avbryt')+'</button>'}
  else if(opts.sheet){const sp=opts.sheet,hum=sp.entries.filter(e=>!isSrcEnt(e)),last=hum[hum.length-1],vals=sp.isCv?sp.own:(sp.hm||sp.m);
    draft={latin:sp.latin,_snap:true};draftForm=sp.form;editId=last&&last.snapshot?last.id:null;
    Object.keys(vals).forEach(k=>{const v=vals[k];if(!DEF[k]||k==='cultivar')return;draft[k]=DEF[k].t==='num'?String(v):Array.isArray(v)?v.slice():v});
    if(sp.isCv)draft.cultivar=sp.cv;
    $('#editBanner').hidden=false;$('#editBanner').innerHTML='<span>'+tr('Editing the whole sheet for ','Redigerar hela bladet för ')+'<i>'+esc(sp.latin)+'</i>'+(sp.isCv?' '+esc(cvQ(sp.cv))+' ('+esc(tr('only this cultivar’s own values','bara sortens egna värden','alleen de eigen waarden van deze cultivar'))+')':'')+'. '+tr('Saving replaces the combined values; earlier entries stay as history.','När du sparar ersätts de sammanslagna värdena; tidigare poster finns kvar som historik.')+'</span><button class="btn sm" type="button" data-act="cancel-edit">'+tr('Cancel','Avbryt')+'</button>'}
  else{draft={latin:opts.latin||'',cultivar:opts.cultivar||''};if(opts.cvNew)draft._cvNew=true;draftForm=opts.form||'w';editId=null;$('#editBanner').hidden=true}
  pendingPhoto=null;draftBase=JSON.stringify(draft);buildForm();go('add');
  if(opts.cvNew)setTimeout(()=>{const i=$('#cvNew');if(i)i.focus()},60);
  if(opts.gap){const sec=GAP_SEC[opts.gap];setTimeout(()=>{const d=sec&&$('#form details[data-sec="'+sec+'"]');const el=d||$('#form .idbox');if(d)d.open=true;if(el)el.scrollIntoView({block:'start',behavior:'smooth'})},80)}
}
async function saveForm(){
  const latin=canon(draft.latin||'');
  if(latin.split(' ').length<2){toast('Enter genus and species, e.g. Malus domestica.','err');$('#latin').focus();return}
  const fields={};
  Object.keys(DEF).forEach(k=>{const d=DEF[k];if(k==='photo'||k==='latin')return;if(d.only&&d.only!==draftForm)return;let v=draft[k];if(isEmpty(v))return;
    if(d.t==='num'){v=Number(v);if(!isFinite(v))return}else if(d.t==='scale')v=Number(v);else if(d.t==='text')v=d.zone?zoneNorm(v,d.zone):String(v).trim();else if(d.t==='cal'||d.t==='multi')v=v.slice();
    if(!isEmpty(v))fields[k]=v});
  if(draft.photo)fields.photo=draft.photo;
  delete fields.cultivar;
  {const n=cvNorm(draft.cultivar||''),sp=bySid.get(slug(latin)),ex=n&&sp&&sp.cvs.find(c=>c.ck===cvKey(n));
   if(draft._cvNew&&!n){toast(tr('Type the cultivar name, or choose “Species”.','Skriv sortnamnet, eller välj ”Arten”.','Typ de cultivarnaam, of kies “Soort”.'),'err');const i=$('#cvNew');if(i)i.focus();return}
   if(n)fields.cultivar=ex?ex.cv:n}
  const nsid=slug(latin),near=!editId&&!draft._snap&&!bySid.get(nsid)&&nearMatch(nsid);
  if(near&&!draft._nearOk){
    const box=$('#nearBox');box.hidden=false;setTimeout(()=>box.scrollIntoView({block:'center',behavior:'smooth'}),0);
    box.innerHTML='<p>'+tr('“'+latin+'” is not in the database yet, but “'+near.latin+'” is very similar. Is it the same species?','”'+latin+'” finns inte än, men ”'+near.latin+'” är mycket likt. Är det samma art?','“'+latin+'” staat nog niet in de database, maar “'+near.latin+'” lijkt er sterk op. Is het dezelfde soort?')+'</p>'+
      '<div class="acts"><button type="button" class="btn primary" data-act="near-use" data-latin="'+esc(near.latin)+'">'+tr('Add to ','Lägg till i ')+'<i>'+esc(near.latin)+'</i></button><button type="button" class="btn" data-act="near-new">'+tr('Save as a new species','Spara som ny art')+'</button></div>';
    box.scrollIntoView({block:'nearest'});return;
  }
  $('#nearBox').hidden=true;
  const btn=$('#saveBtn');btn.disabled=true;$('#saveMsg').textContent='Saving…';
  try{
    if(pendingPhoto){fields.photo=await uploadPhoto(pendingPhoto)}
    const now=Date.now(),old=editId&&state.entries.find(e=>e.id===editId);
    const doc={sid:slug(latin),latin,date:draft._snap?today():(draft._date||today()),form:draftForm,fields,createdAt:old?old.createdAt:now,updatedAt:now};
    if(draft._snap||(old&&old.snapshot))doc.snapshot=true;
    if(old&&old.ex)doc.ex=true;
    if(old&&old.by){doc.by=old.by;if(old.src)doc.src=old.src}
    await Data.saveEntry(editId,doc);
    if(old&&old.fields&&old.fields.photo&&old.fields.photo!==fields.photo)dropPhoto(old.fields.photo,old.id);
    selected=doc.sid;selCv=fields.cultivar?cvKey(fields.cultivar):'';toast(tr('Saved to ','Sparad till ')+latin+(fields.cultivar?' '+cvQ(fields.cultivar):''));
    draft={};draftBase='{}';editId=null;pendingPhoto=null;draftClear();$('#editBanner').hidden=true;$('#nearBox').hidden=true;buildForm();go('sheet');
  }catch(e){toast(errMsg(e),'err')}
  finally{btn.disabled=false;$('#saveMsg').textContent=''}
}

/* ---------- sheet view ---------- */
function fitSheet(){
  const wrap=$('#sheetWrap'),fit=$('#sheetFit');if(!wrap||!fit.firstElementChild)return;
  const pxW=210*96/25.4,pxH=148*96/25.4,cw=wrap.clientWidth-28;
  const k=Math.min(1,Math.max(cw/pxW,0.3));
  fit.style.transform='scale('+k+')';fit.style.width=pxW+'px';
  fit.style.height=(fit.dataset.pages?fit.scrollHeight:pxH)+'px';
  fit.parentElement.style.height=(pxH*k+24)+'px';
  const n=fit.children.length;if(n>1){fit.style.height='auto';fit.parentElement.style.height=((fit.scrollHeight)*k+24)+'px'}
}
const cvPill=o=>o&&o.cultivar?' <span class="pill cvp">'+esc(cvQ(cvNorm(o.cultivar)))+'</span>':'';
// Options for "which cultivar" selects: the species itself, its known cultivars, and a new one.
function cvOptions(s,val,none){
  return '<option value="">'+esc(none||tr('Species (no particular cultivar)','Arten (ingen särskild sort)','Soort (geen bepaalde cultivar)'))+'</option>'+
    ((s&&s.cvs)||[]).map(c=>'<option value="'+esc(c.ck)+'"'+(c.ck===val?' selected':'')+'>'+esc(cvQ(c.cv))+'</option>').join('')+
    '<option value="__new">'+esc(tr('New cultivar…','Ny sort…','Nieuwe cultivar…'))+'</option>';
}
// Read a cultivar select (+ its "new" text box) as a cultivar name, or '' for the species.
function cvRead(sel,inp,s){
  const v=$(sel).value;if(!v)return '';
  if(v==='__new'){const n=cvNorm($(inp).value);if(!n)return null;const k=cvKey(n),ex=s&&s.cvs.find(c=>c.ck===k);return ex?ex.cv:n}
  const c=s&&s.cvs.find(x=>x.ck===v);return c?c.cv:'';
}
function cvBarHTML(s){
  if(!s.cvs.length)return '<div class="cvbar"><span class="fl">'+trh('Cultivars','Sorter','Cultivars')+'</span><span class="muted">'+esc(tr('None recorded yet.','Inga registrerade ännu.','Nog geen vastgelegd.'))+'</span><button type="button" class="btn sm w-only" data-act="cv-new">'+esc(tr('+ Add a cultivar','+ Lägg till en sort','+ Cultivar toevoegen'))+'</button></div>';
  return '<div class="cvbar" role="group" aria-label="'+esc(tr('Cultivars','Sorter','Cultivars'))+'"><span class="fl">'+trh('Show','Visa','Toon')+'</span>'+
    '<button type="button" class="chip sm" data-cv="" aria-pressed="'+(!selCv)+'"><i></i><span>'+esc(tr('Species, all cultivars','Arten, alla sorter','Soort, alle cultivars'))+'</span></button>'+
    s.cvs.map(c=>'<button type="button" class="chip sm" data-cv="'+esc(c.ck)+'" aria-pressed="'+(selCv===c.ck)+'"><i></i><span>'+esc(cvQ(c.cv))+'</span></button>').join('')+
    '<button type="button" class="btn sm w-only" data-act="cv-new">'+esc(tr('+ Add a cultivar','+ Lägg till en sort','+ Cultivar toevoegen'))+'</button></div>';
}
/* All cultivars of a species side by side: one row per cultivar, a column for each trait that some cultivar sets itself. */
const CV_SKIP={photo:1,cultivar:1};
function cvTableHTML(s){
  if(!s.cvs.length)return '';
  const lang=state.lang,keys=Object.keys(DEF).filter(k=>!CV_SKIP[k]&&SPECIES_ONLY.indexOf(k)<0&&s.cvs.some(c=>!isEmpty(c.own[k]))&&(!DEF[k].only||DEF[k].only===s.form));
  const order=Object.keys(DEF);keys.sort((a,b)=>order.indexOf(a)-order.indexOf(b));
  const lab=k=>DEF[k].t==='cal'?trh(CAL_LAB[k][s.form][0],CAL_LAB[k][s.form][1]):trh(DEF[k].en,DEF[k].sv);
  const same=(a,b)=>JSON.stringify(a==null?null:a)===JSON.stringify(b==null?null:b);
  const val=(x,k)=>{const v=x.m[k];if(isEmpty(v))return '';if(DEF[k].t==='cal')return '<span class="cmo">'+MONTHS.map((l,i)=>'<i'+(v.indexOf(i+1)>=0?' class="on"':'')+' title="'+MONTH_NAMES[i]+'"></i>').join('')+'</span>';if(k==='verdict')return dots(v,5);return esc(vtl(DEF[k],v,s.form,lang))};
  const cell=(x,k)=>{const v=val(x,k);if(!x.isCv)return '<td>'+(v||'<span class="muted">–</span>')+'</td>';
    const own=!isEmpty(x.own[k]);if(!own)return '<td class="inh" title="'+esc(tr('From the species','Från arten','Van de soort'))+'">'+(v||'<span class="muted">–</span>')+'</td>';
    return '<td class="own'+(same(x.own[k],s.m[k])?'':' dif')+'">'+v+'</td>'};
  const rowH=x=>'<th scope="row"><button type="button" class="lnk" data-cv="'+esc(x.isCv?x.ck:'')+'">'+(x.isCv?esc(cvQ(x.cv)):'<i>'+esc(tr('Species','Arten','Soort'))+'</i>')+'</button>'+(x.isCv&&x.plantings.length?'<small class="muted"> · '+x.plantings.reduce((t,p)=>t+(Number(p.count)||1),0)+' '+esc(tr('planted','planterade','geplant'))+'</small>':'')+'</th>';
  const rows=[s].concat(s.cvs);
  return '<div class="tbl"><table class="cmpt cvt"><thead><tr><th scope="col">'+trh('Cultivar','Sort','Cultivar')+'</th>'+(keys.length?keys.map(k=>'<th scope="col">'+lab(k)+'</th>').join(''):'<th></th>')+'</tr></thead><tbody>'+
    rows.map(x=>'<tr'+(x.isCv&&x.ck===selCv?' class="sel"':'')+'>'+rowH(x)+(keys.length?keys.map(k=>cell(x,k)).join(''):'<td class="muted">'+esc(tr('No cultivar has its own values yet; all follow the species.','Ingen sort har egna värden ännu; alla följer arten.','Nog geen cultivar heeft eigen waarden; alle volgen de soort.'))+'</td>')+'</tr>').join('')+'</tbody></table></div>'+
    '<p class="muted" style="font-size:13px;margin:0">'+esc(tr('Columns show every trait that at least one cultivar sets itself. Bold values are the cultivar’s own; highlighted ones differ from the species; grey values follow the species.','Kolumnerna visar varje egenskap som minst en sort anger själv. Fetstil är sortens egna värden; markerade skiljer sig från arten; grå värden följer arten.','De kolommen tonen elke eigenschap die minstens één cultivar zelf invult. Vet zijn de eigen waarden van de cultivar; gemarkeerde wijken af van de soort; grijze waarden volgen de soort.'))+'</p>';
}
function updateSheet(){
  const sel=$('#spSel');
  sel.innerHTML=species.length?species.map(s=>'<option value="'+esc(s.sid)+'"'+(s.sid===selected?' selected':'')+'>'+esc(dispName(s))+((commonName(s)?s.latin:(s.m.en||s.m.sv))?' — '+esc(commonName(s)?s.latin:(s.m.en||s.m.sv)):'')+'</option>').join(''):'<option>No species yet</option>';
  $$('#langSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===state.lang));
  $$('#sideSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.side===state.side));
  const s=selected&&bySid.get(selected),p=cur();
  const dis=!s;$$('[data-act="export-one"],[data-act="add-info"]').forEach(b=>b.disabled=dis);
  if(!s){$('#cardArea').innerHTML='<div class="empty"><h2>Nothing to show yet <em>Inget att visa</em></h2><p>Save a species from the Add tab and its fact sheet appears here.</p><button class="btn primary w-only" data-act="goto-add">'+tr('Add a species','Lägg till art')+'</button></div>';
    $('#cvBar').innerHTML='';$('#cvSec').hidden=true;$('#sheetFit').innerHTML='';$('#obsList').innerHTML='';$('#srcList').innerHTML='';$('#entList').innerHTML='';$('#obsForm').hidden=true;$('#srcForm').hidden=true;return}
  $('#obsForm').hidden=false;$('#srcForm').hidden=false;
  $('#cvBar').innerHTML=cvBarHTML(s);
  $$('[data-act=cv-rename]').forEach(b=>b.style.display=p.isCv?'':'none');if(!p.isCv)$('#cvRenBox').hidden=true;
  $('#cardArea').innerHTML=cardHTML(p);
  $('#revBox').innerHTML=revBoxHTML(s);$$('[data-act=flag-open]').forEach(b=>b.hidden=!SB||!meUid());if(!SB||!meUid())$('#flagBox').hidden=true;
  $('#cvSec').hidden=!s.cvs.length;{const j=$('.spjump [data-jump=cvSec]');if(j)j.hidden=!s.cvs.length}$('#cvTable').innerHTML=cvTableHTML(s);
  $('#cvCount').textContent=s.cvs.length?' ('+s.cvs.length+')':'';
  $$('#layoutSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.layout===state.layout));
  $$('[data-withlog]').forEach(c=>c.checked=state.withLog);
  $('#sideSeg').hidden=!state.withLog&&state.side!=='back';
  $('#sheetFit').innerHTML=state.side==='front'?sheetFor(p,state.lang,blobSrc):sheetBacks(p,state.lang,blobSrc);
  fitSheet();
  ['#obsCv','#srcCv'].forEach(id=>{const el=$(id);if(el){el.innerHTML=cvOptions(s,selCv);el.value=selCv;const nb=$(id+'New');if(nb){nb.hidden=true;nb.value=''}}});
  $('#srcList').innerHTML=srcHTML(p);
  updateComments(s);
  $('#spPlInfo').textContent=plSummary(p.plantings)||tr('No planting records yet.','Inga planteringar ännu.');
  $('#spPlList').innerHTML=p.plantings.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(x=>plRow(x,false)).join('');
  $('#sheetAddList').innerHTML=addListSelect(s.sid);
  $('#obsList').innerHTML=p.obs.length?p.obs.map(o=>'<div class="obs"><div class="ph" style="--c:'+FCOL[s.form]+'">'+(o.photo?'<img src="'+blobSrc(o.photo)+'" alt="" data-lb="'+o.photo+'" loading="lazy">':'–')+'</div><div style="min-width:0"><div class="d">'+esc(o.date||'')+(o.plot?' · '+esc(o.plot):'')+(p.isCv?'':cvPill(o))+'</div><p>'+esc(o.text||'')+'</p>'+(SB?'<small class="muted">'+rowStamp(o.id).slice(3)+'</small>':'')+'</div>'+(canEdit(o.id)?'<button class="btn sm danger w-only" data-act="del-obs" data-id="'+esc(o.id)+'">'+tr('Delete','Radera')+'</button>':'<span></span>')+'</div>').join(''):'<p class="muted" style="margin:0">'+(p.isCv?tr('No observations of this cultivar yet.','Inga observationer av den här sorten ännu.','Nog geen waarnemingen van deze cultivar.'):tr('No observations yet. Add a note or a photo above.','Inga observationer ännu. Lägg till en anteckning eller ett foto ovan.'))+'</p>';
  const ents=p.isCv?p.entries:s.entries;
  $('#entList').innerHTML=(p.isCv?'<p class="muted" style="margin:0;font-size:13px">'+esc(tr('Entries for this cultivar only. Entries for the whole species are listed when you show the species.','Endast poster för den här sorten. Poster för hela arten visas när du visar arten.','Alleen invoeren voor deze cultivar. Invoeren voor de hele soort staan bij de soort.'))+'</p>':'')+
    ents.slice().reverse().map(e=>'<div class="ent"><span><b>'+esc(e.date||'')+'</b> · '+(e.snapshot?'<span class="pill">'+tr('Sheet edit','Bladredigering')+'</span> · ':'')+(isSrcEnt(e)?srcPill(e)+' · ':'')+(p.isCv?'':cvPill({cultivar:entCv(e)}))+' '+Object.keys(e.fields||{}).filter(k=>k!=='cultivar').length+' '+(Object.keys(e.fields||{}).filter(k=>k!=='cultivar').length===1?tr('field','fält'):tr('fields','fält'))+(e.ex?' · <em>'+tr('example','exempel')+'</em>':'')+rowStamp(e.id)+'</span>'+(canEdit(e.id)?'<span class="acts w-only"><button class="btn sm" data-act="edit-entry" data-id="'+esc(e.id)+'">'+tr('Edit','Redigera')+'</button><button class="btn sm danger" data-act="del-entry" data-id="'+esc(e.id)+'">'+tr('Delete','Radera')+'</button></span>':'')+'</div>').join('');
}

/* ---------- verified marks and review flags (setup/v4_review.sql). Marks, flags and the dashboard are for admins only. ---------- */
const REV={on:false,marks:new Map(),flags:[],admins:new Set(),st:new Map()};
const SVG_VMK='<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7.2"/><path d="M4.7 8.3l2.2 2.2 4.5-4.7"/></svg>';
function revSet(d){
  if(!d){REV.on=false;REV.marks=new Map();REV.flags=[];REV.admins=new Set()}
  else{REV.on=true;REV.marks=new Map((d.reviews||[]).map(x=>[x.sid,{at:x.at,by:x.by}]));REV.flags=d.flags||[];REV.admins=new Set(d.admins||[])}
  revCompute();
}
// A mark turns grey when someone who is not an admin (a contributor, or Artie) adds, changes or deletes an entry of the species after it.
function revCompute(){
  REV.st=new Map();if(!REV.on)return;
  const late=new Map();
  (state.entries||[]).concat(state.trashE||[]).forEach(e=>{const r=REV.marks.get(e.sid);if(!r)return;const m=META.get(e.id)||{},t=m.updatedAt||m.createdAt;
    if(!t||new Date(t)<=new Date(r.at)||(m.updatedBy&&REV.admins.has(m.updatedBy)))return;
    const p=late.get(e.sid);if(!p||new Date(t)>new Date(p.at))late.set(e.sid,{at:t,by:m.updatedBy})});
  REV.marks.forEach((r,sid)=>REV.st.set(sid,Object.assign({},r,late.has(sid)?{stale:1,chg:late.get(sid)}:{})));
}
async function loadReview(){if(!SB||!isAdmin()){revSet(null);return}try{const r=await SB.rpc('review_state');if(r.error)throw r.error;revSet(r.data)}catch(e){revSet(null)}}
const revTitle=r=>tr('Verified ','Verifierad ','Geverifieerd ')+fmtDate(r.at)+(r.stale?' · '+tr('changed since by ','ändrad sedan dess av ','sindsdien gewijzigd door ')+who(r.chg.by):'');
function vmark(sid){const r=REV.st.get(sid);if(!r)return '';const t=revTitle(r);return ' <span class="vmk'+(r.stale?' stale':'')+'" role="img" title="'+esc(t)+'" aria-label="'+esc(t)+'">'+SVG_VMK+'</span>'}
const flagsFor=sid=>REV.flags.filter(f=>f.sid===sid);
function flagRow(f,withSp){
  const sp=withSp&&bySid.get(f.sid);
  return '<div class="ent flagrow"><span>'+(withSp?(sp?'<button type="button" class="lnk" data-open="'+esc(f.sid)+'">'+esc(dispName(sp))+'</button>':'<i>'+esc(f.latin)+'</i>')+' · ':'')+(f.reason?'“'+esc(f.reason)+'” · ':'')+esc(who(f.by))+' · '+esc(fmtDate(f.at))+'</span>'+
    '<button type="button" class="btn sm" data-act="flag-resolve" data-fid="'+esc(f.id)+'">'+esc(tr('Close flag','Stäng flaggan','Melding sluiten'))+'</button></div>';
}
function revBoxHTML(s){
  if(!isAdmin()||!SB)return '';
  if(!REV.on)return '<div class="revbox"><span class="muted">'+esc(tr('Verified marks need the database update v4_review.sql.','Verifieringsmarkeringar kräver databasuppdateringen v4_review.sql.','Verificatiemarkeringen vereisen de database-update v4_review.sql.'))+'</span></div>';
  const r=REV.st.get(s.sid),fl=flagsFor(s.sid);
  return '<div class="revbox'+(r?(r.stale?' stale':' ok'):'')+'"><span class="revst">'+
    (r?vmark(s.sid)+' '+esc(tr('Verified ','Verifierad ','Geverifieerd '))+esc(fmtDate(r.at))+' '+esc(tr('by ','av ','door '))+esc(who(r.by))+(r.stale?'. '+esc(tr('Changed since by ','Ändrad sedan dess av ','Sindsdien gewijzigd door '))+esc(who(r.chg.by))+' ('+esc(fmtDate(r.chg.at))+').':'.')
      :esc(tr('Not verified yet.','Inte verifierad än.','Nog niet geverifieerd.')))+
    ' <small class="muted">'+esc(tr('Only admins see this.','Bara admin ser detta.','Alleen beheerders zien dit.'))+'</small></span>'+
    '<span class="acts"><button type="button" class="btn sm primary" data-act="rev-mark">'+esc(r?tr('Verify again','Verifiera igen','Opnieuw verifiëren'):tr('Mark as verified','Markera som verifierad','Als geverifieerd markeren'))+'</button>'+
    (r?'<button type="button" class="btn sm" data-act="rev-unmark">'+esc(tr('Remove mark','Ta bort markeringen','Markering verwijderen'))+'</button>':'')+'</span>'+
    (fl.length?'<div class="revflags"><b>'+esc(tr('Flagged for review','Flaggad för granskning','Gemeld voor controle'))+' ('+fl.length+')</b>'+fl.map(f=>flagRow(f,false)).join('')+'<small class="muted">'+esc(tr('Marking the species as verified closes its flags.','Att markera arten som verifierad stänger flaggorna.','Als je de soort als geverifieerd markeert, worden de meldingen gesloten.'))+'</small></div>':'')+
    '</div>';
}
async function revCall(name,args,msg){try{const r=await SB.rpc(name,args);if(r.error)throw r.error;if(msg)toast(msg);await loadReview();refresh()}catch(e){toast(errMsg(e),'err')}}
async function flagSend(s){
  const reason=String($('#flagReason').value||'').trim().slice(0,500);
  try{const r=await SB.rpc('flag_species',{p_sid:s.sid,p_latin:s.latin,p_reason:reason});if(r.error)throw r.error;
    toast(r.data==='duplicate'?tr('Your earlier flag was updated. The admins will have a look.','Din tidigare flagga uppdaterades. Admin tittar på den.','Je eerdere melding is bijgewerkt. De beheerders kijken ernaar.'):tr('Thanks: the species is flagged for review.','Tack: arten är flaggad för granskning.','Bedankt: de soort is gemeld voor controle.'));
    $('#flagBox').hidden=true;$('#flagReason').value='';if(isAdmin()){await loadReview();refresh()}}
  catch(e){toast(errMsg(e),'err')}
}
/* admin dashboard */
const admState={tab:'never',n:40};
function admCounts(){let ok=0,st=0;species.forEach(s=>{const r=REV.st.get(s.sid);if(r){if(r.stale)st++;else ok++}});return{tot:species.length,ok,st,none:species.length-ok-st}}
function updateAdminBadge(){
  const f=isAdmin()?REV.flags.length:0,st=isAdmin()?species.filter(s=>{const r=REV.st.get(s.sid);return r&&r.stale}).length:0,a=isAdmin()?afRows.filter(r=>r.status==='open').length:0,n=f+st+a;
  $$('.admbadge').forEach(b=>{b.hidden=!n;b.textContent=n});
  const t=tr('Admin dashboard','Adminpanel','Beheerdersdashboard')+(n?': '+[f?f+' '+tr('flagged','flaggade','gemeld'):'',st?st+' '+tr('changed since verification','ändrade sedan verifieringen','gewijzigd sinds verificatie'):'',a?a+' '+tr('for Artie','till Artie','voor Artie'):''].filter(Boolean).join(', '):'');
  $$('.dkdot').forEach(d=>{d.hidden=!n});$$('#dock [data-dk=admin]').forEach(x=>{x.title=t;x.setAttribute('aria-label',t)});
}
// View-only accounts: what contributors can do, and how to get access. ADMIN_CONTACT in config.js (optional): an email address or a link.
function updateJoin(){
  const c=String(cfg.ADMIN_CONTACT||'').trim(),box=$('#joinContact');if(!box)return;
  const href=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)?'mailto:'+c+'?subject='+encodeURIComponent('Artblad: contributor access'):safeUrl(c);
  box.innerHTML=href?'<a class="btn primary" href="'+esc(href)+'">'+esc(tr('Contact the admin','Kontakta admin','Neem contact op met de beheerder'))+'</a>':'';
}
function updateAdmin(){
  const box=$('#admBody');if(!box)return;
  if(!isAdmin()){box.innerHTML='<p class="muted">'+esc(tr('Only admins can see this page.','Bara admin kan se den här sidan.','Alleen beheerders kunnen deze pagina zien.'))+'</p>';return}
  const c=admCounts(),pc=x=>c.tot?Math.round(1000*x/c.tot)/10:0,open=afRows.filter(r=>r.status==='open');
  const sec=(h,body)=>'<section class="admsec"><h2 class="hsec">'+h+'</h2>'+body+'</section>';
  const note=REV.on?'':'<p class="admwarn">'+esc(tr('Verified marks and flags need the database update v4_review.sql. Until it has been run, this page shows only the Artie requests.','Verifieringar och flaggor kräver databasuppdateringen v4_review.sql. Tills den har körts visar sidan bara Artie-förfrågningarna.','Verificaties en meldingen vereisen de database-update v4_review.sql. Tot die is uitgevoerd, toont deze pagina alleen de Artie-aanvragen.'))+'</p>';
  const bar='<div class="vbar" role="img" aria-label="'+esc(pc(c.ok)+' % '+tr('verified','verifierade','geverifieerd'))+'"><span class="ok" style="width:'+pc(c.ok)+'%"></span><span class="st" style="width:'+pc(c.st)+'%"></span></div>'+
    '<p class="vleg"><span><i class="sw ok"></i>'+esc(tr('Verified','Verifierade','Geverifieerd'))+': <b>'+c.ok+'</b> '+esc(tr('of','av','van'))+' '+c.tot+' ('+pc(c.ok)+' %)</span><span><i class="sw st"></i>'+esc(tr('Changed since verification','Ändrade sedan verifieringen','Gewijzigd sinds verificatie'))+': <b>'+c.st+'</b></span><span><i class="sw no"></i>'+esc(tr('Not verified','Inte verifierade','Niet geverifieerd'))+': <b>'+c.none+'</b></span></p>';
  const artie=(open.length?'<p class="admnew">'+esc(open.length+' '+(open.length===1?tr('new species requested for Artie','ny art begärd till Artie','nieuwe soort aangevraagd voor Artie'):tr('new species requested for Artie','nya arter begärda till Artie','nieuwe soorten aangevraagd voor Artie')))+'</p><p class="muted" style="margin:4px 0 8px">'+open.slice(0,12).map(r=>'<i>'+esc(r.latin)+'</i>'+(r.n>1?' ('+r.n+'×)':'')).join(', ')+(open.length>12?' …':'')+'</p>':'<p class="muted">'+esc(tr('No new requests.','Inga nya förfrågningar.','Geen nieuwe aanvragen.'))+'</p>')+
    '<div class="acts"><button type="button" class="btn sm primary" data-act="af-download"'+(open.length?'':' disabled')+'>'+esc(tr('Download the list for Artie (.txt)','Ladda ner listan till Artie (.txt)','Lijst voor Artie downloaden (.txt)'))+'</button><button type="button" class="btn sm" data-act="af-sent"'+(open.length?'':' disabled')+'>'+esc(tr('Mark as sent','Markera som skickade','Als verstuurd markeren'))+'</button><a class="btn sm" href="#autofill">'+esc(tr('All requests','Alla förfrågningar','Alle aanvragen'))+'</a></div>';
  const flags=REV.flags.length?'<div class="stack">'+REV.flags.map(f=>flagRow(f,true)).join('')+'</div>':'<p class="muted">'+esc(tr('No open flags.','Inga öppna flaggor.','Geen open meldingen.'))+'</p>';
  const tabs=[['never',tr('Not verified','Inte verifierade','Niet geverifieerd'),c.none],['stale',tr('Changed since verification','Ändrade sedan verifieringen','Gewijzigd sinds verificatie'),c.st],['oldest',tr('Verified longest ago','Verifierade längst sedan','Langst geleden geverifieerd'),c.ok+c.st]];
  let list=species.filter(s=>{const r=REV.st.get(s.sid);return admState.tab==='never'?!r:admState.tab==='stale'?r&&r.stale:!!r});
  if(admState.tab==='never')list.sort(byName);else list.sort((a,b)=>new Date(REV.st.get(a.sid).at)-new Date(REV.st.get(b.sid).at));
  const rows=list.slice(0,admState.n).map(s=>{const r=REV.st.get(s.sid),nm=names(s),m=META.get((s.entries[s.entries.length-1]||{}).id)||{};
    return '<div class="gaprow"><button type="button" class="gapmain" data-open="'+esc(s.sid)+'"><span class="ph" style="--c:'+FCOL[s.form]+'">'+phInner(s,1)+'</span><span style="min-width:0"><span class="lat">'+nm.main+'</span><span class="nm">'+nm.sub+'</span></span></button>'+
      '<span class="muted" style="font-size:13.5px">'+(r?esc(revTitle(r)):esc(tr('Last change ','Senast ändrad ','Laatst gewijzigd ')+(fmtDate(m.updatedAt||m.createdAt)||'–')))+(flagsFor(s.sid).length?' · <b>'+esc(tr('flagged','flaggad','gemeld'))+'</b>':'')+'</span>'+
      '<button type="button" class="btn sm" data-open="'+esc(s.sid)+'">'+esc(tr('Open','Öppna','Openen'))+'</button></div>'}).join('');
  const reg='<div class="seg admtabs" role="group">'+tabs.map(t=>'<button type="button" data-act="adm-tab" data-tab="'+t[0]+'" aria-pressed="'+(admState.tab===t[0])+'">'+esc(t[1])+' ('+t[2]+')</button>').join('')+'</div>'+
    '<div class="stack">'+(rows||'<p class="muted">'+esc(tr('Nothing here.','Inget här.','Niets hier.'))+'</p>')+'</div>'+(list.length>admState.n?'<div class="acts"><button type="button" class="btn sm" data-act="adm-more">'+esc(tr('Show more','Visa fler','Meer tonen'))+' ('+(list.length-admState.n)+')</button></div>':'');
  box.innerHTML=note+(REV.on?sec(esc(tr('Verified species','Verifierade arter','Geverifieerde soorten')),bar):'')+
    sec(esc(tr('Artie requests','Artie-förfrågningar','Artie-aanvragen'))+(open.length?' <span class="admcount">'+open.length+'</span>':''),artie)+
    (REV.on?sec(esc(tr('Flagged for review','Flaggade för granskning','Gemeld voor controle'))+(REV.flags.length?' <span class="admcount">'+REV.flags.length+'</span>':''),flags)+sec(esc(tr('Review register','Granskningsregister','Controleregister')),reg):'');
}

/* ---------- exports ---------- */
function saveFile(filename,data){
  const type=/\.txt$/.test(filename)?'text/plain;charset=utf-8':/\.csv$/.test(filename)?'text/csv;charset=utf-8':/\.json$/.test(filename)?'application/json':'text/html;charset=utf-8';
  const url=URL.createObjectURL(new Blob([data],{type}));
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}
async function sheetPages(list){
  const out=[];
  for(const s of list){
    const ids=[...new Set([s.cover].concat(s.obs.map(o=>o.photo)).filter(Boolean))].slice(0,40),map=new Map();
    await Promise.all(ids.map(async id=>{const u=await dataUrl(id);if(u)map.set(id,u)}));
    const src=id=>map.get(id)||'';
    out.push(sheetFor(s,state.lang,src)+(wantBack(s)?sheetBacks(s,state.lang,src):''));
  }
  return out.join('');
}
function listInView(){return $$('#ovList .sp').map(el=>bySid.get(el.dataset.sid)).filter(Boolean)}
async function printSheets(list){
  if(!list.length){toast(tr('No species to print.','Inga arter att skriva ut.'),'err');return}
  toast(tr('Preparing sheets…','Förbereder blad…'));
  const html=docShell('Skogsträdgårdens artblad',await sheetPages(list));
  const f=document.createElement('iframe');f.style.cssText='position:fixed;width:0;height:0;border:0;left:-9999px';document.body.appendChild(f);
  f.onload=()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(e){toast(tr('Printing is blocked here. Use Download instead.','Utskrift blockeras här. Använd Ladda ner i stället.'),'err')}setTimeout(()=>f.remove(),60000)};
  f.srcdoc=html;
}
async function exportSheets(list,name){
  if(!list.length){toast('No species to export yet.','err');return}
  toast('Preparing sheets…');
  const html=docShell('Skogsträdgårdens artblad · '+name,await sheetPages(list));
  await saveFile('artblad_'+name+'.html',html);
}
function valText(d,v,form){
  if(Array.isArray(v)){if(d.t==='cal')return v.map(n=>MONTH_NAMES[n-1]).join(' ');const o=optsOf(d,form);return v.map(k=>(o.find(x=>x.k===k)||{en:k}).en).join('; ')}
  if(d.t==='single'){const o=optsOf(d,form).find(x=>x.k===v);return o?o.en:v}
  return v;
}
function exportCsv(){
  if(!species.length){toast('No species to export yet.','err');return}
  const keys=Object.keys(DEF).filter(k=>k!=='photo');
  const q=v=>{v=v==null?'':String(v);return /[",\n;]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  const head=['no','latin','form'].concat(keys,['entries','observations']);
  const rows=[].concat(...species.map(s=>[s].concat(s.cvs))).map(s=>[s.no,s.latin,s.form==='w'?'woody':'herbaceous'].concat(keys.map(k=>{const v=s.m[k];return isEmpty(v)?'':valText(DEF[k],v,s.form)}),[s.entries.length,s.obs.length]));
  saveFile('artblad_species_'+today()+'.csv','﻿'+[head].concat(rows).map(r=>r.map(q).join(',')).join('\n'));
}
function exportJson(){
  const strip=a=>a.map(x=>{const c=Object.assign({},x);return c});
  saveFile('artblad_data_'+today()+'.json',JSON.stringify({app:'artblad',exported:new Date().toISOString(),entries:strip(state.entries),obs:strip(state.obs),plantings:strip(state.plantings||[]),lists:strip(state.lists||[]),comments:strip(state.comments||[])},null,2));
}

/* ---------- picture-slot icons (no photo) ---------- */
const PH_ICONS={
  tree:'<circle cx="12" cy="9" r="6"/><path d="M12 15v7M9 22h6"/>',
  smalltree:'<circle cx="12" cy="11" r="4.5"/><path d="M12 15.5v6.5M9.5 22h5"/>',
  shrub:'<path d="M4 18c0-4 2.5-7 5-7 1-3 5-3 6 0 2.5 0 5 3 5 7z"/><path d="M3 21h18"/>',
  herb:'<path d="M12 21V9"/><path d="M12 13c-4 0-6-2.5-6-6 4 0 6 2.5 6 6zM12 11c0-3.5 2-6 6-6 0 3.5-2 6-6 6z"/>',
  ground:'<path d="M3 18c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M7 14c0-2 1-4 3-4M15 14c0-2 1-3.5 3-3.5"/><path d="M3 21h18"/>',
  vine:'<path d="M8 21V3"/><path d="M8 9c3 0 5-1.5 6-4M8 15c3 0 6 1 7 4"/><circle cx="16" cy="6" r="1.8"/>',
  bulb:'<path d="M12 3c0 3-6 6-6 11a6 6 0 0 0 12 0c0-5-6-8-6-11z"/><path d="M9 21.5l3-1 3 1"/>',
  root:'<path d="M10 3l2 3 2-3"/><path d="M8 7h8l-3 14h-2z"/><path d="M9.5 11h3M10.5 15h2"/>',
  sprout:'<path d="M12 21v-8"/><path d="M12 13c-3 0-5-2-5-5 3 0 5 2 5 5zM12 13c3 0 5-2 5-5-3 0-5 2-5 5z"/><path d="M7 21h10"/>'
};
const TYPE_ICON={tree:'tree',shrub:'shrub',subshrub:'shrub',climber:'vine',perennial:'herb',biennial:'herb',annual:'sprout',bulb:'bulb',rootcrop:'root',groundcover:'ground'};
const LAYER_ICON={canopy:'tree',sub:'smalltree',shrub:'shrub',herb:'herb',ground:'ground',root:'root',vert:'vine'};
function phIcon(s){
  const m=s.m,lay=(m.layer||[])[0];
  let k=TYPE_ICON[m.type];
  if(k==='tree'&&(m.layer||[]).indexOf('sub')>=0&&(m.layer||[]).indexOf('canopy')<0)k='smalltree';
  if(!k)k=LAYER_ICON[lay]||(s.form==='w'?'tree':'herb');
  return '<svg class="phi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+PH_ICONS[k]+'</svg>';
}
const phInner=(s,lazy)=>s.cover?'<img src="'+blobSrc(s.cover)+'" alt=""'+(lazy?' loading="lazy"':'')+'>':phIcon(s);

/* ---------- completeness and gaps ---------- */
const has=(m,k)=>!isEmpty(m[k]);
const GAPS=[
  {k:'en',en:'English name',sv:'Engelskt namn',ok:s=>has(s.m,'en')},
  {k:'sv',en:'Swedish name',sv:'Svenskt namn',ok:s=>has(s.m,'sv')},
  {k:'family',en:'Family',sv:'Familj',ok:s=>has(s.m,'family')},
  {k:'type',en:'Plant type / life cycle',sv:'Växttyp / livscykel',ok:s=>has(s.m,'type')},
  {k:'photo',en:'Photo',sv:'Foto',ok:s=>!!s.cover},
  {k:'region',en:'Origin',sv:'Ursprung',ok:s=>has(s.m,'region')},
  {k:'height',en:'Height',sv:'Höjd',ok:s=>has(s.m,'height')},
  {k:'light',en:'Light',sv:'Ljus',ok:s=>has(s.m,'light')},
  {k:'moist',en:'Moisture',sv:'Fukt',ok:s=>has(s.m,'moist')},
  {k:'soil',en:'Soil',sv:'Jord',ok:s=>has(s.m,'soil')},
  {k:'months',en:'Calendar months',sv:'Kalendermånader',ok:s=>['cal1','cal2','cal3','cal4'].some(k=>has(s.m,k))},
  {k:'uses',en:'Uses',sv:'Användning',ok:s=>has(s.m,'uses')},
  {k:'eco',en:'Ecosystem functions',sv:'Ekosystemfunktioner',ok:s=>has(s.m,'eco')},
  {k:'layer',en:'Layer',sv:'Skikt',ok:s=>has(s.m,'layer')},
  {k:'struct',en:'Structure',sv:'Struktur',ok:s=>has(s.m,'struct')},
  {k:'edibility',en:'Edibility',sv:'Ätlighet',ok:s=>has(s.m,'edibility')},
  {k:'hardy',en:'Hardiness zone',sv:'Härdighetszon',ok:s=>['szone','usda','rhs'].some(k=>has(s.m,k))},
  {k:'verdict',en:'Verdict',sv:'Omdöme',ok:s=>has(s.m,'verdict')},
  // Not part of the percentage: cultivars without their own hardiness zone look the same as the species in Pick a plant.
  {k:'cvzone',en:'Cultivar zones',sv:'Sorternas zoner',np:1,ok:s=>!(s.cvs||[]).some(c=>isEmpty(c.own.szone))}
];
const missingOf=s=>GAPS.filter(g=>!g.ok(s));
// Which form section holds each gap (names, type and photo sit at the top of the form).
const GAP_SEC={region:'origin',height:'size',light:'site',moist:'site',soil:'site',hardy:'site',months:'cal',uses:'uses',edibility:'uses',eco:'eco',layer:'place',struct:'place',verdict:'verdict'};
const GAPS_PCT=GAPS.filter(g=>!g.np);
const completeness=s=>Math.round(100*GAPS_PCT.filter(g=>g.ok(s)).length/GAPS_PCT.length);
const cbar=(s,wide)=>{const c=completeness(s);return '<span class="cbar'+(wide?' wide':'')+'" title="'+esc(tr(c+'% complete',c+' % ifyllt',c+'% ingevuld'))+'"><i style="width:'+c+'%"></i></span><span class="cpct">'+c+'%</span>'};
const gapState={only:''};
function updateGaps(){
  const list=species.filter(s=>!gapState.only||!GAPS.find(g=>g.k===gapState.only).ok(s)).sort((a,b)=>completeness(a)-completeness(b)||byName(a,b));
  const avg=species.length?Math.round(species.reduce((t,s)=>t+completeness(s),0)/species.length):0;
  $('#gapStats').textContent=tr(species.length+' species, on average '+avg+'% complete. Least complete first.',species.length+' arter, i snitt '+avg+' % ifyllda. Minst ifyllda först.',species.length+' soorten, gemiddeld '+avg+'% ingevuld. Minst ingevulde eerst.');
  $('#gapChips').innerHTML='<button type="button" class="chip sm" data-gap="" aria-pressed="'+(!gapState.only)+'"><i></i><span>'+trh('All species','Alla arter')+'</span></button>'+
    GAPS.map(g=>{const n=species.filter(s=>!g.ok(s)).length;return n?'<button type="button" class="chip sm" data-gap="'+g.k+'" aria-pressed="'+(gapState.only===g.k)+'"><i></i><span>'+esc(tr('No '+(g.k==='en'||g.k==='sv'?g.en:g.en.toLowerCase()),'Saknar '+g.sv.toLowerCase(),'Ontbreekt: '+nl(g.en).toLowerCase()))+' <b class="gn">'+n+'</b></span></button>':''}).join('');
  $('#gapSel').innerHTML='<option value="">'+esc(tr('All species','Alla arter'))+'</option>'+GAPS.map(g=>{const n=species.filter(s=>!g.ok(s)).length;return n?'<option value="'+g.k+'"'+(gapState.only===g.k?' selected':'')+'>'+esc(tr('No '+(g.k==='en'||g.k==='sv'?g.en:g.en.toLowerCase()),'Saknar '+g.sv.toLowerCase(),'Ontbreekt: '+nl(g.en).toLowerCase()))+' ('+n+')</option>':''}).join('');
  $('#gapList').innerHTML=list.length?list.map(s=>{const miss=missingOf(s),nm=names(s);
    return '<div class="gaprow"><button type="button" class="gapmain" data-open="'+esc(s.sid)+'"><span class="ph" style="--c:'+FCOL[s.form]+'">'+phInner(s,1)+'</span><span style="min-width:0"><span class="lat">'+nm.main+'</span><span class="nm">'+nm.sub+'</span><span class="cline">'+cbar(s,1)+'</span></span></button>'+
      '<div class="gapmiss">'+(miss.length?miss.map(g=>'<span class="pill miss">'+esc(trs(g.en,g.sv))+'</span>').join(''):'<span class="pill">'+tr('Complete','Komplett')+'</span>')+'</div>'+
      '<button type="button" class="btn sm w-only" data-act="gap-add" data-sid="'+esc(s.sid)+'">'+tr('Add info','Lägg till info')+'</button></div>'}).join(''):'<div class="empty"><p>'+tr('No species are missing this.','Inga arter saknar detta.')+'</p></div>';
}

/* ---------- external links ---------- */
function lookupName(latin){
  const w=String(latin||'').replace(/['‘’"].*$/,'').trim().split(/\s+/);
  if(w.length>1&&/^sp{1,2}\.?$/i.test(w[1]))return w[0];
  return w[0]==null?'':(w[1]==='x'||w[1]==='×')?w.slice(0,3).join(' '):w.slice(0,2).join(' ');
}
function extLinks(s){
  const n=lookupName(s.latin);if(!n)return '';
  const wiki='https://'+(state.lang==='sv'?'sv':state.lang==='nl'?'nl':'en')+'.wikipedia.org/wiki/'+encodeURIComponent(n.replace(/ /g,'_'));
  const a=(href,t)=>'<a href="'+esc(href)+'" target="_blank" rel="noopener">'+t+'</a>';
  return '<div class="xlinks"><span>'+tr('Look up','Slå upp')+'</span>'+a('https://pfaf.org/user/Plant.aspx?LatinName='+encodeURIComponent(n).replace(/%20/g,'+'),'PFAF')+a(wiki,'Wikipedia')+a('https://www.gbif.org/species/search?q='+encodeURIComponent(n),'GBIF')+'</div>';
}

/* ---------- near matches ---------- */
const nearMatch=sid=>{const r=species.map(x=>[x,lev(sid,x.sid)]).filter(a=>a[1]>0&&a[1]<=2).sort((a,b)=>a[1]-b[1])[0];return r?r[0]:null};

/* ---------- rename a species ---------- */
function openRename(){const s=selected&&bySid.get(selected);if(!s)return;$('#renBox').hidden=false;$('#renInput').value=s.latin;renHint();$('#renInput').focus()}
function renHint(){
  const s=selected&&bySid.get(selected);if(!s)return;const v=canon($('#renInput').value),sid=slug(v),t=bySid.get(sid),b=$('#renGo');
  let h;
  if(v.split(' ').length<2)h=tr('Enter genus and species.','Ange släkte och art.');
  else if(sid===s.sid&&v===s.latin)h=tr('This is the current name.','Detta är det nuvarande namnet.');
  else if(t&&t!==s)h=tr('“'+t.latin+'” already exists. Renaming merges the two species into one sheet.','”'+t.latin+'” finns redan. Namnbytet slår ihop de två arterna till ett blad.','“'+t.latin+'” bestaat al. Hernoemen voegt de twee soorten samen tot één blad.');
  else h=tr('Moves '+s.entries.length+' entries and '+s.obs.length+' observations to the new name.','Flyttar '+s.entries.length+' poster och '+s.obs.length+' observationer till det nya namnet.','Verplaatst '+s.entries.length+' invoeren en '+s.obs.length+' waarnemingen naar de nieuwe naam.');
  $('#renHint').textContent=h;b.disabled=v.split(' ').length<2||(sid===s.sid&&v===s.latin);
}
async function doRename(){
  const s=selected&&bySid.get(selected);if(!s)return;const v=canon($('#renInput').value),sid=slug(v);
  if(v.split(' ').length<2)return;
  const now=Date.now(),strip=x=>{const o=Object.assign({},x);delete o.id;return o};
  const ents=s.entries.map(e=>({id:e.id,data:Object.assign(strip(e),{sid,latin:v,updatedAt:now})}));
  const obs=s.obs.map(o=>({id:o.id,data:Object.assign(strip(o),{sid,latin:v})}));
  const b=$('#renGo');b.disabled=true;
  try{
    if(SB)await Data.rename(s.sid,sid,v);
    else{await Data.saveMany(ents,obs);if(Fav.has(s.sid)&&s.sid!==sid){Fav.toggle(s.sid);if(!Fav.has(sid))Fav.toggle(sid)}}
    selected=sid;$('#renBox').hidden=true;toast(tr('Renamed to ','Bytt namn till ')+v);updateSheet();
  }catch(e){toast(errMsg(e),'err')}finally{b.disabled=false}
}

/* ---------- rename a cultivar (admins): changes the name on every entry, observation, source, planting and comment ---------- */
function cvItems(c){const s=c.parent,mine=x=>cvKey(x.cultivar)===c.ck;return{obs:s.obs.concat(s.src).filter(mine),pl:s.plantings.filter(mine),cm:(state.comments||[]).filter(x=>x.sid===s.sid&&mine(x))}}
function openCvRename(c){$('#cvRenBox').hidden=false;$('#cvRenInput').value=c.cv;cvRenHint();$('#cvRenInput').focus()}
function cvRenHint(){
  const c=cur();if(!c||!c.isCv)return;const n=cvNorm($('#cvRenInput').value),ex=c.parent.cvs.find(x=>x.ck===cvKey(n)&&x!==c),it=cvItems(c),k=it.obs.length+it.pl.length+it.cm.length;
  $('#cvRenHint').textContent=!n?tr('Type the new name.','Skriv det nya namnet.','Typ de nieuwe naam.'):ex?tr(cvQ(ex.cv)+' already exists. Renaming merges the two cultivars.',cvQ(ex.cv)+' finns redan. Namnbytet slår ihop de två sorterna.',cvQ(ex.cv)+' bestaat al. Hernoemen voegt de twee cultivars samen.'):tr('Changes the name on '+c.entries.length+' entries and '+k+' other records.','Ändrar namnet på '+c.entries.length+' poster och '+k+' andra uppgifter.','Wijzigt de naam bij '+c.entries.length+' invoeren en '+k+' andere gegevens.');
  $('#cvRenGo').disabled=!n||n===c.cv;
}
async function doCvRename(c,n){
  if(!n||n===c.cv)return;
  const ex=c.parent.cvs.find(x=>x.ck===cvKey(n)&&x!==c);if(ex)n=ex.cv;
  const now=Date.now(),strip=x=>{const o=Object.assign({},x);delete o.id;return o},it=cvItems(c);
  const ents=c.entries.map(e=>({id:e.id,data:Object.assign(strip(e),{fields:Object.assign({},e.fields,{cultivar:n}),updatedAt:now})}));
  const re=x=>({id:x.id,data:Object.assign(strip(x),{cultivar:n})});
  const b=$('#cvRenGo');b.disabled=true;
  try{
    await Data.saveRows('plantings',it.pl.map(re));await Data.saveRows('comments',it.cm.map(re));
    await Data.saveMany(ents,it.obs.map(re));
    selCv=cvKey(n);$('#cvRenBox').hidden=true;toast(tr('Renamed to ','Bytt namn till ','Hernoemd naar ')+cvQ(n));updateSheet();
  }catch(e){toast(errMsg(e),'err')}finally{b.disabled=false}
}

/* ---------- where to get seed and plants (stored with the observations, kind:'source') ---------- */
const MATERIAL=O('seed:Seed:Frö|plant:Plants:Plantor|cutting:Cuttings:Sticklingar|scion:Scions:Ympris|division:Divisions:Delningar|other:Other:Annat');
const safeUrl=u=>{u=String(u||'').trim();if(!u)return '';if(!/^https?:\/\//i.test(u))u='https://'+u;try{const x=new URL(u);return /^https?:$/.test(x.protocol)?x.href:''}catch(e){return ''}};
function srcHTML(s){
  if(!s.src.length)return '<p class="muted" style="margin:0">'+(s.isCv?tr('No sources for this cultivar yet.','Inga källor för den här sorten ännu.','Nog geen bronnen voor deze cultivar.'):tr('No sources yet. Add where seed or plants can be found.','Inga källor ännu. Lägg till var man kan få tag på frö eller plantor.'))+'</p>';
  return s.src.map(o=>{const mo=MATERIAL.find(x=>x.k===o.material),u=safeUrl(o.url);
    return '<div class="ent"><span style="min-width:0"><b>'+(u?'<a href="'+esc(u)+'" target="_blank" rel="noopener">'+esc(o.supplier||u)+'</a>':esc(o.supplier||''))+'</b>'+(mo?' <span class="pill">'+trh(mo.en,mo.sv)+'</span>':'')+(s.isCv?'':cvPill(o))+
      (o.text?'<br>'+esc(o.text):'')+'<br><small class="muted">'+esc(o.date||'')+(SB?rowStamp(o.id):'')+'</small></span>'+
      (canEdit(o.id)?'<button class="btn sm danger w-only" data-act="del-obs" data-id="'+esc(o.id)+'">'+tr('Delete','Radera')+'</button>':'')+'</div>'}).join('');
}

/* ---------- auto-fill requests (Artie, the bot) ----------
   Contributors and admins ask for species to be pre-filled from outside sources. Requests are stored in a table
   only admins can read (the database merges doubles); admins download the open ones as a text file for the bot. */
function afParse(line){
  let t=String(line||'').replace(/#.*$/,'').replace(/\s+/g,' ').trim(),cv='';if(!t)return null;
  const q=t.match(/^(.*?)\s*(?:['‘’"“”]([^'‘’"“”]+)['‘’"“”]|\bcv\.?\s+(.+))\s*$/i);if(q&&q[1]){t=q[1].trim();cv=(q[2]||q[3]||'').trim()}
  const latin=canon(t),sid=slug(latin),ok=latin.split(' ').length>=2&&latin.length<=120&&/^[A-Za-z×.\- ]+$/.test(latin)&&/^[a-z0-9]+(-[a-z0-9]+)+$/.test(sid);
  return{latin,sid,cv,ok,raw:String(line).trim()};
}
let afRows=[];
async function artieRequest(lines,btn){
  if(!SB||!CANW){toast(tr('Only contributors can ask for auto-fill.','Bara bidragsgivare kan be om förifyllning.','Alleen bijdragers kunnen om automatisch invullen vragen.'),'err');return}
  const items=[],seen=new Set();lines.map(afParse).filter(Boolean).forEach(x=>{if(x.ok&&seen.has(x.sid))return;seen.add(x.sid);items.push(x)});
  if(!items.length){toast(tr('Type at least one Latin name.','Skriv minst ett latinskt namn.','Typ minstens één Latijnse naam.'),'err');return}
  if(items.length>50){toast(tr('At most 50 names at a time.','Högst 50 namn åt gången.','Maximaal 50 namen tegelijk.'),'err');return}
  if(btn)btn.disabled=true;const out=[];
  for(const x of items){
    if(!x.ok){out.push({x,r:'invalid'});continue}
    try{const r=await SB.rpc('request_autofill',{p_sid:x.sid,p_latin:x.latin});out.push({x,r:r.error?'error':r.data,err:r.error})}catch(e){out.push({x,r:'error',err:e})}
  }
  if(btn)btn.disabled=false;
  const msg={added:tr('requested','begärd','aangevraagd'),duplicate:tr('already requested','redan begärd','al aangevraagd'),filled:tr('already filled in by Artie','redan ifylld av Artie','al ingevuld door Artie'),
    invalid:tr('not a Latin name (genus and species)','inget latinskt namn (släkte och art)','geen Latijnse naam (geslacht en soort)'),error:tr('could not be saved','kunde inte sparas','kon niet worden opgeslagen')};
  const box=$('#afResult');
  if(box&&!$('#v-autofill').hidden){
    box.hidden=false;box.innerHTML='<ul>'+out.map(o=>'<li class="af-'+esc(o.r)+'"><i>'+esc(o.x.ok?o.x.latin:o.x.raw)+'</i>: '+esc(msg[o.r]||o.r)+(o.err?' ('+esc(errMsg(o.err))+')':'')+(o.x.cv&&o.x.ok?' · '+esc(tr('the cultivar part was left out: Artie fills in species only','sortdelen togs bort: Artie fyller bara i arter','het cultivardeel is weggelaten: Artie vult alleen soorten in'))+'':'')+'</li>').join('')+'</ul>';
    const n=out.filter(o=>o.r==='added').length;if(n)$('#afNames').value='';
  }else{const o=out[0];toast((o.x.ok?o.x.latin:o.x.raw)+': '+(msg[o.r]||o.r),o.r==='added'||o.r==='duplicate'||o.r==='filled'?'':'err')}
  if(isAdmin())loadAfRows();
}
async function loadAfRows(){
  if(!SB||!isAdmin())return;
  try{const r=await SB.from('autofill_requests').select('sid,latin,n,status,first_requested_at,last_requested_at,sent_at').order('first_requested_at');if(r.error)throw r.error;afRows=r.data||[]}catch(e){afRows=[];toast(errMsg(e),'err')}
  renderAfAdmin();if(!$('#v-admin').hidden)updateAdmin();updateAdminBadge();
}
function renderAfAdmin(){
  const box=$('#afAdmin');if(!box)return;
  if(!isAdmin()){box.innerHTML='';return}
  const open=afRows.filter(r=>r.status==='open'),sent=afRows.filter(r=>r.status!=='open');
  const row=r=>'<div class="ent'+(r.status==='open'?'':' muted')+'"><span><i>'+esc(r.latin)+'</i> · '+esc(tr('asked by ','begärd av ','gevraagd door '))+r.n+' '+esc(r.n===1?tr('person','person','persoon'):tr('people','personer','personen'))+' · '+esc(fmtDate(r.first_requested_at))+(r.status==='open'?'':' · '+esc(tr('sent to Artie ','skickad till Artie ','naar Artie gestuurd '))+esc(fmtDate(r.sent_at)))+'</span><button type="button" class="btn sm danger" data-act="af-del" data-sid="'+esc(r.sid)+'">'+esc(tr('Remove','Ta bort','Verwijderen'))+'</button></div>';
  box.innerHTML='<h2 class="hsec">'+trh('Requests (admins only)','Förfrågningar (bara admin)','Aanvragen (alleen beheerders)')+' <em>'+open.length+' '+esc(tr('open','öppna','open'))+'</em></h2>'+
    '<p class="muted">'+esc(tr('Only admins see this list. Download the open requests, give the file to Artie (species.txt in the bot repository), then mark them as sent.','Bara admin ser listan. Ladda ner de öppna förfrågningarna, ge filen till Artie (species.txt i botens förråd) och markera dem som skickade.','Alleen beheerders zien deze lijst. Download de open aanvragen, geef het bestand aan Artie (species.txt in de bot-repository) en markeer ze daarna als verstuurd.'))+'</p>'+
    '<div class="acts"><button type="button" class="btn sm primary" data-act="af-download"'+(open.length?'':' disabled')+'>'+esc(tr('Download open requests (.txt)','Ladda ner öppna förfrågningar (.txt)','Open aanvragen downloaden (.txt)'))+'</button><button type="button" class="btn sm" data-act="af-sent"'+(open.length?'':' disabled')+'>'+esc(tr('Mark open requests as sent','Markera öppna som skickade','Open aanvragen als verstuurd markeren'))+'</button></div>'+
    '<div class="stack">'+(afRows.length?open.concat(sent).map(row).join(''):'<p class="muted">'+esc(tr('No requests yet.','Inga förfrågningar ännu.','Nog geen aanvragen.'))+'</p>')+'</div>'+
    (sent.length?'<p class="muted" style="font-size:13px">'+esc(tr('Remove a sent request if Artie could not fill it in, so it can be asked for again.','Ta bort en skickad förfrågan om Artie inte kunde fylla i den, så att den kan begäras igen.','Verwijder een verstuurde aanvraag als Artie hem niet kon invullen, zodat hij opnieuw kan worden aangevraagd.'))+'</p>':'');
}
function afDownload(){
  const open=afRows.filter(r=>r.status==='open');if(!open.length)return;
  saveFile('artie-requests-'+today()+'.txt','# Artie auto-fill requests, downloaded '+today()+' ('+open.length+' species)\n# One Latin name per line. Paste the names into species.txt in the artie-bot repository.\n'+open.map(r=>r.latin).join('\n')+'\n');
}
async function afMarkSent(){
  const open=afRows.filter(r=>r.status==='open').map(r=>r.sid);if(!open.length)return;
  try{const r=await SB.rpc('autofill_mark_sent',{p_sids:open});if(r.error)throw r.error;toast(tr('Marked as sent: ','Markerade som skickade: ','Als verstuurd gemarkeerd: ')+r.data)}catch(e){toast(errMsg(e),'err')}
  loadAfRows();
}
async function afDelete(sid){
  try{const r=await SB.from('autofill_requests').delete().eq('sid',sid).select('sid');if(r.error)throw r.error;if(!r.data||!r.data.length)throw gone()}catch(e){toast(errMsg(e),'err')}
  loadAfRows();
}
let afPrefill='';
function updateAutofill(){
  if(afPrefill){const ta=$('#afNames'),have=String(ta.value||'').split(/\n/).map(x=>canon(x));if(have.indexOf(afPrefill)<0)ta.value=(ta.value.trim()?ta.value.trim()+'\n':'')+afPrefill;afPrefill='';ta.focus()}
  const ro=!SB||!CANW;$('#afForm').hidden=ro;$('#afRo').hidden=!ro;
  if(isAdmin())loadAfRows();else renderAfAdmin();
}

/* ---------- my contributions ---------- */
function statsFor(uid){
  const mine=id=>(META.get(id)||{}).author===uid;
  const ents=state.entries.filter(e=>mine(e.id)&&!e.snapshot&&!isSrcEnt(e)),obs=state.obs.filter(o=>mine(o.id));
  const first=s=>s.entries.filter(e=>!isSrcEnt(e)).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0))[0];
  const started=species.filter(s=>{const f=first(s);return f&&mine(f.id)});
  // Each species and each cultivar you add information to counts once; a species you started yourself does not count again (its cultivars do).
  const touched=new Set(ents.map(e=>{const c=entCv(e);return c?e.sid+'--'+cvKey(c):e.sid}));started.forEach(s=>touched.delete(s.sid));
  const facts=ents.reduce((t,e)=>t+Object.keys(e.fields||{}).length,0);
  const nObs=obs.filter(o=>o.kind!=='source').length,nSrc=obs.filter(o=>o.kind==='source').length;
  const photos=obs.filter(o=>o.photo).length+ents.filter(e=>e.fields&&e.fields.photo).length;
  const d=new Date(),m0=new Date(d.getFullYear(),d.getMonth(),1).getTime();
  const month=ents.filter(e=>(e.createdAt||0)>=m0).length+obs.filter(o=>(o.createdAt||0)>=m0).length;
  const points=5*started.length+2*touched.size+nObs+nSrc+photos+Math.floor(facts/5);
  return {started:started.length,expanded:touched.size,entries:ents.length,facts,obs:nObs,src:nSrc,photos,month,points};
}
/* Contribution shields: six ladders of five growth stages (seed to forest elder), and three overall shields
   (copper beech, silver birch, golden larch) for reaching stage 3, 4 and 5 on every ladder. */
const STAGES=[
  {en:'Seed',sv:'Frö',nl:'Zaad',c:'#8b6b4a',g:'<ellipse cx="12" cy="13.5" rx="4.2" ry="5.8"/><path d="M12 8.5c-1.2 2-1.2 7 0 10"/>'},
  {en:'Sprout',sv:'Grodd',nl:'Kiemplant',c:'#7fa83f',g:'<path d="M12 21v-8"/><path d="M12 13c-3 0-5-2-5-5 3 0 5 2 5 5zM12 13c3 0 5-2 5-5-3 0-5 2-5 5z"/><path d="M8 21h8"/>'},
  {en:'Sapling',sv:'Planta',nl:'Jong boompje',c:'#4f8f3a',g:'<path d="M12 21V8"/><path d="M12 12c-2.6 0-4.4-1.6-4.4-4.2 2.6 0 4.4 1.6 4.4 4.2zM12 10c2.6 0 4.4-1.6 4.4-4.2-2.6 0-4.4 1.6-4.4 4.2zM12 16c-2.4 0-4-1.4-4-3.6 2.4 0 4 1.4 4 3.6zM12 15c2.4 0 4-1.4 4-3.6-2.4 0-4 1.4-4 3.6z"/>'},
  {en:'Tree',sv:'Träd',nl:'Boom',c:'#2f6b3f',g:'<circle cx="12" cy="9" r="6"/><path d="M12 15v7M9 22h6"/>'},
  {en:'Forest elder',sv:'Skogens äldste',nl:'Bosoudste',c:'#173d29',rim:'#d4a72c',g:'<path d="M4.5 11.5C4.5 7 8 4 12 4s7.5 3 7.5 7.5c0 2.6-2 4.5-4.5 4.5H9c-2.5 0-4.5-1.9-4.5-4.5z"/><path d="M10 16v5M14 16v5M7.5 21h9M12 16v-3M9.5 13l2.5 1.5 2.5-1.5"/>'}
];
const LADDERS=[
  {k:'started',t:['Pioneer','Pionjär','Pionier'],en:'Species started',sv:'Arter startade',nl:'Soorten gestart',need:[1,5,10,25,50],ic:'<path d="M12 20v-7"/><path d="M12 13c-3 0-5-2-5-5 3 0 5 2 5 5zM12 13c3 0 5-2 5-5-3 0-5 2-5 5z"/>'},
  {k:'facts',t:['Fact gatherer','Faktasamlare','Feitenverzamelaar'],en:'Facts filled in',sv:'Ifyllda uppgifter',nl:'Ingevulde gegevens',need:[50,100,250,500,1000],ic:'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 11h5M10 14h5M10 17h3"/>'},
  {k:'expanded',t:['Helping hand','Hjälpande hand','Helpende hand'],en:'Species or cultivars added to',sv:'Arter eller sorter du bidragit till',nl:'Soorten of cultivars aangevuld',need:[5,10,25,50,100],ic:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'},
  {k:'obs',t:['Field notes','Fältanteckningar','Veldnotities'],en:'Observations',sv:'Observationer',nl:'Waarnemingen',need:[5,10,25,50,100],ic:'<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>'},
  {k:'photos',t:['Photographer','Fotograf','Fotograaf'],en:'Photos',sv:'Foton',nl:'Foto\'s',need:[5,10,25,50,100],ic:'<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.4"/>'},
  {k:'src',t:['Source scout','Källspanare','Bronnenspeurder'],en:'Sources',sv:'Källor',nl:'Bronnen',need:[5,10,25,50,100],ic:'<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'}
];
const GRAND=[
  {en:'Copper beech',sv:'Blodbok',nl:'Bruine beuk',metal:['Bronze','Brons','Brons'],stage:3,c:'#a5592a',g:'<path d="M3.5 12.5C3.5 7.5 7.4 4 12 4s8.5 3.5 8.5 8.5c0 2.2-1.8 3.5-4 3.5h-9c-2.2 0-4-1.3-4-3.5z"/><path d="M12 16v6M9 22h6"/>'},
  {en:'Silver birch',sv:'Silverbjörk',nl:'Zilverberk',metal:['Silver','Silver','Zilver'],stage:4,c:'#8d989c',g:'<path d="M12 22V5"/><path d="M12 8c-3 1-5 4.5-5 8M12 8c3 1 5 4.5 5 8M12 12c-2 .8-3.3 2.5-3.7 5M12 12c2 .8 3.3 2.5 3.7 5"/><path d="M11 10h2M11 15h2M11 19h2"/>'},
  {en:'Golden larch',sv:'Gyllenlärk',nl:'Goudlariks',metal:['Gold','Guld','Goud'],stage:5,c:'#c08f12',g:'<path d="M12 3l6.5 13h-13z"/><path d="M12 16v6M9 22h6M8.5 11h7"/>'}
];
const SHIELD='M24 2 L44 9 V27 C44 40.5 35.5 49.5 24 54 C12.5 49.5 4 40.5 4 27 V9 Z';
const stageOf=(L,v)=>L.need.filter(n=>v>=n).length; // 0 = not started, 1..5
// One shield: filled in its colour when earned, a dashed outline when still to come.
function shieldSvg(glyph,col,rim,on){
  return '<svg class="shd'+(on?' on':'')+'" viewBox="0 0 48 56" aria-hidden="true"'+(on?' style="--sc:'+col+';--sr:'+(rim||col)+'"':'')+'><path class="sh-bg" d="'+SHIELD+'"/><path class="sh-rim" d="'+SHIELD+'" fill="none"/>'+
    '<g transform="translate(12 13)" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="sh-ic">'+glyph+'</g></svg>';
}
const stName=st=>tr(st.en,st.sv,st.nl);
function ladderHTML(L,t){
  const v=t[L.k],n=stageOf(L,v),cur=n?STAGES[n-1]:null,nx=n<5?STAGES[n]:null,need=nx?L.need[n]:0,prev=n?L.need[n-1]:0;
  const pct=nx?Math.round(100*Math.min(1,v/need)):100;
  const pips='<span class="pips" aria-label="'+esc(tr('Stage '+n+' of 5','Steg '+n+' av 5','Stap '+n+' van 5'))+'">'+STAGES.map((st,i)=>'<i'+(i<n?' style="background:'+st.c+'"':'')+'></i>').join('')+'</span>';
  return '<div class="lad'+(n?' on':'')+'"><div class="ladh"><svg class="lic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+L.ic+'</svg><span class="ladt"><b>'+esc(tr(L.t[0],L.t[1],L.t[2]))+'</b><small>'+esc(tr(L.en,L.sv,L.nl))+'</small></span><span class="ladn">'+v+'</span></div>'+
    '<div class="ladrow"><div class="sh1">'+(cur?shieldSvg(cur.g,cur.c,cur.rim,true):shieldSvg(STAGES[0].g,'',null,false))+'<small>'+(cur?'<b>'+esc(stName(cur))+'</b>':esc(tr('Not started','Inte påbörjad','Nog niet begonnen')))+'</small></div>'+
    (nx?'<span class="ladarr" aria-hidden="true">→</span><div class="sh1 next">'+shieldSvg(nx.g,'',null,false)+'<small>'+esc(stName(nx))+'</small></div>'+
      '<div class="ladp"><span class="prog" aria-label="'+v+' / '+need+'"><i style="width:'+pct+'%;background:'+nx.c+'"></i></span><small>'+esc(tr(v+' / '+need+' · '+(need-v)+' to go',v+' / '+need+' · '+(need-v)+' kvar',v+' / '+need+' · nog '+(need-v)))+'</small></div>'
      :'<div class="ladp"><small class="got">'+esc(tr('All five stages reached','Alla fem steg uppnådda','Alle vijf stappen bereikt'))+'</small></div>')+'</div>'+pips+'</div>';
}
function grandHTML(t){
  const st=LADDERS.map(L=>stageOf(L,t[L.k])),got=GRAND.filter(G=>st.every(n=>n>=G.stage)),nx=GRAND.find(G=>!st.every(n=>n>=G.stage));
  const card=(G,on)=>'<div class="grand'+(on?' on':'')+'">'+shieldSvg(G.g,G.c,null,on)+'<b>'+esc(tr(G.metal[0],G.metal[1],G.metal[2]))+'</b><small>'+esc(tr(G.en,G.sv,G.nl))+'</small>'+
    (on?'<small class="got">'+esc(tr('Earned','Uppnått','Behaald'))+'</small>':'<small>'+esc(tr('Every ladder at '+STAGES[G.stage-1].en,'Alla stegar på '+STAGES[G.stage-1].sv,'Elke ladder op '+STAGES[G.stage-1].nl))+'</small>')+'</div>';
  const todo=nx?LADDERS.map((L,i)=>st[i]>=nx.stage?'':'<li>'+esc(tr(L.en,L.sv,L.nl))+': '+t[L.k]+' / '+L.need[nx.stage-1]+'</li>').join(''):'';
  return '<div class="grands">'+GRAND.map(G=>card(G,got.indexOf(G)>=0)).join('')+'</div>'+
    (nx?'<p class="muted" style="margin:6px 0 0">'+esc(tr('Still needed for '+nx.metal[0]+' ('+nx.en+'):','Kvar till '+nx.metal[1]+' ('+nx.sv+'):','Nog nodig voor '+nx.metal[2]+' ('+nx.nl+'):'))+'</p><ul class="gtodo">'+todo+'</ul>':'<p class="got" style="margin:6px 0 0">'+esc(tr('You have every shield. Thank you!','Du har alla sköldar. Tack!','Je hebt alle schilden. Dank je!'))+'</p>');
}
const shieldCount=t=>LADDERS.reduce((a,L)=>a+stageOf(L,t[L.k]),0)+(()=>{const st=LADDERS.map(L=>stageOf(L,t[L.k]));return GRAND.filter(G=>st.every(n=>n>=G.stage)).length})();
const SHIELD_TOTAL=LADDERS.length*5+GRAND.length;
function updateMe(){
  const box=$('#meBody');if(!box)return;
  if(!SB||!meUid()){box.innerHTML='<p class="muted">'+tr('Sign in to see your contributions.','Logga in för att se dina bidrag.')+'</p>';return}
  const uids=[...new Set([...META.values()].map(m=>m.author).filter(Boolean))];
  const board=uids.map(u=>({u,t:statsFor(u)})).filter(x=>x.t.points>0).sort((a,b)=>b.t.points-a.t.points);
  const t=statsFor(meUid()),rank=board.findIndex(x=>x.u===meUid())+1,myName=PROFILES.get(meUid());
  const nameRow='<p class="meName">'+(myName?esc(trs('Your username: ','Ditt användarnamn: '))+'<b>'+esc(myName)+'</b>':esc(trs('You have no username yet, so others see “a user without a name”.','Du har inget användarnamn än, så andra ser ”en användare utan namn”.')))+' <button type="button" class="btn sm" data-act="set-name">'+esc(myName?trs('Change','Ändra'):trs('Choose a username','Välj ett användarnamn'))+'</button></p>';
  const tile=(n,en,sv,nl)=>'<div class="stat"><b>'+n+'</b><span>'+esc(tr(en,sv,nl))+'</span></div>';
  const top=board.length?board[0].t.points:1;
  box.innerHTML=nameRow+'<p class="rank">'+(rank?esc(tr('You are number '+rank+' of '+board.length+' contributors, with '+t.points+' points.','Du är nummer '+rank+' av '+board.length+' bidragsgivare, med '+t.points+' poäng.','Je staat op plaats '+rank+' van '+board.length+' bijdragers, met '+t.points+' punten.')):esc(tr('No contributions yet. Add a species or some information to get started.','Inga bidrag ännu. Lägg till en art eller information för att komma igång.')))+'</p>'+
    '<div class="stats">'+tile(t.started,'species started','arter startade')+tile(t.expanded,'species or cultivars added to','arter eller sorter du bidragit till','soorten of cultivars aangevuld')+tile(t.facts,'facts filled in','ifyllda uppgifter')+tile(t.obs,'observations','observationer')+tile(t.src,'sources','källor')+tile(t.photos,'photos','foton')+tile(t.month,'this month','denna månad')+'</div>'+
    '<h2 class="hsec">'+trh('Shields','Sköldar','Schilden')+' <em>'+shieldCount(t)+' / '+SHIELD_TOTAL+'</em></h2>'+
    '<p class="muted" style="margin:0 0 8px">'+esc(tr('Each kind of contribution grows through five stages: seed, sprout, sapling, tree and forest elder. Reach the same stage on all six to earn the overall shields.','Varje slags bidrag växer genom fem steg: frö, grodd, planta, träd och skogens äldste. Nå samma steg på alla sex för att få de stora sköldarna.','Elke soort bijdrage groeit in vijf stappen: zaad, kiemplant, jong boompje, boom en bosoudste. Bereik dezelfde stap bij alle zes om de grote schilden te verdienen.'))+'</p>'+
    '<div class="ladders">'+LADDERS.map(L=>ladderHTML(L,t)).join('')+'</div>'+
    '<h2 class="hsec">'+trh('Overall shields','Stora sköldar','Grote schilden')+'</h2>'+grandHTML(t)+
    '<h2 class="hsec">'+trh('Leaderboard','Topplista')+'</h2><p class="muted" style="margin:0 0 8px">'+esc(tr('Others are shown without names.','Andra visas utan namn.'))+'</p>'+
    '<div class="board">'+board.map((x,i)=>'<div class="brow'+(x.u===meUid()?' me':'')+'"><span class="bn2">'+(i+1)+'</span><span class="bl">'+esc(x.u===meUid()?tr('You','Du'):tr('Contributor','Bidragsgivare'))+'</span><span class="bb"><i style="width:'+Math.max(4,Math.round(100*x.t.points/top))+'%"></i></span><span class="bp">'+x.t.points+'</span></div>').join('')+'</div>'+
    '<p class="muted" style="font-size:13px;margin-top:10px">'+esc(tr('Points: 5 per species you start, 2 per species or cultivar you add to, 1 per observation, source or photo, and 1 per 5 facts.','Poäng: 5 per art du startar, 2 per art eller sort du bidrar till, 1 per observation, källa eller foto, och 1 per 5 uppgifter.','Punten: 5 per soort die je start, 2 per soort of cultivar die je aanvult, 1 per waarneming, bron of foto, en 1 per 5 gegevens.'))+'</p>';
}

/* ---------- planning: compare ---------- */
const CMP_MAX=4;
let cmpMode=false;
function updateCmpBar(){const b=$('#cmpBar');if(!b)return;const n=cmp.filter(x=>byRef(x)).length;b.hidden=!cmpMode;$('#cmpN').textContent=n;$('#cmpGo').disabled=n<2;const pb=$('#pickCmpBar');if(pb){pb.hidden=!n;$('#pickCmpN').textContent=n;$('#pickCmpGo').disabled=n<2}$$('[data-act=cmp-mode]').forEach(x=>x.setAttribute('aria-pressed',cmpMode))}
let cmp=(()=>{try{const a=JSON.parse(store.get('ab.cmp')||'[]');return Array.isArray(a)?a.slice(0,CMP_MAX):[]}catch(e){return []}})();
const saveCmp=()=>store.set('ab.cmp',JSON.stringify(cmp));
function cmpAdd(sid){if(cmp.indexOf(sid)<0){if(cmp.length>=CMP_MAX)cmp.shift();cmp.push(sid);saveCmp()}}
function updateCompare(){
  cmp=cmp.filter(x=>byRef(x));
  const list=cmp.map(byRef),lang=state.lang;
  const opts=species.slice().sort(byName).map(x=>'<option value="'+esc(x.sid)+'">'+esc(dispName(x))+'</option>'+x.cvs.map(c=>'<option value="'+esc(c.ref)+'">'+'\u00a0\u00a0\u00a0'+esc(dispName(c))+'</option>').join('')).join('');
  $('#cmpPick').innerHTML='<option value="">'+esc(tr('Add a species…','Lägg till en art…'))+'</option>'+opts;
  $('#cmpPick').disabled=list.length>=CMP_MAX;
  if(!list.length){$('#cmpTable').innerHTML='<div class="empty"><p>'+tr('Pick two to four species to see them side by side. You can also use “Compare” on a species page, or “Add my favourites”.','Välj två till fyra arter för att se dem sida vid sida. Du kan också använda ”Jämför” på en artsida eller ”Lägg till mina favoriter”.')+'</p></div>';return}
  const V=(x,k)=>{const d=DEF[k],v=x.m[k];return isEmpty(v)||!d?'':esc(vtl(d,v,x.form,lang))};
  const months=(x,k)=>'<span class="cmo">'+MONTHS.map((l,i)=>'<i'+((x.m[k]||[]).indexOf(i+1)>=0?' class="on"':'')+' title="'+MONTH_NAMES[i]+'"></i>').join('')+'</span>';
  const rows=[
    ['Type','Typ',x=>V(x,'type')],['Status','Status',x=>V(x,'status')],
    ['Height × spread','Höjd × bredd',x=>!isEmpty(x.m.height)?esc(x.m.height+(isEmpty(x.m.spread)?'':' × '+x.m.spread)+' '+(unitOf(DEF.height,x.form)||'')):''],
    ['Light','Ljus',x=>V(x,'light')],['Moisture','Fukt',x=>V(x,'moist')],['Soil','Jord',x=>V(x,'soil')],['pH','pH',x=>V(x,'ph')],['Tolerates','Tål',x=>V(x,'tol')],
    ['Hardiness','Härdighet',x=>[x.m.usda?'USDA '+esc(x.m.usda):'',x.m.szone?'SE '+esc(x.m.szone):'',x.m.rhs?'RHS '+esc(x.m.rhs):''].filter(Boolean).join(' · ')],
    ['Layer','Skikt',x=>V(x,'layer')],['Role','Roll',x=>V(x,'role')],['Structure','Struktur',x=>V(x,'struct')],
    ['cal1','',x=>x.m.cal1?months(x,'cal1'):''],['cal2','',x=>x.m.cal2?months(x,'cal2'):''],['cal3','',x=>x.m.cal3?months(x,'cal3'):''],['cal4','',x=>x.m.cal4?months(x,'cal4'):''],
    ['Uses','Användning',x=>V(x,'uses')],['Edibility','Ätlighet',x=>isEmpty(x.m.edibility)?'':x.m.edibility===0?esc(trs('Inedible','Oätlig')):dots(x.m.edibility,5)],['Yield','Skörd',x=>V(x,'yield')],['Ecosystem','Ekosystem',x=>V(x,'eco')],
    ['Effort','Insats',x=>V(x,'effort')],['Establishment','Etablering',x=>V(x,'estab')],['Propagation','Förökning',x=>V(x,'prop')],
    ['Use it?','Använda?',x=>x.m.verdict?dots(x.m.verdict,5):''],['Invasive risk (SE)','Invasionsrisk',x=>V(x,'invasive')],['Cautions','Varningar',x=>V(x,'caut')],
    ['Good with','Passar med',x=>V(x,'goodWith')],['Avoid near','Undvik nära',x=>V(x,'avoid')]
  ];
  const head='<tr><th></th>'+list.map(x=>{const nm=names(x);return '<th><div class="cmph"><span class="ph" style="--c:'+FCOL[x.form]+'">'+phInner(x,1)+'</span><button type="button" class="lnk" data-open="'+esc(x.ref)+'"><span class="lat">'+nm.main+'</span></button><span class="nm">'+nm.sub+'</span><span class="cmpacts">'+starBtn(x.sid)+addListSelect(x.sid)+'<button type="button" class="btn sm" data-cmp-del="'+esc(x.ref)+'">'+tr('Remove','Ta bort')+'</button></span></div></th>'}).join('')+'</tr>';
  const body=rows.map(r=>{const cells=list.map(r[2]);if(!cells.some(Boolean))return '';
    const ca=CAL_ACT.find(z=>z[0]===r[0]),lab=ca?trh(ca[1],ca[2]):trh(r[0],r[1]);
    const diff=new Set(cells.map(c=>c.replace(/<[^>]+>/g,''))).size>1;
    return '<tr'+(diff?' class="diff"':'')+'><th scope="row">'+lab+'</th>'+cells.map(c=>'<td>'+(c||'<span class="muted">–</span>')+'</td>').join('')+'</tr>'}).join('');
  $('#cmpTable').innerHTML='<div class="tbl"><table class="cmpt"><thead>'+head+'</thead><tbody>'+body+'</tbody></table></div><p class="muted" style="font-size:13px">'+tr('Rows where the species differ are marked. Empty rows are hidden.','Rader där arterna skiljer sig är markerade. Tomma rader döljs.')+'</p>';
}

/* ---------- planning: calendar ---------- */
const calState={set:'all',acts:new Set(['cal1','cal2','cal3','cal4']),cv:store.get('ab.calcv')!=='0'};
const CAL_ACT=[['cal1','Plant / sow','Plantera / så'],['cal2','Flower','Blomning'],['cal3','Harvest','Skörd'],['cal4','Prune / cut','Beskär / skär']];
function updateCalendar(){
  const lang=state.lang,mo=new Date().getMonth();
  let pool=calState.set==='fav'?species.filter(x=>Fav.has(x.sid)):calState.set==='cmp'?cmp.map(byRef).filter(Boolean):calState.set==='list'?listInView():species;
  const acts=CAL_ACT.filter(a=>calState.acts.has(a[0]));
  const list=pool.filter(x=>acts.some(a=>!isEmpty(x.m[a[0]]))||(calState.cv&&(x.cvs||[]).some(c=>acts.some(a=>!isEmpty(c.own[a[0]]))))).sort(byName);
  $$('#calSet button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.calset===calState.set));
  $$('#calActs [data-calact]').forEach(b=>b.setAttribute('aria-pressed',calState.acts.has(b.dataset.calact)));
  const miss=pool.length-list.length;
  $('#calNote').textContent=tr(list.length+' species with months'+(miss?'; '+miss+' have none recorded yet.':'.'),list.length+' arter med månader'+(miss?'; '+miss+' saknar månader ännu.':'.'),list.length+' soorten met maanden'+(miss?'; bij '+miss+' zijn nog geen maanden vastgelegd.':'.'));
  if(!list.length){$('#calGrid').innerHTML='<div class="empty"><p>'+tr('No calendar months recorded for these species yet.','Inga kalendermånader registrerade för dessa arter ännu.')+'</p></div>';return}
  const mh=MONTHS.map((x,i)=>'<span class="cmh'+(i===mo?' now':'')+'">'+(lang==='sv'?MON_SV[i]:lang==='nl'?MON_NL[i]:MONTH_NAMES[i])+'</span>').join('');
  const cells=x=>MONTHS.map((_,i)=>'<span class="ccell'+(i===mo?' now':'')+'">'+acts.map(a=>(x.m[a[0]]||[]).indexOf(i+1)>=0?'<i class="ca '+a[0]+'" title="'+esc(tr(a[1],a[2]))+'"></i>':'').join('')+'</span>').join('');
  // Cultivars get their own row under the species when their months differ from the species.
  const subs=x=>calState.cv&&!x.isCv&&x.cvs?x.cvs.filter(c=>acts.some(a=>!isEmpty(c.own[a[0]])&&JSON.stringify(c.m[a[0]])!==JSON.stringify(x.m[a[0]]))):[];
  const pc=$('#calCv');if(pc)pc.checked=calState.cv;
  $('#calGrid').innerHTML='<div class="calg"><span class="cname"></span>'+mh+list.map(x=>
    '<button type="button" class="cname" data-open="'+esc(x.ref)+'">'+(commonName(x)?esc(dispName(x)):'<i>'+esc(x.latin)+'</i>'+(x.isCv?' '+esc(cvQ(x.cv)):''))+vmark(x.sid)+'</button>'+cells(x)+
    subs(x).map(c=>'<button type="button" class="cname cvsubn" data-open="'+esc(c.ref)+'" title="'+esc(dispName(c))+'">'+esc(cvQ(c.cv))+'</button>'+cells(c)).join('')).join('')+'</div>';
}

/* ---------- planning: pick a plant ---------- */
const pickState={light:'',moist:0,soil:new Set(),zone:'',temp:'',form:'',scope:'',cv:store.get('ab.pickcv')!=='0'};
// Pick a plant remembers the spot and the filters on this device.
const PKEY='ab.pick';
function pickSave(){try{store.set(PKEY,JSON.stringify({light:pickState.light,moist:pickState.moist,soil:[...pickState.soil],zone:pickState.zone,temp:pickState.temp,form:pickState.form,scope:pickState.scope,adv:{sets:Object.fromEntries(Object.entries(advState.sets).map(([k,v])=>[k,[...v]])),caut:[...advState.caut],inv:advState.inv,verdict:advState.verdict,edib:advState.edib,strict:advState.strict}}))}catch(e){}}
function pickLoad(){try{const d=JSON.parse(store.get(PKEY)||'null');if(!d)return;Object.assign(pickState,{light:d.light||'',moist:d.moist||0,soil:new Set(d.soil||[]),zone:d.zone||'',temp:d.temp||'',form:d.form||'',scope:d.scope||''});
  const a=d.adv||{};Object.keys(advState.sets).forEach(k=>advState.sets[k]=new Set((a.sets||{})[k]||[]));advState.caut=new Set(a.caut||[]);advState.inv=a.inv||'';advState.verdict=a.verdict||0;advState.edib=a.edib||0;advState.strict=!!a.strict}catch(e){}}
// scope: '' = all species, 'fav' = my favourites, 'l:<id>' = one shared list.
function pickScopeSel(){
  const sel=$('#pickScope');if(!sel)return;
  if(pickState.scope.startsWith('l:')&&!listById(pickState.scope.slice(2)))pickState.scope='';
  const ls=(state.lists||[]).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  sel.innerHTML='<option value="">'+esc(tr('All species','Alla arter'))+'</option><option value="fav">'+esc(tr('My favourites','Mina favoriter'))+' ('+Fav.set.size+')</option>'+
    (ls.length?'<optgroup label="'+esc(tr('Shared lists','Delade listor'))+'">'+ls.map(l=>'<option value="l:'+esc(l.id)+'">'+esc(l.name||'–')+' ('+(l.sids||[]).length+')</option>').join('')+'</optgroup>':'');
  sel.value=pickState.scope;
}
function pickInScope(x){
  if(!pickState.scope)return true;
  if(pickState.scope==='fav')return Fav.has(x.sid);
  const L=listById(pickState.scope.slice(2));return !!L&&(L.sids||[]).indexOf(x.sid)>=0;
}
/* Advanced filters: narrow the pool by placement, role, uses, functions, care and cautions. A species without data for a
   chosen filter is kept and marked "?", unless "Hide species without data" is ticked. Cultivars are filtered on their own values. */
const ADV=[['type','Type','Typ','Type',TYPES_ALL],['layer','Layer','Skikt','Laag',LAYER],['role','Role','Roll','Rol',ROLE],['struct','Structure','Struktur','Structuur',STRUCT],['uses','Uses','Användning','Gebruik',USES_ALL],['eco','Ecosystem functions','Ekosystemfunktioner','Ecosysteemfuncties',ECO_ALL],['effort','Effort','Arbetsinsats','Inspanning',EFFORT],['estab','Establishes','Etablering','Vestiging',ESTAB]];
const advState={sets:Object.fromEntries(ADV.map(a=>[a[0],new Set()])),caut:new Set(),inv:'',verdict:0,edib:0,strict:false,open:false};
const advCount=()=>ADV.reduce((t,a)=>t+(advState.sets[a[0]].size?1:0),0)+(advState.caut.size?1:0)+(advState.inv?1:0)+(advState.verdict?1:0)+(advState.edib?1:0);
function buildPickAdv(){
  const el=$('#pickAdv');if(!el)return;const n=advCount();
  el.open=advState.open;
  el.innerHTML='<summary>'+esc(tr('Advanced filters','Avancerade filter','Geavanceerde filters'))+(n?' <span class="badge">'+n+'</span>':'')+'</summary><div class="advb">'+
    '<p class="hint">'+esc(tr('Within each group, any ticked option counts. Groups combine: each one makes the list shorter.','Inom varje grupp räcker ett ikryssat alternativ. Grupperna kombineras: var och en gör listan kortare.','Binnen elke groep telt elke aangevinkte optie. Groepen combineren: elke groep maakt de lijst korter.'))+'</p>'+
    ADV.map(a=>'<div class="fgrp"><span class="fl">'+trh(a[1],a[2],a[3])+'</span><div class="chips">'+a[4].map(o=>'<button type="button" class="chip sm" data-adv="'+a[0]+'" data-v="'+o.k+'" aria-pressed="'+advState.sets[a[0]].has(o.k)+'"><i></i><span>'+labUI(o)+'</span></button>').join('')+'</div></div>').join('')+
    '<div class="fgrp"><span class="fl">'+trh('Leave out species with','Uteslut arter med','Laat soorten weg met')+'</span><div class="chips">'+CAUT.map(o=>'<button type="button" class="chip sm ex" data-advx="'+o.k+'" aria-pressed="'+advState.caut.has(o.k)+'"><i></i><span>'+labUI(o)+'</span></button>').join('')+'</div></div>'+
    '<div class="fgrp advacts"><label><span class="fl">'+trh('Invasive risk (Sweden)','Invasionsrisk (Sverige)','Invasierisico (Zweden)')+'</span><select id="advInv">'+
      [['',tr('Any','Alla','Alle')],['nohigh',tr('Leave out high risk','Uteslut hög risk','Hoog risico weglaten')],['none',tr('Only species with no risk','Bara arter utan risk','Alleen soorten zonder risico')]].map(o=>'<option value="'+o[0]+'"'+(advState.inv===o[0]?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select></label>'+
    '<label><span class="fl">'+trh('Edibility at least','Ätlighet minst','Eetbaarheid minstens')+'</span><select id="advEdib">'+[0,1,2,3,4,5].map(v=>'<option value="'+v+'"'+(advState.edib===v?' selected':'')+'>'+(v?v+' / 5':esc(tr('Any','Alla','Alle')))+'</option>').join('')+'</select></label>'+
    '<label><span class="fl">'+trh('Use it? at least','Använda? minst','Gebruiken? minstens')+'</span><select id="advVerdict">'+[0,2,3,4,5].map(v=>'<option value="'+v+'"'+(advState.verdict===v?' selected':'')+'>'+(v?v+' / 5':esc(tr('Any','Alla','Alle')))+'</option>').join('')+'</select></label></div>'+
    '<div class="advacts"><label class="pkopt"><input type="checkbox" id="advStrict"'+(advState.strict?' checked':'')+'> <span>'+esc(tr('Hide species without data for these filters','Dölj arter som saknar uppgifter för dessa filter','Soorten zonder gegevens voor deze filters verbergen'))+'</span></label>'+
    (n?'<button type="button" class="btn sm" data-act="adv-clear">'+esc(tr('Clear advanced filters','Rensa avancerade filter','Geavanceerde filters wissen'))+'</button>':'')+'</div></div>';
}
// Returns null when x is filtered out, otherwise the list of filters x has no data for.
function advCheck(x){
  const m=x.m,unk=[];
  for(const a of ADV){const S=advState.sets[a[0]];if(!S.size)continue;const v=m[a[0]];if(isEmpty(v)){unk.push(a);continue}if(![].concat(v).some(k=>S.has(k)))return null}
  if(advState.caut.size&&(m.caut||[]).some(k=>advState.caut.has(k)))return null;
  if(advState.inv){const v=m.invasive;if(!v)unk.push(['invasive','Invasive risk','Invasionsrisk','Invasierisico']);else if(v==='high'||(advState.inv==='none'&&v!=='none'))return null}
  if(advState.verdict){const v=m.verdict;if(!v)unk.push(['verdict','Use it?','Använda?','Gebruiken?']);else if(v<advState.verdict)return null}
  if(advState.edib){const v=m.edibility;if(isEmpty(v))unk.push(['edibility','Edibility','Ätlighet','Eetbaarheid']);else if(Number(v)<advState.edib)return null}
  if(advState.strict&&unk.length)return null;
  return unk;
}
const zoneMax=z=>{const n=String(z||'').match(/\d+/g);return n?Math.max.apply(null,n.map(Number)):null};
/* ---------- hardiness on one temperature scale ----------
   USDA zones and RHS ratings are defined by the lowest winter temperature. Swedish zones are not (they also reflect
   the growing season), so their temperatures here are approximate. A range like "2-7" means: grows in zones 2 to 7;
   the coldest zone in it (USDA: lowest number, Swedish: highest number) says how hardy the plant is. */
const usdaLo=(n,h)=>Math.round(((-60+10*(n-1)+(h==='b'?5:0))-32)/1.8*10)/10;   // lower edge in °C
const usdaTok=z=>[...String(z||'').toLowerCase().matchAll(/(\d{1,2})\s*([ab])?/g)].map(m=>({n:+m[1],h:m[2]||''})).filter(t=>t.n>=1&&t.n<=13);
const seTok=z=>(String(z||'').match(/\d+/g)||[]).map(Number).filter(n=>n>=1&&n<=8);
const RHS_K=RHS.map(r=>r.k);
// RHS ratings with or without the H: "H5", "5", "h1b", "H4-H6", "4-6". A plain 1 is read as H1c.
const rhsTok=z=>[...String(z||'').toLowerCase().matchAll(/h?\s*([1-7])\s*([abc])?/g)].map(m=>m[1]==='1'?'H1'+(m[2]||'c'):'H'+m[1]).filter(k=>RHS_K.indexOf(k)>=0);
const SE_T=z=>({lo:z>=8?-50:-10-5*z,hi:z>=8?-45:-5-5*z});   // approximate winter minimum band per Swedish zone
// The coldest temperature a plant is rated for, from its Swedish zone, USDA zone or RHS rating (in that order).
function hardOf(m){
  const se=seTok(m.szone);if(se.length){const z=Math.max.apply(null,se);return{t:SE_T(z).lo,by:'se',label:tr('zone ','zon ','zone ')+z}}
  const us=usdaTok(m.usda);if(us.length){const c=us.slice().sort((a,b)=>a.n-b.n||(a.h>b.h?1:-1))[0];return{t:usdaLo(c.n,c.h||'a'),by:'usda',label:'USDA '+c.n+c.h,approx:1}}
  const rh=rhsTok(m.rhs);if(rh.length){const k=rh.slice().sort((a,b)=>RHS_K.indexOf(b)-RHS_K.indexOf(a))[0],r=RHS.find(o=>o.k===k);return{t:r.hi==null?r.lo:r.lo==null?r.hi:r.lo,by:'rhs',label:'RHS '+r.k,approx:1,open:r.lo==null}}
  return null;
}
function zoneNorm(v,kind){
  if(kind==='rhs'){const t=rhsTok(v);if(!t.length)return String(v).trim();t.sort((a,b)=>RHS_K.indexOf(a)-RHS_K.indexOf(b));const a=t[0],b=t[t.length-1];return a===b?a:a+'-'+b}
  if(kind==='se'){const t=seTok(v);if(!t.length)return String(v).trim();const a=Math.min.apply(null,t),b=Math.max.apply(null,t);return a===b?String(a):a+'-'+b}
  const t=usdaTok(v);if(!t.length)return String(v).trim();const k=x=>x.n*2+(x.h==='b'?1:0);t.sort((a,b)=>k(a)-k(b));const a=t[0],b=t[t.length-1];return k(a)===k(b)?a.n+a.h:a.n+a.h+'-'+b.n+b.h;
}
function zoneHint(d,v){
  if(d.zone==='rhs'){
    if(!String(v||'').trim())return tr('E.g. H5, 5 or H4-H6, with or without the H. The hardiest rating counts.','T.ex. H5, 5 eller H4-H6, med eller utan H. Den härdigaste klassen räknas.','Bijv. H5, 5 of H4-H6, met of zonder H. De winterhardste klasse telt.');
    const h=hardOf({rhs:v});if(!h)return tr('Not understood: use ratings H1a to H7, e.g. H5 or 4-6.','Förstås inte: använd klasserna H1a till H7, t.ex. H5 eller 4-6.','Niet begrepen: gebruik de klassen H1a tot H7, bijv. H5 of 4-6.');
    return (h.open?tr('Hardy below ','Härdig under ','Winterhard onder '):tr('Hardy to ','Härdig till ','Winterhard tot '))+fmtC(h.t)+' ('+h.label+')';
  }
  if(!String(v||'').trim())return d.zone==='se'?tr('E.g. 1-4: grows in zones 1 to 4. The highest number counts.','T.ex. 1-4: växer i zon 1 till 4. Den högsta siffran räknas.','Bijv. 1-4: groeit in zone 1 tot 4. Het hoogste getal telt.'):tr('E.g. 5, 5b or 2-7: grows in zones 2 to 7. The lowest number counts.','T.ex. 5, 5b eller 2-7: växer i zon 2 till 7. Den lägsta siffran räknas.','Bijv. 5, 5b of 2-7: groeit in zone 2 tot 7. Het laagste getal telt.');
  const h=hardOf(d.zone==='se'?{szone:v}:{usda:v});
  if(!h)return tr('Not understood: use zone numbers like 5, 5b or 2-7.','Förstås inte: använd zonnummer som 5, 5b eller 2-7.','Niet begrepen: gebruik zonenummers zoals 5, 5b of 2-7.');
  return (d.zone==='se'?tr('Hardy up to ','Härdig upp till ','Winterhard tot ')+h.label+' (≈ '+fmtC(h.t)+')':tr('Hardy to ','Härdig till ','Winterhard tot ')+fmtC(h.t)+' ('+h.label+')');
}
// Older data: herbaceous "types" that were not life cycles, and structural roles that sat under ecosystem functions.
function normFields(f){
  if(!f)return f;const o=Object.assign({},f),add=(k,v)=>{o[k]=[...new Set((o[k]||[]).concat(v))]};
  if(o.type==='bulb'){delete o.type;add('habit','bulbous')}
  else if(o.type==='rootcrop'){delete o.type;add('uses','root')}
  else if(o.type==='groundcover'){delete o.type;add('struct','ground')}
  if(Array.isArray(o.eco)){const mv=o.eco.filter(k=>k==='screen'||k==='wind'||k==='shade');if(mv.length){o.eco=o.eco.filter(k=>mv.indexOf(k)<0);if(!o.eco.length)delete o.eco;add('struct',mv)}}
  return o;
}
function pickEval(x){
  const m=x.m,res=[];
  if(pickState.light){const L=m.light||[];res.push({k:'light',st:L.length?(L.indexOf(pickState.light)>=0||(pickState.light==='shade'&&(m.tol||[]).indexOf('shade')>=0)?'ok':'no'):'?'})}
  if(pickState.moist){const v=m.moist,T=m.tol||[];let st='?';if(v){const d=pickState.moist-v;st=Math.abs(d)<=1||(d>0&&T.indexOf('wet')>=0)||(d<0&&T.indexOf('drought')>=0)?'ok':'no';res.push({k:'moist',st,dir:d})}else res.push({k:'moist',st})}
  if(pickState.soil.size){const S=m.soil||[];res.push({k:'soil',st:S.length?(S.some(z=>pickState.soil.has(z))?'ok':'no'):'?'})}
  if(pickState.temp!==''){const Ts=Number(pickState.temp),h=hardOf(m);
    if(!h)res.push({k:'zone',st:'?'});else res.push({k:'zone',approx:h.by==='se',temp:1,h,st:h.t<=Ts?'ok':h.open?'?':(h.t<=Ts+5?'edge':'no')})}
  else if(pickState.zone){const z=Number(pickState.zone),h=hardOf(m);
    if(!h)res.push({k:'zone',st:'?'});
    else if(h.by==='se'){const mx=zoneMax(m.szone);res.push({k:'zone',st:mx>=z?'ok':(mx>=z-1?'edge':'no'),h})}
    else{const Ts=SE_T(z).lo;res.push({k:'zone',approx:1,h,st:h.t<=Ts?'ok':h.open?'?':(h.t<=Ts+5?'edge':'no')})}}
  if(advCount()){const u=advCheck(x)||[];res.push({k:'adv',st:'ok'});u.forEach(a=>res.push({k:'a:'+a[0],st:'?',lab:a}))}
  return res;
}
function pickTip(r,x){
  const m=x.m;
  if(r.k==='light'){const L=m.light||[];if(pickState.light==='shade'||(pickState.light==='part'&&L.indexOf('sun')>=0&&L.indexOf('part')<0))return tr('Wants more light: use the sunniest edge of the spot, or thin out the plants that shade it.','Vill ha mer ljus: använd platsens soligaste kant, eller gallra det som skuggar.');return tr('Wants more shade: plant on the north side of taller plants, or under a canopy.','Vill ha mer skugga: plantera norr om högre växter eller under ett krontak.')}
  if(r.k==='moist')return r.dir>0?tr('The spot is wetter than it likes: plant on a mound or raised bed and add grit for drainage.','Platsen är blötare än den vill: plantera på en kulle eller upphöjd bädd och tillsätt grus för dränering.'):tr('The spot is drier than it likes: water while it establishes and mulch thickly; a lower or shadier part helps.','Platsen är torrare än den vill: vattna under etableringen och täckodla tjockt; en lägre eller skuggigare del hjälper.');
  if(r.k==='soil'){const S=m.soil||[],sv=s=>SOIL.filter(o=>S.indexOf(o.k)>=0).map(o=>trs(o.en,o.sv)).join(', ');return tr('Prefers '+sv()+': improve the soil with compost, and grit on heavy clay or organic matter on sand.','Föredrar '+sv()+': förbättra jorden med kompost, och grus på styv lera eller organiskt material på sand.','Geeft de voorkeur aan '+sv()+': verbeter de grond met compost, en met grit bij zware klei of organisch materiaal bij zand.')}
  if(r.k==='zone'&&(r.approx||r.temp)){const h=r.h,ap=r.approx;return tr('Hardy to about '+fmtC(h.t)+' ('+h.label+(ap?'; converted, so approximate':'')+'): give it the warmest, most sheltered place (south wall, no frost pocket) and winter protection.','Härdig till ungefär '+fmtC(h.t)+' ('+h.label+(ap?'; omräknat, alltså ungefärligt':'')+'): ge den den varmaste, mest skyddade platsen (sydvägg, ingen frostgrop) och vinterskydd.','Winterhard tot ongeveer '+fmtC(h.t)+' ('+h.label+(ap?'; omgerekend, dus bij benadering':'')+'): geef hem de warmste, meest beschutte plek (zuidmuur, geen vorstgat) en winterbescherming.')}
  if(r.k==='zone')return tr('Hardy to zone '+zoneMax(m.szone)+': give it the warmest, most sheltered place (south wall, no frost pocket) and winter protection.','Härdig till zon '+zoneMax(m.szone)+': ge den den varmaste, mest skyddade platsen (sydvägg, ingen frostgrop) och vinterskydd.','Winterhard tot zone '+zoneMax(m.szone)+': geef hem de warmste, meest beschutte plek (zuidmuur, geen vorstgat) en winterbescherming.');
  return '';
}
const PICK_LAB={light:['Light','Ljus'],moist:['Moisture','Fukt'],soil:['Soil','Jord'],zone:['Zone','Zon']};
const pkBadges=ev=>['light','moist','soil','zone'].map(k=>{const r=ev.find(z=>z.k===k);if(!r)return '';const cls=r.st==='ok'?'ok':r.st==='?'?'unk':r.st==='edge'?'edge':'no';return '<span class="pk '+cls+'"'+(r.approx&&r.h?' title="'+esc(r.h.label+' ≈ '+fmtC(r.h.t))+'"':'')+'>'+esc(tr(PICK_LAB[k][0],PICK_LAB[k][1]))+(r.approx?' ≈':'')+(r.st==='?'?' ?':'')+'</span>'}).join('')+
  ev.filter(r=>r.lab).map(r=>'<span class="pk unk" title="'+esc(tr('No data for this filter yet','Inga uppgifter för detta filter ännu','Nog geen gegevens voor dit filter'))+'">'+esc(tr(r.lab[1],r.lab[2],r.lab[3]))+' ?</span>').join('');
// Small signs at the top right of a Pick a plant result: sources recorded, invasive risk, toxic, very edible.
const PKI={
  seed:'<svg viewBox="0 0 16 16"><path d="M8 2.3c3 1.8 4.3 5.2 3.3 8.1-.6 1.9-2 3.2-3.3 3.2s-2.7-1.3-3.3-3.2C3.7 7.5 5 4.1 8 2.3z" fill="#d7b27a" stroke="#8a6332" stroke-width="1"/><path d="M8 5.2c-.9 2.3-.9 4.9 0 7.4" fill="none" stroke="#8a6332" stroke-width="1" stroke-linecap="round"/></svg>',
  inv:'<svg viewBox="0 0 16 16"><path d="M8 1.6l6.8 12H1.2z" fill="#f4c430" stroke="#a07c00" stroke-width="1" stroke-linejoin="round"/><path d="M8 5.8v3.9" stroke="#3b2f00" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="11.7" r=".95" fill="#3b2f00"/></svg>',
  tox:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7.3" fill="#b8322a"/><path d="M8 3.4c-2.4 0-4 1.6-4 3.8 0 1.3.6 2.2 1.5 2.8v1.7h5V10c.9-.6 1.5-1.5 1.5-2.8 0-2.2-1.6-3.8-4-3.8z" fill="#fff"/><circle cx="6.4" cy="7.3" r="1.05" fill="#b8322a"/><circle cx="9.6" cy="7.3" r="1.05" fill="#b8322a"/><path d="M7 11.7v-1.2M9 11.7v-1.2" stroke="#b8322a" stroke-width=".8"/></svg>',
  edib:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7.3" fill="#2f7d3a"/><path d="M5.3 3.6v2.8a1.25 1.25 0 0 0 2.5 0V3.6M6.55 3.6v8.8M10.6 12.4V3.6c-1.2.6-1.9 2-1.9 3.6v1.7h1.9" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
function pkIcons(x){
  const s=bySid.get(x.sid)||x,m=x.m||{},out=[];
  if((s.src&&s.src.length)||(x.src&&x.src.length))out.push(['seed',tr('Where to get it: sources recorded','Var finns den: källor finns','Waar te krijgen: bronnen vastgelegd')]);
  if(m.invasive==='low'||m.invasive==='high')out.push(['inv',tr('Possibly invasive','Möjligen invasiv','Mogelijk invasief')+' ('+tr('risk ','risk ','risico ')+(m.invasive==='high'?tr('high','hög','hoog'):tr('low','låg','laag'))+')']);
  if((m.caut||[]).indexOf('toxic')>=0)out.push(['tox',tr('Toxic','Giftig','Giftig')]);
  if(Number(m.edibility)>=4)out.push(['edib',tr('Very edible','Mycket ätlig','Zeer eetbaar')+' ('+m.edibility+'/5)']);
  return{n:out.length,html:out.length?'<span class="pkicons">'+out.map(o=>'<span class="pki '+o[0]+'" role="img" title="'+esc(o[1])+'" aria-label="'+esc(o[1])+'">'+PKI[o[0]]+'</span>').join('')+'</span>':''};
}
const cmpChk=(x,small)=>'<label class="cmpchk'+(small?'':' pkchk')+'" title="'+esc(tr('Tick to compare this with others','Kryssa för att jämföra med andra','Aanvinken om te vergelijken'))+'"><input type="checkbox" data-cmpsel="'+esc(x.ref)+'"'+(cmp.indexOf(x.ref)>=0?' checked':'')+' aria-label="'+esc(tr('Compare','Jämför')+' '+dispName(x))+'">'+(small?'':'<span>'+esc(tr('Compare','Jämför'))+'</span>')+'</label>';
function pickRow(x,ev,tips,extra){
  const nm=names(x),ic=pkIcons(x);
  return '<div class="pickrow'+(ic.n?' hasic" style="--ni:'+ic.n:'')+'">'+ic.html+cmpChk(x)+'<button type="button" class="gapmain" data-open="'+esc(x.ref)+'"><span class="ph" style="--c:'+FCOL[x.form]+'">'+phInner(x,1)+'</span><span style="min-width:0"><span class="lat">'+nm.main+'</span><span class="nm">'+nm.sub+'</span></span></button>'+
    '<div style="min-width:0"><div class="pks">'+pkBadges(ev)+(Fav.has(x.sid)?'<span class="pk fav">★ '+tr('Favourite','Favorit')+'</span>':'')+'</div>'+(extra||'')+(tips&&tips.length?'<ul class="tips">'+tips.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>':'')+'</div></div>';
}
// Score one species or cultivar for the spot: fits (ok), could work with help (close), no data (unk) or does not fit (no).
function pickScore(x){const ev=pickEval(x),no=ev.filter(r=>r.st==='no'||r.st==='edge').length,unk=ev.filter(r=>r.st==='?').length,ok=ev.filter(r=>r.st==='ok').length;
  // More than one zone too cold is a hard no: winter protection will not bridge that.
  const hard=ev.some(r=>r.k==='zone'&&r.st==='no');
  return{x,ev,no,unk,ok,cls:no===0&&ok>0?'ok':no===0?'unk':no<=2&&!hard?'close':'no'}}
const RANK={ok:0,close:1,unk:2,no:3};
const byFit=(a,b)=>RANK[a.cls]-RANK[b.cls]||a.no-b.no||a.unk-b.unk;
const cvLabel=x=>x.isCv?esc(cvQ(x.cv)):'<i>'+esc(tr('Species (seed-grown or unnamed cultivar)','Arten (fröodlad eller okänd sort)','Soort (uit zaad of onbekende cultivar)'))+'</i>';
const failed=r=>r.ev.filter(z=>z.st==='no'||z.st==='edge').map(z=>tr(PICK_LAB[z.k][0],PICK_LAB[z.k][1])).join(', ');
function cvRow(r){
  const tips=r.cls==='close'?r.ev.filter(z=>z.st==='no'||z.st==='edge').map(z=>pickTip(z,r.x)):[];
  return '<div class="cvrow '+r.cls+'">'+cmpChk(r.x,1)+'<button type="button" class="cvname" data-open="'+esc(r.x.ref)+'"><span class="vd '+r.cls+'" aria-hidden="true">'+(r.cls==='ok'?'✓':'')+'</span>'+cvLabel(r.x)+'</button>'+
    '<div style="min-width:0"><div class="pks">'+pkBadges(r.ev)+'</div>'+(tips.length?'<ul class="tips">'+tips.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>':'')+'</div></div>';
}
function cvSummary(g){
  const all=g.cands.filter(r=>r.x.isCv),n=k=>all.filter(r=>r.cls===k).length;
  return tr(n('ok')+' of '+all.length+' cultivars fit'+(n('close')?', '+n('close')+' could work with help':''),n('ok')+' av '+all.length+' sorter passar'+(n('close')?', '+n('close')+' kan fungera med hjälp':''),n('ok')+' van '+all.length+' cultivars passen'+(n('close')?', '+n('close')+' kunnen werken met hulp':''));
}
function pickGroup(g){
  const s=g.s;
  if(!s.cvs.length){const r=g.cands[0];return pickRow(s,r.ev,r.cls!=='ok'?r.ev.filter(z=>z.st==='no'||z.st==='edge').map(z=>pickTip(z,s)):null)}
  const shown=g.cands.filter(r=>r.cls==='ok'||r.cls==='close').sort(byFit),no=g.cands.filter(r=>r.cls==='no'),unk=g.cands.filter(r=>r.cls==='unk');
  const sum='<span class="pksum">'+esc(cvSummary(g))+'</span>';
  if(!pickState.cv){const fit=g.cands.filter(r=>r.cls==='ok'&&r.x.isCv);const sr=g.cands[0];
    return pickRow(s,sr.ev,null,sum+(fit.length?'<span class="pksum">'+esc(tr('Fits: ','Passar: ','Past: '))+fit.map(r=>cvQ(r.x.cv)).join(', ')+'</span>':''))}
  const nm=names(s),ic=pkIcons(s);
  return '<div class="pkgrp"><div class="pickrow'+(ic.n?' hasic" style="--ni:'+ic.n:'')+'">'+ic.html+'<span></span><button type="button" class="gapmain" data-open="'+esc(s.sid)+'"><span class="ph" style="--c:'+FCOL[s.form]+'">'+phInner(s,1)+'</span><span style="min-width:0"><span class="lat">'+nm.main+'</span><span class="nm">'+nm.sub+'</span></span></button>'+
    '<div style="min-width:0">'+(Fav.has(s.sid)?'<div class="pks"><span class="pk fav">★ '+tr('Favourite','Favorit')+'</span></div>':'')+sum+'</div></div>'+
    '<div class="cvsub">'+shown.map(cvRow).join('')+
    (no.length?'<div class="cvno"><span class="vd no" aria-hidden="true">✕</span>'+esc(tr(no.length+' do not fit: ',no.length+' passar inte: ',no.length+' passen niet: '))+no.map(r=>cvLabel(r.x)+' <small>('+esc(failed(r))+')</small>').join(', ')+'</div>':'')+
    (unk.length?'<div class="cvno"><span class="vd" aria-hidden="true">?</span>'+esc(tr(unk.length+' without data for this spot: ',unk.length+' utan uppgifter för platsen: ',unk.length+' zonder gegevens voor deze plek: '))+unk.map(r=>cvLabel(r.x)).join(', ')+'</div>':'')+
    '</div></div>';
}
// Table: USDA zones with their temperatures, the RHS ratings and (approximately) the Swedish zones that match.
function buildHardTab(){
  const el=$('#hardTab');if(!el||el.dataset.lang===state.lang)return;el.dataset.lang=state.lang;
  const ov=(a,b,c,d)=>Math.min(b,d)-Math.max(a,c)>0.5;
  // Rows: 5 °C bands of the lowest winter temperature; each column lists the zones or ratings that fall in that band.
  const B=[[-99,-45]];for(let t=-45;t<15;t+=5)B.push([t,t+5]);B.push([15,99]);
  const uz=[];for(let n=1;n<=13;n++)['a','b'].forEach(h=>{const lo=n===1&&h==='a'?-99:usdaLo(n,h),nx=h==='a'?usdaLo(n,'b'):(n===13?99:usdaLo(n+1,'a'));uz.push({k:n+h,lo,hi:nx})});
  const rows=B.slice().reverse().map(([lo,hi])=>{
    const us=uz.filter(z=>ov(lo,hi,z.lo,z.hi)).map(z=>z.k),rh=RHS.filter(r=>ov(lo,hi,r.lo==null?-99:r.lo,r.hi==null?99:r.hi)).map(r=>r.k),se=[1,2,3,4,5,6,7,8].filter(z=>ov(lo,hi,SE_T(z).lo,SE_T(z).hi));
    const t=lo===-99?'< '+fmtC(hi):hi===99?'> '+fmtC(lo):String(lo).replace('-','−')+' … '+fmtC(hi);
    return '<tr><th scope="row">'+t+'</th><td>'+esc(us.join(', ')||'–')+'</td><td>'+esc(rh.join(', ')||'–')+'</td><td>'+(se.length?'≈ '+se.join(', '):'–')+'</td></tr>'});
  el.innerHTML='<summary>'+esc(tr('Hardiness zones compared','Härdighetszoner jämförda','Winterhardheidszones vergeleken'))+'</summary>'+
    '<div class="tbl"><table class="cmpt hardtab"><thead><tr><th scope="col">'+esc(tr('Lowest winter temperature','Lägsta vintertemperatur','Laagste wintertemperatuur'))+'</th><th scope="col">'+esc(tr('USDA zone','USDA-zon','USDA-zone'))+'</th><th scope="col">RHS (UK)</th><th scope="col">'+esc(tr('Swedish zone','Svensk odlingszon','Zweedse zone'))+'</th></tr></thead><tbody>'+rows.join('')+'</tbody></table></div>'+
    '<p class="muted" style="font-size:13px;margin:6px 0 0">'+esc(tr('USDA zones and RHS ratings are defined by the lowest winter temperature (each USDA zone is split into a and b halves of about 3 °C). Swedish zones also reflect the length and warmth of the growing season, so their column is approximate. Pick a plant uses a species’ Swedish zone when it has one, otherwise its USDA zone, otherwise its RHS rating; converted results are marked ≈. In a range such as USDA 2-7 the coldest zone counts.','USDA-zoner och RHS-klasser bestäms av den lägsta vintertemperaturen (varje USDA-zon delas i halvorna a och b, ungefär 3 °C var). Svenska zoner speglar också växtsäsongens längd och värme, så den kolumnen är ungefärlig. Välj en växt använder artens svenska zon om den finns, annars USDA-zonen, annars RHS-klassen; omräknade resultat markeras ≈. I ett intervall som USDA 2-7 räknas den kallaste zonen.','USDA-zones en RHS-klassen worden bepaald door de laagste wintertemperatuur (elke USDA-zone is verdeeld in helften a en b van ongeveer 3 °C). Zweedse zones weerspiegelen ook de lengte en warmte van het groeiseizoen, dus die kolom is bij benadering. Kies een plant gebruikt de Zweedse zone van een soort als die er is, anders de USDA-zone, anders de RHS-klasse; omgerekende resultaten zijn gemarkeerd met ≈. Bij een bereik zoals USDA 2-7 telt de koudste zone.'))+'</p>';
}
function updatePick(){
  updateCmpBar();pickScopeSel();buildHardTab();
  $$('#pickLight [data-pl]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.pl===pickState.light));
  $$('#pickMoist [data-pm]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.pm)===pickState.moist));
  $$('#pickSoil [data-ps]').forEach(b=>b.setAttribute('aria-pressed',pickState.soil.has(b.dataset.ps)));
  $$('#pickForm [data-pf]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.pf===pickState.form));
  const pc=$('#pickCv');if(pc)pc.checked=pickState.cv;
  buildPickAdv();
  pickSave();
  {const ps=$('#pickTemp');if(ps&&ps.dataset.lang!==state.lang){ps.dataset.lang=state.lang;ps.innerHTML='<option value="">–</option>'+[-50,-45,-40,-35,-30,-25,-20,-15,-10,-5,0].map(t=>'<option value="'+t+'">'+fmtC(t)+' ('+esc(tr('≈ Swedish zone ','≈ zon ','≈ Zweedse zone '))+(t<=-50?8:t>=-15?1:Math.min(8,Math.max(1,Math.round((-10-t)/5))))+')</option>').join('')}if(ps)ps.value=pickState.temp;const pz=$('#pickZone');if(pz)pz.value=pickState.zone}
  const any=pickState.light||pickState.moist||pickState.soil.size||pickState.zone||pickState.temp!==''||advCount();
  {const j=$('#pickJump');if(j)j.hidden=true}
  if(!any){$('#pickOut').innerHTML='<div class="empty"><p>'+tr('Describe the spot above: light, moisture, soil and zone. Leave out what you do not know. Advanced filters narrow it down further.','Beskriv platsen ovan: ljus, fukt, jord och zon. Hoppa över det du inte vet. Avancerade filter begränsar urvalet ytterligare.','Beschrijf de plek hierboven: licht, vocht, grond en zone. Laat weg wat je niet weet. Geavanceerde filters beperken de keuze verder.')+'</p></div>';return}
  const pool=species.filter(x=>(!pickState.form||x.form===pickState.form)&&pickInScope(x));
  const scoped=!!pickState.scope;
  if(scoped&&!pool.length){$('#pickOut').innerHTML='<div class="empty"><p>'+(pickState.scope==='fav'?tr('You have no favourites yet. Star species in the species list or on a sheet.','Du har inga favoriter än. Stjärnmärk arter i artlistan eller på ett blad.'):tr('This list has no species yet.','Den här listan har inga arter än.'))+'</p></div>';return}
  // Each species is judged by its best fit: the species itself or any of its cultivars.
  const adv=advCount();
  const groups=pool.map(s=>{const cands=[s].concat(s.cvs).filter(x=>!adv||advCheck(x)).map(pickScore);return cands.length?{s,cands,best:cands.slice().sort(byFit)[0]}:null}).filter(Boolean);
  const good=groups.filter(g=>g.best.cls==='ok').sort((a,b)=>a.best.unk-b.best.unk||(b.best.x.m.verdict||0)-(a.best.x.m.verdict||0)||byName(a.s,b.s));
  const close=groups.filter(g=>g.best.cls==='close'&&(scoped||Fav.has(g.s.sid))).sort((a,b)=>a.best.no-b.best.no||byName(a.s,b.s));
  const sec=(title,rows,empty)=>'<h2 class="hsec">'+title+' <em>'+rows.length+'</em></h2>'+(rows.length?'<div class="splist">'+rows.map(pickGroup).join('')+'</div>':'<p class="muted">'+empty+'</p>');
  const hint='<p class="cmphint"><span class="cmpbox" aria-hidden="true"></span>'+esc(tr('Tick “Compare” on 2 to 4 species or cultivars to see them side by side.','Kryssa i ”Jämför” på 2 till 4 arter eller sorter för att se dem sida vid sida.','Vink “Vergelijken” aan bij 2 tot 4 soorten of cultivars om ze naast elkaar te zien.'))+'</p>';
  {const j=$('#pickJump'),n=good.length+close.length;if(j){j.hidden=!n;j.textContent=tr('Show '+n+' matches ↓','Visa '+n+' träffar ↓','Toon '+n+' resultaten ↓')}}
  $('#pickOut').innerHTML=hint+sec(trh('Good matches','Bra matchningar'),good,tr('No species match everything yet. Try leaving out a condition.','Inga arter matchar allt ännu. Prova att hoppa över ett villkor.'))+
    sec(scoped?trh('Could work with some help','Kan fungera med lite hjälp'):trh('Favourites that could work with some help','Favoriter som kan fungera med lite hjälp'),close,scoped?tr('None of these species are a near miss for this spot.','Ingen av dessa arter är nära att passa här.'):tr('None of your favourites are a near miss for this spot.','Ingen av dina favoriter är nära att passa här.'))+
    '<p class="muted" style="font-size:13px">'+tr('A “?” means the species has no data for that condition yet; it still counts as a match on the rest. Zone uses the Swedish growing zones (1 south, 8 north). A species with cultivars is listed when the species itself or at least one cultivar fits; each cultivar is judged on its own values plus what it inherits from the species.','Ett ”?” betyder att arten saknar uppgift för det villkoret; den räknas ändå som matchning på resten. Zon avser svenska odlingszoner (1 söder, 8 norr). En art med sorter visas när arten själv eller minst en sort passar; varje sort bedöms på sina egna värden plus det den ärver från arten.','Een “?” betekent dat de soort nog geen gegevens heeft voor die voorwaarde; hij telt op de rest wel mee. Zone gebruikt de Zweedse groeizones (1 zuid, 8 noord). Een soort met cultivars wordt getoond als de soort zelf of minstens één cultivar past; elke cultivar wordt beoordeeld op zijn eigen waarden plus wat hij van de soort erft.')+'</p>';
}
/* ---------- planting records ---------- */
const PSTAT=O('alive:Alive:Lever|struggling:Struggling:Kämpar|dead:Dead:Död|removed:Removed:Borttagen|unknown:Unknown:Okänd');
const plState={status:'',place:'',edit:null};
const pstatPill=st=>{const o=PSTAT.find(x=>x.k===st)||PSTAT[4];return '<span class="pill pst '+esc(o.k)+'">'+esc(trs(o.en,o.sv))+'</span>'};
function plSummary(list){
  if(!list.length)return '';
  const n=k=>list.filter(p=>p.status===k).length,plants=list.reduce((t,p)=>t+(Number(p.count)||1),0);
  return (state.lang==='nl'?list.length+' aanplant'+(list.length===1?'':'en')+' ('+plants+' plant'+(plants===1?'':'en')+'): ':state.lang==='sv'?list.length+' plantering'+(list.length===1?'':'ar')+' ('+plants+' plant'+(plants===1?'a':'or')+'): ':list.length+' planting'+(list.length===1?'':'s')+' ('+plants+' plant'+(plants===1?'':'s')+'): ')+
    PSTAT.filter(o=>n(o.k)).map(o=>n(o.k)+' '+(trs(o.en,o.sv)).toLowerCase()).join(', ');
}
/* ---------- comments ---------- */
const cmtState={edit:null};
function updateComments(s){
  const el=$('#cmtList');if(!el)return;
  const list=(state.comments||[]).filter(c=>c.sid===s.sid).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
  el.innerHTML=list.length?list.map(c=>{
    const m=META.get(c.id)||{},who=m.author?(PROFILES.get(m.author)||tr('Someone','Någon')):tr('Someone','Någon'),ed=m.updatedAt&&m.createdAt&&new Date(m.updatedAt)-new Date(m.createdAt)>60000;
    const mine=canEdit(c.id);
    if(cmtState.edit===c.id)return '<div class="cmt" data-cmt="'+esc(c.id)+'"><div class="ch"><b>'+esc(who)+'</b></div><textarea id="cmtEdit" rows="3" maxlength="2000">'+esc(c.text||'')+'</textarea><div class="acts" style="margin-top:6px"><button type="button" class="btn sm primary" data-act="cmt-save" data-id="'+esc(c.id)+'">'+tr('Save','Spara')+'</button><button type="button" class="btn sm" data-act="cmt-cancel">'+tr('Cancel','Avbryt')+'</button></div></div>';
    return '<div class="cmt" data-cmt="'+esc(c.id)+'"><div class="ch"><span><b>'+esc(who)+'</b> · '+esc(fmtDate(c.createdAt||m.createdAt))+(ed?' · '+tr('edited','redigerad'):'')+cvPill(c)+'</span>'+
      (mine?'<span class="acts w-only"><button type="button" class="btn sm" data-act="cmt-edit" data-id="'+esc(c.id)+'">'+tr('Edit','Redigera')+'</button><button type="button" class="btn sm danger" data-act="cmt-del" data-id="'+esc(c.id)+'">'+tr('Delete','Radera')+'</button></span>':'')+
      '</div><p>'+esc(c.text||'')+'</p></div>'}).join(''):'<p class="muted" style="margin:0">'+tr('No comments yet.','Inga kommentarer ännu.')+'</p>';
}
async function cmtPost(s){
  const t=$('#cmtText').value.trim();if(!t){toast(tr('Write something first.','Skriv något först.'),'err');return}
  const p=cur(),doc={sid:s.sid,text:t,createdAt:Date.now()};if(p&&p.isCv&&p.sid===s.sid)doc.cultivar=p.cv;
  try{await Data.saveRow('comments',null,doc);$('#cmtText').value='';toast(tr('Comment posted','Kommentar skickad'))}catch(e){toast(errMsg(e),'err')}
}
async function cmtSave(id){
  const c=(state.comments||[]).find(x=>x.id===id),t=($('#cmtEdit')||{}).value;if(!c||!t||!t.trim())return;
  try{cmtState.edit=null;await Data.saveRow('comments',id,Object.assign({},c,{id:undefined,text:t.trim()}));toast(tr('Comment saved','Kommentar sparad'))}catch(e){toast(errMsg(e),'err')}
}
function plRow(p,showSpecies){
  const x=bySid.get(p.sid),last=(p.checks||[]).slice(-1)[0];
  return '<div class="ent plrow"><span style="min-width:0">'+(showSpecies?'<button type="button" class="lnk" data-open="'+esc(p.sid+(p.cultivar?'--'+cvKey(p.cultivar):''))+'"><b>'+esc(x?dispName(x):p.latin||p.sid)+(p.cultivar?' '+cvQ(cvNorm(p.cultivar)):'')+'</b></button> · ':(p.cultivar&&!(cur()||{}).isCv?cvPill(p)+' · ':''))+
    '<b>'+esc(p.place||tr('No place given','Ingen plats angiven'))+'</b>'+(p.count?' · '+esc(p.count)+' '+tr('plants','plantor'):'')+' · '+esc(p.date||'')+' '+pstatPill(p.status)+
    (p.source?'<br><small class="muted">'+tr('Source','Källa')+': '+esc(p.source)+'</small>':'')+(p.notes?'<br>'+esc(p.notes):'')+
    (last?'<br><small class="muted">'+tr('Last check','Senaste kontroll')+' '+esc(last.date)+(last.note?': '+esc(last.note):'')+'</small>':'')+
    (SB?'<br><small class="muted">'+rowStamp(p.id).slice(3)+'</small>':'')+'</span>'+
    (canEdit(p.id)?'<span class="acts w-only"><select data-plstat="'+esc(p.id)+'" aria-label="'+esc(tr('Update status','Uppdatera status'))+'"><option value="">'+esc(tr('Update status…','Uppdatera status…'))+'</option>'+PSTAT.map(o=>'<option value="'+o.k+'">'+esc(trs(o.en,o.sv))+'</option>').join('')+'</select><button class="btn sm" data-act="pl-edit" data-id="'+esc(p.id)+'">'+tr('Edit','Redigera')+'</button><button class="btn sm danger" data-act="pl-del" data-id="'+esc(p.id)+'">'+tr('Delete','Radera')+'</button></span>':'')+'</div>';
}
function plCvFill(ck){const s=bySid.get($('#plSp').value);$('#plCv').innerHTML=cvOptions(s,ck,tr('Species / unknown cultivar','Arten / okänd sort','Soort / onbekende cultivar'));$('#plCv').value=ck&&s&&s.cvs.some(c=>c.ck===ck)?ck:'';$('#plCvNew').hidden=true;$('#plCvNew').value=''}
function plFormOpen(p,sid,cv){
  plState.edit=p?p.id:null;const f=$('#plForm');f.hidden=false;
  $('#plSp').innerHTML=species.slice().sort(byName).map(x=>'<option value="'+esc(x.sid)+'">'+esc(dispName(x))+(commonName(x)?' ('+esc(x.latin)+')':'')+'</option>').join('');
  $('#plSp').value=p?p.sid:(sid||selected||'');$('#plSp').disabled=!!p;
  plCvFill(p?cvKey(p.cultivar):(cv!=null?cv:((sid||selected)===selected?selCv:'')));
  $('#plPlace').value=p?p.place||'':'';$('#plDate').value=p?p.date||today():today();$('#plCount').value=p&&p.count?p.count:'';
  $('#plSource').value=p?p.source||'':'';$('#plStatus').value=p?p.status||'alive':'alive';$('#plNotes').value=p?p.notes||'':'';
  $('#plGeo').value=p&&p.lat!=null?p.lat+', '+p.lng:'';
  $('#plTitle').textContent=p?tr('Edit planting','Redigera plantering'):tr('New planting','Ny plantering');
  const places=[...new Set((state.plantings||[]).map(x=>x.place).filter(Boolean))].sort();
  $('#plPlaces').innerHTML=places.map(x=>'<option value="'+esc(x)+'"></option>').join('');
  const srcs=[...new Set(state.obs.filter(o=>o.kind==='source').map(o=>o.supplier).filter(Boolean))].sort();
  $('#plSources').innerHTML=srcs.map(x=>'<option value="'+esc(x)+'"></option>').join('');
  f.scrollIntoView({block:'nearest'});$('#plPlace').focus();
}
async function plSave(){
  const sid=$('#plSp').value,x=bySid.get(sid);if(!x){toast(tr('Choose a species.','Välj en art.'),'err');return}
  const cv=cvRead('#plCv','#plCvNew',x);if(cv===null){toast(tr('Type the cultivar name.','Skriv sortnamnet.','Typ de cultivarnaam.'),'err');return}
  const old=plState.edit&&(state.plantings||[]).find(p=>p.id===plState.edit);
  const geo=$('#plGeo').value.split(',').map(v=>parseFloat(v));
  const st=$('#plStatus').value;
  const doc={sid,latin:x.latin,place:$('#plPlace').value.trim(),date:$('#plDate').value||today(),count:$('#plCount').value?Number($('#plCount').value):null,
    source:$('#plSource').value.trim(),status:st,notes:$('#plNotes').value.trim(),checks:old&&old.checks?old.checks.slice():[],createdAt:old?old.createdAt:Date.now()};
  if(geo.length===2&&geo.every(isFinite)){doc.lat=geo[0];doc.lng=geo[1]}
  if(old&&old.fromV1)doc.fromV1=true;
  if(cv)doc.cultivar=cv;
  if(old&&old.status!==st)doc.checks.push({date:today(),status:st,note:''});
  try{await Data.saveRow('plantings',plState.edit,doc);$('#plForm').hidden=true;plState.edit=null;toast(tr('Planting saved','Plantering sparad'));updatePlantings()}catch(e){toast(errMsg(e),'err')}
}
async function plSetStatus(id,st,note){
  const p=(state.plantings||[]).find(x=>x.id===id);if(!p||!st)return;
  const doc=Object.assign({},p);delete doc.id;doc.checks=(p.checks||[]).concat([{date:today(),status:st,note:note||''}]);doc.status=st;
  try{await Data.saveRow('plantings',id,doc);toast(tr('Status updated','Status uppdaterad'))}catch(e){toast(errMsg(e),'err')}
}
function updatePlantings(){
  const all=(state.plantings||[]).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const places=[...new Set(all.map(p=>p.place).filter(Boolean))].sort();
  $('#plPlaceSel').innerHTML='<option value="">'+esc(tr('All places','Alla platser'))+'</option>'+places.map(x=>'<option'+(x===plState.place?' selected':'')+'>'+esc(x)+'</option>').join('');
  $$('#plStatSeg [data-plst]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.plst===plState.status));
  const list=all.filter(p=>(!plState.status||p.status===plState.status)&&(!plState.place||p.place===plState.place));
  $('#plStats').textContent=plSummary(all)||tr('No planting records yet.','Inga planteringar ännu.');
  $('#plList').innerHTML=list.length?list.map(p=>plRow(p,true)).join(''):'<div class="empty"><p>'+tr('No planting records match.','Inga planteringar matchar.')+'</p></div>';
}

/* ---------- shared lists ---------- */
const listById=id=>(state.lists||[]).find(l=>l.id===id);
function addListSelect(sid){
  if(!SB||!CANW)return '';
  const mine=(state.lists||[]).filter(l=>canEdit(l.id));
  return '<select class="addlist" data-addlist="'+esc(sid)+'" aria-label="'+esc(tr('Add to a list','Lägg till i en lista'))+'"><option value="">'+esc(tr('Add to list…','Lägg till i lista…'))+'</option>'+
    mine.map(l=>'<option value="'+esc(l.id)+'"'+((l.sids||[]).indexOf(sid)>=0?' disabled':'')+'>'+esc(l.name)+((l.sids||[]).indexOf(sid)>=0?' ✓':'')+'</option>').join('')+'<option value="__new">'+esc(tr('New list…','Ny lista…'))+'</option></select>';
}
async function listAdd(lid,sid){
  if(lid==='__new'){const x=bySid.get(sid);const id=await Data.saveRow('lists',null,{name:tr('New list','Ny lista'),description:'',sids:[sid],createdAt:Date.now()});location.hash='l-'+id;return}
  const L=listById(lid);if(!L)return;const doc=Object.assign({},L);delete doc.id;doc.sids=[...new Set((L.sids||[]).concat([sid]))];
  try{await Data.saveRow('lists',lid,doc);toast(tr('Added to ','Tillagd i ')+L.name)}catch(e){toast(errMsg(e),'err')}
}
let openList='';
function updateLists(){
  const L=openList&&listById(openList);
  $('#listsAll').hidden=!!L;$('#listOne').hidden=!L;
  if(!L){
    const ls=(state.lists||[]).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name)));
    $('#listsGrid').innerHTML=ls.length?ls.map(l=>'<a class="htile" href="#l-'+esc(l.id)+'"><span class="hi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg></span><b>'+esc(l.name)+'</b><span>'+esc(l.description||'')+(l.description?' · ':'')+(l.sids||[]).length+' '+tr('species','arter')+(SB?' · '+esc(trs('by ','av '))+esc(who((META.get(l.id)||{}).author)):'')+'</span></a>').join('')
      :'<div class="empty"><p>'+tr('No lists yet.','Inga listor ännu.')+'</p></div>';
    return;
  }
  const ed=canEdit(L.id),sp=(L.sids||[]).map(x=>bySid.get(x)).filter(Boolean).sort(byName);
  $('#listHead').innerHTML=ed?'<input id="listName" class="lname" value="'+esc(L.name)+'" aria-label="'+esc(tr('List name','Listans namn'))+'"><textarea id="listDesc" rows="2" placeholder="'+esc(tr('Description (optional)','Beskrivning (valfri)'))+'">'+esc(L.description||'')+'</textarea><div class="acts"><button class="btn sm primary" data-act="list-save">'+tr('Save name and description','Spara namn och beskrivning')+'</button><button class="btn sm danger" data-act="list-del">'+tr('Delete list','Radera lista')+'</button></div>'
    :'<h1>'+esc(L.name)+'</h1>'+(L.description?'<p>'+esc(L.description)+'</p>':'');
  $('#listInfo').textContent=sp.length+' '+tr('species','arter')+(SB?' · '+trs('by ','av ')+who((META.get(L.id)||{}).author):'');
  $('#listSp').innerHTML=sp.length?sp.map(x=>{const nm=names(x);return '<div class="gaprow"><button type="button" class="gapmain" data-open="'+esc(x.sid)+'"><span class="ph" style="--c:'+FCOL[x.form]+'">'+phInner(x,1)+'</span><span style="min-width:0"><span class="lat">'+nm.main+'</span><span class="nm">'+nm.sub+'</span></span></button><span></span>'+(ed?'<button class="btn sm" data-act="list-rm" data-sid="'+esc(x.sid)+'">'+tr('Remove','Ta bort')+'</button>':'<span></span>')+'</div>'}).join('')
    :'<div class="empty"><p>'+tr('This list is empty. Add species with “Add to list” on a species page or in Compare.','Listan är tom. Lägg till arter med ”Lägg till i lista” på en artsida eller i Jämför.')+'</p></div>';
}

/* ---------- who and when ---------- */
// Whole sentences: in EN+SV mode they stay in English rather than being glued together.
function who(uid){
  if(!uid)return trs('the first version','första versionen');
  const n=PROFILES.get(uid);if(n)return n;
  return uid===meUid()?trs('you','du'):trs('a user without a name','en användare utan namn');
}
const fmtDate=t=>{if(!t)return '';const d=new Date(t);return isNaN(d)?'':d.toLocaleDateString(state.lang==='sv'?'sv-SE':state.lang==='nl'?'nl-NL':'en-GB',{day:'numeric',month:'short',year:'numeric'})};
function speciesStamp(s){
  if(!SB||!s.entries.length)return '';
  const rows=s.entries.map(e=>META.get(e.id)).concat(s.obs.map(o=>META.get(o.id))).filter(Boolean);if(!rows.length)return '';
  const first=s.entries.map(e=>META.get(e.id)).filter(Boolean).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)))[0];
  const last=rows.slice().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];
  const added=first&&first.author?esc(trs('Added by ','Tillagd av '))+'<b>'+esc(who(first.author))+'</b>':esc(trs('Added in the first version','Tillagd i första versionen'));
  const changed=last.updatedBy?esc(trs(' by ',' av '))+'<b>'+esc(who(last.updatedBy))+'</b>':'';
  return '<p class="stamp">'+added+' · '+esc(trs('last changed ','senast ändrad '))+esc(fmtDate(last.updatedAt))+changed+'</p>';
}
function rowStamp(id){
  const m=META.get(id);if(!m)return '';
  const changed=m.updatedBy&&(m.updatedBy!==m.author||String(m.updatedAt).slice(0,16)!==String(m.createdAt).slice(0,16));
  return ' · '+(m.author?esc(trs('by ','av '))+esc(who(m.author)):esc(trs('from the first version','från första versionen')))+(changed?' · '+esc(trs('changed ','ändrad '))+esc(fmtDate(m.updatedAt))+esc(trs(' by ',' av '))+esc(who(m.updatedBy)):'');
}

/* ---------- trash ---------- */
const TRASH_DAYS=30;
function trashItems(){
  const rows=[];
  (state.trashE||[]).forEach(e=>rows.push({t:'entries',id:e.id,latin:e.latin+(entCv(e)?' '+cvQ(entCv(e)):''),what:trs('Entry from ','Post från ')+(e.date||'')+' · '+Object.keys(e.fields||{}).length+' '+(Object.keys(e.fields||{}).length===1?trs('field','fält'):trs('fields','fält')),m:META.get(e.id)}));
  (state.trashP||[]).forEach(p=>rows.push({t:'plantings',id:p.id,latin:p.latin,what:trs('Planting','Plantering')+': '+(p.place||'')+' '+(p.date||''),m:META.get(p.id)}));
  (state.trashC||[]).forEach(c=>rows.push({t:'comments',id:c.id,latin:(bySid.get(c.sid)||{}).latin||c.sid,what:trs('Comment','Kommentar')+': '+String(c.text||'').slice(0,80),m:META.get(c.id)}));
  (state.trashL||[]).forEach(l=>rows.push({t:'lists',id:l.id,latin:'',what:trs('List','Lista')+': '+(l.name||''),m:META.get(l.id)}));
  (state.trashO||[]).forEach(o=>rows.push({t:'obs',id:o.id,latin:o.latin,what:(o.kind==='source'?trs('Source','Källa')+': '+(o.supplier||''):trs('Observation','Observation'))+' '+(o.date||'')+(o.text?': '+String(o.text).slice(0,80):''),m:META.get(o.id)}));
  return rows.sort((a,b)=>String(b.m.deletedAt).localeCompare(String(a.m.deletedAt)));
}
async function openTrash(){if(SB&&isAdmin()){try{const r=await SB.rpc('purge_trash');if(!r.error&&r.data)await loadAll()}catch(e){}}updateTrash()}
function updateTrash(){
  const rows=trashItems();
  $('#trashN').textContent=rows.length?' ('+rows.length+')':'';
  if($('#v-trash').hidden)return;
  $('#trashList').innerHTML=rows.length?rows.map(r=>{
    const left=Math.max(0,TRASH_DAYS-Math.floor((Date.now()-new Date(r.m.deletedAt))/864e5));
    return '<div class="ent trow2"><span style="min-width:0"><b><i>'+esc(r.latin||'')+'</i></b> · '+esc(r.what)+'<br><small class="muted">'+esc(trs('Deleted ','Raderad '))+esc(fmtDate(r.m.deletedAt))+esc(trs(' by ',' av '))+esc(who(r.m.deletedBy))+' · '+esc(trs(left+' days left',left+' dagar kvar',left+' dagen over'))+'</small></span>'+
      '<span class="acts">'+(canEdit(r.id)?'<button class="btn sm" data-act="restore" data-t2="'+r.t+'" data-id="'+esc(r.id)+'">'+trs('Restore','Återställ')+'</button>':'')+
      (isAdmin()?'<button class="btn sm danger" data-act="purge" data-t2="'+r.t+'" data-id="'+esc(r.id)+'">'+trs('Delete for good','Radera för gott')+'</button>':'')+'</span></div>'}).join('')
    :'<div class="empty"><p>'+trs('The trash is empty.','Papperskorgen är tom.')+'</p></div>';
}

/* ---------- display name ---------- */
function openName(hint){const b=$('#nameBox');b.hidden=false;$('#nameHint').hidden=!hint;$('#nameInput').value=PROFILES.get(meUid())||'';if(!hint)$('#nameInput').focus()}
async function saveName(){
  const v=$('#nameInput').value.trim();if(!v||v.length>40){toast(trs('Use 1 to 40 characters.','Använd 1 till 40 tecken.'),'err');return}if(v.indexOf('@')>=0){toast(trs('Use a name, not an email address.','Använd ett namn, inte en e-postadress.'),'err');return}
  try{await Data.setName(v);$('#nameBox').hidden=true;renderAcct();if(!$('#v-me').hidden)updateMe();toast(trs('Username saved','Användarnamn sparat'))}catch(e){toast(errMsg(e),'err')}
}

/* ---------- how to use this app: the manual, in the language of the app (site/manual.js, built from the manual doc) ---------- */
let manLoad=null;
function loadManual(){if(window.ARTBLAD_MANUAL)return Promise.resolve();if(!manLoad)manLoad=new Promise((res,rej)=>{const sc=document.createElement('script');sc.src='manual.js'+((document.querySelector('script[src^="app.js?"]')||{}).src||'').replace(/^[^?]*/,'');sc.onload=res;sc.onerror=()=>{manLoad=null;rej()};document.head.appendChild(sc)});return manLoad}
async function updateHelp(){
  const body=$('#helpBody');if(!body)return;
  if(!window.ARTBLAD_MANUAL){body.innerHTML='<p class="muted">'+esc(tr('Loading the manual…','Laddar manualen…','Handleiding laden…'))+'</p>';
    try{await loadManual()}catch(e){body.innerHTML='<p class="muted">'+esc(tr('The manual could not be loaded. Check your connection and try again.','Manualen kunde inte laddas. Kontrollera anslutningen och försök igen.','De handleiding kon niet worden geladen. Controleer je verbinding en probeer het opnieuw.'))+'</p>';return}}
  const M=window.ARTBLAD_MANUAL,l=LOC();
  if(body.dataset.lang===l)return;body.dataset.lang=l;
  body.innerHTML=M[l]||M.en;
  $('#helpMeta').textContent=tr('Manual for version 2','Manual för version 2','Handleiding voor versie 2')+(M.updated?' · '+tr('updated ','uppdaterad ','bijgewerkt ')+fmtDate(M.updated):'')+'. '+tr('If a button name differs, the app is right.','Om ett knappnamn skiljer sig gäller appen.','Als een knopnaam afwijkt, heeft de app gelijk.');
  const hs=$$('#helpBody h3');
  $('#helpToc').innerHTML='<p>'+esc(tr('Contents','Innehåll','Inhoud'))+'</p><ol>'+hs.map(h=>'<li><button type="button" data-hjump="'+esc(h.id)+'">'+esc(h.textContent)+'</button></li>').join('')+'</ol>';
}

/* ---------- home ---------- */
const textHit=(s,q)=>{q=String(q).toLowerCase();return [s.latin,s.m.en,s.m.sv,s.m.nl,s.m.family].concat((s.cvs||[]).map(c=>c.cv)).some(x=>x&&String(x).toLowerCase().indexOf(q)>=0)};
const cvHit=(s,q)=>{q=String(q).toLowerCase().replace(/[‘’'"]/g,'').trim();return q?(s.cvs||[]).find(c=>c.cv.toLowerCase().indexOf(q)>=0):null};
const MONTHS_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SV=['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];
const MONTHS_NL=['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
// Species of the day: a stable pick per calendar day, from species with enough data to be worth showing.
function speciesOfDay(d){
  const pool=species.filter(s=>!s.ex&&Object.keys(s.m).length>=6);
  const list=(pool.length?pool:species).slice().sort((a,b)=>a.sid.localeCompare(b.sid));
  if(!list.length)return null;
  const day=Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5);
  return list[(day*2654435761>>>0)%list.length];
}
const chipList=(arr)=>arr.length?'<div class="tchips">'+arr.slice().sort(byName).map(s=>'<button type="button" class="tchip'+(commonName(s)?' cn':'')+'" data-open="'+esc(s.sid)+'">'+esc(dispName(s))+vmark(s.sid)+'</button>').join('')+'</div>':'';
function updateHome(){
  $('#homeStats').textContent=!loaded?tr('Loading…','Laddar…'):[species.length+' '+trs('species','arter'),state.entries.length+' '+trs('entries','poster'),state.obs.length+' '+trs('observations','observationer')].join(' · ');
  const now=new Date(),mo=now.getMonth()+1,s=speciesOfDay(now);
  let left='<div><div class="eyebrow">'+esc(tr('Species of the day','Dagens art'))+'</div>';
  if(s){const m=s.m,typeO=TYPES_ALL.find(o=>o.k===m.type);
    const line=m.product||m.edible||m.habitat||'';
    left+='<button type="button" class="sotd" data-open="'+esc(s.sid)+'" style="margin-top:12px"><div class="ph" style="--c:'+FCOL[s.form]+'">'+phInner(s)+'</div>'+
      '<div style="min-width:0"><div class="lat">'+names(s).main+'</div><div class="nm">'+names(s).sub+'</div>'+
      '<div class="meta" style="margin-top:6px"><span class="pill t" style="--c:'+FCOL[s.form]+'">'+(typeO?trh(typeO.en,typeO.sv):(s.form==='w'?trh('Woody','Vedartad'):trh('Herbaceous','Örtartad')))+'</span>'+(m.verdict?dots(m.verdict,5):'')+'</div>'+
      (line?'<p>'+esc(line)+'</p>':'')+'</div></button>';
  }else left+='<p class="tnone">'+tr('No species yet.','Inga arter ännu.')+'</p>';
  left+='</div>';
  const plant=species.filter(x=>(x.m.cal1||[]).indexOf(mo)>=0),harvest=species.filter(x=>(x.m.cal3||[]).indexOf(mo)>=0);
  const none='<span class="tnone">'+(state.lang==='sv'?'Inget registrerat för '+MONTHS_SV[mo-1]+' ännu.':state.lang==='nl'?'Nog niets vastgelegd voor '+MONTHS_NL[mo-1]+'.':'Nothing recorded for '+MONTHS_EN[mo-1]+' yet.')+'</span>';
  const right='<div><div class="eyebrow">'+esc(tr('Now in '+MONTHS_EN[mo-1],'Nu i '+MONTHS_SV[mo-1],'Nu in '+MONTHS_NL[mo-1]))+'</div>'+
    '<div class="trow"><span>'+trh('Plant','Plantera')+'</span>'+(chipList(plant)||none)+'</div>'+
    '<div class="trow"><span>'+trh('Harvest','Skörda')+'</span>'+(chipList(harvest)||none)+'</div>'+
    '<p class="tnone" style="margin:0;padding:0">'+tr('Based on the planting and harvest months on each species sheet.','Baserat på plantering- och skördemånaderna på varje artblad.')+'</p></div>';
  $('#today').innerHTML=left+right;
  updateHomeSearch();
}
function updateHomeSearch(){
  const q=($('#hq').value||'').trim(),box=$('#hqRes');
  if(!q){box.hidden=true;box.innerHTML='';return}
  const hits=species.filter(s=>textHit(s,q)).sort(byName);
  box.hidden=false;
  box.innerHTML=hits.length?hits.slice(0,6).map(s=>{const c=!textHit(Object.assign({},s,{cvs:[]}),q)&&cvHit(s,q),x=c||s;return '<button type="button" data-open="'+esc(x.ref)+'"><span class="lat">'+names(x).main+'</span><small>'+names(x).sub+'</small></button>'}).join('')+
    (hits.length>6?'<button type="button" data-act="home-all"><span class="more">'+tr('Show all '+hits.length+' matches','Visa alla '+hits.length+' träffar','Alle '+hits.length+' resultaten tonen')+'</span></button>':''):'<p class="tnone" style="margin:0">'+tr('No species match','Inga arter matchar')+' “'+esc(q)+'”.</p>';
}
function homeToOverview(){const q=($('#hq').value||'').trim();state.q=q;$('#q').value=q;go('overview');updateOverview()}

/* ---------- navigation ---------- */
function show(v){
  if(v!=='add'&&!$('#v-add').hidden&&draftDirty()){draftKeep();toast(tr('Your unsaved entry is kept on this device. Open Add to finish it.','Din osparade post sparas på den här enheten. Öppna Lägg till för att göra klart den.','Je niet-opgeslagen invoer blijft op dit apparaat bewaard. Open Toevoegen om hem af te maken.'))}
  mmenu(false);$$('.acts.mcol.open').forEach(c=>c.classList.remove('open'));
  $$('.view').forEach(x=>{x.hidden=x.id!=='v-'+v});
  document.body.classList.toggle('onadd',v==='add');dockSize();
  $$('#dock [data-dk]').forEach(t=>t.setAttribute('aria-current',t.dataset.dk===(v==='trash'||v==='lists'?'overview':v==='help'||v==='autofill'?'home':v)?'page':'false'));
  $$('.tab').forEach(t=>t.setAttribute('aria-current',t.dataset.v===(['gaps','trash','compare','lists'].indexOf(v)>=0?'overview':v==='help'||v==='autofill'||v==='admin'||v==='join'?'home':v)?'page':'false'));
  if(v==='add'&&!formBuilt)buildForm();
  if(v==='add')draftOffer();
  if(v==='sheet')updateSheet();
  if(v==='home')updateHome();
  if(v==='gaps')updateGaps();
  if(v==='trash')openTrash();
  if(v==='me')updateMe();
  if(v==='compare')updateCompare();
  if(v==='calendar')updateCalendar();
  if(v==='pick')updatePick();
  if(v==='plantings')updatePlantings();
  if(v==='lists')updateLists();
  if(v==='help')updateHelp();
  if(v==='autofill')updateAutofill();
  if(v==='admin')updateAdmin();
  if(v==='add'&&document.body.classList.contains('ro')){location.hash='home';return}
  if(['gaps','plantings','lists'].indexOf(v)>=0&&document.body.classList.contains('ro')&&SESSION){location.hash='join';return}
  if(v==='join')updateJoin();
  if(v!=='sheet'&&$('#renBox'))$('#renBox').hidden=true;
  window.scrollTo(0,0);
}
function route(){const h=(location.hash||'#home').slice(1);
  if(h.indexOf('s-')===0){setSel(h.slice(2));show('sheet');return}
  if(h.indexOf('l-')===0){openList=h.slice(2);show('lists');return}
  if(h==='lists')openList='';
 show(['home','overview','add','sheet','gaps','trash','me','compare','calendar','pick','plantings','lists','help','autofill','admin','join'].indexOf(h)>=0?h:'home')}
function go(v){if(location.hash==='#'+v)show(v);else location.hash=v}
function refresh(){derive();revCompute();updateAdminBadge();if(!$('#v-admin').hidden)updateAdmin();updateOverview();if(!$('#v-home').hidden)updateHome();if(!$('#v-gaps').hidden)updateGaps();if(!$('#v-me').hidden)updateMe();if(!$('#v-compare').hidden)updateCompare();if(!$('#v-calendar').hidden)updateCalendar();if(!$('#v-pick').hidden)updatePick();if(!$('#v-plantings').hidden)updatePlantings();if(!$('#v-lists').hidden)updateLists();if(!$('#v-help').hidden)updateHelp();updateTrash();if(!$('#v-sheet').hidden)updateSheet();
  $('#spNames').innerHTML=species.map(s=>'<option value="'+esc(s.latin)+'"></option>').join('');updateHint()}
function arm(btn,run){
  if(btn.dataset.armed){clearTimeout(btn._t);delete btn.dataset.armed;btn.textContent=btn.dataset.label;run();return}
  btn.dataset.armed='1';btn.dataset.label=btn.textContent;btn.textContent=tr('Confirm','Bekräfta');
  btn._t=setTimeout(()=>{delete btn.dataset.armed;btn.textContent=btn.dataset.label},4000);
}

/* ---------- events ---------- */
document.addEventListener('click',async e=>{
  const t=e.target;
  const ah=t.closest('.artie-hint a');if(ah){const l=canon(draft.latin||'');if(l.split(' ').length>=2)afPrefill=l}
  const sj=t.closest('[data-jump]');if(sj){e.preventDefault();const el=document.getElementById(sj.dataset.jump);if(el&&!el.hidden)el.scrollIntoView({block:'start',behavior:'smooth'});return}
  const hj=t.closest('[data-hjump]');if(hj){const h=document.getElementById(hj.dataset.hjump);if(h)h.scrollIntoView({behavior:'smooth',block:'start'});return}
  const lb=t.closest('[data-lb]');if(lb){$('#lb img').src=blobSrc(lb.dataset.lb);$('#lb').hidden=false;return}
  if(t.closest('#lb')){$('#lb').hidden=true;return}
  const st=t.closest('[data-fav]');if(st){Fav.toggle(st.dataset.fav);return}
  const fo=t.closest('[data-favonly]');if(fo){state.favOnly=!state.favOnly;updateOverview();return}
  const cd=t.closest('[data-cmp-del]');if(cd){cmp=cmp.filter(x=>x!==cd.dataset.cmpDel);saveCmp();updateCompare();return}
  const cs=t.closest('[data-calset]');if(cs){calState.set=cs.dataset.calset;updateCalendar();return}
  const ca=t.closest('[data-calact]');if(ca){const k=ca.dataset.calact;if(calState.acts.has(k)&&calState.acts.size>1)calState.acts.delete(k);else calState.acts.add(k);updateCalendar();return}
  const pl=t.closest('[data-pl]');if(pl){pickState.light=pickState.light===pl.dataset.pl?'':pl.dataset.pl;updatePick();return}
  const pm=t.closest('[data-pm]');if(pm){const v=Number(pm.dataset.pm);pickState.moist=pickState.moist===v?0:v;updatePick();return}
  const ps=t.closest('[data-ps]');if(ps){const k=ps.dataset.ps;pickState.soil.has(k)?pickState.soil.delete(k):pickState.soil.add(k);updatePick();return}
  const ad=t.closest('[data-adv]');if(ad){const S=advState.sets[ad.dataset.adv],v=ad.dataset.v;S.has(v)?S.delete(v):S.add(v);updatePick();return}
  const adx=t.closest('[data-advx]');if(adx){const v=adx.dataset.advx;advState.caut.has(v)?advState.caut.delete(v):advState.caut.add(v);updatePick();return}
  const pf=t.closest('[data-pf]');if(pf){pickState.form=pickState.form===pf.dataset.pf?'':pf.dataset.pf;updatePick();return}
  const pst=t.closest('[data-plst]');if(pst){plState.status=plState.status===pst.dataset.plst?'':pst.dataset.plst;updatePlantings();return}
  const gp=t.closest('[data-gap]');if(gp){gapState.only=gp.dataset.gap;updateGaps();return}
  const cvb=t.closest('#v-sheet [data-cv]');if(cvb){selCv=cvb.dataset.cv;$('#cvRenBox').hidden=true;try{history.replaceState(null,'','#s-'+selected+(selCv?'--'+selCv:''))}catch(err){}updateSheet();if(cvb.closest('#cvTable'))$('#cardArea').scrollIntoView({block:'start',behavior:'smooth'});return}
  const cvf=t.closest('[data-cvfill]');if(cvf){const sp=bySid.get(slug(canon(draft.latin||''))),c=sp&&sp.cvs.find(x=>x.ck===cvf.dataset.cvfill);if(c){draft.cultivar=c.cv;draft._cvNew=false;updateCvField()}return}
  const op=t.closest('[data-open]');if(op){setSel(op.dataset.open);go('sheet');updateSheet();return}
  const row=t.closest('.sp');if(row){selected=row.dataset.sid;selCv='';go('sheet');updateSheet();return}
  const fb=t.closest('[data-fk]');if(fb){const key=fb.dataset.fk+':'+fb.dataset.fv;state.flt.has(key)?state.flt.delete(key):state.flt.add(key);updateOverview();return}
  const ff=t.closest('[data-form]');if(ff){state.fForm=ff.dataset.form;updateOverview();return}
  if(t.closest('#fltClear')){state.flt.clear();state.fForm='';state.favOnly=false;updateOverview();return}
  const sg=t.closest('[data-side]');if(sg){state.side=sg.dataset.side;updateSheet();return}
  const ly=t.closest('[data-layout]');if(ly){state.layout=LAYOUTS_OK(ly.dataset.layout);store.set('ab.layout',state.layout);state.side='front';updateSheet();return}
  const lg=t.closest('[data-lang]');if(lg){setLang(lg.dataset.lang);return}
  const fill=t.closest('[data-fill]');if(fill){draft.latin=fill.dataset.fill;$('#latin').value=draft.latin;updateHint();return}
  const kb=t.closest('#form button[data-k]');
  if(kb){
    const k=kb.dataset.k,d=DEF[k],v=kb.dataset.v;
    if(d.t==='multi'||d.t==='cal'){const val=d.t==='cal'?Number(v):v,a=(draft[k]||[]).slice(),i=a.indexOf(val);if(i>=0)a.splice(i,1);else a.push(val);draft[k]=a;kb.setAttribute('aria-pressed',i<0)}
    else{const val=d.t==='scale'?Number(v):v,was=draft[k]===val;draft[k]=was?null:val;$$('#form [data-k="'+k+'"]').forEach(b=>b.setAttribute('aria-pressed',!was&&b===kb))}
    if(k==='type'&&draft.type&&formOf(draft.type)!==draftForm){draftForm=formOf(draft.type);buildForm();return}
    updateCounts();return;
  }
  const a=t.closest('[data-act]');if(!a)return;
  const act=a.dataset.act,s=selected&&bySid.get(selected),cp=cur();
  if(act==='goto-add')openAdd({});
  else if(act==='artie-req')artieRequest([a.dataset.latin],a);
  else if(act==='af-send')artieRequest(String($('#afNames').value||'').split(/\n/),a);
  else if(act==='af-download')afDownload();
  else if(act==='rev-mark'&&s&&SB&&isAdmin())revCall('mark_reviewed',{p_sid:s.sid},tr('Marked as verified: ','Markerad som verifierad: ','Als geverifieerd gemarkeerd: ')+s.latin);
  else if(act==='rev-unmark'&&s&&SB&&isAdmin())arm(a,()=>revCall('unmark_reviewed',{p_sid:s.sid},tr('Mark removed','Markering borttagen','Markering verwijderd')));
  else if(act==='flag-resolve'&&SB&&isAdmin())revCall('resolve_flag',{p_id:Number(a.dataset.fid)},tr('Flag closed','Flagga stängd','Melding gesloten'));
  else if(act==='flag-open'&&s){const b=$('#flagBox');b.hidden=!b.hidden;if(!b.hidden)$('#flagReason').focus()}
  else if(act==='flag-cancel')$('#flagBox').hidden=true;
  else if(act==='flag-send'&&s&&SB)flagSend(s);
  else if(act==='adm-tab'){admState.tab=a.dataset.tab;admState.n=40;updateAdmin()}
  else if(act==='adm-more'){admState.n+=40;updateAdmin()}
  else if(act==='af-sent')arm(a,afMarkSent);
  else if(act==='af-del')arm(a,()=>afDelete(a.dataset.sid));
  else if(act==='signin'){$('#auth').hidden=false;$('#authEmail').focus()}
  else if(act==='signout'){if(SB)SB.auth.signOut()}
  else if(act==='add-info'&&s)openAdd({latin:s.latin,form:s.form,cultivar:cp&&cp.isCv?cp.cv:''});
  else if(act==='cv-new'&&s)openAdd({latin:s.latin,form:s.form,cvNew:true});
  else if(act==='cv-rename'&&cp&&cp.isCv)openCvRename(cp);
  else if(act==='cv-ren-cancel')$('#cvRenBox').hidden=true;
  else if(act==='cv-ren-go'&&cp&&cp.isCv){const n=cvNorm($('#cvRenInput').value),ex=s.cvs.find(c=>c.ck===cvKey(n)&&c!==cp);if(ex)arm(a,()=>doCvRename(cp,n));else doCvRename(cp,n)}
  else if(act==='cancel-edit'){resetDraft()}
  else if(act==='draft-restore')draftRestore();
  else if(act==='draft-discard'){draftClear();toast(tr('Draft discarded','Utkastet slängt','Concept weggegooid'))}
  else if(act==='export-sheets')exportSheets(listInView(),'list_'+today());
  else if(act==='print-sheets')printSheets(listInView());
  else if(act==='print-one'&&cp)printSheets([cp]);
  else if(act==='export-one'&&cp)exportSheets([cp],cp.ref);
  else if(act==='export-csv')exportCsv();
  else if(act==='export-json')exportJson();
  else if(act==='home-all')homeToOverview();
  else if(act==='near-use'){draft.latin=a.dataset.latin;$('#latin').value=a.dataset.latin;$('#nearBox').hidden=true;saveForm()}
  else if(act==='near-new'){draft._nearOk=true;$('#nearBox').hidden=true;saveForm()}
  else if(act==='rename')openRename();
  else if(act==='sp-trash'&&s&&SB&&isAdmin())arm(a,async()=>{const n=s.latin;try{await Data.trashMany('entries',s.entries.map(e=>e.id));toast(tr('Moved to the trash: ','Flyttad till papperskorgen: ','Naar de prullenbak: ')+n+'. '+tr('Restore it from Species → Trash within 30 days.','Återställ den från Arter → Papperskorg inom 30 dagar.','Zet hem binnen 30 dagen terug via Soorten → Prullenbak.'));go('overview')}catch(err){toast(errMsg(err),'err')}});
  else if(act==='compare-add'&&cp){cmpAdd(cp.ref);go('compare')}
  else if(act==='cmp-favs'){species.filter(x=>Fav.has(x.sid)).slice(0,CMP_MAX).forEach(x=>cmpAdd(x.sid));updateCompare()}
  else if(act==='cmp-clear'){cmp=[];saveCmp();updateCompare();updateOverview();if(!$('#v-pick').hidden)updatePick()}
  else if(act==='adv-clear'){ADV.forEach(x=>advState.sets[x[0]].clear());advState.caut.clear();advState.inv='';advState.verdict=0;advState.edib=0;updatePick()}
  else if(act==='pick-jump'){const o=$('#pickOut');if(o)o.scrollIntoView({block:'start',behavior:'smooth'})}
  else if(act==='pick-clear'){Object.assign(pickState,{light:'',moist:0,soil:new Set(),zone:'',temp:'',form:'',scope:''});ADV.forEach(x=>advState.sets[x[0]].clear());advState.caut.clear();advState.inv='';advState.verdict=0;advState.edib=0;advState.strict=false;updatePick()}
  else if(act==='cmp-mode'){cmpMode=!cmpMode;updateOverview()}
  else if(act==='pl-new')plFormOpen(null,a.dataset.sid);
  else if(act==='mmenu')mmenu(!document.body.classList.contains('mmenu'));
  else if(act==='mmore'){const c=a.closest('.acts');const o=!c.classList.contains('open');c.classList.toggle('open',o);a.setAttribute('aria-expanded',o)}
  else if(act==='cmt-post'&&s)cmtPost(s);
  else if(act==='cmt-edit'&&s){cmtState.edit=a.dataset.id;updateComments(s);const t=$('#cmtEdit');if(t)t.focus()}
  else if(act==='cmt-cancel'&&s){cmtState.edit=null;updateComments(s)}
  else if(act==='cmt-save')cmtSave(a.dataset.id);
  else if(act==='cmt-del')arm(a,async()=>{try{await Data.trash('comments',a.dataset.id,true);toast(tr('Moved to the trash','Flyttad till papperskorgen'))}catch(err){toast(errMsg(err),'err')}});
  else if(act==='pl-new-here'&&s){go('plantings');setTimeout(()=>plFormOpen(null,s.sid,selCv),50)}
  else if(act==='pl-edit'){const p=(state.plantings||[]).find(x=>x.id===a.dataset.id);if(p){if($('#v-plantings').hidden){go('plantings');setTimeout(()=>plFormOpen(p),50)}else plFormOpen(p)}}
  else if(act==='pl-save')plSave();
  else if(act==='pl-cancel'){$('#plForm').hidden=true;plState.edit=null}
  else if(act==='pl-geo'){try{navigator.geolocation.getCurrentPosition(pos=>{$('#plGeo').value=pos.coords.latitude.toFixed(5)+', '+pos.coords.longitude.toFixed(5)},()=>toast(tr('Location is not available here.','Platsen är inte tillgänglig här.'),'err'))}catch(e){toast(tr('Location is not available here.','Platsen är inte tillgänglig här.'),'err')}}
  else if(act==='pl-del')arm(a,async()=>{try{await Data.trash('plantings',a.dataset.id,true);toast(tr('Moved to the trash','Flyttad till papperskorgen'))}catch(err){toast(errMsg(err),'err')}});
  else if(act==='list-new'){const n=$('#newListName').value.trim();if(!n){toast(tr('Give the list a name.','Ge listan ett namn.'),'err');return}try{const id=await Data.saveRow('lists',null,{name:n,description:$('#newListDesc').value.trim(),sids:[],createdAt:Date.now()});$('#newListName').value='';$('#newListDesc').value='';location.hash='l-'+id}catch(err){toast(errMsg(err),'err')}}
  else if(act==='list-save'){const L=listById(openList);if(L){const doc=Object.assign({},L);delete doc.id;doc.name=$('#listName').value.trim()||L.name;doc.description=$('#listDesc').value.trim();try{await Data.saveRow('lists',L.id,doc);toast(tr('List saved','Lista sparad'))}catch(err){toast(errMsg(err),'err')}}}
  else if(act==='list-rm'){const L=listById(openList);if(L){const doc=Object.assign({},L);delete doc.id;doc.sids=(L.sids||[]).filter(x=>x!==a.dataset.sid);try{await Data.saveRow('lists',L.id,doc)}catch(err){toast(errMsg(err),'err')}}}
  else if(act==='list-del')arm(a,async()=>{try{await Data.trash('lists',openList,true);location.hash='lists';toast(tr('Moved to the trash','Flyttad till papperskorgen'))}catch(err){toast(errMsg(err),'err')}});
  else if(act==='list-show'){state.listId=openList;go('overview');updateOverview()}
  else if(act==='list-cmp'){const L=listById(openList);if(L){cmp=[];(L.sids||[]).filter(x=>bySid.has(x)).slice(0,CMP_MAX).forEach(cmpAdd);saveCmp();go('compare')}}
  else if(act==='list-clear-filter'){state.listId='';updateOverview()}
  else if(act==='cmp-go'){cmpMode=false;go('compare')}
  else if(act==='edit-sheet'&&cp)openAdd({sheet:cp});
  else if(act==='restore'){try{await Data.trash(a.dataset.t2,a.dataset.id,false);toast(tr('Restored','Återställd'));updateTrash()}catch(err){toast(errMsg(err),'err')}}
  else if(act==='purge')arm(a,async()=>{try{await Data.purge(a.dataset.t2,a.dataset.id);toast(tr('Deleted for good','Raderad för gott'));updateTrash()}catch(err){toast(errMsg(err),'err')}});
  else if(act==='set-name'){mmenu(false);openName()}
  else if(act==='name-save')saveName();
  else if(act==='name-cancel')$('#nameBox').hidden=true;
  else if(act==='ren-cancel')$('#renBox').hidden=true;
  else if(act==='ren-go'){const t2=bySid.get(slug(canon($('#renInput').value)));if(t2&&t2!==s)arm(a,doRename);else doRename()}
  else if(act==='gap-add'){const g=bySid.get(a.dataset.sid);if(g){selected=g.sid;selCv='';const miss=gapState.only&&!GAPS.find(x=>x.k===gapState.only).ok(g)?gapState.only:((missingOf(g)[0]||{}).k||'');openAdd({latin:g.latin,form:g.form,gap:miss})}}
  else if(act==='edit-entry'){const en=state.entries.find(x=>x.id===a.dataset.id);if(en)openAdd({entry:en})}
  else if(act==='del-entry')arm(a,async()=>{const en=state.entries.find(x=>x.id===a.dataset.id);try{await Data.delEntry(a.dataset.id);if(!SB&&en&&en.fields&&en.fields.photo)dropPhoto(en.fields.photo,en.id);toast(SB?tr('Moved to the trash','Flyttad till papperskorgen'):tr('Entry deleted','Post raderad'))}catch(err){toast(errMsg(err),'err')}});
  else if(act==='del-obs')arm(a,async()=>{const o=state.obs.find(x=>x.id===a.dataset.id);try{await Data.delObs(a.dataset.id);if(!SB&&o&&o.photo)dropPhoto(o.photo,o.id);toast(SB?tr('Moved to the trash','Flyttad till papperskorgen'):tr('Observation deleted','Observation raderad'))}catch(err){toast(errMsg(err),'err')}});
  else if(act==='remove-examples')arm(a,async()=>{try{for(const en of state.entries.filter(x=>x.ex))await Data.delEntry(en.id);toast('Examples removed')}catch(err){toast(errMsg(err),'err')}});
});
document.addEventListener('change',e=>{
  if(e.target.id==='cvSel'){const v=e.target.value,sp=bySid.get(slug(canon(draft.latin||'')));if(v==='__new'){draft._cvNew=true;draft.cultivar='';$('#cvNew').value='';$('#cvNew').hidden=false;$('#cvNew').focus()}else{draft._cvNew=false;const c=sp&&sp.cvs.find(x=>x.ck===v);draft.cultivar=c?c.cv:'';$('#cvNew').hidden=true}cvHint();return}
  if(e.target.matches('select[data-cvnew]')){const i=$('#'+e.target.dataset.cvnew);if(i){i.hidden=e.target.value!=='__new';if(!i.hidden)i.focus()}return}
  if(e.target.matches('[data-addlist]')){const v=e.target.value;e.target.value='';if(v)listAdd(v,e.target.dataset.addlist);return}if(e.target.matches('[data-plstat]')){plSetStatus(e.target.dataset.plstat,e.target.value);return}if(e.target.id==='plSp'){plCvFill('');return}if(e.target.id==='plPlaceSel'){plState.place=e.target.value;updatePlantings();return}if(e.target.matches('[data-cmpsel]')){const id=e.target.dataset.cmpsel;if(e.target.checked){if(cmp.length>=CMP_MAX){e.target.checked=false;toast(tr('You can compare up to 4 species.','Du kan jämföra upp till 4 arter.'),'err');return}cmp.push(id)}else cmp=cmp.filter(x=>x!==id);saveCmp();updateCmpBar();return}if(e.target.id==='cmpPick'&&e.target.value){cmpAdd(e.target.value);updateCompare();return}if(e.target.id==='pickZone'){pickState.zone=e.target.value;if(pickState.zone)pickState.temp='';updatePick();return}if(e.target.id==='pickTemp'){pickState.temp=e.target.value;if(pickState.temp!=='')pickState.zone='';updatePick();return}if(e.target.id==='pickScope'){pickState.scope=e.target.value;updatePick();return}if(e.target.id==='advInv'){advState.inv=e.target.value;updatePick();return}if(e.target.id==='advEdib'){advState.edib=Number(e.target.value);updatePick();return}if(e.target.id==='advVerdict'){advState.verdict=Number(e.target.value);updatePick();return}if(e.target.id==='advStrict'){advState.strict=e.target.checked;updatePick();return}if(e.target.id==='pickCv'){pickState.cv=e.target.checked;store.set('ab.pickcv',pickState.cv?'1':'0');updatePick();return}if(e.target.id==='calCv'){calState.cv=e.target.checked;store.set('ab.calcv',calState.cv?'1':'0');updateCalendar();return}if(e.target.matches('[data-withlog]')){state.withLog=e.target.checked;store.set('ab.withlog',state.withLog?'1':'0');if(!state.withLog)state.side='front';$$('[data-withlog]').forEach(c=>c.checked=state.withLog);updateSheet();return}if(e.target.id==='gapSel'){gapState.only=e.target.value;updateGaps()}});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='q'){state.q=t.value.trim();updateOverview();return}
  if(t.id==='hq'){updateHomeSearch();return}
  if(t.id==='renInput'){renHint();return}
  if(t.id==='cvRenInput'){cvRenHint();return}
  if(t.closest('#form')){
    if(t.id==='entDate'){draft._date=t.value;return}
    if(t.id==='entPhoto'){pendingPhoto=t.files[0]||null;return}
    if(t.id==='cvNew'){draft.cultivar=t.value;cvHint();return}
    const k=t.dataset.k;if(!k)return;draft[k]=t.value;if(DEF[k]&&DEF[k].zone){const zh=$('[data-zh="'+k+'"]');if(zh)zh.textContent=zoneHint(DEF[k],t.value)}if(k==='latin'){delete draft._nearOk;$('#nearBox').hidden=true;updateHint()}updateCounts();
  }
});
$('#sortSel').addEventListener('change',e=>{state.sort=e.target.value;updateOverview()});
$('#spSel').addEventListener('change',e=>{selected=e.target.value;selCv='';updateSheet()});
$('#saveBtn').addEventListener('click',saveForm);
$('#resetBtn').addEventListener('click',resetDraft);
$('#form').addEventListener('submit',e=>e.preventDefault());
$('#obsForm').addEventListener('submit',async e=>{
  e.preventDefault();const s=selected&&bySid.get(selected);if(!s)return;
  const text=$('#obsText').value.trim(),plot=$('#obsPlot').value.trim(),date=$('#obsDate').value||today(),file=$('#obsPhoto').files[0],cv=cvRead('#obsCv','#obsCvNew',s);
  if(!text&&!file){toast('Add a note or a photo.','err');return}
  if(cv===null){toast(tr('Type the cultivar name.','Skriv sortnamnet.','Typ de cultivarnaam.'),'err');return}
  const btn=$('#obsBtn');btn.disabled=true;
  try{
    const photo=file?await uploadPhoto(file):null;
    const doc={sid:s.sid,latin:s.latin,date,plot,text,photo,createdAt:Date.now()};if(cv)doc.cultivar=cv;
    await Data.saveObs(doc);
    $('#obsText').value='';$('#obsPhoto').value='';toast(tr('Observation saved','Observation sparad'));
  }catch(err){toast(errMsg(err),'err')}finally{btn.disabled=false}
});
$('#srcForm').addEventListener('submit',async e=>{
  e.preventDefault();const s=selected&&bySid.get(selected);if(!s)return;
  const supplier=$('#srcName').value.trim(),url=$('#srcUrl').value.trim(),material=$('#srcMat').value,text=$('#srcNote').value.trim();
  if(!supplier&&!url){toast(tr('Add a name or a link.','Ange ett namn eller en länk.'),'err');return}
  const cv=cvRead('#srcCv','#srcCvNew',s);if(cv===null){toast(tr('Type the cultivar name.','Skriv sortnamnet.','Typ de cultivarnaam.'),'err');return}
  if(url&&!safeUrl(url)){toast(tr('That link does not look right.','Länken ser inte rätt ut.'),'err');return}
  const btn=$('#srcBtn');btn.disabled=true;
  try{
    const doc={kind:'source',sid:s.sid,latin:s.latin,date:today(),supplier,url:safeUrl(url),material,text,createdAt:Date.now()};if(cv)doc.cultivar=cv;
    await Data.saveObs(doc);
    ['#srcName','#srcUrl','#srcNote'].forEach(x=>$(x).value='');toast(tr('Source saved','Källa sparad'));
  }catch(err){toast(errMsg(err),'err')}finally{btn.disabled=false}
});
window.addEventListener('hashchange',route);
window.addEventListener('resize',()=>{if(!$('#v-sheet').hidden)fitSheet()});
try{new ResizeObserver(()=>{if(!$('#v-sheet').hidden)fitSheet()}).observe($('#sheetWrap'))}catch(e){}
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#lb').hidden=true;if(e.key==='Enter'&&e.target&&e.target.id==='hq'){e.preventDefault();homeToOverview()}});

/* ---------- sign-in, roles and realtime ---------- */
function stopRealtime(){if(RT&&SB){try{SB.removeChannel(RT)}catch(e){}}RT=null}
function startRealtime(uid){
  stopRealtime();let tm;
  // A change I just saved arrives here too; the save already reloaded everything, so skip that echo.
  const kick=p=>{const r=p&&(p.new||p.old)||{};if((r.updated_by||r.author||r.user_id)===meUid()&&Date.now()-lastLoad<2500)return;clearTimeout(tm);tm=setTimeout(loadAll,350)};
  RT=SB.channel('artblad')
    .on('postgres_changes',{event:'*',schema:'public',table:'entries'},kick)
    .on('postgres_changes',{event:'*',schema:'public',table:'obs'},kick)
    .on('postgres_changes',{event:'*',schema:'public',table:'profiles'},kick)
    .on('postgres_changes',{event:'*',schema:'public',table:'plantings'},kick)
    .on('postgres_changes',{event:'*',schema:'public',table:'lists'},kick)
    .on('postgres_changes',{event:'*',schema:'public',table:'comments'},kick);
  if(uid)RT.on('postgres_changes',{event:'*',schema:'public',table:'favorites',filter:'user_id=eq.'+uid},async()=>{await loadFav(uid);refresh()});
  RT.subscribe();
}
function renderAcct(){
  const ma=$('#mAcct');if(ma){const n=SESSION&&SESSION.user?(PROFILES.get(SESSION.user.id)||SESSION.user.email||'?'):'';ma.textContent=n?n.trim().charAt(0).toUpperCase():'…'}
  const el=$('#acct');if(!SB){el.innerHTML='';return}
  el.innerHTML=SESSION&&SESSION.user
    ?'<button type="button" class="who lnk" data-act="set-name" title="'+esc(SESSION.user.email+' · '+trs('Change your username','Ändra ditt användarnamn'))+'">'+esc(PROFILES.get(SESSION.user.id)||SESSION.user.email)+'</button><span class="pill">'+(MYROLE==='admin'?'Admin':MYROLE==='contributor'?tr('Contributor','Bidragsgivare'):tr('View only','Läsläge'))+'</span><button class="btn sm" data-act="signout" type="button">'+tr('Sign out','Logga ut')+'</button>'
    :'<button class="btn sm" data-act="signin" type="button">'+tr('Sign in','Logga in')+'</button>';
}
/* ---------- loading screen: the logo grows (spruce, birch, lingonberry), then moves into the header ---------- */
let splashT0=0,namePrompted=false;
function splashStart(){
  const el=$('#splash');if(!el||window.__noSplash)return;
  el.classList.remove('out','go');const lg=el.querySelector('.splogo');lg.style.transform='';
  el.hidden=false;splashT0=0;
  const begin=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{el.classList.add('go');splashT0=Date.now()}));
  // Start the growing only when the page is actually on screen, so nobody misses it.
  if(document.hidden){const v=()=>{if(!document.hidden){document.removeEventListener('visibilitychange',v);begin()}};document.addEventListener('visibilitychange',v)}else begin();
  clearTimeout(splashStart.fail);splashStart.fail=setTimeout(()=>{splashT0=1;splashEnd()},12000);
}
const SPLASH_MS=matchMedia('(prefers-reduced-motion: reduce)').matches?900:3600;
function splashEnd(){
  const el=$('#splash');if(!el||el.hidden)return;
  if(!splashT0){setTimeout(splashEnd,200);return}
  clearTimeout(splashStart.fail);
  const wait=Math.max(0,SPLASH_MS-(Date.now()-splashT0));
  setTimeout(()=>{
    if(el.hidden||el.classList.contains('out'))return;
    const lg=el.querySelector('.splogo'),to=$('.top .brand .bm');
    if(to&&to.getBoundingClientRect().width){
      const a=lg.getBoundingClientRect(),b=to.getBoundingClientRect();
      lg.style.transform='translate('+(b.left-a.left)+'px,'+(b.top-a.top)+'px) scale('+(b.width/a.width)+')';
    }
    el.classList.add('out');
    setTimeout(()=>{el.hidden=true;el.classList.remove('out','go');lg.style.transform=''},650);
  },wait);
}
async function applySession(s){
  const uid=s&&s.user?s.user.id:null;
  if(uid===curUid)return;
  curUid=uid;SESSION=s;
  if(uid)splashStart();
  const gated=!cfg.PUBLIC_READ&&!uid;
  $('#auth').hidden=!gated;$('#authCancel').hidden=gated;
  if(gated){
    stopRealtime();state.entries=[];state.obs=[];state.plantings=[];state.lists=[];state.comments=[];state.trashC=[];state.trashE=[];state.trashO=[];META.clear();PROFILES.clear();MYROLE='viewer';revSet(null);afRows=[];$('#admBody').innerHTML='';$('#revBox').innerHTML='';document.body.classList.remove('admin');CANW=false;ASSETS=null;Fav.ref=null;Fav.loadLocal();loaded=true;
    namePrompted=false;$('#nameBox').hidden=true;document.body.classList.add('ro','nophoto');renderAcct();refresh();splashEnd();return;
  }
  CANW=false;MYROLE='viewer';
  if(uid){try{const r=await SB.rpc('my_role');if(!r.error&&r.data)MYROLE=r.data;else{const q=await SB.rpc('is_editor');if(q.data===true)MYROLE='contributor'}}catch(e){}}
  if(uid&&MYROLE==='viewer'){try{const q=await SB.rpc('is_editor');if(q.data===true)MYROLE='contributor'}catch(e){}}
  CANW=MYROLE==='admin'||MYROLE==='contributor';
  if(uid&&!/^#s-/.test(location.hash||'')){if(location.hash&&location.hash!=='#home')location.hash='home';else show('home')}
  document.body.classList.toggle('admin',MYROLE==='admin');
  ASSETS=CANW?PHOTOS:null;
  document.body.classList.toggle('ro',!CANW);document.body.classList.toggle('nophoto',!ASSETS);
  if(uid){
    Fav.ref={set:async d=>{const r=await SB.from('favorites').upsert({user_id:uid,sids:d.sids,updated_at:new Date().toISOString()});if(r.error)throw r.error}};
    await loadFav(uid);
  }else{Fav.ref=null;Fav.loadLocal()}
  renderAcct();
  await loadAll();startRealtime(uid);
  splashEnd();
  if(uid&&CANW&&!PROFILES.get(uid)&&!namePrompted){namePrompted=true;openName(true)}
}
$('#authForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!SB)return;
  const btn=$('#authBtn'),msg=$('#authMsg');btn.disabled=true;msg.textContent='';
  try{
    const r=await SB.auth.signInWithPassword({email:$('#authEmail').value.trim(),password:$('#authPw').value});
    if(r.error)throw r.error;$('#authPw').value='';
  }catch(err){
    const m=(err&&err.message)||'';
    msg.textContent=/invalid login credentials/i.test(m)?tr('Wrong email or password, or this account has no password.','Fel e-post eller lösenord, eller så saknar kontot lösenord.')
      :/api key|apikey/i.test(m)?'The Supabase key in config.js is wrong or was not saved. ('+m+')'
      :/failed to fetch|network|load failed/i.test(m)?'Cannot reach Supabase. Check the Project URL in config.js. ('+m+')'
      :(m||'Could not sign in.');
  }
  finally{btn.disabled=false}
});
$('#authCancel').addEventListener('click',()=>{$('#auth').hidden=true});

/* ---------- init ---------- */
// The header height (--hh) places the shortcut strip right under the header; nothing sits at the bottom except Save/Clear on the Add page.
function dockSize(){const d=$('#dock'),t=$('header.top');if(t)document.documentElement.style.setProperty('--hh',t.getBoundingClientRect().height+'px');if(!d||!d.offsetHeight)return;document.documentElement.style.setProperty('--dockh','0px')}
// Phone menu (language and account) behind the round buttons in the header.
function mmenu(open){document.body.classList.toggle('mmenu',open);$$('[data-act=mmenu]').forEach(b=>b.setAttribute('aria-expanded',open))}
document.addEventListener('click',e=>{if(document.body.classList.contains('mmenu')&&!e.target.closest('.hdr-r,[data-act=mmenu]'))mmenu(false)},true);
addEventListener('resize',dockSize);addEventListener('load',dockSize);
(async function init(){
  const sty=document.createElement('style');sty.textContent=SHEET_CSS;document.head.appendChild(sty);
  $('#obsDate').value=today();
  Fav.loadLocal();
  {const d=$('#dock'),t=$('header.top');if(d&&t)t.after(d)}
  pickLoad();
  {const pa=$('#pickAdv');if(pa)pa.addEventListener('toggle',()=>{advState.open=pa.open})}
  applyLang();buildFilters();route();updateOverview();dockSize();
  const bn=$('#banner');
  if(!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY||/your-/i.test(String(cfg.SUPABASE_URL)+String(cfg.SUPABASE_ANON_KEY))||!window.supabase){
    bn.hidden=false;bn.textContent='Not connected to a database yet. Add your Supabase details to config.js. Until then, entries stay in memory and disappear when you reload.';
    document.body.classList.add('nophoto');loaded=true;refresh();return;
  }
  if(/(^|\.)supabase\.com$/i.test(String(cfg.SUPABASE_URL).replace(/^https?:\/\//,'').split('/')[0])){
    bn.hidden=false;bn.textContent='The address in config.js is the Supabase website, not your Project URL. Use the one that looks like https://abcdefgh.supabase.co.';loaded=true;refresh();return;
  }
  SB=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
  SB.auth.onAuthStateChange((ev,s)=>{setTimeout(()=>applySession(s),0)});
  const r=await SB.auth.getSession();
  await applySession(r.data&&r.data.session);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&SB&&(curUid||cfg.PUBLIC_READ))loadAll()});
})();

})();
