import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fitMultiView,rotation} from '../js/multiViewFit.js';
const canonical=Float32Array.from(readFileSync(new URL('../models/mediapipe_canonical_face.obj',import.meta.url),'utf8').split('\n').filter(s=>s.startsWith('v ')).flatMap(s=>s.trim().split(/\s+/).slice(1).map(Number)));
function capture(shape,yaw=0,pitch=0,roll=0,width=900,height=1200,scale=.035){
 const r=rotation(yaw,pitch,roll);
 return {imageCanvas:{width,height},landmarks:Array.from({length:468},(_,i)=>{
  const p=Array.from(shape.slice(i*3,i*3+3));
  return {x:.5+scale*r[0].reduce((s,v,j)=>s+v*p[j],0),y:(.6-scale*r[1].reduce((s,v,j)=>s+v*p[j],0))*width/height,z:999};
 })};
}
const rms=(a,b,axis=2)=>Math.sqrt(Array.from({length:468},(_,i)=>(a[i*3+axis]-b[i*3+axis])**2).reduce((a,b)=>a+b,0)/468);
test('recovers camera yaw, pitch, roll and independent views without trusting detector Z',()=>{
 const result=fitMultiView({straight:capture(canonical,0,5,8),left:capture(canonical,-35,-4,5),right:capture(canonical,40,3,-7)},canonical);
 assert.equal(result.quality.poseCount,3);
 assert.ok(Math.abs(result.views.left.angles[0]+35)<2);
 assert.ok(Math.abs(result.views.right.angles[0]-40)<2);
 assert.ok(rms(result.positions,canonical)<.06);
 assert.equal(result.quality.metricScale,false);
});
test('distinct side images recover localized depth changes better than a frontal image alone',()=>{
 const shape=Float32Array.from(canonical);
 // Known synthetic variation away from camera-fitting anchor points.
 for(const i of [19,20,44,45,48,49,51,115,122,134,196,220,275,278,279,281,344,351,363])shape[i*3+2]+=.65;
 const straight=capture(shape),left=capture(shape,-35),right=capture(shape,35);
 const single=fitMultiView({straight},canonical),multi=fitMultiView({straight,left,right},canonical);
 assert.ok(rms(multi.positions,shape)<rms(single.positions,shape)*.4);
 assert.ok(multi.quality.diagnostics.every(d=>d.relativeReprojectionError<.015));
});
test('identical and same-side captures cannot count as three independent angles',()=>{
 const straight=capture(canonical);
 const duplicate=fitMultiView({straight,left:straight,right:straight},canonical);
 assert.equal(duplicate.quality.poseCount,1);
 assert.ok(duplicate.quality.warnings.some(w=>w.includes('too similar')));
 const sameSide=fitMultiView({straight,left:capture(canonical,25),right:capture(canonical,50)},canonical);
 assert.equal(sameSide.quality.poseCount,2);
});
test('preserves fitting across image aspect ratio and camera distance',()=>{
 const result=fitMultiView({straight:capture(canonical,0,0,0,1200,800,.026),left:capture(canonical,-35,0,0,800,1200,.04),right:capture(canonical,35,0,0,1000,1000,.035)},canonical);
 assert.ok(rms(result.positions,canonical,0)<.03);
 assert.ok(rms(result.positions,canonical,1)<.03);
 assert.ok(rms(result.positions,canonical,2)<.03);
});
test('invalid landmarks fail clearly; missing side views retain an explicitly approximate fallback',()=>{
 assert.throws(()=>fitMultiView({straight:{imageCanvas:{width:900,height:1200},landmarks:Array(468).fill({x:NaN,y:0})}},canonical),/invalid landmarks/);
 const result=fitMultiView({straight:capture(canonical)},canonical);
 assert.equal(result.quality.poseCount,1);
 assert.ok(result.quality.warnings.length>0);
 assert.ok(Array.from(result.positions).every(Number.isFinite));
});
