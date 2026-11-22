// Artblad: Records that bring people back (2.8.0, batch 4): the spot of a planting, summer records, harvests,
// field notes and photos, a history page per plant, season checks, quick capture, the monthly to-do, places in Pick a plant.
// Part 19c; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* Everything here is stored inside the planting record's own document (micro, summers, harvests, log), so the project
   rules of database update v9 apply: only the project's members see it. Only sums leave a project (v9/v10 evidence). */

/* ---------- the spot of a planting (row 71: microsite taps) ---------- */
const MICRO=[
  {k:'sun',l:['Sun','Sol','Zon'],o:O3('full:Full sun:Full sol:Volle zon|part:Part shade:Halvskugga:Halfschaduw|shade:Shade:Skugga:Schaduw')},
  {k:'shel',l:['Shelter','Lä','Beschutting'],o:O3('open:Open and windy:Öppet och blåsigt:Open en winderig|some:Some shelter:Visst lä:Enigszins beschut|wall:Against a south wall:Mot en sydvägg:Tegen een zuidmuur')},
  {k:'slope',l:['Slope','Lutning','Helling'],o:O3('flat:Flat:Plant:Vlak|s:Facing south:Mot söder:Op het zuiden|n:Facing north:Mot norr:Op het noorden|ew:Facing east or west:Mot öster eller väster:Op het oosten of westen')},
  {k:'moist',l:['Soil moisture','Markfukt','Bodemvocht'],o:O3('dry:Dry:Torr:Droog|normal:Normal:Normal:Normaal|wet:Wet:Blöt:Nat')},
  {k:'snow',l:['Snow cover in winter','Snötäcke på vintern','Sneeuwdek in de winter'],o:O3('yes:Usually covered:Oftast täckt:Meestal bedekt|some:Sometimes:Ibland:Soms|no:Rarely (blown free):Sällan (blåser fritt):Zelden (waait vrij)')},
  {k:'frost',l:['Frost pocket','Frostficka','Vorstkom'],o:O3('no:No:Nej:Nee|yes:Yes, cold air collects:Ja, kall luft samlas:Ja, koude lucht blijft hangen')}
];
function microHTML(pre,m,keys){m=m||{};return (keys?MICRO.filter(d=>keys.indexOf(d.k)>=0):MICRO).map(d=>'<label class="f"><span class="fl">'+esc(tr(d.l[0],d.l[1],d.l[2]))+'</span><select id="'+pre+d.k+'" data-micro="'+d.k+'"><option value="">–</option>'+d.o.map(o=>'<option value="'+o.k+'"'+(m[d.k]===o.k?' selected':'')+'>'+esc(t3(o))+'</option>').join('')+'</select></label>').join('')}
function microRead(pre){const m={};MICRO.forEach(d=>{const el=$('#'+pre+d.k);if(el&&el.value)m[d.k]=el.value});return m}
function microFill(pre,m,onlyEmpty){MICRO.forEach(d=>{const el=$('#'+pre+d.k);if(el&&(!onlyEmpty||!el.value))el.value=(m&&m[d.k])||(onlyEmpty?el.value:'')})}
const microTxt=m=>MICRO.filter(d=>m&&m[d.k]).map(d=>t3(d.o.find(o=>o.k===m[d.k]))).filter(Boolean).join(' · ');
const plPlaceOf=p=>{const q=p&&p.project&&pjById(p.project);return q&&p.placeId?(q.places||[]).find(x=>x.id===p.placeId):null};
// The spot of a planting: its own taps, else those of its place in the project.
const plMicro=p=>Object.assign({},(plPlaceOf(p)||{}).micro||{},(p&&p.micro)||{});

/* ---------- summer records (row 74) ---------- */
const SOUT=O3('matured:Matured:Mognade:Rijp geworden|partly:Partly:Delvis:Gedeeltelijk|not:Did not mature:Mognade inte:Niet rijp geworden');
const SWHY=O3('short:Season too short:För kort säsong:Seizoen te kort|cool:Summer too cool:För sval sommar:Zomer te koel|frost:Early frost:Tidig frost:Vroege vorst|other:Other reason:Annan orsak:Andere reden');
const SWOOD=O3('ripe:Shoots ripened (bark brown, buds set):Skotten mognade (brun bark, knoppar satta):Scheuten afgerijpt (bast bruin, knoppen gezet)|some:Partly ripened:Delvis mognade:Gedeeltelijk afgerijpt|green:Still green at the first frost:Fortfarande gröna vid första frosten:Nog groen bij de eerste vorst');
// The season to record: this year from July, else last year.
const summerYear=()=>{const d=new Date();return d.getMonth()>=6?d.getFullYear():d.getFullYear()-1};
const recId=()=>randHex(4);
function summerTxt1(r){
  const o=SOUT.find(x=>x.k===r.o),w=SWOOD.find(x=>x.k===r.wood),y=SWHY.find(x=>x.k===r.why);
  return tr('Summer ','Sommar ','Zomer ')+r.y+': '+t3(o)+(y?' ('+t3(y).toLowerCase()+')':'')+(w?' · '+t3(w):'')+(r.first?' · '+tr('first harvest ','första skörd ','eerste oogst ')+r.first:'')+
    (r.gdd!=null?' · ≈ '+intTxt(r.gdd)+' '+tr('degree days','graddagar','graaddagen')+(r.ffd!=null?', '+r.ffd+' '+tr('frost-free days','frostfria dagar','vorstvrije dagen'):'')+(r.sofar?' '+tr('(so far)','(hittills)','(tot nu toe)'):''):'');
}
// Climate of one season at a planting's spot, without waiting for the budget (single look-ups).
async function seasonAt(p,y){const pt=plPoint(p);if(!pt)return null;const v=await yearVals(pt.lat,pt.lng,y,false);return{gdd:v.gdd,ffd:v.ffd,sofar:!!v.partial}}
// Summer evidence summed over all projects (v10 artblad_summer_evidence); without v10 the visible records.

function summerOf(x){
  if(!x)return null;let ok=0,gok=null,fok=null,part=0,fail=0,gfail=null;
  const take=(o,g,f,n)=>{if(o==='matured'){ok+=n;if(g!=null&&(gok==null||g<gok))gok=g;if(f!=null&&(fok==null||f<fok))fok=f}else if(o==='partly')part+=n;else if(o==='not'){fail+=n;if(g!=null&&(gfail==null||g>gfail))gfail=g}};
  const mine=r=>!x.isCv||(r.cultivar&&cvKey(r.cultivar)===x.ck);
  if(SEVID){(SEVID.get(x.sid)||[]).filter(mine).forEach(r=>{const n=v=>v==null?null:Number(v);if(r.matured>0)take('matured',n(r.gdd_matured),n(r.ffd_matured),r.matured);if(r.partly>0)take('partly',null,null,r.partly);if(r.failed>0)take('not',n(r.gdd_failed),null,r.failed)})}
  else ((x.plantings)||[]).filter(p=>!isEnc(p)).forEach(p=>{const best={};(p.summers||[]).forEach(r=>{take(r.o,r.gdd!=null?Number(r.gdd):null,r.ffd!=null?Number(r.ffd):null,best[r.o]?0:1);best[r.o]=1})});
  return ok||part||fail?{ok,gok,fok,part,fail,gfail}:null;
}
function summerTxt(e){
  const pl=n=>n+' '+(n===1?tr('planting','plantering','aanplant'):tr('plantings','planteringar','aanplantingen'));
  return [e.ok?tr('Matured in ','Mognade i ','Rijp geworden in ')+pl(e.ok)+(e.gok!=null?tr(', in summers from ≈ ',', i somrar från ≈ ',', in zomers vanaf ≈ ')+intTxt(e.gok)+' '+tr('degree days','graddagar','graaddagen'):''):'',
    e.part?tr('partly in ','delvis i ','gedeeltelijk in ')+pl(e.part):'',
    e.fail?tr('did not mature in ','mognade inte i ','niet rijp in ')+pl(e.fail)+(e.gfail!=null?' ('+tr('up to ≈ ','upp till ≈ ','tot ≈ ')+intTxt(e.gfail)+')':''):''].filter(Boolean).join(' · ').replace(/^./,c=>c.toUpperCase());
}
// Pick a plant: the summer evidence next to the site's heat sum (when the spot came from a project or place).
function pkSummer(x){
  const e=summerOf(x),g=pickState.site&&pickState.site.gdd;if(!e&&!g)return '';
  if(!e)return '';
  const st=g==null||e.gok==null?'':g>=e.gok?' ok':e.gfail!=null&&g<=e.gfail?' no':' edge';
  return '<div class="pkhard pksum'+st+'">☀ '+esc(summerTxt(e))+(g!=null?' · '+esc(tr('your site ≈ ','din plats ≈ ','jouw plek ≈ ')+intTxt(g)):'')+'</div>';
}

/* ---------- harvest log (row 19, D12: weight, count or just "harvested") ---------- */
const HUNIT=O3('kg:kg:kg:kg|g:g:g:g|n:pieces:st:stuks|ok:harvested (no amount):skördat (ingen mängd):geoogst (geen hoeveelheid)');
const harvTxt=h=>h.unit==='ok'||h.amt==null||h.amt===''?tr('Harvested','Skördat','Geoogst'):numTxt(Number(h.amt))+' '+t3(HUNIT.find(u=>u.k===h.unit)||HUNIT[0]);
// Totals of a set of records for one year: weight in kg, pieces, and harvests without an amount.
function harvSum(list,y){const t={kg:0,n:0,ok:0,c:0};list.forEach(p=>(p.harvests||[]).filter(h=>String(h.date||'').slice(0,4)===String(y)).forEach(h=>{t.c++;const a=Number(h.amt);if(h.unit==='ok'||!isFinite(a)||h.amt==='')t.ok++;else if(h.unit==='g')t.kg+=a/1000;else if(h.unit==='n')t.n+=a;else t.kg+=a}));return t}
const harvSumTxt=t=>[t.kg?numTxt(t.kg)+' kg':'',t.n?intTxt(t.n)+' '+tr('pieces','st','stuks'):'',t.ok?t.ok+' '+tr('harvests without an amount','skördar utan mängd','oogsten zonder hoeveelheid'):''].filter(Boolean).join(' · ');

/* ---------- saving parts of a planting record ---------- */
function plDoc(p){const d=Object.assign({},p);delete d.id;return d}
async function plPatch(id,fn,msg){
  const p=(state.plantings||[]).find(x=>x.id===id);if(!p)return false;const d=plDoc(p);fn(d);
  try{await Data.saveRow('plantings',id,d);if(msg)toast(msg);return true}catch(e){toast(errMsg(e),'err');return false}
}
// Field photos go into the folder pl/ of the photo storage (database update v10 lets project editors upload there).
async function uploadPlPhoto(file){
  if(!SB){return await uploadPhoto(file)}
  const b=await shrink(file,1600,.82),id='pl/'+randHex(16);
  const r=await SB.storage.from('photos').upload(id+'.jpg',b,{contentType:'image/jpeg'});if(r.error)throw r.error;
  try{await SB.storage.from('photos').upload(id+'_t.jpg',await shrink(file,360,.72),{contentType:'image/jpeg'})}catch(e){}
  return id;
}

/* ---------- history page of one planting (row 18) ---------- */
let openPl='';
const phState={open:'',busy:false};
function plTitle(p){const x=bySid.get(p.sid);return (x?dispName(x):p.latin||p.sid)+(p.cultivar?' '+cvQ(cvNorm(p.cultivar)):'')}
function phTimeline(p){
  const it=[],ed=canEdit(p.id),del=(arr,i)=>ed?'<button type="button" class="btn sm danger w-only" data-act="ph-del" data-arr="'+arr+'" data-i="'+i+'" aria-label="'+esc(tr('Remove','Ta bort','Verwijderen'))+'">×</button>':'';
  if(p.date)it.push({d:p.date,o:0,h:'<b>'+esc(p.status==='planned'?tr('Planned','Planerad','Gepland'):tr('Planted','Planterad','Geplant'))+'</b>'+(p.count?' · '+esc(p.count)+' '+esc(tr('plants','plantor','planten')):'')+(p.source?' · '+esc(tr('from ','från ','van '))+esc(p.source):'')});
  (p.checks||[]).forEach(c=>it.push({d:c.date,o:1,h:esc(tr('Status: ','Status: ','Status: '))+pstatPill(c.status)+(c.note?' '+esc(c.note):'')}));
  (p.winters||[]).forEach((w,i)=>it.push({d:w.date||'',o:2,h:winterRows({winters:[w]}),x:del('winters',i)}));
  (p.summers||[]).forEach((r,i)=>it.push({d:r.date||'',o:3,h:'<span class="pill sumr '+esc(r.o)+'">'+esc(summerTxt1(r))+'</span>',x:del('summers',i)}));
  (p.harvests||[]).forEach((h,i)=>it.push({d:h.date||'',o:4,h:'<b>'+esc(tr('Harvest','Skörd','Oogst'))+':</b> '+esc(harvTxt(h))+(h.note?' · '+esc(h.note):''),x:del('harvests',i)}));
  (p.log||[]).forEach((l,i)=>it.push({d:l.date||'',o:5,h:(l.photo?'<span class="phimg" data-lb="'+esc(l.photo)+'">'+thumbImg(l.photo,1)+'</span>':'')+'<span>'+esc(l.note||'')+(hasPt(l)?' <small class="muted">'+esc(tr('(position saved)','(position sparad)','(positie opgeslagen)'))+'</small>':'')+'</span>',x:del('log',i)}));
  it.sort((a,b)=>String(b.d).localeCompare(String(a.d))||b.o-a.o);
  return it.length?'<div class="phtl">'+it.map(x=>'<div class="phit"><span class="phd">'+esc(x.d||'')+'</span><span class="phb">'+(x.o===5?x.h:'<span>'+x.h+'</span>')+'</span>'+(x.x||'')+'</div>').join('')+'</div>':'<p class="muted">'+esc(tr('Nothing recorded yet.','Inget registrerat ännu.','Nog niets vastgelegd.'))+'</p>';
}
function phFormHTML(p,k){
  const sel=(id,opts,v,empty)=>'<select id="'+id+'">'+(empty?'<option value="">'+esc(empty)+'</option>':'')+opts.map(o=>'<option value="'+o.k+'"'+(o.k===v?' selected':'')+'>'+esc(t3(o))+'</option>').join('')+'</select>';
  const btn=(act,lab)=>'<div class="acts" style="grid-column:1/-1"><button type="button" class="btn sm primary" data-act="'+act+'" data-id="'+esc(p.id)+'">'+esc(lab)+'</button><button type="button" class="btn sm" data-act="ph-close">'+esc(tr('Cancel','Avbryt','Annuleren'))+'</button></div>';
  const x=bySid.get(p.sid),woody=x&&x.form==='w';
  if(k==='summer')return '<form class="obsform" onsubmit="return false"><label class="f"><span class="fl">'+esc(tr('Season','Säsong','Seizoen'))+'</span><input id="phSy" type="number" min="1990" max="'+new Date().getFullYear()+'" value="'+summerYear()+'"></label>'+
    '<label class="f"><span class="fl">'+esc(tr('Did it mature?','Mognade den?','Werd hij rijp?'))+'</span>'+sel('phSo',SOUT,'matured')+'</label>'+
    '<label class="f"><span class="fl">'+esc(tr('If not: why?','Om inte: varför?','Zo niet: waarom?'))+'</span>'+sel('phSw',SWHY,'','–')+'</label>'+
    (woody?'<label class="f"><span class="fl">'+esc(tr('This year’s shoots','Årets skott','De scheuten van dit jaar'))+'</span>'+sel('phSr',SWOOD,'','–')+'</label>':'')+
    '<label class="f"><span class="fl">'+esc(tr('First harvest (optional)','Första skörd (valfritt)','Eerste oogst (optioneel)'))+'</span><input id="phSf" type="date"></label>'+
    '<p class="muted" style="grid-column:1/-1;margin:0;font-size:13px">'+esc(plPoint(p)?tr('The season’s heat sum and frost-free days are added from Open-Meteo for this spot.','Säsongens värmesumma och frostfria dagar läggs till från Open-Meteo för platsen.','De warmtesom en vorstvrije dagen van het seizoen worden voor deze plek aangevuld via Open-Meteo.'):tr('Give the record or its project a map position, and the season’s heat sum is added automatically.','Ge posten eller projektet en kartposition så läggs säsongens värmesumma till automatiskt.','Geef het record of het project een kaartpositie, dan wordt de warmtesom automatisch aangevuld.'))+'</p>'+btn('ph-summer-save',tr('Save summer','Spara sommar','Zomer opslaan'))+'</form>';
  if(k==='harvest'){const lu=store.get('ab.hunit')||'kg';return '<form class="obsform" onsubmit="return false"><label class="f"><span class="fl">'+esc(tr('Date','Datum','Datum'))+'</span><input id="phHd" type="date" value="'+today()+'"></label>'+
    '<label class="f"><span class="fl">'+esc(tr('Amount','Mängd','Hoeveelheid'))+'</span><input id="phHa" type="number" min="0" step="any" inputmode="decimal"'+(lu==='ok'?' disabled':'')+'></label>'+
    '<label class="f"><span class="fl">'+esc(tr('Unit','Enhet','Eenheid'))+'</span>'+sel('phHu',HUNIT,lu)+'</label>'+
    '<label class="f wide"><span class="fl">'+esc(tr('Note (optional)','Anteckning (valfritt)','Notitie (optioneel)'))+'</span><input id="phHn" maxlength="200"></label>'+btn('ph-harv-save',tr('Save harvest','Spara skörd','Oogst opslaan'))+'</form>'}
  if(k==='note')return '<form class="obsform" onsubmit="return false"><label class="f wide"><span class="fl">'+esc(tr('Note','Anteckning','Notitie'))+'</span><textarea id="phNn" rows="2" maxlength="1000"></textarea></label>'+
    '<label class="f"><span class="fl">'+esc(tr('Photo (optional)','Foto (valfritt)','Foto (optioneel)'))+'</span><input id="phNp" type="file" accept="image/*"></label>'+btn('ph-note-save',tr('Save note','Spara anteckning','Notitie opslaan'))+'</form>';
  if(k==='spot')return '<form class="obsform" onsubmit="return false">'+microHTML('phM',p.micro||{})+'<p class="muted" style="grid-column:1/-1;margin:0;font-size:13px">'+esc(tr('Quick taps about this plant’s own spot. They often explain more than the zone: a south wall or snow cover can be worth a whole zone.','Snabba val om plantans egen plats. De förklarar ofta mer än zonen: en sydvägg eller ett snötäcke kan vara värt en hel zon.','Snelle keuzes over de eigen plek van deze plant. Ze verklaren vaak meer dan de zone: een zuidmuur of een sneeuwdek kan een hele zone waard zijn.'))+'</p>'+btn('ph-spot-save',tr('Save spot','Spara platsen','Plek opslaan'))+'</form>';
  return '';
}
function updatePlHist(){
  const box=$('#phBody');if(!box)return;
  const p=(state.plantings||[]).find(x=>x.id===openPl);
  if(!p){box.innerHTML='<div class="empty"><p>'+esc(loaded?tr('This planting record is not available (deleted, or in a project you are not a member of).','Planteringen är inte tillgänglig (raderad, eller i ett projekt du inte är medlem i).','Deze aanplant is niet beschikbaar (verwijderd, of in een project waar je geen lid van bent).'):tr('Loading…','Laddar…','Laden…'))+'</p></div>';return}
  const ed=canEdit(p.id),x=bySid.get(p.sid),q=p.project&&pjById(p.project),pt=plPoint(p),mi=plMicro(p),pl=plPlaceOf(p);
  const facts=[plPlaceName(p)?tr('Place: ','Plats: ','Plek: ')+plPlaceName(p):'',p.date?tr('Planted ','Planterad ','Geplant ')+p.date:'',p.count?p.count+' '+tr('plants','plantor','planten'):'',
    pt?(pt.own?tr('Own map position','Egen kartposition','Eigen kaartpositie')+(p.acc?' ± '+p.acc+' m':''):pt.plan?tr('Map position from the garden plan','Kartposition från trädgårdsplanen','Kaartpositie uit het tuinplan'):tr('Map position of the project','Projektets kartposition','Kaartpositie van het project')):tr('No map position','Ingen kartposition','Geen kaartpositie'),
    p.pos?tr('on the plan at ','på planen vid ','op het plan op ')+'x '+numTxt(p.pos.x)+' m, y '+numTxt(p.pos.y)+' m':''].filter(Boolean);
  const act=(k,lab)=>'<button type="button" class="btn sm'+(phState.open===k?' primary':'')+'" data-act="ph-open" data-k="'+k+'">'+esc(lab)+'</button>';
  box.innerHTML='<div class="ovhead"><div><p style="margin:0"><a href="#plantings" class="lnk">← '+esc(tr('Planting records','Planteringar','Aanplantingen'))+'</a></p>'+
    '<h1 style="margin:4px 0"><button type="button" class="lnk" data-open="'+esc(p.sid+(p.cultivar?'--'+cvKey(p.cultivar):''))+'">'+esc(plTitle(p))+'</button></h1>'+
    '<p class="muted" style="margin:0">'+(q?pjPill(q.id)+' ':'')+pstatPill(p.status)+' '+esc(facts.join(' · '))+'</p></div></div>'+
    (p.notes?'<p>'+esc(p.notes)+'</p>':'')+
    '<section class="admsec"><h2 class="hsec">'+esc(tr('Spot','Platsen','Plek'))+'</h2>'+(microTxt(mi)?'<p style="margin:0">'+esc(microTxt(mi))+(pl&&pl.micro&&!p.micro?' <small class="muted">'+esc(tr('(from the place ','(från platsen ','(van de plek ')+pl.name+')')+'</small>':'')+'</p>':'<p class="muted" style="margin:0">'+esc(tr('No spot details yet.','Inga uppgifter om platsen ännu.','Nog geen gegevens over de plek.'))+'</p>')+
      (q&&q.site?'<details style="margin-top:6px"><summary>'+esc(tr('Site values of ','Platsvärden för ','Locatiewaarden van ')+pjName(q.id))+'</summary>'+siteTable(q.site)+'</details>':'')+'</section>'+
    (ed?'<div class="acts w-only phacts" style="margin:10px 0">'+act('spot',tr('Spot','Platsen','Plek'))+'<button type="button" class="btn sm" data-act="pl-winter" data-id="'+esc(p.id)+'">'+esc(tr('Log a winter','Notera en vinter','Winter noteren'))+'</button>'+act('summer',tr('Log a summer','Notera en sommar','Zomer noteren'))+act('harvest',tr('Log a harvest','Notera en skörd','Oogst noteren'))+act('note',tr('Note or photo','Anteckning eller foto','Notitie of foto'))+
      '<select data-plstat="'+esc(p.id)+'" aria-label="'+esc(tr('Update status','Uppdatera status'))+'"><option value="">'+esc(tr('Update status…','Uppdatera status…'))+'</option>'+PSTAT.map(o=>'<option value="'+o.k+'">'+esc(trs(o.en,o.sv))+'</option>').join('')+'</select>'+
      '<button type="button" class="btn sm" data-act="pl-edit" data-id="'+esc(p.id)+'">'+esc(tr('Edit','Redigera','Bewerken'))+'</button>'+
      (p.project?'<button type="button" class="btn sm" data-act="ph-plan" data-id="'+esc(p.id)+'">'+esc(p.pos?tr('Show on the plan','Visa på planen','Op het plan tonen'):tr('Put on the plan','Lägg på planen','Op het plan zetten'))+'</button>':'')+
      '<button type="button" class="btn sm" data-act="pl-mapplace" data-id="'+esc(p.id)+'">'+esc(tr('Place on the map','Placera på kartan','Op de kaart plaatsen'))+'</button></div>'+winterForm(p)+(phState.open?'<div class="phform">'+phFormHTML(p,phState.open)+'</div>':''):'')+
    '<section class="admsec"><h2 class="hsec">'+esc(tr('History','Historik','Geschiedenis'))+'</h2>'+phTimeline(p)+'</section>'+
    (x?'<p class="muted" style="font-size:13px">'+esc(tr('What other growers recorded for this species (all projects, sums only): ','Vad andra odlare registrerat för arten (alla projekt, bara summor): ','Wat andere kwekers voor deze soort vastlegden (alle projecten, alleen sommen): '))+esc([provenOf(x)?provenTxt(provenOf(x)):'',summerOf(x)?summerTxt(summerOf(x)):''].filter(Boolean).join(' · ')||tr('nothing yet.','inget ännu.','nog niets.'))+'</p>':'');
}
async function phSummerSave(id){
  const p=(state.plantings||[]).find(x=>x.id===id);if(!p)return;
  const y=Number($('#phSy').value)||summerYear(),r={id:recId(),y,o:$('#phSo').value,why:$('#phSw').value||'',date:today()};
  const w=$('#phSr');if(w&&w.value)r.wood=w.value;const f=$('#phSf').value;if(f)r.first=f;if(r.o==='matured')r.why='';
  let msg=tr('Summer saved','Sommaren sparad','Zomer opgeslagen'),bad=false;
  try{const c=await seasonAt(p,y);if(c){Object.assign(r,c);r.src='open-meteo';msg+=': ≈ '+intTxt(c.gdd)+' '+tr('degree days','graddagar','graaddagen')}}catch(e){msg+='. '+omErrMsg(e);bad=true}
  phState.open='';if(await plPatch(id,d=>{d.summers=(d.summers||[]).concat([r])}))toast(msg,bad?'err':'');
}
async function phHarvSave(id){
  const u=$('#phHu').value,a=$('#phHa').value,h={id:recId(),date:$('#phHd').value||today(),unit:u,note:($('#phHn').value||'').trim()};
  if(u!=='ok'){if(a===''||!isFinite(Number(a))){toast(tr('Give an amount, or choose “harvested (no amount)”.','Ange en mängd, eller välj ”skördat (ingen mängd)”.','Geef een hoeveelheid, of kies “geoogst (geen hoeveelheid)”.'),'err');return}h.amt=Number(a)}
  store.set('ab.hunit',u);phState.open='';await plPatch(id,d=>{d.harvests=(d.harvests||[]).concat([h])},tr('Harvest saved','Skörden sparad','Oogst opgeslagen'));
}
async function phNoteSave(id){
  const n=($('#phNn').value||'').trim(),f=($('#phNp').files||[])[0];if(!n&&!f){toast(tr('Write a note or choose a photo.','Skriv en anteckning eller välj ett foto.','Schrijf een notitie of kies een foto.'),'err');return}
  const l={id:recId(),date:today(),at:Date.now(),note:n};
  if(f){toast(tr('Uploading the photo…','Laddar upp fotot…','Foto uploaden…'));try{l.photo=await uploadPlPhoto(f)}catch(e){toast(errMsg(e),'err');return}}
  phState.open='';await plPatch(id,d=>{d.log=(d.log||[]).concat([l])},tr('Note saved','Anteckningen sparad','Notitie opgeslagen'));
}
async function phSpotSave(id){const m=microRead('phM');phState.open='';await plPatch(id,d=>{if(Object.keys(m).length)d.micro=m;else delete d.micro},tr('Spot saved','Platsen sparad','Plek opgeslagen'))}
async function phDel(id,arr,i){if(['winters','summers','harvests','log'].indexOf(arr)<0)return;await plPatch(id,d=>{const a=(d[arr]||[]).slice();a.splice(i,1);d[arr]=a},tr('Removed','Borttagen','Verwijderd'))}

/* ---------- season checks: the spring winter prompt and the autumn summer prompt (rows 71 and 74) ----------
   One list per project with the plants that have no record for that winter or summer yet; one tap each, one save.
   The lowest winter temperature and the summer's heat sum are looked up once per map position. */
const scState={k:'',pid:''};
// The winter to record in a season check: the one that ended last spring (or is ending now).
const scWinter=()=>{const y=new Date().getFullYear();return (y-1)+'/'+String(y).slice(2)};
const scLive=p=>!isEnc(p)&&p.status!=='planned'&&p.status!=='removed';
const scWinterTodo=list=>list.filter(p=>scLive(p)&&!(p.winters||[]).some(w=>winterStart(w.w)===winterStart(scWinter())));
const scSummerTodo=list=>list.filter(p=>scLive(p)&&p.status!=='dead'&&!(p.summers||[]).some(r=>Number(r.y)===summerYear()));
function scHTML(p){
  const pl=pjPlantings(p.id),wt=scWinterTodo(pl),st=scSummerTodo(pl),ed=projCanEdit(p.id);
  let h='<p class="muted" style="margin:0 0 6px">'+esc(tr('Winter ','Vinter ','Winter ')+scWinter()+': '+wt.length+' '+(wt.length===1?tr('plant without a record','planta utan notering','plant zonder notitie'):tr('plants without a record','plantor utan notering','planten zonder notitie'))+' · '+tr('Summer ','Sommar ','Zomer ')+summerYear()+': '+st.length+' '+tr('without a record','utan notering','zonder notitie'))+'</p>';
  if(ed)h+='<div class="acts"><button type="button" class="btn sm'+(scState.k==='w'&&scState.pid===p.id?' primary':'')+'" data-act="sc-open" data-k="w"'+(wt.length?'':' disabled')+'>'+esc(tr('Winter check','Vinterkoll','Wintercontrole'))+'</button><button type="button" class="btn sm'+(scState.k==='s'&&scState.pid===p.id?' primary':'')+'" data-act="sc-open" data-k="s"'+(st.length?'':' disabled')+'>'+esc(tr('Summer check','Sommarkoll','Zomercontrole'))+'</button></div>';
  if(!ed||scState.pid!==p.id||!scState.k)return h;
  const list=(scState.k==='w'?wt:st).slice().sort((a,b)=>plTitle(a).localeCompare(plTitle(b)));if(!list.length)return h;
  const opt=(o,empty)=>'<option value="">'+esc(empty)+'</option>'+o.map(x=>'<option value="'+x.k+'">'+esc(t3(x))+'</option>').join('');
  const rows=list.map(q=>{const x=bySid.get(q.sid),wd=x&&x.form==='w';return '<div class="scrow" data-sc="'+esc(q.id)+'"><span><b>'+esc(plTitle(q))+'</b>'+(plPlaceName(q)?' <small class="muted">'+esc(plPlaceName(q))+'</small>':'')+'</span>'+
    (scState.k==='w'?'<select class="sc-o" aria-label="'+esc(tr('Result','Resultat','Resultaat'))+'">'+opt(WOUT.map(o=>({k:o.k,en:o.en,sv:o.sv,nl:nl(o.en)})),tr('skip','hoppa över','overslaan'))+'</select>'
      :'<select class="sc-o" aria-label="'+esc(tr('Did it mature?','Mognade den?','Werd hij rijp?'))+'">'+opt(SOUT,tr('skip','hoppa över','overslaan'))+'</select>'+(wd?'<select class="sc-r" aria-label="'+esc(tr('This year’s shoots','Årets skott','De scheuten van dit jaar'))+'">'+opt(SWOOD,tr('shoots: –','skott: –','scheuten: –'))+'</select>':''))+'</div>'}).join('');
  return h+'<div class="scbox"><p style="margin:6px 0">'+esc(scState.k==='w'?tr('How did your plants come through winter ','Hur klarade sig plantorna vintern ','Hoe kwamen je planten door de winter ')+scWinter()+'? '+tr('Losses count as much as successes.','Förluster räknas lika mycket som framgångar.','Verliezen tellen even zwaar als successen.'):tr('What matured in summer ','Vad mognade sommaren ','Wat werd rijp in de zomer van ')+summerYear()+'? '+tr('“Did not mature” is just as useful to others.','”Mognade inte” är lika nyttigt för andra.','“Niet rijp geworden” is net zo nuttig voor anderen.'))+'</p>'+rows+
    '<div class="acts" style="margin-top:8px"><button type="button" class="btn sm primary" data-act="sc-save">'+esc(tr('Save','Spara','Opslaan'))+'</button><button type="button" class="btn sm" data-act="sc-close">'+esc(tr('Close','Stäng','Sluiten'))+'</button></div></div>';
}
async function scSave(){
  const p=pjActive();if(!p||!scState.k)return;const rows=[],look=new Map();let bad='';
  $$('.scbox [data-sc]').forEach(el=>{const o=el.querySelector('.sc-o').value;if(!o)return;const q=(state.plantings||[]).find(x=>x.id===el.dataset.sc);if(!q)return;const r=el.querySelector('.sc-r');rows.push({q,o,wood:r?r.value:''})});
  if(!rows.length){toast(tr('Nothing chosen yet.','Inget valt ännu.','Nog niets gekozen.'),'err');return}
  toast(tr('Looking up the climate and saving…','Hämtar klimatet och sparar…','Klimaat opzoeken en opslaan…'));
  const out=[];
  for(const r of rows){
    const d=plDoc(r.q),pt=plPoint(r.q),key=pt?ptKey(pt.lat,pt.lng):'';
    if(scState.k==='w'){
      const w=scWinter(),rec={w,t:'',o:r.o,date:today()};
      if(pt){if(!look.has(key))look.set(key,winterMin(pt.lat,pt.lng,winterStart(w)).then(v=>v,e=>{bad=omErrMsg(e);return null}));const v=await look.get(key);if(v){rec.t=v.t;rec.tSrc='open-meteo'}}
      d.winters=(d.winters||[]).concat([rec]);if(r.o==='died'&&d.status!=='dead'){d.status='dead';d.checks=(d.checks||[]).concat([{date:today(),status:'dead',note:tr('Winter check','Vinterkoll','Wintercontrole')}])}
    }else{
      const y=summerYear(),rec={id:recId(),y,o:r.o,date:today()};if(r.wood)rec.wood=r.wood;
      if(pt){if(!look.has(key))look.set(key,yearVals(pt.lat,pt.lng,y,false).then(v=>v,e=>{bad=omErrMsg(e);return null}));const v=await look.get(key);if(v){rec.gdd=v.gdd;rec.ffd=v.ffd;if(v.partial)rec.sofar=true;rec.src='open-meteo'}}
      d.summers=(d.summers||[]).concat([rec]);
    }
    out.push({id:r.q.id,data:d});
  }
  try{await Data.saveRows('plantings',out);scState.k='';toast((tr('Saved for ','Sparat för ','Opgeslagen voor ')+out.length+' '+(out.length===1?tr('plant','planta','plant'):tr('plants','plantor','planten')))+(bad?'. '+tr('Climate: ','Klimat: ','Klimaat: ')+bad:''),bad?'err':'');updateProjects()}catch(e){toast(errMsg(e),'err')}
}

/* ---------- site values on the project page (row 71) ---------- */
const siteBusy={pid:'',msg:''};
function pjSiteValsHTML(p,ed){
  const v=p.site,has=hasPt(p);
  let h=v?siteTable(v)+'<p class="muted" style="font-size:13px;margin:6px 0 0">'+esc(tr('Looked up ','Hämtat ','Opgezocht op ')+v.at+(v.years?' · '+tr('growing seasons ','växtsäsonger ','groeiseizoenen ')+v.years:'')+' · ')+SITE_CREDIT+'</p>'
    :'<p class="muted" style="margin:0">'+esc(has?tr('Not looked up yet.','Inte hämtat ännu.','Nog niet opgezocht.'):tr('Save a site point first (Edit name and site).','Spara en platspunkt först (Redigera namn och plats).','Sla eerst een locatie op (Naam en locatie bewerken).'))+'</p>';
  h+='<p class="muted" style="font-size:13px;margin:6px 0 0">'+esc(tr('The site point itself stays private to the project. These derived values are what may be compared with other growers later, never the point.','Själva platspunkten stannar inom projektet. De här härledda värdena är vad som senare kan jämföras med andra odlare, aldrig punkten.','De locatie zelf blijft binnen het project. Deze afgeleide waarden kunnen later met andere kwekers worden vergeleken, nooit de locatie zelf.'))+'</p>';
  if(siteBusy.pid===p.id)h+='<p class="admwarn" style="margin:6px 0 0">'+esc(siteBusy.msg)+'</p>';
  if(ed&&has)h+='<div class="acts" style="margin-top:8px"><button type="button" class="btn sm" data-act="pj-site-look"'+(siteBusy.pid?' disabled':'')+'>'+esc(v?tr('Look up again','Hämta igen','Opnieuw opzoeken'):tr('Look up site values (1–2 min)','Hämta platsvärden (1–2 min)','Locatiewaarden opzoeken (1–2 min)'))+'</button></div>';
  return h;
}
async function pjSiteLook(){
  const p=pjActive();if(!p||!hasPt(p)||siteBusy.pid)return;siteBusy.pid=p.id;
  const show=t=>{siteBusy.msg=t;if(!$('#v-projects').hidden)updateProjects()};
  try{const v=await siteLookup(Number(p.lat),Number(p.lng),show);siteBusy.pid='';const q=pjById(p.id)||p;
    await pjSaveDoc(q,{site:v},tr('Site values saved','Platsvärden sparade','Locatiewaarden opgeslagen')+(v.miss.length?' ('+tr('not found: ','hittades inte: ','niet gevonden: ')+v.miss.join(', ')+')':''))}
  catch(e){siteBusy.pid='';toast(omErrMsg(e),'err');updateProjects()}
}

/* ---------- places feed Pick a plant (row 24) ---------- */
const pjPlState={edit:''};
function pjPlaceCondHTML(p,x){
  return '<form class="obsform" onsubmit="return false" style="margin:6px 0 10px">'+microHTML('pqM',x.micro||{},['sun','moist','shel','snow','frost'])+
    '<label class="f"><span class="fl">'+esc(tr('Soil','Jord','Grond'))+'</span><select id="pqSoil"><option value="">'+esc(tr('– as the site –','– som platsen –','– als de locatie –'))+'</option>'+SOIL.map(o=>'<option value="'+o.k+'"'+((x.soil||[])[0]===o.k?' selected':'')+'>'+esc(trs(o.en,o.sv))+'</option>').join('')+'</select></label>'+
    '<div class="acts" style="grid-column:1/-1"><button type="button" class="btn sm primary" data-act="pj-place-cond-save" data-id="'+esc(x.id)+'">'+esc(tr('Save','Spara','Opslaan'))+'</button><button type="button" class="btn sm" data-act="pj-place-cond" data-id="">'+esc(tr('Cancel','Avbryt','Annuleren'))+'</button></div></form>';
}
async function pjPlaceCondSave(id){
  const p=pjActive();if(!p)return;const m=microRead('pqM'),so=($('#pqSoil')||{}).value||'';pjPlState.edit='';
  await pjSaveDoc(p,{places:(p.places||[]).map(y=>{if(y.id!==id)return y;const z=Object.assign({},y,{micro:m});if(so)z.soil=[so];else delete z.soil;return z})},tr('Place saved','Platsen sparad','Plek opgeslagen'));
}
// Fill Pick a plant from a project (and one of its places): zone, winter low, light, moisture, soil, heat sum.
function pickFromSite(p,x){
  if(!p)return;pickState.site=null;
  if(p.szone){const z=String(p.szone).match(/\d/);if(z)pickState.zone=z[0]}
  const v=p.site;if(v&&v.winterLow!=null)pickState.temp=String(Math.round(v.winterLow));
  if(v&&(v.gdd!=null||v.ffd!=null))pickState.site={gdd:v.gdd,ffd:v.ffd,name:pjName(p.id)+(x?' · '+x.name:'')};
  if(v&&v.soilCls&&v.soilCls.length)pickState.soil=new Set(v.soilCls);
  if(x){const m=x.micro||{};if(m.sun)pickState.light={full:'sun',part:'part',shade:'shade'}[m.sun]||'';if(m.moist)pickState.moist={dry:2,normal:3,wet:4}[m.moist]||0;if(x.soil&&x.soil.length)pickState.soil=new Set(x.soil);
    if(!pickState.site)pickState.site={name:pjName(p.id)+' · '+x.name}}
  location.hash='pick';
  setTimeout(()=>{const g=$('#pkGeo');if(g&&hasPt(p)){g.value=p.lat+', '+p.lng}if(typeof updatePick==='function')updatePick()},50);
}
function pkSiteNote(){
  const s=pickState.site;if(!s)return '';
  return '<p class="pksite">'+esc(tr('Spot: ','Plats: ','Plek: ')+s.name+(s.gdd!=null?' · ≈ '+intTxt(s.gdd)+' '+tr('degree days','graddagar','graaddagen'):'')+(s.ffd!=null?', '+s.ffd+' '+tr('frost-free days','frostfria dagar','vorstvrije dagen'):''))+' <button type="button" class="btn sm" data-act="pk-site-clear">'+esc(tr('Clear','Rensa','Wissen'))+'</button></p>';
}

/* ---------- quick capture in the field (row 26): photo + note + position, attached to the nearest planting ---------- */
const QC={pos:null,asking:false,err:''};
function qcLocate(){
  if(QC.asking||!navigator.geolocation)return;QC.asking=true;QC.err='';updateCapture();
  navigator.geolocation.getCurrentPosition(g=>{QC.asking=false;QC.pos={lat:g.coords.latitude,lng:g.coords.longitude,acc:Math.round(g.coords.accuracy||0)};updateCapture()},
    ()=>{QC.asking=false;QC.err=tr('Position not available.','Positionen är inte tillgänglig.','Positie niet beschikbaar.');updateCapture()},{enableHighAccuracy:true,timeout:20000,maximumAge:30000});
}
function distM(a,b){const k=Math.PI/180,x=(b.lng-a.lng)*k*Math.cos((a.lat+b.lat)/2*k),y=(b.lat-a.lat)*k;return Math.round(Math.sqrt(x*x+y*y)*6371000)}
function qcCands(){
  const list=(state.plantings||[]).filter(p=>!isEnc(p)&&canEdit(p.id)&&p.status!=='removed');
  return list.map(p=>({p,d:QC.pos&&hasPt(p)?distM(QC.pos,{lat:Number(p.lat),lng:Number(p.lng)}):null})).sort((a,b)=>(a.d==null)-(b.d==null)||(a.d||0)-(b.d||0)||(a.p.project===PJ?0:1)-(b.p.project===PJ?0:1)||plTitle(a.p).localeCompare(plTitle(b.p)));
}
function updateCapture(){
  const box=$('#qcBody');if(!box)return;
  const c=qcCands(),sel=($('#qcPl')||{}).value,keep={note:($('#qcNote')||{}).value||''};
  if(!c.length){box.innerHTML='<div class="empty"><p>'+esc(tr('No planting records you can add to yet.','Inga planteringar som du kan lägga till i ännu.','Nog geen aanplantingen waar je aan kunt toevoegen.'))+'</p></div>';return}
  const near=c[0].d!=null&&c[0].d<=150?c[0].p.id:'';
  const pos=QC.pos?tr('Your position: ±','Din position: ±','Jouw positie: ±')+QC.pos.acc+' m':QC.asking?tr('Finding your position…','Söker din position…','Je positie zoeken…'):QC.err||tr('No position yet.','Ingen position ännu.','Nog geen positie.');
  box.innerHTML='<form class="obsform" onsubmit="return false">'+
    '<label class="f wide"><span class="fl">'+esc(tr('Photo','Foto','Foto'))+'</span><input id="qcPhoto" type="file" accept="image/*" capture="environment"></label>'+
    '<label class="f wide"><span class="fl">'+esc(tr('Note','Anteckning','Notitie'))+'</span><textarea id="qcNote" rows="2" maxlength="1000" placeholder="'+esc(tr('What do you see? Flowering, damage, first fruit…','Vad ser du? Blomning, skador, första frukten…','Wat zie je? Bloei, schade, eerste vrucht…'))+'">'+esc(keep.note)+'</textarea></label>'+
    '<div class="f wide"><span class="fl">'+esc(tr('Plant','Planta','Plant'))+'</span><select id="qcPl">'+c.map(o=>'<option value="'+esc(o.p.id)+'"'+((sel||near)===o.p.id?' selected':'')+'>'+esc(plTitle(o.p)+(plPlaceName(o.p)?' · '+plPlaceName(o.p):'')+(o.p.project?' · '+pjName(o.p.project):'')+(o.d!=null?' · ≈ '+o.d+' m':''))+'</option>').join('')+'</select></div>'+
    '<p class="muted" style="grid-column:1/-1;margin:0;font-size:13px">'+esc(pos)+' <button type="button" class="btn sm" data-act="qc-locate">'+esc(tr('Update position','Uppdatera position','Positie bijwerken'))+'</button></p>'+
    '<label class="chk" style="grid-column:1/-1" id="qcSetWrap"'+(QC.pos?'':' hidden')+'><input type="checkbox" id="qcSetPos"> '+esc(tr('Also save this position as the plant’s own map position (only project members see it)','Spara också positionen som plantans egen kartposition (bara projektets medlemmar ser den)','Deze positie ook als eigen kaartpositie van de plant opslaan (alleen projectleden zien hem)'))+'</label>'+
    '<div class="acts" style="grid-column:1/-1"><button type="button" class="btn primary" data-act="qc-save">'+esc(tr('Save to this plant','Spara till plantan','Opslaan bij deze plant'))+'</button></div></form>'+
    '<p class="muted" style="font-size:13px">'+esc(tr('The nearest plant with a map position is chosen for you. Photos are stored with a long random name; only the project’s members see the record that points to them.','Närmaste planta med kartposition väljs åt dig. Foton sparas med ett långt slumpat namn; bara projektets medlemmar ser posten som pekar på dem.','De dichtstbijzijnde plant met een kaartpositie wordt voor je gekozen. Foto’s worden opgeslagen met een lange willekeurige naam; alleen de projectleden zien het record dat ernaar verwijst.'))+'</p>';
}
async function qcSave(){
  const id=($('#qcPl')||{}).value,f=(($('#qcPhoto')||{}).files||[])[0],n=(($('#qcNote')||{}).value||'').trim(),setPos=!!(($('#qcSetPos')||{}).checked);
  if(!id)return;if(!f&&!n){toast(tr('Take a photo or write a note.','Ta ett foto eller skriv en anteckning.','Maak een foto of schrijf een notitie.'),'err');return}
  const l={id:recId(),date:today(),at:Date.now(),note:n};if(QC.pos){l.lat=Number(QC.pos.lat.toFixed(6));l.lng=Number(QC.pos.lng.toFixed(6));l.acc=QC.pos.acc}
  if(f){toast(tr('Uploading the photo…','Laddar upp fotot…','Foto uploaden…'));try{l.photo=await uploadPlPhoto(f)}catch(e){toast(errMsg(e),'err');return}}
  const ok=await plPatch(id,d=>{d.log=(d.log||[]).concat([l]);if(setPos&&QC.pos){d.lat=l.lat;d.lng=l.lng}},tr('Saved to ','Sparat till ','Opgeslagen bij ')+plTitle((state.plantings||[]).find(x=>x.id===id)||{}));
  if(ok){const a=$('#qcNote');if(a)a.value='';const b=$('#qcPhoto');if(b)b.value='';updateCapture()}
}

/* ---------- the monthly to-do from what is actually planted (row 25) ---------- */
function myTodo(mo){
  const own=(state.plantings||[]).filter(p=>!isEnc(p)&&p.project&&['planned','alive','struggling'].indexOf(p.status||'alive')>=0);
  if(!own.length)return null;
  const sp=k=>[...new Set(own.filter(p=>p.status!=='planned').map(p=>p.sid))].map(s=>bySid.get(s)).filter(x=>x&&(x.m[k]||[]).indexOf(mo)>=0);
  const planned=[...new Set(own.filter(p=>p.status==='planned').map(p=>p.sid))].map(s=>bySid.get(s)).filter(Boolean);
  const all=(state.plantings||[]).filter(p=>p.project&&canEdit(p.id));
  return{harvest:sp('cal3'),flower:sp('cal2'),prune:sp('cal4'),planned,
    winter:mo>=3&&mo<=6?scWinterTodo(all).length:0,summer:mo>=8&&mo<=11?scSummerTodo(all).length:0};
}
function myTodoHTML(mo,none){
  const t=myTodo(mo);if(!t)return '';
  const row=(l,a)=>'<div class="trow"><span>'+l+'</span>'+(chipList(a)||none)+'</div>';
  const chk=[t.winter?'<button type="button" class="btn sm" data-act="sc-go" data-k="w">'+esc(tr('Winter check: ','Vinterkoll: ','Wintercontrole: ')+t.winter+' '+tr('plants','plantor','planten'))+'</button>':'',
    t.summer?'<button type="button" class="btn sm" data-act="sc-go" data-k="s">'+esc(tr('Summer check: ','Sommarkoll: ','Zomercontrole: ')+t.summer+' '+tr('plants','plantor','planten'))+'</button>':''].filter(Boolean).join(' ');
  return '<div class="mytodo"><div class="eyebrow" style="margin-top:4px">'+esc(tr('Your plants','Dina plantor','Jouw planten'))+'</div>'+
    row(trh('Harvest','Skörda','Oogsten'),t.harvest)+row(trh('Flowering','Blommar','Bloei'),t.flower)+row(trh('Prune / cut','Beskär / skär','Snoeien / knippen'),t.prune)+(t.planned.length?row(trh('Planned, not planted yet','Planerade, inte planterade än','Gepland, nog niet geplant'),t.planned):'')+
    (chk?'<div class="acts" style="margin:6px 0 0">'+chk+'</div>':'')+'</div>';
}
function scGo(k){
  const all=(state.plantings||[]).filter(p=>p.project&&canEdit(p.id)),todo=k==='w'?scWinterTodo(all):scSummerTodo(all);
  const pid=(todo.find(p=>p.project===PJ)||todo[0]||{}).project;if(!pid)return;pjSet(pid);scState.k=k;scState.pid=pid;go('projects');
}

/* ---------- events for this part (called from part 21) ---------- */
function recClick(act,a){
  const id=a.dataset.id;
  if(act==='ph-open'){phState.open=phState.open===a.dataset.k?'':a.dataset.k;updatePlHist();return true}
  if(act==='ph-close'){phState.open='';updatePlHist();return true}
  if(act==='ph-summer-save'){phSummerSave(id);return true}
  if(act==='ph-harv-save'){phHarvSave(id);return true}
  if(act==='ph-note-save'){phNoteSave(id);return true}
  if(act==='ph-spot-save'){phSpotSave(id);return true}
  if(act==='ph-del'){arm(a,()=>phDel(openPl,a.dataset.arr,Number(a.dataset.i)));return true}
  if(act==='pl-hist'){location.hash='p-'+id;return true}
  if(act==='sc-open'){const p=pjActive();if(p){scState.k=scState.k===a.dataset.k&&scState.pid===p.id?'':a.dataset.k;scState.pid=p.id;updateProjects()}return true}
  if(act==='sc-close'){scState.k='';updateProjects();return true}
  if(act==='sc-save'){scSave();return true}
  if(act==='sc-go'){scGo(a.dataset.k);return true}
  if(act==='pj-site-look'){pjSiteLook();return true}
  if(act==='pj-place-cond'){pjPlState.edit=pjPlState.edit===id?'':id;updateProjects();return true}
  if(act==='pj-place-cond-save'){pjPlaceCondSave(id);return true}
  if(act==='pj-place-pick'){const p=pjActive(),x=p&&(p.places||[]).find(y=>y.id===id);if(p&&x)pickFromSite(p,x);return true}
  if(act==='pk-site-clear'){pickState.site=null;updatePick();return true}
  if(act==='rc-capture'){go('capture');return true}
  if(act==='qc-locate'){qcLocate();return true}
  if(act==='qc-save'){qcSave();return true}
  if(act==='pl-tab'){plState.tab=a.dataset.k;store.set('ab.pltab',plState.tab);updatePlantings();return true}
  return false;
}
function recChange(t){
  if(t.id==='phHu'){const a=$('#phHa');if(a){a.disabled=t.value==='ok';if(a.disabled)a.value=''}return true}
  if(t.id==='plPlaceId'){const q=pjById(($('#plProj')||{}).value),x=q&&(q.places||[]).find(y=>y.id===t.value);if(x&&x.micro&&Object.keys(x.micro).length){microFill('plM',x.micro,true);const d=$('#plMicro')&&$('#plMicro').closest('details');if(d)d.open=true}return true}
  return false;
}
