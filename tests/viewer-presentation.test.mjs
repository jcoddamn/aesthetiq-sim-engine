import test from 'node:test';
import assert from 'node:assert/strict';
import {viewerPresentation,framedCameraDistance} from '../js/viewerPresentation.js';
test('personalized faces do not attach generic ears and neck by default or claim accuracy percentages',()=>{
 const p=viewerPresentation({personalized:true,procedure:'lip-filler',poseCount:3});
 assert.equal(p.showContext,false);assert.equal(p.captureLabel,'3 capture angles · approximate depth');assert.match(p.note,/not a full-head/);assert.ok(!p.captureLabel.includes('%'));
 assert.equal(viewerPresentation({personalized:true,procedure:'lip-filler',showContext:true}).showContext,true);
});
test('ear and neck procedures explicitly retain schematic context',()=>{
 for(const procedure of ['otoplasty','neck-lift']){const p=viewerPresentation({personalized:true,procedure});assert.equal(p.showContext,true);assert.equal(p.contextRequired,true);assert.match(p.note,/generic reference/);}
});
test('portrait framing moves the camera out enough to retain the full model width',()=>{
 const input={width:16,height:20,depth:8,aspect:1};const normal=framedCameraDistance(input),portrait=framedCameraDistance({...input,aspect:.5});assert.ok(portrait>normal);
 const usableDistance=portrait-input.depth/2;assert.ok(2*usableDistance*Math.tan(40*Math.PI/360)*.5>input.width);
 assert.throws(()=>framedCameraDistance({...input,aspect:0}));
});
