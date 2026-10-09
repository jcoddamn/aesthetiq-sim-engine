// Consent-based before/after photo measurement. Analysis only.
// Never interpret single examples as expected treatment outcomes.
import {measureFaceMorphometrics} from "./faceMorphometrics.js?v=1";
const KEY_METRICS={
 rhinoplasty:["alarToIntercanthal","alarToFace","noseToFaceLength","tipMidlineToFace"],
 "revision-rhinoplasty":["alarToIntercanthal","alarToFace","noseToFaceLength","tipMidlineToFace"],
 "chin-filler":["chinToFaceLength","jawToFaceWidth"],
 "chin-implant":["chinToFaceLength","jawToFaceWidth"],
 "cheek-filler":["jawToFaceWidth"],
 "jawline-filler":["jawToFaceWidth"],
 "facelift":["jawToFaceWidth","chinToFaceLength"],
 "mini-facelift":["jawToFaceWidth","chinToFaceLength"],
 "upper-blepharoplasty":["upperLidApertureLeft","upperLidApertureRight"],
 "lower-blepharoplasty":["upperLidApertureLeft","upperLidApertureRight"],
 "brow-lift":["upperLidApertureLeft","upperLidApertureRight"],
 "lip-lift":["mouthToFaceWidth"]
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function yawProxy(l){
 const left=l?.[234],right=l?.[454],nose=l?.[1];
 if(!left||!right||!nose)return null;
 const center=(left.x+right.x)/2,half=Math.abs(right.x-left.x)/2;
 return half>0?Math.abs(nose.x-center)/half:null;
}
function roll(l){
 const a=l?.[33],b=l?.[263];
 return a&&b?Math.atan2(b.y-a.y,b.x-a.x):null;
}
export function measureClinicalPhotoPair(before,after,procedure){
 const b=measureFaceMorphometrics(before),a=measureFaceMorphometrics(after);
 if(!a||!b)throw Error("Both photographs must contain a detected face.");
 const by=yawProxy(before),ay=yawProxy(after);
 const br=roll(before),ar=roll(after);
 const warnings=[];
 if(by===null||ay===null||Math.abs(by-ay)>.1)warnings.push("Face yaw differs between images; measurements may be unreliable.");
 if(br===null||ar===null||Math.abs(br-ar)>.075)warnings.push("Head roll differs between images; use standardized photos.");
 const keys=KEY_METRICS[procedure]||Object.keys(b);
 const measurements={};
 for(const key of keys){
   if(!Number.isFinite(b[key])||!Number.isFinite(a[key]))continue;
   const delta=a[key]-b[key];
   measurements[key]={
     before:b[key],after:a[key],absoluteChange:delta,
     relativeChange:b[key]!==0?clamp(delta/Math.abs(b[key]),-2,2):null
   };
 }
 return {procedure,measurements,warnings,
   comparable:warnings.length===0,
   disclaimer:"Photographic morphometrics are not 3D volume or outcome predictions. Do not infer an individual treatment response."};
}
