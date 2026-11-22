// Artblad: Helpers, option lists, field schema, cultivars, app state.
// Part 1 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
// The version shown on Home. Also change ?v= on every script tag in index.html (dev/check_version.py checks this).
const APP_VERSION='2.8.1';
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
  D('status','single','Status','Status',{o:STATUS,hide:1}) // retired in 2.7.0 (row 7): not shown or asked any more; old values stay stored
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
  D('product','text','Main product','Huvudprodukt'),
  D('asAnnual','multi','Can be grown as','Kan odlas som',{o:O('annual:Annual:Ettårig'),only:'h'})]},
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
/* ---------- lengths (2.6.0): stored in centimetres, shown in cm below 2 m and in metres from 2 m ----------
   Entries saved since 2.6.0 carry lu:'cm'. Older entries (and Artie's) used metres for woody height and spread and for
   native size; lenNorm converts those when the data is loaded, so the rest of the app only ever sees centimetres. */
const LEN_KEYS=['height','spread','nativeH','nativeW','spacing'];
function lenNorm(e){
  if(!e||e.lu==='cm'||!e.fields)return e;
  const f=e.fields,form=e.form||(f.type?formOf(f.type):'h');
  LEN_KEYS.forEach(k=>{const v=f[k];if(v==null||v==='')return;const n=Number(v);if(!isFinite(n))return;if(unitOf(DEF[k],form)==='m')f[k]=Math.round(n*1000)/10});
  e.lu='cm';return e;
}
const decSep=()=>state.lang==='en'?'.':',';
const numTxt=n=>String(Math.round(n*10)/10).replace('.',decSep());
// One length: "80 cm", "2,5 m". Two lengths (height × spread) share one unit, chosen by the larger.
function fmtLen(cm){const n=Number(cm);if(cm==null||cm===''||!isFinite(n))return '';return Math.abs(n)<200?numTxt(n)+' cm':numTxt(n/100)+' m'}
function fmtSize(a,b){
  const x=Number(a),y=Number(b),hx=a!=null&&a!==''&&isFinite(x),hy=b!=null&&b!==''&&isFinite(y);if(!hx&&!hy)return '';
  const big=Math.max(hx?Math.abs(x):0,hy?Math.abs(y):0)>=200,f=v=>big?numTxt(v/100):numTxt(v);
  return (hx?f(x):'?')+' × '+(hy?f(y):'?')+(big?' m':' cm');
}
// The unit offered first in the form: metres for woody height and spread and for native size, else centimetres.
const lenUnitDefault=(k,form)=>unitOf(DEF[k],form)==='m'?'m':'cm';
const isEmpty=v=>v==null||v===''||(Array.isArray(v)&&!v.length);
// Latin names: genus with a capital, species epithet, hybrid sign and ranks (var., subsp., f.) in lower case.
// Later words keep the capitals they were typed with (cultivar groups, grex, 'Cultivar' in quotes); "group" becomes "Group".
// Only the display changes: species ids (slug) are lower case anyway.
const LATIN_RANKS=['var.','subsp.','ssp.','f.','cv.','agg.','s.l.','s.str.','nothosubsp.','nothovar.'];
const canon=s=>{
  const w=String(s||'').trim().replace(/\s+/g,' ').split(' ').filter(Boolean);
  const cap=x=>x.charAt(0).toUpperCase()+x.slice(1).toLowerCase(),hyb=x=>x==='×'||x.toLowerCase()==='x';
  let g=0;if(w.length>1&&hyb(w[0]))g=1; // a hybrid genus: "× Sorbaronia"
  let epi=g+1;if(w[epi]&&hyb(w[epi]))epi++; // "Malus × domestica"
  return w.map((x,i)=>{
    if(i<g)return x.toLowerCase();
    if(i===g)return cap(x);
    if(i<=epi||hyb(x)||LATIN_RANKS.indexOf(x.toLowerCase())>=0||LATIN_RANKS.indexOf(String(w[i-1]).toLowerCase())>=0)return x.toLowerCase();
    if(/^['"‘’“”]/.test(x))return x;
    if(x.toLowerCase()==='group')return 'Group';
    return x;
  }).join(' ');
};
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
const state={plantings:[],lists:[],comments:[],projects:[],trashPj:[],members:[],listId:'',withLog:store.get('ab.withlog')!=='0',withGenus:store.get('ab.withgenus')==='1',withCv:store.get('ab.withcv')==='1',entries:[],obs:[],layout:LAYOUTS_OK(store.get('ab.layout')),lang:(['en','sv','nl'].indexOf(store.get('ab.lang'))>=0?store.get('ab.lang'):'en'),side:'front',q:'',fForm:'',flt:new Set(),favOnly:false,sort:'name'};
const cfg=Object.assign({},window.ARTBLAD_CONFIG||{});
try{cfg.SUPABASE_URL=new URL(String(cfg.SUPABASE_URL||'').trim()).origin}catch(e){}
cfg.SUPABASE_ANON_KEY=String(cfg.SUPABASE_ANON_KEY||'').trim();
// 2.6.0: which installation this is. "family" (the default, also when config.js does not say) hides My contributions and
// Become a contributor, and shows Help fill the gaps only to admins. "public" shows them to everyone.
const FAMILY=String(cfg.MODE||'family').trim().toLowerCase()!=='public';
let species=[],bySid=new Map(),selected=null,selCv='',SB=null,SESSION=null,ASSETS=null,CANW=true,MYROLE='viewer',loaded=false,curUid=undefined,RT=null;
// Row metadata kept by the database (who added, who changed, trash). Kept apart from the documents so exports and saves are unchanged.
const META=new Map(),PROFILES=new Map();
const isAdmin=()=>MYROLE==='admin',meUid=()=>SESSION&&SESSION.user?SESSION.user.id:null;
// A record in a project (v9) is changed by that project's owner and editors, admins included only when they are members.
const projRole=pid=>{const u=meUid(),m=(state.members||[]).find(x=>x.project_id===pid&&x.user_id===u);return m?m.role:''};
const projCanEdit=pid=>['owner','editor'].indexOf(projRole(pid))>=0;
const canEdit=id=>{if(!SB)return true;const m=META.get(id)||{};if(m.project)return projCanEdit(m.project);if(m.kind==='project')return projCanEdit(id);return isAdmin()||(CANW&&!!meUid()&&m.author===meUid())};
const mem={entries:[],obs:[],n:0};
const errMsg=e=>{const c=e&&(e.code||e.statusCode),m=String((e&&e.message)||'');if(c==='42501'||/row-level security|not authorized|unauthorized|permission/i.test(m))return trs('You do not have permission to change this.','Du har inte behörighet att ändra detta.');if(/exceeded|too large|payload|413|quota/i.test(m))return trs('That file is too large or storage is full.','Filen är för stor eller lagringen är full.');if(/mime|not supported|invalid.*type/i.test(m))return trs('That file type is not supported.','Filtypen stöds inte.');if(c==='23505'&&/profiles/.test(m))return trs('That username is already taken. Choose another.','Användarnamnet är redan upptaget. Välj ett annat.');if(/profiles_reserved/.test(m))return trs('That username is reserved. Choose another.','Användarnamnet är reserverat. Välj ett annat.','Die gebruikersnaam is gereserveerd. Kies een andere.');if(/profiles_not_email/.test(m))return trs('Use a name, not an email address.','Använd ett namn, inte en e-postadress.');return m||trs('Something went wrong.','Något gick fel.')};
let lastLoad=0;
let tt;function toast(msg,kind){const t=$('#toast');t.textContent=msg;t.className='toast show'+(kind?' '+kind:'');clearTimeout(tt);tt=setTimeout(()=>{t.className='toast'},3800)}
/* ---------- outside services (2.6.0): every address in one place, one way to call them ----------
   Each service can be swapped or switched off in config.js without touching the code, e.g.
     SERVICES: { tiles: { url: "https://tiles.example.org/{z}/{x}/{y}.png", attr: "© Example" }, gbif: false }
   svcFetch records the last result per service; the admin page "Service check" shows it and can test each one.
   The app's core (reading and saving species) needs only Supabase; every service below is optional. */
const SERVICE_DEFAULTS={
  gbif:{name:'GBIF name check',url:'https://api.gbif.org/v1',test:'/species/match?kingdom=Plantae&name=Betula%20pendula',for:['Latin name check while typing','Kontroll av latinskt namn']},
  tiles:{name:'Map tiles (OpenStreetMap)',url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',attr:'© OpenStreetMap',test:'0/0/0',for:['Map of plantings','Karta över planteringar']},
  climate:{name:'Winter climate (Open-Meteo, ERA5-Land)',url:'https://archive-api.open-meteo.com/v1/archive',test:'?latitude=63.8&longitude=20.3&start_date=2020-01-01&end_date=2020-01-02&daily=temperature_2m_min&models=era5_land&timezone=GMT',for:['Winter climate of a map position','Vinterklimat för en kartposition']},
  sguSoil:{name:'Soil map (SGU)',url:'https://resource.sgu.se/service/wms/130/jordarter-25-100-tusen',layer:'jord:SE.GOV.SGU.JORD.GRUNDLAGER.25K',test:'?SERVICE=WMS&REQUEST=GetCapabilities',for:['Soil type in Pick a plant','Jordart i Välj en växt']},
  sguPerm:{name:'Soil permeability (SGU)',url:'https://api.sgu.se/oppnadata/genomslapplighet/ogc/features/v1',test:'/collections?f=json',for:['Moisture guess in Pick a plant','Fuktuppskattning i Välj en växt']}
};
const SERVICES={};
Object.keys(SERVICE_DEFAULTS).forEach(id=>{
  const o=cfg.SERVICES&&Object.prototype.hasOwnProperty.call(cfg.SERVICES,id)?cfg.SERVICES[id]:undefined;
  SERVICES[id]=o===false?Object.assign({},SERVICE_DEFAULTS[id],{off:true}):Object.assign({},SERVICE_DEFAULTS[id],o&&typeof o==='object'?o:{},{custom:!!(o&&typeof o==='object')});
});
const SVC_ST=new Map(); // id → {ok, at, msg}: the last call of this session
const svcOn=id=>!!SERVICES[id]&&!SERVICES[id].off;
const svcUrl=id=>SERVICES[id]?SERVICES[id].url:'';
function svcNote(id,ok,msg){SVC_ST.set(id,{ok,at:Date.now(),msg:msg||''})}
async function svcFetch(id,url,opts){
  if(!svcOn(id)){const e=new Error('service off');e.why='off';throw e}
  let r;try{r=await fetch(url,opts)}catch(e){svcNote(id,false,e&&e.name==='AbortError'?'timeout':'connection');throw e}
  svcNote(id,r.ok||r.type==='opaque'||(r.status>=400&&r.status<500&&r.status!==404),r.ok?'':'HTTP '+r.status);
  return r;
}
