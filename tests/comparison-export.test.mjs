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

test('close-up export leaves room for readable labels without clipping either photo', () => {
  globalThis.document = { createElement: () => createCanvas(1, 1) };
  const original = createCanvas(120, 90), result = createCanvas(120, 90);
  original.getContext('2d').fillStyle = '#cc2233'; original.getContext('2d').fillRect(0, 0, 120, 90);
  result.getContext('2d').fillStyle = '#2244cc'; result.getContext('2d').fillRect(0, 0, 120, 90);
  const label = 'BOTOX Cosmetic · frown lines · Enhanced · Frowning · Day 120 · Around 4 months · Further return of movement · Recovery example with possible bruising · Close-up · This is an illustration of a possible appearance. Results and treatment response vary.';
  const pair = createComparisonCanvas(original, result, label, { minPanelWidth: 600, wrapLabel: true });
  const header = pair.height - 450;
  assert.equal(pair.width, 1216);
  assert.ok(header >= 142, 'The header must fit more than one line of readable text.');
  const pixel = (x, y) => [...pair.getContext('2d').getImageData(x, y, 1, 1).data];
  assert.deepEqual(pixel(300, header + 225), [204, 34, 51, 255]);
  assert.deepEqual(pixel(916, header + 225), [34, 68, 204, 255]);
  assert.equal(original.width, 120);
  assert.equal(result.width, 120);
});
