// Local-only transfer of user-approved precision captures between AesthetIQ pages.
// Facial photos and landmarks are sensitive. Never transmit or persist without
// a user's affirmative action. Expire after 30 minutes and offer deletion.
const DB_NAME="aesthetiq-local-3d-v1";
const STORE="capture";
const KEY="latest";
const TTL=30*60*1000;
function openDB(){
 return new Promise((resolve,reject)=>{
  if(!("indexedDB" in window))return reject(Error("This browser does not support local scan storage."));
  const req=indexedDB.open(DB_NAME,1);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error("Unable to open local scan storage."));
 });
}
async function transact(mode,action){
 const db=await openDB();
 try{
  return await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,mode);
   let result;
   const req=action(tx.objectStore(STORE));
   req.onsuccess=()=>{result=req.result;};
   req.onerror=()=>reject(req.error||Error("Local scan operation failed."));
   tx.oncomplete=()=>resolve(result);
   tx.onerror=()=>reject(tx.error||Error("Local scan transaction failed."));
   tx.onabort=()=>reject(tx.error||Error("Local scan transaction aborted."));
  });
 }finally{db.close();}
}
function canvasBlob(canvas){
 return new Promise((resolve,reject)=>{
  if(!canvas?.width||!canvas?.height)return reject(Error("Capture image is empty."));
  const scaled=document.createElement("canvas");
  const factor=Math.min(1,1024/Math.max(canvas.width,canvas.height));
  scaled.width=Math.max(1,Math.round(canvas.width*factor));
  scaled.height=Math.max(1,Math.round(canvas.height*factor));
  scaled.getContext("2d").drawImage(canvas,0,0,scaled.width,scaled.height);
  scaled.toBlob(blob=>blob?resolve(blob):reject(Error("Unable to encode capture.")),"image/jpeg",.88);
 });
}
export async function saveApproved3DScan(captures){
 const payload={version:1,createdAt:Date.now(),poses:{}};
 const poses=["straight","left","right"];
 for(const pose of poses){
  const c=captures?.[pose];
  if(!c)continue;
  if(!Array.isArray(c.landmarks)||c.landmarks.length<468)throw Error("Invalid "+pose+" facial landmarks.");
  payload.poses[pose]={
   image:await canvasBlob(c.imageCanvas),
   landmarks:c.landmarks.slice(0,468).map(p=>({x:p.x,y:p.y,z:p.z??0})),
   pose
  };
 }
 if(!payload.poses.straight)throw Error("A front-facing capture is required.");
 await transact("readwrite",store=>store.put(payload,KEY));
 return {poseCount:Object.keys(payload.poses).length};
}
export async function loadApproved3DScan(){
 const item=await transact("readonly",store=>store.get(KEY));
 if(!item)return null;
 if(Date.now()-item.createdAt>TTL){await clearApproved3DScan();return null;}
 return item;
}
export async function clearApproved3DScan(){
 await transact("readwrite",store=>store.delete(KEY));
}
export async function blobToCanvas(blob){
 const bitmap=await createImageBitmap(blob);
 try{
  const canvas=document.createElement("canvas");
  canvas.width=bitmap.width;canvas.height=bitmap.height;
  canvas.getContext("2d").drawImage(bitmap,0,0);
  return canvas;
 }finally{bitmap.close();}
}
