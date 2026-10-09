// Approximate depth-aware weighting for 2D landmark warps.
// MediaPipe z is relative and not metric; this is a conservative heuristic.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const STRUCTURAL=new Set(["rhinoplasty","revision-rhinoplasty","chin-filler","chin-implant","cheek-filler","cheek-implants","jawline-filler","facelift","mini-facelift","buccal-fat-removal","lip-filler","lip-lift","brow-lift","upper-blepharoplasty","lower-blepharoplasty","facial-fat-transfer"]);
export function depthAwareWarp(original,warped,procedure){
 if(!STRUCTURAL.has(procedure)||!Array.isArray(original)||!Array.isArray(warped))return warped;
 const nose=Number(original[1]?.z)||0;
 const cheek=[234,454].map(i=>Number(original[i]?.z)).filter(Number.isFinite);
 const cheekZ=cheek.length?cheek.reduce((a,b)=>a+b,0)/cheek.length:nose+.06;
 const range=Math.max(.02,Math.abs(nose-cheekZ));
 return warped.map((p,i)=>{
  const o=original[i];
  if(!o||!p||!Number.isFinite(o.z)||!Number.isFinite(o.x)||!Number.isFinite(o.y))return p;
  const depth=clamp((cheekZ-o.z)/range,-1,1);
  const weight=clamp(1+depth*.08,.92,1.08);
  return {...p,x:o.x+(p.x-o.x)*weight,y:o.y+(p.y-o.y)*weight};
 });
}
