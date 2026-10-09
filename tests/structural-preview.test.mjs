import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCanvas,ImageData} from '@napi-rs/canvas';
import {runProcedureSimulationFromLandmarks} from '../js/simulationPipeline.js';
import {warpFacelift} from '../js/faceWarp.js';
import {renderWarp} from '../js/warpRenderer.js';
globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.ImageData=ImageData;
const points=readFileSync(new URL('../models/mediapipe_canonical_face.obj',import.meta.url),'utf8').split('\n').filter(l=>l.startsWith('v ')).map(l=>{const [x,y,z]=l.split(/\s+/).slice(1).map(Number);return {x:.5+x/24,y:.5-y/24,z:-z/24};});
const lip=[61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146];
function polygon(ctx,ids){ctx.beginPath();ids.forEach((id,i)=>ctx[i?'lineTo':'moveTo'](points[id].x*600,points[id].y*600));ctx.closePath();ctx.fill();}
const data=c=>c.getContext('2d').getImageData(0,0,600,600).data;
const darkArea=c=>{const d=data(c);let total=0;for(let i=0;i<d.length;i+=4)if(d[i]<100)total++;return total;};
test('lip filler enlarges rendered lip silhouette across levels without adding pigment',()=>{
 const source=createCanvas(600,600),ctx=source.getContext('2d');ctx.fillStyle='#b0b0b0';ctx.fillRect(0,0,600,600);ctx.fillStyle='#404040';polygon(ctx,lip);
 const r=runProcedureSimulationFromLandmarks({procedure:'lip-filler',landmarks:points,imageSource:source});
 const areas=['natural','balanced','enhanced'].map(level=>darkArea(r[level+'Canvas']));
 assert.ok(areas[0]>darkArea(source)*1.02,JSON.stringify({areas,original:darkArea(source)}));
 assert.ok(areas[1]>areas[0]&&areas[2]>areas[1],JSON.stringify(areas));
 const pixels=data(r.enhancedCanvas);
 for(let i=0;i<pixels.length;i+=4)assert.ok(Math.abs(pixels[i]-pixels[i+1])<=1&&Math.abs(pixels[i+1]-pixels[i+2])<=1,'geometry preview must not tint neutral lips pink');
});
test('facelift moves inner cheek tissue and a visible cheek marker, preserving eyes and mouth',()=>{
 const w=warpFacelift(points,'balanced');
 const changed=w.map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y)>1e-6?i:null).filter(i=>i!==null);
 assert.ok(changed.length>35,`only ${changed.length} vertices moved`);
 for(const i of [33,133,263,362,61,291,0,13,14,17,1,168])assert.deepEqual(w[i],points[i]);
 const boundary=new Set([234,93,132,58,172,136,150,454,323,361,288,397,365,379]);
 const id=changed.find(i=>!boundary.has(i)&&points[i].x<.5&&points[i].y>.5);
 assert.ok(id!==undefined);
 const source=createCanvas(600,600),ctx=source.getContext('2d');ctx.fillStyle='#c0c0c0';ctx.fillRect(0,0,600,600);ctx.fillStyle='#202020';ctx.beginPath();ctx.arc(points[id].x*600,points[id].y*600,3,0,Math.PI*2);ctx.fill();
 const centroid=c=>{const d=data(c);let sum=0,n=0;for(let y=0;y<600;y++)for(let x=0;x<600;x++)if(d[(y*600+x)*4]<80){sum+=y;n++;}return sum/n;};
 const r=runProcedureSimulationFromLandmarks({procedure:'facelift',landmarks:points,imageSource:source});
 assert.ok(centroid(r.enhancedCanvas)<centroid(source)-.6,'cheek landmark marker must visibly lift, not merely change brightness');
});
test('outline warp replaces the old silhouette instead of retaining an unmoved edge',()=>{
 const source=createCanvas(600,600),ctx=source.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,600,600);
 const oval=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
 ctx.fillStyle='#303030';polygon(ctx,oval);
 const moved=points.map(p=>({...p,x:.5+(p.x-.5)*.94}));
 const output=renderWarp(source,points,moved);
 assert.ok(darkArea(output)<darkArea(source)*.965,'original outline should be erased when the geometry narrows');
});
