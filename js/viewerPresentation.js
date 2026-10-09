// Presentation state only; capture completeness is not reconstruction accuracy.
export function viewerPresentation({personalized,procedure,showContext=false,poseCount=0}){
 const schematicProcedure=['otoplasty','neck-lift'].includes(procedure);
 return {
  showContext:schematicProcedure||!personalized||showContext,
  contextRequired:schematicProcedure,
  captureLabel:personalized?`${poseCount} capture angle${poseCount===1?'':'s'} · approximate depth`:'Canonical reference model',
  note:schematicProcedure?'The ears and neck are generic reference shapes, not reconstructed anatomy.':personalized?'Photo-textured facial surface. Forehead boundaries and unseen regions are incomplete; this is not a full-head digital twin.':'Illustrative reference model; not a patient-specific surgical prediction.'
 };
}
export function framedCameraDistance({width,height,depth=0,aspect,fovDegrees=40,padding=1.22}){
 if(![width,height,depth,aspect,fovDegrees,padding].every(Number.isFinite)||width<=0||height<=0||depth<0||aspect<=0||fovDegrees<=0||fovDegrees>=180||padding<1)throw Error('Invalid 3D framing dimensions.');
 const tangent=Math.tan(fovDegrees*Math.PI/360);
 return Math.max(height/(2*tangent),width/(2*tangent*aspect))*padding+depth/2;
}
