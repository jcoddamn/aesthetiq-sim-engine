// AesthetIQ reference-to-simulation comparison.
// Compares normalized 2D landmark changes, not millimeters, volumes,
// medical efficacy, or guaranteed treatment outcomes.
import {measureFaceMorphometrics} from "./faceMorphometrics.js?v=2";

export const METRIC_GROUPS = Object.freeze({
 "lip-filler":["upperVermilionToMouth","lowerVermilionToMouth","cupidBowDipToMouth","mouthToFaceWidth"],
 "lip-lift":["upperVermilionToMouth","cupidBowDipToMouth","mouthToFaceWidth"],
 "lip-flip":["upperVermilionToMouth","cupidBowDipToMouth"],
 "rhinoplasty":["alarToIntercanthal","alarToFace","noseToFaceLength","tipMidlineToFace"],
 "revision-rhinoplasty":["alarToIntercanthal","alarToFace","noseToFaceLength","tipMidlineToFace"],
 "chin-filler":["chinToFaceLength","jawToFaceWidth"],
 "chin-implant":["chinToFaceLength","jawToFaceWidth"],
 "jawline-filler":["jawToFaceWidth","chinToFaceLength"],
 "cheek-filler":["jawToFaceWidth"],
 "cheek-implants":["jawToFaceWidth"],
 "facelift":["jawToFaceWidth","chinToFaceLength"],
 "mini-facelift":["jawToFaceWidth","chinToFaceLength"],
 "brow-lift":["browHeightLeftToFace","browHeightRightToFace"],
 "upper-blepharoplasty":["upperLidApertureLeft","upperLidApertureRight"],
 "lower-blepharoplasty":["upperLidApertureLeft","upperLidApertureRight"],
 "buccal-fat-removal":["jawToFaceWidth"],
 "facial-fat-transfer":["jawToFaceWidth"]
});
const finite=Number.isFinite;
function angleProxy(l){
 const a=l?.[234],b=l?.[454],n=l?.[1],eyeL=l?.[33],eyeR=l?.[263];
 if(!a||!b||!n||!eyeL||!eyeR)return null;
 const half=Math.abs(a.x-b.x)/2;
 if(half<.001)return null;
 return {yaw:(n.x-(a.x+b.x)/2)/half,roll:Math.atan2(eyeR.y-eyeL.y,eyeR.x-eyeL.x)};
}
function delta(base,other,key){
 return finite(base[key])&&finite(other[key])?other[key]-base[key]:null;
}
export function compareProcedureLandmarks({
 beforeLandmarks,
 afterLandmarks,
 simulatedLandmarksByLevel,
 procedure
}){
 const metrics=METRIC_GROUPS[procedure]||[];
 if(!metrics.length)return {
  procedure,status:"not_quantifiable_with_face_landmarks",
  reason:"This procedure requires surface, color, tooth, hair, body, or 3D measurements beyond the current 2D facial metric set."
 };
 const before=measureFaceMorphometrics(beforeLandmarks);
 const after=measureFaceMorphometrics(afterLandmarks);
 if(!before||!after)throw Error("Complete before and after facial landmarks are required.");
 const p=angleProxy(before),q=angleProxy(after);
 const warnings=[];
 if(!p||!q)warnings.push("Unable to verify photo alignment.");
 else{
  if(Math.abs(p.yaw-q.y)>.10)warnings.push("Head yaw differs between before and after photos.");
  if(Math.abs(p.roll-q.roll)>.075)warnings.push("Head roll differs between before and after photos.");
 }
 const measured={},simulated={},errors={};
 for(const metric of metrics){
  measured[metric]=delta(before,after,metric);
  errors[metric]={};
 }
 for(const [level,landmarks] of Object.entries(simulatedLandmarksByLevel||{})){
  const values=measureFaceMorphometrics(landmarks);
  if(!values)continue;
  simulated[level]={};
  let sum=0,count=0;
  for(const metric of metrics){
   const d=delta(before,values,metric);
   simulated[level][metric]=d;
   if(finite(d)&&finite(measured[metric])){
    const error=d-measured[metric];
    errors[metric][level]=error;
    sum+=error*error;count++;
   }
  }
  simulated[level].rmseNormalized=count?Math.sqrt(sum/count):null;
 }
 const validMetrics=Object.values(measured).filter(finite).length;
 return {
  procedure,
  status:warnings.length?"alignment_review_required":validMetrics?"comparison_available":"insufficient_metrics",
  measurements:measured,
  simulated,
  errors,
  warnings,
  validMetricCount:validMetrics,
  interpretation:"Errors are differences in normalized 2D landmark ratios, not a clinical accuracy score. A single case cannot calibrate a procedure.",
  automaticCalibrationApplied:false
 };
}
