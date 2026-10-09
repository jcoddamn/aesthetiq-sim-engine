// Calibrated geometry and paired observations. No clinical response fitting.
import {CLINICAL_METRICS,PROCEDURE_MEASUREMENTS} from './clinicalMeasurementRegistry.js';
const finite=Number.isFinite;
const text=v=>typeof v==='string'&&v.trim().length>0&&v.length<=160;
const fail=message=>{throw Error(message);};
function pointsOf(input){
 const dimension=input?.space==='metric_3d_mm'?3:input?.space==='image_pixels'?2:0;
 if(!dimension)fail('Use image_pixels or metric_3d_mm; normalized FaceMesh depth is not a physical scan.');
 const points=input.points;
 if(!Array.isArray(points)||!points.length||points.length>100000||!points.every(p=>Array.isArray(p)&&p.length===dimension&&p.every(finite)))fail('Finite points with the declared dimension are required.');
 let scale=1;
 if(dimension===2){
  const c=input.calibration;
  if(c?.samePlaneConfirmed!==true||!text(c?.referenceId)||!finite(c?.referencePixels)||c.referencePixels<=0||!finite(c?.referenceMm)||c.referenceMm<=0)fail('A documented same-plane millimeter scale is required; assumed face or body size is not a scale.');
  scale=c.referenceMm/c.referencePixels;
 }else if(!text(input.calibration?.referenceId)||input.calibration?.metricScaleVerified!==true)fail('A verified metric 3D scale is required.');
 return points.map(p=>p.map(x=>x*scale));
}
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
function simplePolygon(points){
 if(points.length>2000)fail('Resample polygons to at most 2000 points before calculation.');
 if(points.length<3)fail('A polygon needs at least three points.');
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const on=(a,b,p)=>Math.abs(cross(a,b,p))<1e-9&&p[0]>=Math.min(a[0],b[0])-1e-9&&p[0]<=Math.max(a[0],b[0])+1e-9&&p[1]>=Math.min(a[1],b[1])-1e-9&&p[1]<=Math.max(a[1],b[1])+1e-9;
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];
  if(distance(a,b)<1e-9)fail('Polygon contains duplicate adjacent points.');
  for(let j=i+1;j<points.length;j++){
   if(j===i+1||(i===0&&j===points.length-1))continue;
   const c=points[j],d=points[(j+1)%points.length];
   if((cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b))fail('Polygon must not self-intersect or touch itself.');
  }
 }
}
export function measureGeometry(input){
 const p=pointsOf(input),op=input.operation;
 let value,unit='mm';
 if(op==='distance'){
  if(p.length!==2)fail('Distance requires two points.');value=distance(...p);
 }else if(op==='angle'){
  if(p.length!==3)fail('Angle requires three points with the vertex second.');
  const a=p[0].map((v,i)=>v-p[1][i]),b=p[2].map((v,i)=>v-p[1][i]);
  const den=Math.hypot(...a)*Math.hypot(...b);if(den<1e-12)fail('Angle reference is degenerate.');
  value=Math.acos(Math.max(-1,Math.min(1,a.reduce((s,v,i)=>s+v*b[i],0)/den)))*180/Math.PI;unit='deg';
 }else if(op==='ratio'){
  if(p.length!==4)fail('Ratio requires numerator endpoints followed by denominator endpoints.');
  const den=distance(p[2],p[3]);if(den<1e-12)fail('Ratio denominator is zero.');value=distance(p[0],p[1])/den;unit='ratio';
 }else if(op==='area'){
  if(input.space!=='image_pixels')fail('Planar area requires a traced calibrated photograph; it is not curved surface area.');
  simplePolygon(p);value=Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;unit='mm2';if(value<1e-12)fail('Polygon area is zero.');
 }else if(op==='circumference'){
  if(input.space!=='metric_3d_mm'||input.closedSectionConfirmed!==true||p.length<3)fail('Circumference requires a complete 3D cross-section; a photo width cannot supply it.');
  const origin=p[0],u=p[1].map((v,i)=>v-origin[i]),len=Math.hypot(...u);
  if(len<1e-9)fail('Section has duplicate points.');
  const axis=u.map(v=>v/len);let normal;
  for(const point of p.slice(2)){
   const v=point.map((x,i)=>x-origin[i]);
   const n=[axis[1]*v[2]-axis[2]*v[1],axis[2]*v[0]-axis[0]*v[2],axis[0]*v[1]-axis[1]*v[0]],l=Math.hypot(...n);
   if(l>1e-9){normal=n.map(x=>x/l);break;}
  }
  if(!normal)fail('Section is degenerate.');
  const second=[normal[1]*axis[2]-normal[2]*axis[1],normal[2]*axis[0]-normal[0]*axis[2],normal[0]*axis[1]-normal[1]*axis[0]];
  const projected=p.map(point=>{const v=point.map((x,i)=>x-origin[i]);
   if(Math.abs(v.reduce((sum,x,i)=>sum+x*normal[i],0))>1e-5)fail('Section must be planar; resample the scan at a fixed plane.');
   return [v.reduce((sum,x,i)=>sum+x*axis[i],0),v.reduce((sum,x,i)=>sum+x*second[i],0)];});
  simplePolygon(projected);
  value=p.reduce((s,a,i)=>s+distance(a,p[(i+1)%p.length]),0)/10;unit='cm';
 }else if(op==='volume'){
  if(input.space!=='metric_3d_mm'||input.closureProtocolConfirmed!==true||input.nonSelfIntersectingMeshConfirmed!==true)fail('Volume requires a closed metric 3D mesh and documented closure and non-self-intersection checks.');
  const faces=input.triangles,edges=new Map(),neighbors=new Map(),used=new Set();
  if(!Array.isArray(faces)||faces.length<4||faces.length>200000)fail('A triangulated closed mesh is required.');
  let signed=0;
  for(const f of faces){
   if(!Array.isArray(f)||f.length!==3||new Set(f).size!==3||!f.every(i=>Number.isInteger(i)&&i>=0&&i<p.length))fail('Invalid triangle indices.');
   const [a,b,c]=f.map(i=>p[i].map((v,j)=>v-p[0][j]));
   const u=b.map((v,i)=>v-a[i]),v=c.map((x,i)=>x-a[i]);
   if(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])<1e-10)fail('Degenerate triangle.');
   signed+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
   for(let j=0;j<3;j++){
    const x=f[j],y=f[(j+1)%3],key=[Math.min(x,y),Math.max(x,y)].join(':');
    const e=edges.get(key)||{count:0,balance:0};e.count++;e.balance+=x<y?1:-1;edges.set(key,e);
    used.add(x);if(!neighbors.has(x))neighbors.set(x,new Set());neighbors.get(x).add(y);neighbors.get(x).add(f[(j+2)%3]);
   }
  }
  if([...edges.values()].some(e=>e.count!==2||e.balance!==0))fail('Mesh must be closed and consistently oriented; open surface volume is invalid.');
  const visited=new Set(),queue=[0];while(queue.length){const i=queue.pop();if(visited.has(i))continue;visited.add(i);queue.push(...(neighbors.get(i)||[]));}
  if(visited.size!==p.length||used.size!==p.length)fail('Use one connected regional mesh without unused vertices.');
  value=Math.abs(signed)/1000;unit='mL';if(value<1e-12)fail('Mesh volume is zero.');
 }else fail('Unsupported geometry operation.');
 if(!finite(value))fail('Geometry result is not finite.');
 return {value,unit,method:input.space==='image_pixels'?'calibrated_photo':'metric_3d',clinicalValidationComplete:false};
}
export function measureDensity({count,areaCm2,kind}){
 if(!Number.isInteger(count)||count<0||!finite(areaCm2)||areaCm2<=0||!['hair','follicular_unit'].includes(kind))fail('A nonnegative integer count, positive calibrated area and count type are required.');
 const value=count/areaCm2;if(!Number.isSafeInteger(count)||!finite(value))fail('Density count or result exceeds numerical limits.');
 return {value,unit:kind==='hair'?'hairs/cm2':'FU/cm2'};
}
export function colorDifference76(before,after){
 for(const c of [before,after])if(!Array.isArray(c)||c.length!==3||!c.every(finite)||c[0]<0||c[0]>100)fail('Valid calibrated CIELAB values are required.');
 return Math.hypot(...after.map((v,i)=>v-before[i]));
}
function validateObservation(o){
 const def=CLINICAL_METRICS[o?.metricId];if(!def)fail('Unknown clinical metric.');
 for(const key of ['region','side','expression','view','protocolId','calibrationId'])if(!text(o[key]))fail('Each observation needs '+key+'.');
 if(!def.methods.includes(o.method))fail('Method is not compatible with '+o.metricId+'.');
 if(o.unit!==def.unit)fail('Unit mismatch for '+o.metricId+': expected '+def.unit+'.');
 if(def.quantity==='color'){colorDifference76(o.value,o.value);if(!text(o.illuminant)||!text(o.observer))fail('Color measurements require illuminant and observer.');}
 else{
  if(!finite(o.value)||(!def.signed&&o.value<0))fail('Invalid numeric value for '+o.metricId+'.');
  if(o.unit==='percent'&&o.value>100)fail('Percent must be between zero and 100.');
  if(o.unit==='deg'&&o.value>180)fail('This angle definition must use 0–180 degrees.');
 }
 if(def.quantity==='score'&&(!text(o.scaleId)||!finite(o.scaleMin)||!finite(o.scaleMax)||o.scaleMax<=o.scaleMin||o.value<o.scaleMin||o.value>o.scaleMax))fail('Clinical scores require a named scale and valid range.');
 if(o.uncertainty!==undefined&&o.uncertainty!==null&&(!finite(o.uncertainty)||o.uncertainty<0))fail('Measurement uncertainty must be nonnegative in the reported unit.');
 return def;
}
const keyOf=o=>JSON.stringify([o.metricId,o.region,o.side,o.expression]);
export function compareClinicalMeasurements(input){
 const specification=PROCEDURE_MEASUREMENTS[input?.procedure];
 if(!specification||input.schemaVersion!==1)fail('Unknown procedure or measurement schema.');
 const c=input.caseContext;
 if(!c||!['caseId','cohortId','techniqueId'].every(k=>text(c[k]))||!['adultConfirmed','samePersonConfirmed','authorizedUse','captureMatched'].every(k=>c[k]===true))fail('Reviewed adult same-person case and capture context is required.');
 if(!finite(input.followupDays)||input.followupDays<=0)fail('Positive follow-up days are required.');
 if(!Array.isArray(input.before)||!Array.isArray(input.after)||input.before.length>1000||input.after.length>1000)fail('Before and after measurement arrays are required.');
 const parse=items=>{
  const map=new Map();
  for(const o of items){validateObservation(o);if(!specification.metrics.includes(o.metricId))fail('Metric does not belong to this procedure.');const k=keyOf(o);if(map.has(k))fail('Duplicate metric/region/side/expression.');map.set(k,o);}
  return map;
 };
 const a=parse(input.before),b=parse(input.after),results=[];
 for(const key of new Set([...a.keys(),...b.keys()])){
  const x=a.get(key),y=b.get(key),o=x||y,def=CLINICAL_METRICS[o.metricId];
  const row={metricId:o.metricId,label:def.label,region:o.region,side:o.side,expression:o.expression,unit:def.unit};
  if(!x||!y){results.push({...row,status:'missing_pair'});continue;}
  const compareKeys=['unit','method','protocolId','view',...(def.quantity==='score'?['scaleId','scaleMin','scaleMax']:[]),...(def.quantity==='color'?['illuminant','observer']:[])];
  if(compareKeys.some(k=>x[k]!==y[k])){results.push({...row,status:'incompatible_protocol'});continue;}
  const color=def.quantity==='color',delta=color?colorDifference76(x.value,y.value):y.value-x.value;
  const canPercent=!color&&!def.signed&&!['score','angle'].includes(def.quantity)&&x.value>0&&def.unit!=='percent'&&def.unit!=='index';
  results.push({...row,status:'paired',method:x.method,protocolId:x.protocolId,view:x.view,baselineCalibrationId:x.calibrationId,followupCalibrationId:y.calibrationId,before:x.value,after:y.value,delta,
   deltaUnit:color?'deltaE76':def.unit,relativeChangePercent:canPercent?delta/x.value*100:null,
   uncertaintyOfDifference:null,uncertaintyNote:'Paired uncertainty requires repeatability and covariance; individual uncertainties are not automatically combined.',
   baselineUncertainty:x.uncertainty??null,followupUncertainty:y.uncertainty??null});
 }
 const present=new Set(results.filter(r=>r.status==='paired').map(r=>r.metricId));
 const missingMetrics=specification.metrics.filter(id=>!present.has(id));
 return {schemaVersion:1,procedure:input.procedure,caseContext:{caseId:c.caseId,cohortId:c.cohortId,techniqueId:c.techniqueId},followupDays:input.followupDays,results,missingMetrics,
  status:missingMetrics.length||results.some(r=>r.status!=='paired')?'partial_measurements':'measurements_complete',
  warnings:[...(input.followupDays<14?['Early follow-up may reflect swelling; do not equate it with a healed result.']:[]),...(c.isolatedProcedureConfirmed!==true?['Concurrent treatment attribution is unresolved.']:[])],
  interpretation:'Descriptive observed changes only. No pooled RMSE across units, no clinical accuracy score, no preset fitting. Complete measurements do not establish clinical validation.',
  clinicalValidationComplete:false,automaticCalibrationApplied:false};
}
