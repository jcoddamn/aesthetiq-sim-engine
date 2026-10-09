import {standardizePhotoLandmarks} from './researchPhotoGeometry.js';
import {measureFaceMorphometrics} from './faceMorphometrics.js?v=3';
import {METRIC_GROUPS} from './procedureEvidenceComparison.js?v=4';
export function measurePreviewGeometry({procedure,original,levels,imageSize}){
 const metrics=METRIC_GROUPS[procedure];
 if(!metrics)return {status:'requires_additional_measurements',clinicalValidationComplete:false,levels:{}};
 try{
  const before=measureFaceMorphometrics(standardizePhotoLandmarks(original,imageSize).points),out={};
  for(const [level,points] of Object.entries(levels)){
   const after=measureFaceMorphometrics(standardizePhotoLandmarks(points,imageSize).points);
   out[level]=Object.fromEntries(metrics.map(k=>[k,{before:before[k],after:after[k],delta:after[k]-before[k],unit:'ratio'}]));
  }
  if(Object.values(out).some(v=>Object.values(v).some(m=>!Number.isFinite(m.before)||!Number.isFinite(m.after)||!Number.isFinite(m.delta))))throw Error('Missing metric');
  return {status:'illustrative_geometry_only',protocol:'square_pixel_eye_aligned_2d_v3',levels:out,clinicalValidationComplete:false};
 }catch{return {status:'measurement_unavailable',levels:{},clinicalValidationComplete:false};}
}
