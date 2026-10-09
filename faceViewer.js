import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {warpLipFiller,warpChin,warpJawline,warpCheeks,warpRhinoplasty,warpBuccalSlimming,warpFacelift,warpBrowLift,warpUpperBlepharoplasty,warpLowerBlepharoplasty,warpLipLift} from "./js/faceWarp.js?v=25";
import {constrainWarpByFaceScale} from "./js/faceMorphometrics.js?v=1";
import {getSharedIntensity} from "./js/sharedProcedureMath.js?v=1";
import {detectFaceLandmarksFromImage} from "./js/mediapipeRunner.js";
import {reconstruct3DFromCaptures,makeMultiAngleTexture} from "./js/personalizedFace3D.js?v=3";
import {loadApproved3DScan,clearApproved3DScan,blobToCanvas} from "./js/precision3dStore.js?v=2";
import {inspectScan} from "./js/twinCaptureQuality.js?v=1";
const names={
"rhinoplasty":"Rhinoplasty","revision-rhinoplasty":"Revision Rhinoplasty",
"lip-filler":"Lip Filler","lip-flip":"Lip Flip","cheek-filler":"Cheek Filler",
"chin-filler":"Chin Filler","jawline-filler":"Jawline Filler","under-eye-filler":"Under-Eye Filler",
"temple-filler":"Temple Filler","chin-implant":"Chin Implant","cheek-implants":"Cheek Implants",
"buccal-fat-removal":"Buccal Fat Removal","facelift":"Facelift","mini-facelift":"Mini Facelift",
"brow-lift":"Brow Lift","upper-blepharoplasty":"Upper Blepharoplasty",
"lower-blepharoplasty":"Lower Blepharoplasty","lip-lift":"Lip Lift","neck-lift":"Neck Lift",
"otoplasty":"Otoplasty","facial-fat-transfer":"Facial Fat Transfer",
"forehead-neuromodulator":"Forehead Neuromodulator","glabella-neuromodulator":"11 Lines",
"crows-feet-neuromodulator":"Crow's Feet","chemical-peel":"Chemical Peel",
"laser-resurfacing":"Laser Resurfacing","microneedling":"Microneedling",
"rf-microneedling":"RF Microneedling","ipl":"IPL","co2-laser":"CO2 Laser"
};
const goals={
"rhinoplasty":["balanced-refinement","bridge-refinement","tip-refinement","nasal-base-refinement"],
"revision-rhinoplasty":["balanced-refinement","bridge-refinement","tip-refinement","nasal-base-refinement"],
"lip-filler":["classic","russian","keyhole"],
"cheek-filler":["balanced","soft-volume","contour","lifted-look"],
"chin-filler":["balanced","projection","length","definition"],
"jawline-filler":["balanced","jaw-angle","full-jaw","subtle-definition"],
"buccal-fat-removal":["balanced-contour","mid-cheek-emphasis","lower-cheek-transition"],
"facelift":["balanced-lift","midface-lift","jawline-refinement"],
"mini-facelift":["balanced-lift","midface-lift","jawline-refinement"],
"brow-lift":["balanced-brow-lift","lateral-brow-lift","central-brow-lift"],
"upper-blepharoplasty":["balanced-upper-lid","central-lid-opening","outer-lid-refinement"],
"lower-blepharoplasty":["balanced-lower-lid","central-smoothing","lid-cheek-transition"],
"lip-lift":["balanced-lip-lift","central-lip-lift","broad-upper-lip-lift"]
};
const $=id=>document.getElementById(id),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const scene=new THREE.Scene();scene.background=new THREE.Color(0x101629);
const canvas=$("viewer");
const camera=new THREE.PerspectiveCamera(40,1,.1,150);camera.position.set(0,0,34);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.enablePan=false;
controls.minDistance=17;controls.maxDistance=60;controls.target.set(0,-.5,0);
scene.add(new THREE.HemisphereLight(0xffffff,0x27344f,2));
const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(10,15,18);scene.add(light);
const rim=new THREE.DirectionalLight(0x8899ff,.75);rim.position.set(-10,4,-12);scene.add(rim);
const material=new THREE.MeshStandardMaterial({color:0xc58b73,roughness:.78,side:THREE.DoubleSide});
const group=new THREE.Group();scene.add(group);
const skull=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),material.clone());
skull.scale.set(7.9,10,5.6);skull.position.set(0,.1,-2.3);group.add(skull);
const ears=[-1,1].map(side=>{
 const ear=new THREE.Mesh(new THREE.SphereGeometry(1,24,20),material.clone());
 ear.scale.set(1.08,2.4,.85);ear.position.set(side*7.9,-.6,-.3);group.add(ear);return ear;
});
const neck=new THREE.Mesh(new THREE.CylinderGeometry(3.6,4,6.5,32),material.clone());
neck.position.set(0,-11.4,-2.2);group.add(neck);
let mesh=null,base=null,procedure="rhinoplasty",goal="balanced-refinement",photoFitted=false;
let scanTexture=null;
function status(msg,error=false){$("status").textContent=msg;$("status").classList.toggle("error",error);}
function parseOBJ(data){
 const vertices=[],uvs=[],faces=[],uvByVertex=new Float32Array(468*2);
 for(const line of data.split(/\r?\n/)){
  if(line.startsWith("v "))vertices.push(line.trim().split(/\s+/).slice(1,4).map(Number));
  if(line.startsWith("vt "))uvs.push(line.trim().split(/\s+/).slice(1,3).map(Number));
  if(line.startsWith("f ")){
   const tokens=line.trim().split(/\s+/).slice(1);
   const ids=tokens.map(v=>Number(v.split("/")[0])-1);
   const uvIds=tokens.map(v=>Number(v.split("/")[1])-1);
   for(let j=0;j<ids.length;j++){
    const uv=uvs[uvIds[j]];
    if(uv){uvByVertex[ids[j]*2]=uv[0];uvByVertex[ids[j]*2+1]=uv[1];}
   }
   for(let j=1;j<ids.length-1;j++)faces.push(ids[0],ids[j],ids[j+1]);
  }
 }
 if(vertices.length!==468||uvs.length!==468||faces.length<2600)throw Error("Canonical face model topology mismatch.");
 const geo=new THREE.BufferGeometry();
 geo.setAttribute("position",new THREE.Float32BufferAttribute(vertices.flat(),3));
 geo.setAttribute("uv",new THREE.BufferAttribute(uvByVertex,2));
 geo.setIndex(faces);geo.computeVertexNormals();return geo;
}
function landmarks(){
 const l=[];
 for(let i=0;i<468;i++)l.push({x:.5+base[i*3]/18,y:.5-base[i*3+1]/21,z:-base[i*3+2]/18});
 return l;
}
function move(l,ids,dx,dy,dz){const out=l.map(p=>({...p}));for(const i of ids)if(out[i]){out[i].x+=dx;out[i].y+=dy;out[i].z+=dz;}return out;}
function warped(l){
 switch(procedure){
 case "rhinoplasty":return warpRhinoplasty(l,"balanced",goal,false);
 case "revision-rhinoplasty":return warpRhinoplasty(l,"balanced",goal,true);
 case "lip-filler":return warpLipFiller(l,"balanced",1,null,goal,"provider");
 case "lip-flip":return move(l,[37,0,267,39,269,13,82,312],0,-.0018,-.002);
 case "chin-filler":return warpChin(l,"balanced","provider",goal);
 case "chin-implant":return warpChin(l,"balanced");
 case "cheek-filler":return warpCheeks(l,"balanced","provider",goal);
 case "cheek-implants":case "facial-fat-transfer":return warpCheeks(l,"balanced");
 case "jawline-filler":return warpJawline(l,"balanced","provider",goal);
 case "buccal-fat-removal":return warpBuccalSlimming(l,"balanced",goal);
 case "facelift":return warpFacelift(l,"balanced",false,goal);
 case "mini-facelift":return warpFacelift(l,"balanced",true,goal);
 case "brow-lift":return warpBrowLift(l,"balanced",goal);
 case "upper-blepharoplasty":return warpUpperBlepharoplasty(l,"balanced",goal);
 case "lower-blepharoplasty":return warpLowerBlepharoplasty(l,"balanced",goal);
 case "lip-lift":return warpLipLift(l,"balanced",goal);
 case "under-eye-filler":return move(l,[117,118,119,120,121,346,347,348,349,350],0,0,-.003);
 case "temple-filler":return move(l,[127,234,356,454,162,389],0,0,-.003);
 default:return l.map(p=>({...p}));
 }
}
function morph(){
 if(!mesh)return;
 const original=landmarks();
 let target=warped(original);
 target=constrainWarpByFaceScale(original,target,procedure);
 const amount=clamp(Number($("intensitySlider").value),0,1.6)*clamp(Number($("recoverySlider").value)/100,0,1);
 const position=mesh.geometry.attributes.position;
 const deltas=new Float32Array(base.length);
 for(let i=0;i<468;i++){
  deltas[i*3]=clamp((target[i].x-original[i].x)*18,-.65,.65);
  deltas[i*3+1]=clamp(-(target[i].y-original[i].y)*21,-.65,.65);
  deltas[i*3+2]=clamp(-(target[i].z-original[i].z)*18,-.65,.65);
 }
 // Smooth each displacement across connected triangles, not arbitrary image pixels.
 const neighbor=Array.from({length:468},()=>new Set());
 const ix=mesh.geometry.index.array;
 for(let k=0;k<ix.length;k+=3){
  const a=ix[k],b=ix[k+1],c=ix[k+2];
  for(const [u,v] of [[a,b],[a,c],[b,a],[b,c],[c,a],[c,b]])neighbor[u].add(v);
 }
 for(let i=0;i<468;i++)for(let axis=0;axis<3;axis++){
  let sum=deltas[i*3+axis]*3,n=3;
  for(const j of neighbor[i]){sum+=deltas[j*3+axis];n++;}
  position.array[i*3+axis]=base[i*3+axis]+sum/n*amount;
 }
 position.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();
 ears.forEach((ear,i)=>{const sign=i===0?-1:1;const v=procedure==="otoplasty"?amount:0;ear.position.x=sign*(7.9-v*.65);ear.scale.z=.85-v*.2;});
 const n=procedure==="neck-lift"?amount:0;neck.scale.set(1-n*.08,1,1-n*.07);
 const surface=["chemical-peel","laser-resurfacing","microneedling","rf-microneedling","ipl","co2-laser","forehead-neuromodulator","glabella-neuromodulator","crows-feet-neuromodulator"].includes(procedure);
 mesh.material.roughness=.78-(surface?amount*.12:0);
 $("selectedProcedureLabel").textContent=names[procedure];
 $("intensityValue").textContent=Number($("intensitySlider").value).toFixed(2)+"×";
 $("recoveryValue").textContent=$("recoverySlider").value+"%";
 $("previewNote").textContent=surface?"Surface-treatment effects are schematic; this mesh cannot resolve wrinkles or skin layers.":(procedure==="otoplasty"||procedure==="neck-lift")?"Ear and neck components are schematic, not anatomically scanned.":"Illustrative 3D landmark deformation; not a patient-specific surgical prediction.";
}
function setProcedure(id){
 if(!names[id])return;
 procedure=id;const options=goals[id]||["balanced"];
 $("goalSelect").replaceChildren(...options.map(value=>{const opt=document.createElement("option");opt.value=value;opt.textContent=value.replace(/-/g," ");return opt;}));
 goal=options[0];morph();
}
function resize(){
 const rect=canvas.getBoundingClientRect();
 renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);
 camera.aspect=rect.width/Math.max(1,rect.height);camera.updateProjectionMatrix();
}
function reset(){camera.position.set(0,0,34);controls.target.set(0,-.5,0);controls.update();}
function setTexture(captures){
 if(!mesh)return;
 const textureCanvas=makeMultiAngleTexture(
   captures,
   mesh.geometry.index.array,
   mesh.geometry.attributes.uv.array,
   mesh.geometry.userData.canonical,
   1536
 );
 const texture=new THREE.CanvasTexture(textureCanvas);
 texture.colorSpace=THREE.SRGBColorSpace;
 texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
 if(scanTexture)scanTexture.dispose();
 scanTexture=texture;
 mesh.material.map=texture;
 mesh.material.color.set(0xffffff);
 mesh.material.needsUpdate=true;
}
async function applyPersonalizedCaptures(captures){
 if(!mesh)throw Error("3D model is not loaded.");
 const review=inspectScan(captures);
 const model=reconstruct3DFromCaptures(review.captures,mesh.geometry.userData.canonical);
 // Build texture first; only update the displayed identity if it succeeds.
 setTexture(review.captures);
 base=Float32Array.from(model.positions);
 photoFitted=true;
 morph();
 const quality=Math.round(review.quality*100);
 $("scanQuality").textContent="Scan quality: "+quality+"% · "+model.quality.poseCount+" angle(s)";
 $("scanWarnings").textContent=review.warnings.length?review.warnings.join(" "):
  "Capture passed basic lighting, framing and sharpness checks.";
 status("Personalized facial geometry and photo texture loaded. Rotate to inspect likeness.");
}
async function fitPhoto(file){
 if(!file||!mesh)return;
 status("Detecting facial landmarks…");
 const bitmap=await createImageBitmap(file);
 const temp=document.createElement("canvas");
 const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));
 temp.width=Math.round(bitmap.width*scale);temp.height=Math.round(bitmap.height*scale);
 temp.getContext("2d").drawImage(bitmap,0,0,temp.width,temp.height);bitmap.close();
 const points=await detectFaceLandmarksFromImage(temp);
 if(!points||points.length<468)throw Error("No complete face detected.");
 await applyPersonalizedCaptures({straight:{imageCanvas:temp,landmarks:points}});
}
async function loadStoredScan(){
 const payload=await loadApproved3DScan();
 if(!payload)return;
 const captures={};
 for(const pose of ["straight","left","right"]){
  const record=payload.poses?.[pose];
  if(record?.image&&record?.landmarks)captures[pose]={
   imageCanvas:await blobToCanvas(record.image),
   landmarks:record.landmarks
  };
 }
 await applyPersonalizedCaptures(captures);
}
for(const [id,label] of Object.entries(names)){const option=document.createElement("option");option.value=id;option.textContent=label;$("procedureSelect").append(option);}
$("procedureSelect").addEventListener("change",e=>setProcedure(e.target.value));
$("goalSelect").addEventListener("change",e=>{goal=e.target.value;morph();});
$("intensitySlider").addEventListener("input",morph);
for(const [id,level] of [["presetNatural","natural"],["presetBalanced","balanced"],["presetEnhanced","enhanced"]]){
 const button=$(id);
 if(button)button.addEventListener("click",()=>{
  $("intensitySlider").value=getSharedIntensity(level);
  morph();
 });
}
$("recoverySlider").addEventListener("input",morph);
$("wireframe").addEventListener("change",e=>{if(mesh)mesh.material.wireframe=e.target.checked;});
$("resetView").addEventListener("click",reset);
$("resetModel").addEventListener("click",()=>{if(!mesh)return;base=Float32Array.from(mesh.geometry.userData.canonical);photoFitted=false;
 if(scanTexture){scanTexture.dispose();scanTexture=null;}mesh.material.map=null;mesh.material.color.set(0xc58b73);mesh.material.needsUpdate=true;
 $("scanQuality").textContent="Canonical reference model";
 $("scanWarnings").textContent="No personalized scan is active.";
 morph();status("Canonical face restored.");});
$("photo").addEventListener("change",async e=>{try{await fitPhoto(e.target.files?.[0]);}catch(err){status(err.message||String(err),true);}});
$("deleteScan").addEventListener("click",async()=>{
 try{await clearApproved3DScan();$("resetModel").click();status("Saved facial scan deleted from this browser.");}
 catch(e){status("Unable to delete local scan: "+(e.message||e),true);}
});
let savedIntensity=1;
$("compareOriginal").addEventListener("pointerdown",()=>{
 savedIntensity=Number($("intensitySlider").value);
 $("intensitySlider").value=0;morph();
});
function restoreCompare(){
 $("intensitySlider").value=savedIntensity;morph();
}
$("compareOriginal").addEventListener("pointerup",restoreCompare);
$("compareOriginal").addEventListener("pointercancel",restoreCompare);
$("compareOriginal").addEventListener("pointerleave",restoreCompare);
$("save").addEventListener("click",()=>{renderer.render(scene,camera);const a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download="aesthetiq-3d-"+procedure+".png";a.click();});
$("back").addEventListener("click",()=>{history.length>1?history.back():location.assign("index.html");});
const requested=new URLSearchParams(location.search).get("procedure");
const selected=names[requested]?requested:"rhinoplasty";
$("procedureSelect").value=selected;setProcedure(selected);
window.addEventListener("resize",resize);resize();
(async()=>{try{
 const res=await fetch("./models/mediapipe_canonical_face.obj");
 if(!res.ok)throw Error("Canonical face asset unavailable ("+res.status+").");
 const geometry=parseOBJ(await res.text());
 base=Float32Array.from(geometry.attributes.position.array);
 geometry.userData.canonical=Float32Array.from(base);
 mesh=new THREE.Mesh(geometry,material.clone());group.add(mesh);morph();
 status("468-vertex 3D model ready. Drag to rotate and pinch to zoom.");
 if(new URLSearchParams(location.search).get("scan")==="local"){
  try{await loadStoredScan();}catch(error){status("3D model ready, but saved scan could not be loaded: "+(error.message||error),true);}
 }
 }catch(e){status(e.message||String(e),true);}})();
function frame(){requestAnimationFrame(frame);controls.update();renderer.render(scene,camera);}
frame();
