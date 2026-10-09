// AesthetIQ — anatomy-normalized facial morphometrics.
// Landmark ratios are dimensionless. They are measurement descriptors,
// NOT clinical targets, norms, or guaranteed surgical outcomes.
// Inspired by standardized clinical photogrammetry, not trained on
// unlicensed patient photographs.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function pair(l,a,b){return finite(l[a])&&finite(l[b])?d(l[a],l[b]):null;}
function safeRatio(a,b){return a!==null&&b!==null&&b>1e-6?a/b:null;}
export function measureFaceMorphometrics(landmarks){
 if(!Array.isArray(landmarks)||landmarks.length<468)return null;
 const l=landmarks;
 const eyeWidth=pair(l,133,362);
 const faceWidth=pair(l,234,454);
 const faceHeight=pair(l,10,152);
 const mouthWidth=pair(l,61,291);
 const alarWidth=pair(l,129,358);
 const noseLength=pair(l,168,2);
 const tipMidline=finite(l[1])&&finite(l[168])?Math.abs(l[1].x-l[168].x):null;
 const jawWidth=pair(l,172,397);
 const chinLength=pair(l,17,152);
 const upperLidLeft=pair(l,159,145);
 const upperLidRight=pair(l,386,374);
 return {
   intercanthalDistance:eyeWidth,
   faceWidth,
   faceHeight,
   alarWidth,
   alarToIntercanthal:safeRatio(alarWidth,eyeWidth),
   alarToFace:safeRatio(alarWidth,faceWidth),
   noseToFaceLength:safeRatio(noseLength,faceHeight),
   tipMidlineToFace:safeRatio(tipMidline,faceWidth),
   jawToFaceWidth:safeRatio(jawWidth,faceWidth),
   chinToFaceLength:safeRatio(chinLength,faceHeight),
   mouthToFaceWidth:safeRatio(mouthWidth,faceWidth),
   upperLidApertureLeft:safeRatio(upperLidLeft,faceHeight),
   upperLidApertureRight:safeRatio(upperLidRight,faceHeight)
 };
}
// Limit simulated landmark motion relative to detected facial scale.
// Use local feature scale, not an absolute normalized pixel offset.
// Conservative educational limits; not observed patient effect sizes.
const GROUPS={
 "rhinoplasty":{indices:[168,6,197,195,5,4,45,275,129,98,97,49,358,327,326,279,1],ratio:.028,reference:"faceWidth"},
 "revision-rhinoplasty":{indices:[168,6,197,195,5,4,45,275,129,98,97,49,358,327,326,279,1],ratio:.018,reference:"faceWidth"},
 "chin-filler":{indices:[152,148,176,149,150,136,172],ratio:.025,reference:"faceWidth"},
 "chin-implant":{indices:[152,148,176,149,150,136,172],ratio:.025,reference:"faceWidth"},
 "jawline-filler":{indices:[234,93,132,58,172,136,150,149,176,148,454,323,361,288,397,365,379,378,400,377],ratio:.032,reference:"faceWidth"},
 "cheek-filler":{indices:[234,93,132,58,454,323,361,288],ratio:.027,reference:"faceWidth"},
 "cheek-implants":{indices:[234,93,132,58,454,323,361,288],ratio:.027,reference:"faceWidth"},
 "upper-blepharoplasty":{indices:[246,161,160,159,158,157,466,388,387,386,385,384],ratio:.012,reference:"faceHeight"},
 "lower-blepharoplasty":{indices:[155,154,153,145,144,163,398,384,385,386,387,388],ratio:.012,reference:"faceHeight"},
 "brow-lift":{indices:[70,63,105,66,107,55,65,52,53,46,336,296,334,293,300,276,283,282,295,285],ratio:.018,reference:"faceHeight"},
 "facelift":{indices:[234,93,132,58,172,136,150,454,323,361,288,397,365,379],ratio:.03,reference:"faceWidth"},
 "mini-facelift":{indices:[234,93,132,58,172,136,150,454,323,361,288,397,365,379],ratio:.02,reference:"faceWidth"},
 "buccal-fat-removal":{indices:[234,93,132,58,172,136,454,323,361,288,397,365],ratio:.025,reference:"faceWidth"},
 "lip-lift":{indices:[61,185,40,39,37,0,267,269,270,409,291,78,191,80,81,82,13,312,311,310,415,308],ratio:.014,reference:"faceHeight"}
};
export function constrainWarpByFaceScale(original,warped,procedure){
 const config=GROUPS[procedure];
 if(!config||!Array.isArray(original)||!Array.isArray(warped)||original.length!==warped.length)return warped;
 const m=measureFaceMorphometrics(original);
 const scale=m?.[config.reference];
 if(!Number.isFinite(scale)||scale<=0)return warped;
 const limit=scale*config.ratio;
 const affected=new Set(config.indices);
 return warped.map((p,i)=>{
  const o=original[i];
  if(!affected.has(i)||!finite(p)||!finite(o))return p;
  const dx=p.x-o.x,dy=p.y-o.y;
  const magnitude=Math.hypot(dx,dy);
  const factor=magnitude>limit?limit/magnitude:1;
  const z=Number.isFinite(p.z)?p.z:o.z;
  return {...p,x:o.x+dx*factor,y:o.y+dy*factor,z};
 });
}
export function compareFaceMorphometrics(original,warped){
 const a=measureFaceMorphometrics(original);
 const b=measureFaceMorphometrics(warped);
 if(!a||!b)return null;
 const delta={};
 for(const key of Object.keys(a)){
  if(Number.isFinite(a[key])&&Number.isFinite(b[key]))delta[key]=b[key]-a[key];
 }
 return {before:a,after:b,delta};
}
