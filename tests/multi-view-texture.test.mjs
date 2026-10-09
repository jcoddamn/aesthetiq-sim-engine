import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {makeMultiAngleTexture} from '../js/personalizedFace3D.js';
import {rotation} from '../js/multiViewFit.js';
function photo(color){const imageCanvas=createCanvas(200,200),ctx=imageCanvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,200,200);return {imageCanvas,landmarks:Array.from({length:468},(_,i)=>({x:i===1?.8:.2,y:i===2?.8:.2}))};}
test('texture blending uses only accepted views and responds to surface orientation',()=>{
 const old=globalThis.document;globalThis.document={createElement:()=>createCanvas(1,1)};
 try{
  const captures={straight:photo('#ff0000'),left:photo('#0000ff'),right:photo('#00ff00')};
  const shape=new Float32Array([0,0,1,1,0,0,0,1,1]),uv=new Float32Array([.1,.1,.9,.1,.1,.9]);
  const views={straight:{rows:rotation(0)},left:{rows:rotation(-45)}};
  const atlas=makeMultiAngleTexture(captures,[0,1,2],uv,shape,128,views,shape);
  const pixel=atlas.getContext('2d').getImageData(35,90,1,1).data;
  assert.ok(pixel[2]>pixel[0],`visible side should contribute more blue than red: ${pixel}`);
  assert.equal(pixel[1],0,'excluded green capture must not contribute');
  assert.equal(pixel[3],255);
 }finally{globalThis.document=old;}
});
