// AesthetIQ body preview engine — MediaPipe Pose + Selfie Segmentation.
// Browser-only processing. A silhouette approximation, not a clinical prediction.
export const BODY_PROCEDURES = Object.freeze({
  "breast-augmentation":{region:"chest",direction:1},
  "breast-lift":{region:"chest",direction:0.35},
  "breast-reduction":{region:"chest",direction:-1},
  "liposuction":{region:"waist",direction:-1},
  "tummy-tuck":{region:"abdomen",direction:-1},
  "mini-tummy-tuck":{region:"lowerAbdomen",direction:-1},
  "brazilian-butt-lift":{region:"hips",direction:1},
  "butt-implants":{region:"hips",direction:1},
  "mommy-makeover":{region:"waist",direction:-0.8},
  "arm-lift":{region:"arms",direction:-1},
  "thigh-lift":{region:"thighs",direction:-1},
  "male-breast-reduction":{region:"chest",direction:-1},
  "pectoral-implants":{region:"chest",direction:1},
  "calf-implants":{region:"calves",direction:1}
});
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const smooth=(x)=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
const gaussian=(x,c,r)=>Math.exp(-Math.pow((x-c)/Math.max(r,1),2)*2);
const coord=(p,w,h)=>({x:p.x*w,y:p.y*h});
function checkPose(points,w,h){
  if(!Array.isArray(points)||points.length<33)throw Error("MediaPipe could not identify a full-body pose.");
  const ids=[11,12,23,24,25,26,27,28];
  if(ids.some(i=>!points[i]||!Number.isFinite(points[i].x)||!Number.isFinite(points[i].y)))throw Error("Required body landmarks were not found.");
  const visible=ids.filter(i=>(points[i].visibility??1)>0.4).length;
  if(visible<6)throw Error("Please use a well-lit photo showing the torso and both legs.");
  const p=i=>coord(points[i],w,h);
  const shoulders=[p(11),p(12)],hips=[p(23),p(24)];
  const shoulderY=(shoulders[0].y+shoulders[1].y)/2;
  const hipY=(hips[0].y+hips[1].y)/2;
  if(hipY-shoulderY<0.1*h)throw Error("The torso is too small for a reliable body preview.");
  return {shoulderY,hipY,shoulderWidth:Math.abs(shoulders[0].x-shoulders[1].x),
    hipWidth:Math.abs(hips[0].x-hips[1].x),centerX:(shoulders[0].x+shoulders[1].x+hips[0].x+hips[1].x)/4,
    knees:(p(25).y+p(26).y)/2,ankles:(p(27).y+p(28).y)/2,points:points.map(v=>coord(v,w,h))};
}
function regions(p,procedure){
 const torso=Math.max(1,p.hipY-p.shoulderY);
 const data={
 chest:[p.shoulderY+torso*.29,torso*.23],
 waist:[p.shoulderY+torso*.68,torso*.27],
 abdomen:[p.shoulderY+torso*.79,torso*.32],
 lowerAbdomen:[p.hipY-torso*.08,torso*.18],
 hips:[p.hipY+torso*.09,torso*.25],
 arms:[p.shoulderY+torso*.45,torso*.56],
 thighs:[p.hipY+(p.knees-p.hipY)*.48,Math.max(8,(p.knees-p.hipY)*.55)],
 calves:[p.knees+(p.ankles-p.knees)*.45,Math.max(8,(p.ankles-p.knees)*.55)]
 };
 return data[procedure.region]||data.waist;
}
function bodyWarp(source,mask,pose,procedure,intensity){
 const w=source.width,h=source.height;
 const result=document.createElement("canvas");result.width=w;result.height=h;
 const ctx=result.getContext("2d",{willReadFrequently:true});
 const srcCtx=source.getContext("2d",{willReadFrequently:true});
 const maskCtx=mask.getContext("2d",{willReadFrequently:true});
 if(!ctx||!srcCtx||!maskCtx)throw Error("Canvas processing is unavailable.");
 const input=srcCtx.getImageData(0,0,w,h);
 const segmentation=maskCtx.getImageData(0,0,w,h);
 const output=ctx.createImageData(w,h);output.data.set(input.data);
 const [cy,ry]=regions(pose,procedure);
 const base=Math.min(w*.022,Math.max(1,pose.shoulderWidth*.085));
 const amplitude=base*intensity*procedure.direction;
 // Row-wise, segmentation-bounded 2D silhouette resampling.
 // This approximates a contour only. It does not reconstruct 3D tissue.
 for(let y=Math.max(0,Math.floor(cy-ry*1.8));y<Math.min(h,Math.ceil(cy+ry*1.8));y++){
   const influence=gaussian(y,cy,ry);
   if(influence<.015)continue;
   const center=Math.round(pose.centerX);
   const limit=Math.max(20,Math.round(Math.max(pose.shoulderWidth,pose.hipWidth)*.85));
   let left=-1,right=-1;
   for(let x=Math.max(0,center-limit);x<Math.min(w,center+limit);x++){
     const i=(y*w+x)*4;
     if(segmentation.data[i+3]>150){if(left<0)left=x;right=x;}
   }
   if(left<0||right-left<16)continue;
   const middle=(left+right)/2;
   const half=(right-left)/2;
   const targetHalf=Math.max(6,half+amplitude*influence);
   const begin=Math.max(0,Math.floor(Math.min(left,middle-targetHalf)-3));
   const finish=Math.min(w-1,Math.ceil(Math.max(right,middle+targetHalf)+3));
   const leftBackground=Math.max(0,left-5),rightBackground=Math.min(w-1,right+5);
   for(let x=begin;x<=finish;x++){
     const i=(y*w+x)*4;
     const inside=Math.abs(x-middle)<=targetHalf;
     if(inside){
       const sx=Math.max(0,Math.min(w-1,Math.round(middle+(x-middle)*half/targetHalf)));
       const si=(y*w+sx)*4;
       const alpha=segmentation.data[si+3]/255;
       const bgx=x<middle?leftBackground:rightBackground;
       const bi=(y*w+bgx)*4;
       for(let c=0;c<3;c++)output.data[i+c]=Math.round(input.data[si+c]*alpha+input.data[bi+c]*(1-alpha));
     }else if(x>=left&&x<=right){
       const bgx=x<middle?leftBackground:rightBackground;
       const bi=(y*w+bgx)*4;
       for(let c=0;c<3;c++)output.data[i+c]=input.data[bi+c];
     }
   }
 }
 ctx.putImageData(output,0,0);
 return result;
}
export function renderBodyLevels(imageCanvas,poseLandmarks,segmentationCanvas,procedureId){
 const procedure=BODY_PROCEDURES[procedureId];
 if(!procedure)throw Error("This procedure does not yet have a body preview.");
 if(!imageCanvas||!segmentationCanvas)throw Error("Body image and segmentation are required.");
 const p=checkPose(poseLandmarks,imageCanvas.width,imageCanvas.height);
 const levels={natural:.48,balanced:.8,enhanced:1.08};
 const results={};
 for(const [level,intensity] of Object.entries(levels)){
   results[level]=bodyWarp(imageCanvas,segmentationCanvas,p,procedure,intensity);
 }
 return results;
}
