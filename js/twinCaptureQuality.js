// Quality checks for consented, local 3D face reconstruction.
// These are capture heuristics, not biometric identity verification.
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const average=(a)=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length);
export function inspectFaceCapture(capture,pose="straight"){
 const canvas=capture?.imageCanvas,points=capture?.landmarks;
 const problems=[];
 if(!canvas||!Array.isArray(points)||points.length<468)return {usable:false,score:0,problems:["Missing image or facial landmarks."]};
 const w=canvas.width,h=canvas.height;
 if(w<320||h<320)problems.push("Image resolution is low.");
 const a=points[234],b=points[454],top=points[10],bottom=points[152],nose=points[1];
 if(![a,b,top,bottom,nose].every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)))
  return {usable:false,score:0,problems:["Required facial landmarks are missing."]};
 const faceWidth=Math.abs(b.x-a.x),faceHeight=Math.abs(bottom.y-top.y);
 if(faceWidth<.17||faceHeight<.24)problems.push("Move closer so your face fills more of the image.");
 const center=(a.x+b.x)/2;
 const yaw=Math.abs(nose.x-center)/Math.max(faceWidth,.001);
 if(pose==="straight"&&yaw>.23)problems.push("Look more directly at the camera.");
 if(pose!=="straight"&&yaw<.04)problems.push("Turn slightly further to show a side angle.");
 const ctx=canvas.getContext("2d",{willReadFrequently:true});
 let brightness=128,sharpness=20;
 if(ctx){
  const sample=document.createElement("canvas");sample.width=96;sample.height=96;
  const sc=sample.getContext("2d",{willReadFrequently:true});
  sc.drawImage(canvas,0,0,96,96);
  const data=sc.getImageData(0,0,96,96).data;
  let sum=0,edge=0,count=0;
  const gray=(x,y)=>{const i=(y*96+x)*4;return .2126*data[i]+.7152*data[i+1]+.0722*data[i+2];};
  for(let y=20;y<76;y+=2)for(let x=20;x<76;x+=2){
   const v=gray(x,y);sum+=v;edge+=Math.abs(v-gray(x+1,y))+Math.abs(v-gray(x,y+1));count++;
  }
  brightness=sum/Math.max(1,count);sharpness=edge/Math.max(1,count);
 }
 if(brightness<48||brightness>224)problems.push("Use brighter, more even lighting without overexposure.");
 if(sharpness<7)problems.push("Image appears soft; steady the camera and improve focus.");
 const score=clamp(1-problems.length*.2,0,1);
 return {usable:faceWidth>.12&&faceHeight>.18&&w>=240&&h>=240,score,problems,
  metrics:{faceWidth,faceHeight,yaw,brightness,sharpness}};
}
export function inspectScan(captures){
 const entries=Object.entries(captures||{}).filter(([_,v])=>v?.landmarks);
 const reports=Object.fromEntries(entries.map(([pose,capture])=>[pose,inspectFaceCapture(capture,pose)]));
 const front=reports.straight;
 if(!front?.usable)throw Error("The front scan is insufficient. Capture a clear, well-lit front view.");
 const accepted=Object.fromEntries(entries.filter(([pose])=>reports[pose].usable).map(([pose,c])=>[pose,c]));
 const warnings=Object.entries(reports).flatMap(([pose,r])=>r.problems.map(p=>pose+": "+p));
 if(!accepted.left||!accepted.right)warnings.push("Only partial side-view data: depth and side textures are less reliable.");
 return {captures:accepted,reports,warnings,quality:average(Object.values(reports).map(r=>r.score))};
}
