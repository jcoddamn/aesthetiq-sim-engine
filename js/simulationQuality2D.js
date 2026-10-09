// AesthetIQ 2D quality checks: image geometry, blur and conservative fallback.
// These are rendering heuristics, not assessments of medical accuracy.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const FOCUS={
 "lip-filler":[0,13,14,17,37,267,61,291],
 "lip-flip":[0,13,37,267],
 "rhinoplasty":[1,4,5,6,129,358],
 "revision-rhinoplasty":[1,4,5,6,129,358],
 "upper-blepharoplasty":[159,145,386,374],
 "lower-blepharoplasty":[145,153,374,380],
 "chin-filler":[152,175,17],
 "chin-implant":[152,175,17],
 "cheek-filler":[234,454,50,280]
};
export function inspectWarp(original,warped,procedure){
 const warnings=[];
 if(!Array.isArray(original)||!Array.isArray(warped)||original.length!==warped.length)return {valid:false,warnings:["Landmark count mismatch"],scale:0};
 const w=Math.abs((original[454]?.x??0)-(original[234]?.x??0));
 if(w<.05)return {valid:false,warnings:["Face scale is unreliable"],scale:0};
 let max=0,bad=0,changed=0;
 for(let i=0;i<original.length;i++){
  const a=original[i],b=warped[i];
  if(!valid(a)||!valid(b)){bad++;continue;}
  const d=Math.hypot(b.x-a.x,b.y-a.y)/w;
  max=Math.max(max,d);
  if(d>.00005)changed++;
  if(d>.11||b.x<-.1||b.x>1.1||b.y<-.1||b.y>1.1)bad++;
 }
 if(max>.045)warnings.push("Large facial deformation detected");
 if(bad)warnings.push(bad+" invalid or extreme landmark positions");
 const focus=FOCUS[procedure]||[];
 const altered=focus.filter(i=>valid(original[i])&&valid(warped[i])&&Math.hypot(original[i].x-warped[i].x,original[i].y-warped[i].y)>.00005).length;
 if(focus.length&&altered===0)warnings.push("No change detected in expected treatment region");
 return {valid:bad===0&&max<.085,warnings,scale:clamp(.04/Math.max(.04,max),.35,1),changed,maxRelativeMovement:max};
}
export function moderateWarp(original,warped,factor){
 const t=clamp(factor,0,1);
 return warped.map((p,i)=>{
  const o=original[i];
  if(!valid(o)||!valid(p))return o?{...o}:p;
  return {...p,x:o.x+(p.x-o.x)*t,y:o.y+(p.y-o.y)*t,
   z:Number.isFinite(p.z)&&Number.isFinite(o.z)?o.z+(p.z-o.z)*t:(p.z??o.z)};
 });
}
function sample(canvas){
 if(!canvas?.width||!canvas?.height)return null;
 const tmp=document.createElement("canvas");tmp.width=72;tmp.height=72;
 const c=tmp.getContext("2d",{willReadFrequently:true});if(!c)return null;
 c.drawImage(canvas,0,0,72,72);
 const d=c.getImageData(0,0,72,72).data;
 let mean=0,variance=0,edges=0;
 const gray=new Float32Array(72*72);
 for(let i=0;i<gray.length;i++){const j=i*4;gray[i]=d[j]*.2126+d[j+1]*.7152+d[j+2]*.0722;mean+=gray[i];}
 mean/=gray.length;
 for(let y=1;y<71;y++)for(let x=1;x<71;x++){
  const i=y*72+x;variance+=(gray[i]-mean)**2;
  edges+=Math.abs(gray[i]*4-gray[i-1]-gray[i+1]-gray[i-72]-gray[i+72]);
 }
 return {mean,variance:variance/(70*70),edge:edges/(70*70)};
}
export function inspectRender(source,result){
 const a=sample(source),b=sample(result);
 if(!a||!b)return {valid:false,warnings:["Unable to inspect output"]};
 const warnings=[];
 if(b.mean<15||b.mean>243)warnings.push("Output is overexposed or very dark");
 if(a.edge>3&&b.edge/a.edge<.48)warnings.push("Output appears excessively smoothed");
 if(a.variance>50&&b.variance/a.variance<.32)warnings.push("Output has lost substantial contrast");
 return {valid:!warnings.length,warnings,edgeRetention:a.edge>0?b.edge/a.edge:1,contrastRetention:a.variance>0?b.variance/a.variance:1};
}
