// Artblad: Data layer (Supabase or in-memory demo), favourites, photos, merging entries.
// Part 2 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- data layer: Supabase (each document is one jsonb row; no database means in-memory demo mode) ---------- */
const randHex=n=>{const a=new Uint8Array(n);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,'0')).join('')};
const newId=()=>randHex(10);
const COLS='id,data,author,updated_by,updated_at,deleted_at,deleted_by,created_at';
async function fetchAll(t,cols){let out=[],from=0;for(;;){const r=await SB.from(t).select(cols||COLS).order('id').range(from,from+999);if(r.error)throw r.error;out=out.concat(r.data);if(r.data.length<1000)break;from+=1000}return out}
// Fixed species numbers from the database (update v8, since 2.5.1); null when not available (then the list order is used).
let SPNO=null;
async function loadAll(){
  if(!SB)return;
  try{
    const adm=isAdmin(),soft=q=>Promise.resolve(q).then(x=>x,e=>({error:e}));
    const r=await Promise.all([fetchAll('entries'),fetchAll('obs'),SB.from('profiles').select('user_id,display_name'),CANW?fetchAll('plantings').catch(()=>[]):[],CANW?fetchAll('lists').catch(()=>[]):[],fetchAll('comments').catch(()=>[]),
      adm?soft(SB.rpc('review_state')):null,adm?soft(SB.from('autofill_requests').select('sid,latin,n,status,first_requested_at,last_requested_at,sent_at').order('first_requested_at')):null,
      soft(SB.from('species_numbers').select('sid,no'))]);
    META.clear();PROFILES.clear();
    (r[2].data||[]).forEach(p=>PROFILES.set(p.user_id,p.display_name));
    const keep=(rows,kind)=>rows.map(x=>{META.set(x.id,{kind,author:x.author,updatedBy:x.updated_by,updatedAt:x.updated_at,deletedAt:x.deleted_at,deletedBy:x.deleted_by,createdAt:x.created_at});return Object.assign({id:x.id},x.data)});
    const E=keep(r[0],'entry').map(e=>e.fields?Object.assign(e,{fields:normFields(e.fields)}):e),O=keep(r[1],'obs'),live=x=>!META.get(x.id).deletedAt;
    state.entries=E.filter(live);state.obs=O.filter(live);state.trashE=E.filter(x=>!live(x));state.trashO=O.filter(x=>!live(x));
    const Pl=keep(r[3],'planting'),Li=keep(r[4],'list');state.plantings=Pl.filter(live);state.lists=Li.filter(live);state.trashP=Pl.filter(x=>!live(x));state.trashL=Li.filter(x=>!live(x));
    const Cm=keep(r[5],'comment');state.comments=Cm.filter(live);state.trashC=Cm.filter(x=>!live(x));
    SPNO=r[8]&&!r[8].error&&Array.isArray(r[8].data)&&r[8].data.length?new Map(r[8].data.map(x=>[x.sid,Number(x.no)])):null;
    revSet(adm&&r[6]&&!r[6].error?r[6].data:null);if(adm&&r[7]&&!r[7].error)afRows=r[7].data||[];
    $('#banner').hidden=true;loaded=true;lastLoad=Date.now();renderAcct();refresh();
  }catch(e){
    loaded=true;const b=$('#banner');b.hidden=false;b.textContent=tr('Could not read the species data (','Kunde inte läsa artdata (','Kon de soortgegevens niet lezen (')+((e&&(e.code||e.message))||'error')+tr('). Check your connection and reload.','). Kontrollera anslutningen och ladda om.','). Controleer je verbinding en laad opnieuw.');refresh();
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
  async thumb(id,blob){const r=await SB.storage.from('photos').upload(id+'_t.jpg',blob,{contentType:'image/jpeg'});if(r.error)throw r.error;return true},
  async delete(id){const r=await SB.storage.from('photos').remove([id+'.jpg',id+'_t.jpg']);if(r.error)throw r.error;return{deleted:true}}
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
// A photo file is still needed while any live or trashed entry or observation points to it.
const photoUsed=(id,exceptDoc)=>[state.entries,state.trashE||[]].some(a=>a.some(e=>e.id!==exceptDoc&&e.fields&&e.fields.photo===id))||[state.obs,state.trashO||[]].some(a=>a.some(o=>o.id!==exceptDoc&&o.photo===id));
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
async function uploadPhoto(file){if(!ASSETS)throw new Error('Photos can be added by people with edit access.');const b=await shrink(file,1600,.82);const r=await ASSETS.upload(b);
  try{if(ASSETS.thumb)await ASSETS.thumb(r.id,await shrink(file,360,.72))}catch(e){}return r.id}
const blobSrc=id=>String(cfg.SUPABASE_URL||'').replace(/\/+$/,'')+'/storage/v1/object/public/photos/'+id+'.jpg';
// Lists show a small copy (id_t.jpg, about 20 KB); older photos without one fall back to the full photo.
const thumbSrc=id=>String(cfg.SUPABASE_URL||'').replace(/\/+$/,'')+'/storage/v1/object/public/photos/'+id+'_t.jpg';
const thumbImg=(id,lazy)=>'<img src="'+thumbSrc(id)+'" alt=""'+(lazy?' loading="lazy"':'')+' onerror="this.onerror=null;this.src=\''+blobSrc(id)+'\'">';
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
