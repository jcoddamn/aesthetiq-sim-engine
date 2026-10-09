// Multi-angle face fitting + texture atlas.
// Landmark correspondence is MediaPipe 468-point topology. Side views provide
// approximate depth constraints, NOT metric photogrammetric reconstruction.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const valid=points=>Array.isArray(points)&&points.length>=468&&points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
function stats(points){
 const left=points[234],right=points[454],top=points[10],bottom=points[152],nose=points[1];
 const w=Math.abs(left.x-right.x),h=Math.abs(top.y-bottom.y);
 if(w<.08||h<.08)throw Error("Face is too small for 3D fitting.");
 return {cx:(left.x+right.x)/2,cy:(top.y+bottom.y)/2,w,h,nose:nose.x};
}
export function reconstruct3DFromCaptures(captures,canonical){
 const front=captures?.straight;
 if(!front||!valid(front.landmarks))throw Error("A front-facing scan with 468 landmarks is required.");
 const fm=stats(front.landmarks);
 if(Math.abs(fm.nose-fm.cx)>fm.w*.2)throw Error("The frontal image is not centered enough.");
 const side={left:captures.left,right:captures.right};
 const widths=[],depthEvidence=[];
 for(const name of ["left","right"]){
  const c=side[name];
  if(!c||!valid(c.landmarks))continue;
  const st=stats(c.landmarks);
  const ratio=clamp(st.w/fm.w,.38,1.1);
  widths.push(ratio);
  // Side-view normalized Z is model-relative, not an absolute depth measurement.
  const nose=c.landmarks[1],cheek=c.landmarks[name==="left"?234:454];
  if(Number.isFinite(nose.z)&&Number.isFinite(cheek.z)){
   depthEvidence.push(clamp(Math.abs(nose.z-cheek.z)/Math.max(.05,st.w),.05,.8));
  }
 }
 const faceWidth=Math.abs(canonical[454*3]-canonical[234*3]);
 const faceHeight=Math.abs(canonical[10*3+1]-canonical[152*3+1]);
 const frontZ=front.landmarks.map(p=>Number.isFinite(p.z)?p.z:0);
 const zSorted=[...frontZ].sort((a,b)=>a-b);
 const zRange=Math.max(.02,zSorted[440]-zSorted[27]);
 const meanSide=widths.length?widths.reduce((a,b)=>a+b,0)/widths.length:null;
 const sideStrength=meanSide===null?.24:clamp(.22+(1-meanSide)*.45,.2,.46);
 const depthSignal=depthEvidence.length?depthEvidence.reduce((a,b)=>a+b,0)/depthEvidence.length:0;
 const result=new Float32Array(canonical);
 const zCenter=frontZ[168];
 for(let i=0;i<468;i++){
  const p=front.landmarks[i];
  const x=(p.x-fm.cx)/fm.w*faceWidth;
  const y=-(p.y-fm.cy)/fm.h*faceHeight;
  const zNorm=clamp((zCenter-frontZ[i])/zRange,-1.2,1.2);
  const sideSignals=[];
  for(const name of ["left","right"]){
    const view=captures[name]?.landmarks;
    if(!valid(view))continue;
    const noseZ=view[168]?.z;
    const pointZ=view[i]?.z;
    if(Number.isFinite(noseZ)&&Number.isFinite(pointZ)){
      const st=stats(view);
      sideSignals.push(clamp((noseZ-pointZ)/Math.max(.05,st.w),-1.5,1.5));
    }
  }
  const sideSignal=sideSignals.length
    ?sideSignals.reduce((sum,v)=>sum+v,0)/sideSignals.length
    :zNorm;
  const blendedDepth=zNorm*.72+sideSignal*.28;
  const baseZ=canonical[i*3+2];
  const estimatedZ=baseZ+blendedDepth*sideStrength*(2.2+depthSignal);
  // Blend 2D fit to avoid extreme landmark distortions on poor photos.
  result[i*3]=clamp(x,canonical[i*3]-.85,canonical[i*3]+.85);
  result[i*3+1]=clamp(y,canonical[i*3+1]-.9,canonical[i*3+1]+.9);
  result[i*3+2]=clamp(estimatedZ,canonical[i*3+2]-.85,canonical[i*3+2]+.85);
 }
 return {positions:result,quality:{
  poseCount:1+widths.length,
  approximateDepth:true,
  sideWidthRatios:widths,
  note:"Multi-angle landmark fit; camera calibration and true metric depth are unavailable."
 }};
}
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
export function makeMultiAngleTexture(captures,triangles,uvs,canonical,size=1536){
 if(!captures?.straight?.imageCanvas||!valid(captures.straight.landmarks))throw Error("Frontal texture capture is missing.");
 const atlas=document.createElement("canvas");atlas.width=size;atlas.height=size;
 const ctx=atlas.getContext("2d");
 ctx.fillStyle="#b58b78";ctx.fillRect(0,0,size,size);
 const jobs=[];
 for(let k=0;k<triangles.length;k+=3){
  const ids=[triangles[k],triangles[k+1],triangles[k+2]];
  const meanX=ids.reduce((sum,id)=>sum+canonical[id*3],0)/3;
  jobs.push({ids,capture:captures.straight,alpha:1});
  // Side views are restricted to the far lateral surface, where frontal
  // photos lose detail. Soft partial coverage avoids hard image boundaries.
  const side=meanX< -3.8?captures.left:meanX>3.8?captures.right:null;
  if(side?.imageCanvas&&valid(side.landmarks)){
   const opacity=clamp((Math.abs(meanX)-3.8)/2.8,0,.8);
   if(opacity>.04)jobs.push({ids,capture:side,alpha:opacity});
  }
 }
 for(const {ids,capture,alpha} of jobs){
  const image=capture.imageCanvas,landmarks=capture.landmarks;
  const src=ids.map(i=>({x:landmarks[i].x*image.width,y:landmarks[i].y*image.height}));
  const target=ids.map(i=>({x:uvs[i*2]*size,y:(1-uvs[i*2+1])*size}));
  drawTriangle(ctx,image,src,target,alpha);
 }
 return atlas;
}
