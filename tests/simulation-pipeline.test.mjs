import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createCanvas,ImageData}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?
 `${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`:'@napi-rs/canvas');
test('actual lip pipeline renders three finite intensity levels from synthetic reference geometry',async()=>{
 const obj=await readFile(new URL('../models/mediapipe_canonical_face.obj',import.meta.url),'utf8');
 const lines=obj.split('\n');
 const landmarks=lines.filter(l=>l.startsWith('v ')).map(l=>{
  const [x,y,z]=l.split(/\s+/).slice(1).map(Number);return {x:.5+x/24,y:.5-y/24,z:-z/24};
 });
 const edges=[];
 for(const f of lines.filter(l=>l.startsWith('f '))){
  const indices=f.split(/\s+/).slice(1).map(v=>Number(v.split('/')[0])-1);
  for(let i=0;i<indices.length;i++)edges.push([indices[i],indices[(i+1)%indices.length]]);
 }
 const canvases=[];
 globalThis.document={createElement:name=>{assert.equal(name,'canvas');const c=createCanvas(1,1);canvases.push(c);return c;}};
 globalThis.FACEMESH_TESSELATION=edges;globalThis.ImageData=ImageData;
 globalThis.alert=message=>{throw Error(message);};
 const {runProcedureSimulationFromLandmarks}=await import('../js/simulationPipeline.js');
 const source=createCanvas(256,256),ctx=source.getContext('2d');
 ctx.fillStyle='#bc9276';ctx.fillRect(0,0,256,256);ctx.fillStyle='#9d715d';ctx.fillRect(110,175,36,15);
 try{
  const result=runProcedureSimulationFromLandmarks({procedure:'lip-filler',landmarks,imageSource:source,blurPx:8,mirrorX:false});
  for(const level of ['natural','balanced','enhanced']){
   const canvas=result[level+'Canvas'];assert.equal(canvas.width,256);assert.equal(canvas.height,256);
   assert.ok(result.landmarksByLevel[level].every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
   assert.ok(canvas.toBuffer('image/png').length>100);
  }
  assert.notDeepEqual(result.landmarksByLevel.natural,result.landmarksByLevel.enhanced);
 }finally{for(const c of canvases){c.width=1;c.height=1;}}
});
