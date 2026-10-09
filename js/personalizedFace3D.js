// Multi-angle face fitting + texture atlas.
// Landmark correspondence is MediaPipe 468-point topology. Side views provide
// approximate depth constraints, NOT metric photogrammetric reconstruction.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const valid=points=>Array.isArray(points)&&points.length>=468&&points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
export {fitMultiView as reconstruct3DFromCaptures} from './multiViewFit.js';
function affine(s,t){
 const [a,b,c]=s,[d,e,f]=t;
 const det=(a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y));
 if(Math.abs(det)<.001)return null;
 return [
 (d.x*(b.y-c.y)+e.x*(c.y-a.y)+f.x*(a.y-b.y))/det,
 (d.y*(b.y-c.y)+e.y*(c.y-a.y)+f.y*(a.y-b.y))/det,
 (d.x*(c.x-b.x)+e.x*(a.x-c.x)+f.x*(b.x-a.x))/det,
 (d.y*(c.x-b.x)+e.y*(a.x-c.x)+f.y*(b.x-a.x))/det,
 (d.x*(b.x*c.y-c.x*b.y)+e.x*(c.x*a.y-a.x*c.y)+f.x*(a.x*b.y-b.x*a.y))/det,
 (d.y*(b.x*c.y-c.x*b.y)+e.y*(c.x*a.y-a.x*c.y)+f.y*(a.x*b.y-b.x*a.y))/det
 ];
}
function drawTriangle(ctx,image,src,target,alpha=1){
 const m=affine(src,target);if(!m)return;
 // A tiny overlap avoids subpixel gaps between adjacent atlas triangles.
 const cx=(target[0].x+target[1].x+target[2].x)/3;
 const cy=(target[0].y+target[1].y+target[2].y)/3;
 const clip=target.map(p=>{
  const dx=p.x-cx,dy=p.y-cy,d=Math.hypot(dx,dy)||1;
  return {x:p.x+dx/d*.7,y:p.y+dy/d*.7};
 });
 ctx.save();ctx.globalAlpha=alpha;ctx.beginPath();ctx.moveTo(clip[0].x,clip[0].y);
 ctx.lineTo(clip[1].x,clip[1].y);ctx.lineTo(clip[2].x,clip[2].y);ctx.closePath();ctx.clip();
 ctx.setTransform(...m);ctx.drawImage(image,0,0);ctx.restore();
}
function facialExposure(image,landmarks){
 const p=landmarks[1];
 const sample=document.createElement("canvas");sample.width=48;sample.height=48;
 const c=sample.getContext("2d",{willReadFrequently:true});
 if(!c)return 128;
 const x=Math.max(0,Math.min(image.width-1,Math.round((p?.x??.5)*image.width)));
 const y=Math.max(0,Math.min(image.height-1,Math.round((p?.y??.5)*image.height)));
 const span=Math.max(8,Math.round(Math.min(image.width,image.height)*.14));
 c.drawImage(image,Math.max(0,x-span),Math.max(0,y-span),Math.min(image.width-x+span,span*2),Math.min(image.height-y+span,span*2),0,0,48,48);
 const rgba=c.getImageData(0,0,48,48).data;
 let sum=0;
 for(let i=0;i<rgba.length;i+=4)sum+=.2126*rgba[i]+.7152*rgba[i+1]+.0722*rgba[i+2];
 return sum/(48*48);
}
function exposureMatchedCapture(capture,targetExposure){
 if(!capture?.imageCanvas)return capture;
 const source=capture.imageCanvas;
 const current=facialExposure(source,capture.landmarks);
 const gain=clamp(targetExposure/Math.max(20,current),.82,1.22);
 if(Math.abs(gain-1)<.035)return capture;
 const canvas=document.createElement("canvas");canvas.width=source.width;canvas.height=source.height;
 const ctx=canvas.getContext("2d");
 if(!ctx)return capture;
 ctx.filter="brightness("+gain.toFixed(3)+")";
 ctx.drawImage(source,0,0);
 return {...capture,imageCanvas:canvas};
}
export function makeMultiAngleTexture(captures,triangles,uvs,canonical,size=1536,views=null,positions=canonical){
 if(!captures?.straight?.imageCanvas||!valid(captures.straight.landmarks))throw Error("Frontal texture capture is missing.");
 const frontExposure=facialExposure(captures.straight.imageCanvas,captures.straight.landmarks);
 const matched={
  ...captures,
  left:exposureMatchedCapture(captures.left,frontExposure),
  right:exposureMatchedCapture(captures.right,frontExposure)
 };
 const atlas=document.createElement("canvas");atlas.width=size;atlas.height=size;
 const ctx=atlas.getContext("2d");
 ctx.fillStyle="#b58b78";ctx.fillRect(0,0,size,size);
 const jobs=[];
 for(let k=0;k<triangles.length;k+=3){
  const ids=[triangles[k],triangles[k+1],triangles[k+2]];
  if(views){
   const vertex=(array,id)=>Array.from(array.slice(id*3,id*3+3));
   const normal=array=>{
    const [a,b,c]=ids.map(id=>vertex(array,id)),u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);
    return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
   };
   const n=normal(positions),ref=normal(canonical),length=Math.hypot(...n)||1;
   const sign=ref[2]<0?-1:1;
   const ranked=Object.entries(views).map(([name,view])=>{
    const capture=matched[name];
    const facing=n.reduce((sum,v,i)=>sum+sign*v*view.rows[2][i],0)/length;
    return {capture,score:Math.max(0,facing)**4};
   }).filter(v=>v.capture?.imageCanvas&&v.score>.015).sort((a,b)=>b.score-a.score);
   if(ranked.length){
    // Base coat then weighted overlay; each photo is projected independently.
    let accumulated=0;
    for(const item of ranked){accumulated+=item.score;jobs.push({ids,capture:item.capture,alpha:item.score/accumulated});}
   }else jobs.push({ids,capture:captures.straight,alpha:1});
  }else jobs.push({ids,capture:captures.straight,alpha:1});
 }
 for(const {ids,capture,alpha} of jobs){
  const image=capture.imageCanvas,landmarks=capture.landmarks;
  const src=ids.map(i=>({x:landmarks[i].x*image.width,y:landmarks[i].y*image.height}));
  const target=ids.map(i=>({x:uvs[i*2]*size,y:(1-uvs[i*2+1])*size}));
  drawTriangle(ctx,image,src,target,alpha);
 }
 return atlas;
}
