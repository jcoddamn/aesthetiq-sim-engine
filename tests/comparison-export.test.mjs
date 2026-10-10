import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createComparisonCanvas} from '../js/comparisonExport.js';
test('comparison preserves exact original and result pixels at matching scale',()=>{
 globalThis.document={createElement:()=>createCanvas(1,1)};
 const a=createCanvas(100,150),b=createCanvas(100,150);
 a.getContext('2d').fillRect(10,20,40,50);b.getContext('2d').fillRect(20,25,50,60);
 const c=createComparisonCanvas(a,b,'Classic · Balanced');
 assert.equal(c.width,216);assert.equal(c.height,226);
 // Use opaque sources so the export background cannot affect equality.
 for(const s of [a,b]){const ctx=s.getContext('2d');ctx.globalCompositeOperation='destination-over';ctx.fillStyle='white';ctx.fillRect(0,0,100,150);}
 const pair=createComparisonCanvas(a,b,'Classic · Balanced');
 for(const [source,x] of [[a,0],[b,116]])assert.deepEqual(pair.getContext('2d').getImageData(x,76,100,150).data,source.getContext('2d').getImageData(0,0,100,150).data);
 assert.throws(()=>createComparisonCanvas(a,createCanvas(50,50),'test'),/matching/);
});
