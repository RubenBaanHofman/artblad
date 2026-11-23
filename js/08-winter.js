// Artblad: Winter survival records and sanity checks.
// Part 8 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- winter survival records (stored in planting records: winters:[{w,t,o,date}]) ---------- */
const WOUT=O('survived:Survived:Överlevde|damaged:Damaged:Skadad|died:Died:Dog');
// The coldest winter temperature a species (or cultivar) is recorded to have survived, and in how many plantings.
function provenOf(x){
  const pl=(x&&x.plantings)||[];let t=null,ts=null;const ids=new Set(),sids=new Set();let n=null;
  // Since 2.7.1 the planting part comes from the database's summed evidence over ALL projects (artblad_evidence),
  // so private projects count for everyone without showing their records. Without v9: the visible plantings, as before.
  const ev=EVID&&x?EVID.get(x.sid):null;
  if(EVID&&x){n=0;(ev||[]).filter(r=>!x.isCv||(r.cultivar&&cvKey(r.cultivar)===x.ck)).forEach(r=>{const v=Number(r.t_survived);if(r.survived>0&&r.t_survived!=null&&isFinite(v)){n+=r.survived;if(t==null||v<t)t=v}})}
  else pl.forEach(p=>(p.winters||[]).forEach(w=>{const v=Number(w.t);if(w.o==='survived'&&w.t!==''&&w.t!=null&&isFinite(v)){ids.add(p.id);if(t==null||v<t)t=v}}));
  // Encounters marked as established, with the winter climate of their map position (Open-Meteo): "seen established".
  pl.forEach(p=>{if(isEnc(p)&&p.established&&p.clim&&isFinite(p.clim.t)){sids.add(p.id);if(ts==null||p.clim.t<ts)ts=p.clim.t}});
  if(t==null&&ts==null)return null;
  return{t:t==null?ts:ts==null?t:Math.min(t,ts),n:n!=null?n:ids.size,tOwn:t,tSeen:ts,ns:sids.size};
}
const provenTxt=pv=>[pv.tOwn!=null?tr('Survived ','Överlevde ','Overleefde ')+fmtC(pv.tOwn)+' ('+pv.n+' '+(pv.n===1?tr('planting','plantering','aanplant'):tr('plantings','planteringar','aanplantingen'))+')':'',
  pv.tSeen!=null?tr('seen established where winters reach ≈ ','sedd etablerad där vintrarna når ≈ ','gevestigd gezien waar de winters ≈ ')+fmtC(pv.tSeen)+tr('','',' halen')+' ('+pv.ns+' '+(pv.ns===1?tr('encounter','fynd','vondst'):tr('encounters','fynd','vondsten'))+')':''].filter(Boolean).join(' · ').replace(/^./,c=>c.toUpperCase());
const lastWinter=()=>{const d=new Date(),y=d.getMonth()<6?d.getFullYear()-1:d.getFullYear();return y+'/'+String(y+1).slice(2)};
function winterRows(p){return (p.winters||[]).map(w=>'<span class="pill wint '+esc(w.o)+'"'+(w.tSrc?' title="'+esc(tr('Lowest temperature looked up for this spot and winter','Lägsta temperatur hämtad för platsen och vintern','Laagste temperatuur opgezocht voor deze plek en winter')+' ('+tSrcTxt(w)+')')+'"':'')+'>'+esc(tr('Winter ','Vinter ','Winter ')+w.w+': '+(w.t!==''&&w.t!=null?(w.tSrc==='open-meteo'?'≈ ':'')+fmtC(Number(w.t))+(w.tSrc&&w.tSrc!=='open-meteo'?' ('+tr('measured','uppmätt','gemeten')+')':w.tSrc==='open-meteo'?' ('+tr('model','modell','model')+')':'')+', ':'')+trs((WOUT.find(o=>o.k===w.o)||{en:w.o,sv:w.o}).en,(WOUT.find(o=>o.k===w.o)||{en:w.o,sv:w.o}).sv))+'</span>').join('')}
function winterForm(p){return '<div class="plw" data-plw="'+esc(p.id)+'" hidden><label><span class="fl">'+trh('Winter','Vinter','Winter')+'</span><input type="text" class="plw-w" value="'+esc(lastWinter())+'" maxlength="9"></label>'+
  '<label><span class="fl">'+trh('Lowest temperature (°C)','Lägsta temperatur (°C)','Laagste temperatuur (°C)')+'</span><input type="number" class="plw-t" step="1" min="-60" max="20" placeholder="'+esc(plPoint(p)?tr('empty = look up','tom = hämta','leeg = opzoeken'):'')+'"></label>'+
  '<label><span class="fl">'+trh('Result','Resultat','Resultaat')+'</span><select class="plw-o">'+WOUT.map(o=>'<option value="'+o.k+'">'+esc(trs(o.en,o.sv))+'</option>').join('')+'</select></label>'+
  '<button type="button" class="btn sm primary" data-act="pl-winter-save" data-id="'+esc(p.id)+'">'+esc(tr('Save winter','Spara vinter','Winter opslaan'))+'</button>'+
  '<small class="muted plw-h">'+esc(plPoint(p)?tr('Leave the temperature empty and the app looks up the lowest temperature of that winter at this map position (or the project’s).','Lämna temperaturen tom så hämtar appen vinterns lägsta temperatur på kartpositionen (eller projektets).','Laat de temperatuur leeg, dan zoekt de app de laagste temperatuur van die winter op deze kaartpositie (of die van het project) op.'):tr('Add a map position to this record and the app can look up the winter’s lowest temperature for you.','Lägg till en kartposition så kan appen hämta vinterns lägsta temperatur åt dig.','Voeg een kaartpositie toe, dan kan de app de laagste temperatuur van de winter voor je opzoeken.'))+'</small></div>'}
async function plWinterSave(id){
  const box=$$('[data-plw="'+id+'"]').find(b=>!b.hidden&&b.offsetParent)||$('[data-plw="'+id+'"]'),p=(state.plantings||[]).find(x=>x.id===id);if(!box||!p)return;
  const w=box.querySelector('.plw-w').value.trim()||lastWinter(),tv=box.querySelector('.plw-t').value,o=box.querySelector('.plw-o').value;
  const rec={w,t:tv===''?'':Number(tv),o,date:today()};let msg='',bad=false;
  // No temperature given: look up the lowest temperature of that winter at the record's map position.
  const pt=plPoint(p);
  if(tv===''&&(pt||ownLowOf(p.project,winterStart(w)))){
    const y=winterStart(w);
    if(y==null){msg=tr('Saved without temperature: write the winter like 2025/26 to look it up.','Sparad utan temperatur: skriv vintern som 2025/26 för att hämta den.','Opgeslagen zonder temperatuur: schrijf de winter als 2025/26 om hem op te zoeken.');bad=true}
    else{toast(tr('Looking up that winter’s lowest temperature…','Hämtar vinterns lägsta temperatur…','Laagste temperatuur van die winter opzoeken…'));
      try{const r=await winterFor(p,y);rec.t=r.t;rec.tSrc=r.src;if(r.stn)rec.tStn=r.stn;msg=tr('Winter saved: lowest ','Vintern sparad: lägsta ','Winter opgeslagen: laagste ')+(r.src==='open-meteo'?'≈ ':'')+fmtC(r.t)+(r.partial?tr(' (so far)',' (hittills)',' (tot nu toe)'):'')+' · '+(r.src==='own'?tr('measured in this project','uppmätt i det här projektet','gemeten in dit project'):r.stn?tr('measured at ','uppmätt vid ','gemeten bij ')+r.stn:tr('model estimate','modelluppskattning','modelschatting'))}
      catch(e){msg=tr('Winter saved without temperature. ','Vintern sparad utan temperatur. ','Winter opgeslagen zonder temperatuur. ')+omErrMsg(e);bad=true}}
  }
  const doc=Object.assign({},p);delete doc.id;doc.winters=(p.winters||[]).concat([rec]);
  try{await Data.saveRow('plantings',id,doc);toast(msg||tr('Winter saved','Vintern sparad','Winter opgeslagen'),bad?'err':'')}catch(e){toast(errMsg(e),'err')}
}

/* ---------- sanity checks (admins): possible problems, never blocking ---------- */
const FOOD_USES=['fruit','seed','leaf','shoot','flower','root','bulb','herb','tea','sap'];
function checksOf(s){
  const m=s.m,w=s.form==='w',out=[],add=(k,en,sv,n)=>out.push({k,txt:tr(en,sv,n),key:k+':'+ckHash(en)});
  const h=Number(m.height);
  if(!isEmpty(m.height)&&isFinite(h)){
    // Since 2.6.0 heights are in centimetres for every plant; the form lets people type cm or m.
    const L=fmtLen(h);
    if(!w&&h>400)add('height','Height '+L+' for a herbaceous plant: check the unit (cm or m).','Höjd '+L+' för en örtartad växt: kontrollera enheten (cm eller m).','Hoogte '+L+' voor een kruidachtige plant: controleer de eenheid (cm of m).');
    if(h>0&&h<=3)add('height','Height '+L+': check the unit (cm or m).','Höjd '+L+': kontrollera enheten (cm eller m).','Hoogte '+L+': controleer de eenheid (cm of m).');
    if(w&&h>6000)add('height','Height '+L+' for a woody plant: check the unit (cm or m).','Höjd '+L+' för en vedartad växt: kontrollera enheten (cm eller m).','Hoogte '+L+' voor een houtige plant: controleer de eenheid (cm of m).');
  }
  const ts=[];if(usdaTok(m.usda).length)ts.push(hardOf({usda:m.usda}));if(rhsTok(m.rhs).length)ts.push(hardOf({rhs:m.rhs}));
  const tv=ts.filter(Boolean).map(x=>x.t);if(tv.length>1&&Math.max.apply(null,tv)-Math.min.apply(null,tv)>10)add('hardy','The USDA and RHS ratings disagree by more than about two zones ('+ts.filter(Boolean).map(x=>x.label+' ≈ '+fmtC(x.t)).join(', ')+').','USDA- och RHS-uppgifterna skiljer sig med mer än ungefär två zoner ('+ts.filter(Boolean).map(x=>x.label+' ≈ '+fmtC(x.t)).join(', ')+').','De USDA- en RHS-gegevens verschillen meer dan ongeveer twee zones ('+ts.filter(Boolean).map(x=>x.label+' ≈ '+fmtC(x.t)).join(', ')+').');
  if((m.caut||[]).indexOf('toxic')>=0&&Number(m.edibility)>=4)add('edibility','Marked Toxic but rated very edible.','Markerad som giftig men mycket ätlig.','Als giftig gemarkeerd maar zeer eetbaar.');
  if(!isEmpty(m.edibility)&&Number(m.edibility)===0&&(m.uses||[]).some(u=>FOOD_USES.indexOf(u)>=0))add('edibility','Marked Inedible but has food uses.','Markerad som oätlig men har matanvändning.','Als oneetbaar gemarkeerd maar heeft voedselgebruik.');
  if(m.invasive==='high'&&Number(m.verdict)===5)add('verdict','High invasive risk with the top verdict.','Hög invasionsrisk med högsta omdöme.','Hoog invasierisico met het hoogste oordeel.');
  if((m.cal3||[]).length&&isEmpty(m.uses))add('uses','Harvest months, but no uses.','Skördemånader men ingen användning.','Oogstmaanden, maar geen gebruik.');
  (s.conf||[]).forEach(c=>add(c.k,'Entries disagree on '+DEF[c.k].en.toLowerCase()+'.','Posterna skiljer sig om '+DEF[c.k].sv.toLowerCase()+'.','Invoeren verschillen over '+nl(DEF[c.k].en).toLowerCase()+'.'));
  if(!/^[A-Z][a-z-]+( × | x | )[a-z-]+/.test(s.latin||''))add('latin','The Latin name does not look like “Genus species”.','Det latinska namnet ser inte ut som ”Släkte art”.','De Latijnse naam ziet er niet uit als “Geslacht soort”.');
  const txt=s.entries.map(e=>Object.values(e.fields||{}).filter(v=>typeof v==='string').join(' ')).join(' ')+' '+s.obs.map(o=>o.text||'').join(' ');
  if(/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(txt)||/\+?\d[\d\s-]{8,}\d/.test(txt))add('privacy','A note contains what looks like an email address or phone number.','En anteckning innehåller något som liknar en e-postadress eller ett telefonnummer.','Een notitie bevat iets wat op een e-mailadres of telefoonnummer lijkt.');
  return out;
}
