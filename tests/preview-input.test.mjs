import test from 'node:test';
import assert from 'node:assert/strict';
import {previewDimensions} from '../js/previewInput.js';
test('phone photos are bounded before face detection and multi-pass rendering',()=>{
 assert.deepEqual(previewDimensions(4032,3024),{width:1200,height:900});
 assert.deepEqual(previewDimensions(3024,4032),{width:900,height:1200});
 assert.deepEqual(previewDimensions(640,480),{width:640,height:480});
 assert.throws(()=>previewDimensions(0,480));assert.throws(()=>previewDimensions(Infinity,480));
});
test('a stalled photo detector times out and can be retried',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});let closed=0,instances=0;
 globalThis.window={FaceMesh:class{constructor(){instances++;}setOptions(){}onResults(fn){this.result=fn;}send(){return new Promise(()=>{});}close(){closed++;}}};
 const {detectFaceLandmarksFromImage}=await import('../js/mediapipeRunner.js?timeout-test');
 const pending=detectFaceLandmarksFromImage({width:1,height:1});const check=assert.rejects(pending,/timed out/);
 await assert.rejects(detectFaceLandmarksFromImage({width:1,height:1}),/already/);
 t.mock.timers.tick(20001);await check;await Promise.resolve();assert.equal(closed,1);
 const retry=detectFaceLandmarksFromImage({width:1,height:1});const checkedRetry=assert.rejects(retry,/timed out/);assert.equal(instances,2);t.mock.timers.tick(20001);await checkedRetry;
});
test('camera startup distinguishes unavailable hardware from denied permission',async()=>{
 globalThis.window={FaceMesh:class{setOptions(){}onResults(){}close(){}}};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:async()=>{throw Object.assign(Error('No camera'),{name:'NotFoundError'});}}}});
 const {startFaceTracking}=await import('../js/mediapipeRunner.js?camera-test');const statuses=[];
 await startFaceTracking({},()=>{},s=>statuses.push(s));assert.match(statuses.at(-1),/No camera found.*Upload Photo/);
});
