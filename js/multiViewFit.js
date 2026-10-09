// Experimental weak-perspective fitting. Coordinates have arbitrary scale.
// Reprojection agreement is a fit diagnostic, never an accuracy certificate.
const N=468, rad=Math.PI/180;
const anchors=[4,6,10,33,70,105,127,133,152,168,197,234,263,300,334,356,362,454];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function rotation(yaw,pitch=0,roll=0){
 const c=Math.cos(yaw*rad),s=Math.sin(yaw*rad),p=Math.cos(pitch*rad),q=Math.sin(pitch*rad),r=Math.cos(roll*rad),t=Math.sin(roll*rad);
 return [[r*c-t*q*s,-t*p,r*s+t*q*c],[t*c+r*q*s,r*p,t*s-r*q*c],[-p*s,q,p*c]];
}
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
function point(positions,i){return Array.from(positions.slice(i*3,i*3+3));}
function observations(capture){
 const w=capture?.imageCanvas?.width,h=capture?.imageCanvas?.height;
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0||capture?.landmarks?.length<N)throw Error('Image dimensions and 468 landmarks are required for 3D fitting.');
 return capture.landmarks.slice(0,N).map(p=>{
  if(!p||![p.x,p.y].every(Number.isFinite))throw Error('Scan contains invalid landmarks.');
  return [p.x,-p.y*h/w];
 });
}
function cameraAt(shape,obs,angles){
 const rows=rotation(...angles),projected=anchors.map(i=>[dot(rows[0],point(shape,i)),dot(rows[1],point(shape,i))]);
 const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
 const a=[0,1].map(d=>mean(projected.map(p=>p[d]))),b=[0,1].map(d=>mean(anchors.map(i=>obs[i][d])));
 let numerator=0,denominator=0;
 projected.forEach((p,k)=>{for(let d=0;d<2;d++){numerator+=(p[d]-a[d])*(obs[anchors[k]][d]-b[d]);denominator+=(p[d]-a[d])**2;}});
 const scale=numerator/Math.max(1e-9,denominator),offset=b.map((v,d)=>v-scale*a[d]);
 const error=projected.reduce((sum,p,k)=>sum+p.reduce((s,v,d)=>s+(v*scale+offset[d]-obs[anchors[k]][d])**2,0),0)/anchors.length;
 return {angles,rows,scale,offset,error};
}
export function fitCamera(shape,obs){
 let best={error:Infinity};
 for(let yaw=-65;yaw<=65;yaw+=5){const c=cameraAt(shape,obs,[yaw,0,0]);if(c.error<best.error&&c.scale>0)best=c;}
 for(const step of [5,2,0.5])for(let round=0;round<5;round++){
  let changed=false;
  for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
   const angles=[...best.angles];angles[axis]+=step*sign;
   if(Math.abs(angles[axis])>(axis===0?70:25))continue;
   const c=cameraAt(shape,obs,angles);
   if(c.error<best.error&&c.scale>0){best=c;changed=true;}
  }
  if(!changed)break;
 }
 return best;
}
function solve3(a,b){
 const m=a.map((row,i)=>[...row,b[i]]);
 for(let c=0;c<3;c++){
  let pivot=c;for(let r=c+1;r<3;r++)if(Math.abs(m[r][c])>Math.abs(m[pivot][c]))pivot=r;
  [m[c],m[pivot]]=[m[pivot],m[c]];
  if(Math.abs(m[c][c])<1e-10)throw Error('Insufficient independent views for reconstruction.');
  const div=m[c][c];for(let j=c;j<4;j++)m[c][j]/=div;
  for(let r=0;r<3;r++)if(r!==c){const f=m[r][c];for(let j=c;j<4;j++)m[r][j]-=f*m[c][j];}
 }
 return m.map(row=>row[3]);
}
export function fitMultiView(captures,canonical){
 if(!canonical||canonical.length!==N*3||!Array.from(canonical).every(Number.isFinite))throw Error('Invalid canonical face geometry.');
 if(!captures?.straight)throw Error('A front-facing capture is required.');
 const views={},warnings=[];
 for(const name of ['straight','left','right']){
  if(!captures[name])continue;
  try{
   const obs=observations(captures[name]),camera=fitCamera(canonical,obs);
   const span=Math.hypot(obs[234][0]-obs[454][0],obs[234][1]-obs[454][1]);
   if(span<.08||!Number.isFinite(camera.scale)||camera.scale<=0||Math.sqrt(camera.error)/span>.09)throw Error('Landmarks do not agree with a stable camera fit.');
   views[name]={...camera,obs,span};
  }catch(error){if(name==='straight')throw error;warnings.push(`${name}: recapture this view. ${error.message}`);}
 }
 const front=views.straight;
 if(Math.abs(front.angles[0])>20||Math.abs(front.angles[1])>18)throw Error('Look straight at the camera and keep your chin level for the front capture.');
 for(const name of ['left','right']){
  const v=views[name];if(!v)continue;
  const other=name==='right'?views.left:null;
  if(Math.abs(v.angles[0]-front.angles[0])<15||(other&&Math.abs(v.angles[0]-other.angles[0])<15)){
   warnings.push(`${name}: this angle is too similar to another capture; turn further and rescan.`);delete views[name];
  }
 }
 if(views.left&&views.right&&(views.left.angles[0]-front.angles[0])*(views.right.angles[0]-front.angles[0])>0){warnings.push('Capture both sides of your face; the second side was excluded.');delete views.right;}
 const accepted=Object.values(views),positions=new Float32Array(canonical);
 // A prior keeps weakly observed depths bounded; no detector Z values are used.
 const prior=accepted.length===1?.3:.025;
 for(let i=0;i<N;i++){
  const base=point(canonical,i),a=[[prior,0,0],[0,prior,0],[0,0,prior]],b=base.map(v=>v*prior);
  for(const view of accepted){
   // Side silhouettes/hidden landmarks are less reliable than central points.
   const weight=Math.abs(view.angles[0])>20&&Math.abs(base[0])>4?.35:1;
   for(let d=0;d<2;d++){
    const row=view.rows[d],value=(view.obs[i][d]-view.offset[d])/view.scale;
    for(let x=0;x<3;x++){b[x]+=weight*row[x]*value;for(let y=0;y<3;y++)a[x][y]+=weight*row[x]*row[y];}
   }
  }
  const solved=solve3(a,b);
  for(let d=0;d<3;d++)positions[i*3+d]=clamp(solved[d],base[d]-1.8,base[d]+1.8);
 }
 const diagnostics=Object.entries(views).map(([name,v])=>{
  const error=Array.from({length:N},(_,i)=>[0,1].reduce((s,d)=>s+(dot(v.rows[d],point(positions,i))*v.scale+v.offset[d]-v.obs[i][d])**2,0)).reduce((a,b)=>a+b,0);
  return {name,yawDegrees:v.angles[0],pitchDegrees:v.angles[1],relativeReprojectionError:Math.sqrt(error/N)/v.span};
 });
 if(accepted.length<3)warnings.push('Limited independent views: depth remains strongly influenced by the reference face.');
 return {positions,views,quality:{poseCount:accepted.length,approximateDepth:true,metricScale:false,method:'regularized-weak-perspective',diagnostics,warnings,note:'Experimental multi-view landmark fit; agreement with photos does not establish physical accuracy.'}};
}
