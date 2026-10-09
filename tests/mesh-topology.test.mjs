import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCanvas,ImageData} from '@napi-rs/canvas';
test('facial geometry renders different pixels without a CDN mesh-connection global',async()=>{
 delete globalThis.FACEMESH_TESSELATION;delete globalThis.FaceMesh;
 const {getFaceTriangles}=await import('../js/warpRenderer.js');
 assert.ok(getFaceTriangles().length>800,'A ready face detector must not leave geometry rendering with an empty mesh');
 const obj=await readFile(new URL('../models/mediapipe_canonical_face.obj',import.meta.url),'utf8');
 const landmarks=obj.split('\n').filter(l=>l.startsWith('v ')).map(l=>{const [x,y,z]=l.split(/\s+/).slice(1).map(Number);return {x:.5+x/24,y:.5-y/24,z:-z/24};});
 globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.ImageData=ImageData;
 const source=createCanvas(256,256),ctx=source.getContext('2d');
 for(let y=0;y<256;y+=4)for(let x=0;x<256;x+=4){ctx.fillStyle=(x+y)%8?'#b38d77':'#795340';ctx.fillRect(x,y,4,4);}
 const {runProcedureSimulationFromLandmarks}=await import('../js/simulationPipeline.js');
 for(const procedure of ['lip-filler','rhinoplasty','chin-filler']){
  const r=runProcedureSimulationFromLandmarks({procedure,landmarks,imageSource:source});
  const pixels=c=>Buffer.from(c.getContext('2d').getImageData(0,0,256,256).data);
  assert.notDeepEqual(pixels(r.naturalCanvas),pixels(r.enhancedCanvas),procedure+' intensity images must differ');
  assert.notDeepEqual(pixels(source),pixels(r.balancedCanvas),procedure+' output must not silently be the original');
 }
});
