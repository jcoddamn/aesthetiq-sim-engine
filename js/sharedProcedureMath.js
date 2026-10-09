// Shared 2D/3D intensity scale. Educational controls, not clinical dose equivalence.
export const INTENSITY_STRENGTH=Object.freeze({
 natural:0.68,balanced:1,enhanced:1.32
});
export function getSharedIntensity(value){
 if(typeof value==="number")return Math.max(0,Math.min(1.6,value));
 return INTENSITY_STRENGTH[value]??1;
}
export function interpolateLandmarks(original,warped,factor){
 const t=getSharedIntensity(factor);
 return warped.map((p,i)=>{
  const o=original[i];
  if(!o||!p)return p;
  return {...p,
   x:o.x+(p.x-o.x)*t,
   y:o.y+(p.y-o.y)*t,
   z:Number.isFinite(p.z)&&Number.isFinite(o.z)?o.z+(p.z-o.z)*t:(p.z??o.z)
  };
 });
}
