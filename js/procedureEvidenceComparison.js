// AesthetIQ reference-to-simulation comparison.
// Compares normalized 2D landmark changes, not millimeters, volumes,
// medical efficacy, or guaranteed treatment outcomes.
import {measureFaceMorphometrics} from "./faceMorphometrics.js?v=3";
import {standardizePhotoLandmarks} from "./researchPhotoGeometry.js";

export const COMPARISON_VERSION = 3;
export const COMPARISON_LEVELS = Object.freeze(["natural", "balanced", "enhanced"]);

export const METRIC_GROUPS = Object.freeze({
 "lip-filler":["upperVermilionToMouth","lowerVermilionToMouth","cupidBowDipToMouth","mouthToFaceWidth"],
 "lip-lift":["philtrumToMouth","upperVermilionToMouth","cupidBowDipToMouth"],
 "lip-flip":["upperVermilionToMouth","cupidBowDipToMouth"],
 "rhinoplasty":["alarToIntercanthal","alarToFace","noseToFaceLength","tipMidlineToFace"],
 "revision-rhinoplasty":["alarToIntercanthal","alarToFace","noseToFaceLength","tipMidlineToFace"],
 "chin-filler":["chinToFaceLength","jawToFaceWidth"],
 "chin-implant":["chinToFaceLength","jawToFaceWidth"],
 "jawline-filler":["jawToFaceWidth","chinToFaceLength"],
 "brow-lift":["browHeightLeftToFace","browHeightRightToFace"],
 "upper-blepharoplasty":["upperLidApertureLeft","upperLidApertureRight"],
 "lower-blepharoplasty":["lowerLidToCanthalLineLeft","lowerLidToCanthalLineRight"]
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
 procedure,
 beforeImageSize,
 afterImageSize
}){
 const metrics=METRIC_GROUPS[procedure]||[];
 if(!metrics.length)return {
  procedure,status:"not_quantifiable_with_face_landmarks",
  reason:"This procedure requires surface, color, tooth, hair, body, or 3D measurements beyond the current 2D facial metric set."
 };
 const original=standardizePhotoLandmarks(beforeLandmarks,beforeImageSize);
 const observed=standardizePhotoLandmarks(afterLandmarks,afterImageSize);
 const before=measureFaceMorphometrics(original.points);
 const after=measureFaceMorphometrics(observed.points);
 if(!before||!after)throw Error("Complete before and after facial landmarks are required.");
 const p=angleProxy(original.points),q=angleProxy(observed.points);
 const warnings=[];
 if(!p||!q)warnings.push("Unable to verify photo alignment.");
 else{
  if(Math.abs(p.yaw-q.y)>.10)warnings.push("Head yaw differs between before and after photos.");
  if(Math.max(Math.abs(p.yaw),Math.abs(q.yaw))>.25)warnings.push("A near-frontal view is required for these 2D metrics.");
  if(Math.abs(original.roll-observed.roll)>.075)warnings.push("Head roll differs between before and after photos.");
 }
 if(["lip-filler","lip-lift","lip-flip"].includes(procedure)&&
    finite(before.mouthOpeningToMouth)&&finite(after.mouthOpeningToMouth)&&
    Math.abs(before.mouthOpeningToMouth-after.mouthOpeningToMouth)>.03){
  warnings.push("Mouth opening differs; review expression before comparing lip geometry (engineering screen, not a clinical threshold).");
 }
 const measured={},simulated={},errors={};
 for(const metric of metrics){
  measured[metric]=delta(before,after,metric);
  errors[metric]={};
 }
 for(const level of COMPARISON_LEVELS){
  const landmarks=simulatedLandmarksByLevel?.[level];
  if(!landmarks)continue;
  const values=measureFaceMorphometrics(standardizePhotoLandmarks(landmarks,beforeImageSize).points);
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
 const complete=validMetrics===metrics.length&&COMPARISON_LEVELS.every(level=>
  metrics.every(metric=>finite(simulated[level]?.[metric])));
 return {
  schemaVersion:COMPARISON_VERSION,
  measurementProtocol:"square_pixel_eye_aligned_2d_v3",
  procedure,
  status:warnings.length?"alignment_review_required":complete?"comparison_available":"insufficient_metrics_or_simulations",
  coverage:"partial_2d_geometry_only",
  clinicalValidationComplete:false,
  missingCapabilities:["physical_scale","calibrated_3d_surface","clinical_function_and_tissue_response"],
  measurements:measured,
  simulated,
  errors,
  warnings,
  validMetricCount:validMetrics,
  interpretation:"Errors are differences in normalized 2D landmark ratios, not a clinical accuracy score. A single case cannot calibrate a procedure.",
  automaticCalibrationApplied:false
 };
}
