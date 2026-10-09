import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {standardizePhotoLandmarks} from '../js/researchPhotoGeometry.js';
import {measureFaceMorphometrics} from '../js/faceMorphometrics.js';
import {compareProcedureLandmarks, METRIC_GROUPS} from '../js/procedureEvidenceComparison.js';
import {summarizeCalibrationEvidence} from '../js/evidenceCalibrationReview.js';
import {auditEvidenceReadiness} from '../js/evidenceReadinessAudit.js';
import {createTemporaryPhotoSession} from '../js/temporaryPhotoSession.js';
import {procedures} from '../js/procedureData.js';

// Synthetic points, never a patient's face or clinical outcome.
function face(){
 const l=Array.from({length:468},()=>({x:.5,y:.5,z:0}));
 const coordinates={33:[.3,.35],263:[.7,.35],234:[.2,.5],454:[.8,.5],1:[.5,.5],
  133:[.4,.35],362:[.6,.35],10:[.5,.1],152:[.5,.9],61:[.35,.7],291:[.65,.7],
  0:[.5,.65],13:[.5,.68],17:[.5,.76],14:[.5,.72],37:[.45,.63],267:[.55,.63],
  129:[.44,.5],358:[.56,.5],168:[.5,.38],2:[.5,.55],172:[.3,.75],397:[.7,.75],
  159:[.33,.33],145:[.33,.38],386:[.67,.33],374:[.67,.38],105:[.33,.27],334:[.67,.27]};
 for(const [i,[x,y]] of Object.entries(coordinates))l[i]={x,y,z:0};
 return l;
}
const size={width:1000,height:1000};
function comparison(overrides={}){
 const before=face(), after=face();after[13].y+=.01;
 return compareProcedureLandmarks({procedure:'lip-filler',beforeLandmarks:before,afterLandmarks:after,
  beforeImageSize:size,afterImageSize:size,
  simulatedLandmarksByLevel:{natural:after,balanced:after,enhanced:after},...overrides});
}
function record(i=0,overrides={}){
 const r=comparison();
 // Distinct synthetic residuals let the test distinguish independent cases.
 r.measurements.upperVermilionToMouth+=i/10000;
 r.caseContext={caseId:`case-${i}`,cohortId:'study-a',treatmentGoal:'volume',techniqueId:'protocol-a',
  followupWindow:'5-12-weeks',simulationConfigId:'default-v1',split:'development',
  adultConfirmed:true,samePersonConfirmed:true,isolatedProcedureConfirmed:true,
  standardizedCaptureConfirmed:true,referenceLandmarksVisible:true,imageUseAuthorized:true,...overrides};
 return r;
}
test('cross-axis lip ratios are invariant to image canvas proportions',()=>{
 const a=face(), wide=a.map(p=>({...p,x:p.x/2}));
 const x=measureFaceMorphometrics(standardizePhotoLandmarks(a,size).points);
 const y=measureFaceMorphometrics(standardizePhotoLandmarks(wide,{width:2000,height:1000}).points);
 for(const k of Object.keys(x))assert.ok(Math.abs(x[k]-y[k])<1e-12,k);
});
test('rotating a photo preserves eye-aligned ratios',()=>{
 const theta=.1,c=Math.cos(theta),s=Math.sin(theta);
 const rotated=face().map(p=>({...p,x:p.x*c-p.y*s,y:p.x*s+p.y*c}));
 const x=measureFaceMorphometrics(standardizePhotoLandmarks(face(),size).points);
 const y=measureFaceMorphometrics(standardizePhotoLandmarks(rotated,size).points);
 for(const k of Object.keys(x))assert.ok(Math.abs(x[k]-y[k])<1e-12,k);
 assert.equal(comparison({afterLandmarks:rotated}).status,'alignment_review_required');
});
test('missing image sizes, corrupt points and collapsed eye references are rejected',()=>{
 assert.throws(()=>comparison({beforeImageSize:undefined}),/width and height/);
 const l=face();l[13].x=NaN;assert.throws(()=>comparison({afterLandmarks:l}),/finite/);
 const bad=face();bad[263]=bad[33];assert.throws(()=>standardizePhotoLandmarks(bad,size),/degenerate/);
});
test('missing output levels cannot be reported as a completed comparison',()=>{
 assert.equal(comparison({simulatedLandmarksByLevel:{natural:face()}}).status,'insufficient_metrics_or_simulations');
});
test('all 17 facial procedure comparisons produce finite ratios with valid inputs',()=>{
 for(const procedure of Object.keys(METRIC_GROUPS))assert.equal(comparison({procedure}).status,'comparison_available',procedure);
});
test('twenty complete independent development cases reach expert review only',()=>{
 const s=summarizeCalibrationEvidence(Array.from({length:20},(_,i)=>record(i)));
 assert.equal(s.acceptedReports,20);assert.equal(s.groups[0].eligibleForExpertReview,true);
 assert.equal(s.groups[0].clinicalValidationComplete,false);assert.equal(s.calibrationApplied,false);
 assert.equal(s.groups[0].metrics.upperVermilionToMouth.pairedCases,20);
});
test('repeated exports never inflate the independent case count',()=>{
 const s=summarizeCalibrationEvidence(Array.from({length:20},()=>record(0)));
 assert.equal(s.acceptedReports,1);assert.equal(s.excludedReports.length,19);
 assert.equal(s.groups[0].eligibleForExpertReview,false);
});
test('renaming identical reports is flagged for review',()=>{
 const a=record(),b=structuredClone(a);b.caseContext.caseId='different';
 assert.equal(summarizeCalibrationEvidence([a,b]).acceptedReports,1);
});
test('conflicting development and holdout labels exclude both copies',()=>{
 const a=record(),b=record(0,{split:'holdout'});
 const s=summarizeCalibrationEvidence([a,b]);assert.equal(s.acceptedReports,0);
 assert.ok(s.excludedReports.every(x=>x.reasons.includes('case_shared_across_development_and_holdout')));
});
test('holdout-only cases never qualify for calibration',()=>{
 const s=summarizeCalibrationEvidence(Array.from({length:20},(_,i)=>record(i,{split:'holdout'})));
 assert.equal(s.groups[0].status,'holdout_evaluation_only');assert.equal(s.groups[0].eligibleForExpertReview,false);
});
test('different treatment goals and timing cannot be pooled toward the review floor',()=>{
 const cases=Array.from({length:20},(_,i)=>record(i,{treatmentGoal:i<10?'volume':'shape'}));
 const s=summarizeCalibrationEvidence(cases);assert.equal(s.groups.length,2);
 assert.ok(s.groups.every(g=>!g.eligibleForExpertReview));
 cases[0].caseContext.followupWindow='immediate';assert.equal(summarizeCalibrationEvidence(cases).groups.length,3);
});
test('legacy, unreviewed and incomplete measurements are excluded with reasons',()=>{
 const old=record();delete old.schemaVersion;
 const missing=record(1);delete missing.simulated.balanced;
 const unreviewed=record(2,{adultConfirmed:false});
 const s=summarizeCalibrationEvidence([old,missing,unreviewed]);assert.equal(s.acceptedReports,0);
 assert.equal(s.excludedReports.length,3);
 assert.throws(()=>summarizeCalibrationEvidence([],{minimumCases:1}),/20/);
});
test('discard invalidates work and erases canvases arriving after cancellation',()=>{
 const s=createTemporaryPhotoSession(),token=s.current(),canvas={width:100,height:100};
 s.track(canvas,token);s.discard();assert.equal(canvas.width,0);
 const late={width:100,height:100};assert.throws(()=>s.track(late,token),{name:'AbortError'});
 assert.equal(late.height,0);assert.throws(()=>s.assertCurrent(token),{name:'AbortError'});
});
test('catalog audit covers all 54 procedures and no clinical validation is invented',async()=>{
 const matrix=JSON.parse(await readFile(new URL('../research/all_54_procedure_evidence_matrix.json',import.meta.url)));
 assert.deepEqual(matrix.procedures.map(p=>p.procedure_id).sort(),procedures.map(p=>p.id).sort());
 const s=auditEvidenceReadiness(matrix);assert.equal(s.valid,true);assert.equal(s.totalProcedures,54);
 assert.equal(s.articlesWithVerifiedLicense,8);assert.equal(s.readyForExpertCalibrationReview,0);
 const row=matrix.procedures[0];Object.assign(row,{figure_reuse_permission:'confirmed',measured_real_before_after_pairs:20,actual_app_simulation_compared_to_real_pairs:true,clinically_calibrated:true});
 const bad=auditEvidenceReadiness(matrix);assert.equal(bad.valid,false);assert.equal(bad.readyForExpertCalibrationReview,0);
});

test('lip fullness measures vermilion and is unchanged by opening the mouth',async()=>{
 const {getLipProfile}=await import('../js/lipAnatomy.js');
 const closed=face();closed[14].y=closed[13].y;closed[17].y=closed[14].y+.04;
 const open=structuredClone(closed);open[14].y+=.05;open[17].y+=.05;
 const a=getLipProfile(closed,size),b=getLipProfile(open,size);
 assert.ok(Math.abs(a.fullness-b.fullness)<1e-12);
 assert.ok(a.fullness>0);assert.ok(Math.abs(a.upperRatio+a.lowerRatio-1)<1e-12);
 const wide=closed.map(p=>({...p,x:p.x/2}));
 assert.ok(Math.abs(a.fullness-getLipProfile(wide,{width:2000,height:1000}).fullness)<1e-12);
});
test('lip product settings are initialized before use for every style and intensity',async()=>{
 const {warpLipFiller}=await import('../js/faceWarp.js');
 const {LIP_STYLE_PROFILES}=await import('../js/lipProfiles.js');
 const original=face(),copy=structuredClone(original);
 for(const style of Object.keys(LIP_STYLE_PROFILES))for(const level of ['natural','balanced','enhanced']){
  const output=warpLipFiller(original,level,1,null,style,'provider','balanced',size);
  assert.equal(output.length,468);
  assert.ok(output.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z)),`${style}/${level}`);
 }
 assert.deepEqual(original,copy);
});
