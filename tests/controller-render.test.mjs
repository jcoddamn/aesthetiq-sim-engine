import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createCanvas,ImageData} from '@napi-rs/canvas';

test('controller initializes and displays generated results after a completed precision scan',async()=>{
 const html=await readFile(new URL('../simulation.html',import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://example.test/simulation.html?procedure=lip-filler',runScripts:'outside-only'});
 const w=dom.window, canvases=new WeakMap();
 const backing=el=>{if(!(el instanceof w.HTMLCanvasElement))return el;let c=canvases.get(el);if(!c||c.width!==el.width||c.height!==el.height){c=createCanvas(el.width||1,el.height||1);canvases.set(el,c);}return c;};
 w.HTMLCanvasElement.prototype.getContext=function(kind){const ctx=backing(this).getContext(kind);return new Proxy(ctx,{get(target,key){if(key==='drawImage')return (source,...args)=>target.drawImage(backing(source),...args);const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;},set(target,key,value){target[key]=value;return true;}});};
 w.HTMLElement.prototype.scrollIntoView=function(){};w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};
 globalThis.document=w.document;globalThis.window=w;globalThis.ImageData=ImageData;globalThis.requestAnimationFrame=w.requestAnimationFrame;
 const obj=await readFile(new URL('../models/mediapipe_canonical_face.obj',import.meta.url),'utf8');
 const lines=obj.split('\n');const landmarks=lines.filter(l=>l.startsWith('v ')).map(l=>{const [x,y,z]=l.split(/\s+/).slice(1).map(Number);return {x:.5+x/24,y:.5-y/24,z:-z/24};});
 globalThis.FACEMESH_TESSELATION=lines.filter(l=>l.startsWith('f ')).flatMap(l=>{const ids=l.split(/\s+/).slice(1).map(s=>Number(s.split('/')[0])-1);return ids.map((id,i)=>[id,ids[(i+1)%ids.length]]);});
 let source=await readFile(new URL('../js/appController.js',import.meta.url),'utf8');
 const imports=[...source.matchAll(/import\s*\{([\s\S]*?)\}\s*from\s*["']([^"']+)["'];/g)];
 for(const match of imports){const mod=await import(new URL('../js/'+match[2].replace(/^\.\//,''),import.meta.url));for(const name of match[1].split(',').map(x=>x.trim()).filter(Boolean))w[name]=mod[name];}
 w.startFaceTracking=()=>{};w.stopFaceTracking=()=>{};
 source=source.replace(/import\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];/g,'');
 try{
  w.eval(source+'\nwindow.inspectTestResult=()=>({simulationResults,selectedLevel});');
  const canvas=w.document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');for(let y=0;y<256;y+=4)for(let x=0;x<256;x+=4){ctx.fillStyle=(x+y)%8?'#b38d77':'#795340';ctx.fillRect(x,y,4,4);}
  w.testCaptures={straight:{imageCanvas:canvas,landmarks},left:{imageCanvas:canvas,landmarks},right:{imageCanvas:canvas,landmarks}};
  w.eval('handlePrecisionScanComplete(testCaptures)');
  assert.match(w.document.getElementById('trackingStatus').textContent,/Preview ready/);
  const result=w.document.getElementById('resultCanvas');assert.equal(result.width,256);assert.ok(backing(result).getContext('2d').getImageData(120,120,1,1).data[3]>0);
  assert.equal(w.document.getElementById('resultsSection').style.display,'block');
  const pixels=()=>Buffer.from(backing(result).getContext('2d').getImageData(0,0,256,256).data);
  const balanced=pixels();
  const lipArea=landmarks=>{
    const ids=[61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146];
    return Math.abs(ids.reduce((sum,id,i)=>{const next=landmarks[ids[(i+1)%ids.length]],p=landmarks[id];return sum+p.x*next.y-next.x*p.y;},0))/2;
  };
  w.testLipArea=lipArea;
  assert.ok(lipArea(w.inspectTestResult().simulationResults.landmarksByLevel.balanced)>lipArea(landmarks)*1.02, 'Classic Balanced must grow lip area after the Precision anatomy/tissue path');
  assert.match(w.document.getElementById('resultStateLabel')?.textContent||w.inspectTestResult().selectedLevel,/balanced/i);

  w.document.querySelector('[data-level="enhanced"]').click();
  assert.notDeepEqual(pixels(),balanced,'Intensity buttons must display distinct rendered images');
  w.document.getElementById('showOriginalButton').click();
  assert.deepEqual(pixels(),Buffer.from(backing(canvas).getContext('2d').getImageData(0,0,256,256).data),'Original control must display the actual captured image');
 }finally{w.close();}
});
