// Local research aggregation. Counts pseudonymous cases, never report files.
// Twenty is an internal review floor, not a clinical validation threshold.
import {COMPARISON_LEVELS, COMPARISON_VERSION, METRIC_GROUPS} from "./procedureEvidenceComparison.js?v=3";
const finite=Number.isFinite;
const median=values=>{
 const a=values.filter(finite).sort((x,y)=>x-y), k=Math.floor(a.length/2);
 return !a.length?null:a.length%2?a[k]:(a[k-1]+a[k])/2;
};
const token=value=>typeof value==="string"&&/^[a-zA-Z0-9_-]{1,80}$/.test(value);
const contexts=["cohortId","treatmentGoal","techniqueId","followupWindow","simulationConfigId"];
export const FOLLOWUP_WINDOWS=Object.freeze(["immediate","1-4-weeks","5-12-weeks","13-26-weeks","over-26-weeks"]);
export function summarizeCalibrationEvidence(records,{minimumCases=20}={}){
 if(!Array.isArray(records))throw Error("Expected an array of comparison reports.");
 if(!Number.isInteger(minimumCases)||minimumCases<20)throw Error("The research review floor cannot be lower than 20 independent cases.");
 const result={minimumCases,acceptedReports:0,excludedReports:[],groups:[],calibrationApplied:false,
  caveat:"Self-attested case metadata is not proof of independence or consent. Expert provenance review and independent holdout evaluation are still required."};
 const splitsByCase=new Map(), seenCases=new Set(), seenMeasurements=new Set(), groups=new Map();
 for(const r of records){
  if(!token(r?.caseContext?.caseId)||!token(r?.caseContext?.cohortId))continue;
  const key=JSON.stringify([r.caseContext.cohortId,r.caseContext.caseId]);
  if(!splitsByCase.has(key))splitsByCase.set(key,new Set());
  splitsByCase.get(key).add(r.caseContext.split);
 }
 for(const [index,record] of records.entries()){
  const c=record?.caseContext, metrics=METRIC_GROUPS[record?.procedure], reasons=[];
  if(record?.schemaVersion!==COMPARISON_VERSION||record?.measurementProtocol!=="square_pixel_eye_aligned_2d_v2")reasons.push("incompatible_measurement_protocol");
  if(record?.status!=="comparison_available"||!Array.isArray(record?.warnings)||record.warnings.length)reasons.push("comparison_not_ready");
  if(!c||!["caseId",...contexts].every(k=>token(c[k]))||
     !FOLLOWUP_WINDOWS.includes(c.followupWindow)||!["development","holdout"].includes(c.split))reasons.push("missing_case_context");
  if(!c||!["adultConfirmed","samePersonConfirmed","isolatedProcedureConfirmed","standardizedCaptureConfirmed","referenceLandmarksVisible","imageUseAuthorized"].every(k=>c[k]===true))reasons.push("case_review_incomplete");
  if(!metrics?.length||!metrics.every(m=>finite(record.measurements?.[m])&&
     COMPARISON_LEVELS.every(l=>finite(record.simulated?.[l]?.[m]))))reasons.push("incomplete_paired_metrics");
  const patientKey=c?JSON.stringify([c.cohortId,c.caseId]):null;
  if(splitsByCase.get(patientKey)?.size>1)reasons.push("case_shared_across_development_and_holdout");
  const caseKey=JSON.stringify([patientKey,record?.procedure]);
  if(seenCases.has(caseKey))reasons.push("repeated_case");
  const signature=metrics?.length?JSON.stringify([record.procedure,metrics.map(m=>[
   record.measurements?.[m],...COMPARISON_LEVELS.map(l=>record.simulated?.[l]?.[m])])]):null;
  if(signature&&seenMeasurements.has(signature))reasons.push("identical_measurements_require_review");
  if(reasons.length){result.excludedReports.push({index,reasons});continue;}
  seenCases.add(caseKey);seenMeasurements.add(signature);result.acceptedReports++;
  const key=JSON.stringify([record.procedure,...contexts.map(k=>c[k]),c.split]);
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(record);
 }
 for(const cases of groups.values()){
  const first=cases[0], context=first.caseContext, metricSummary={};
  for(const name of METRIC_GROUPS[first.procedure]){
   const residuals=cases.map(r=>r.simulated.balanced[name]-r.measurements[name]);
   metricSummary[name]={pairedCases:cases.length,
    medianObservedDelta:median(cases.map(r=>r.measurements[name])),
    medianNaturalDelta:median(cases.map(r=>r.simulated.natural[name])),
    medianBalancedDelta:median(cases.map(r=>r.simulated.balanced[name])),
    medianEnhancedDelta:median(cases.map(r=>r.simulated.enhanced[name])),
    medianBalancedResidual:median(residuals),
    medianAbsoluteBalancedResidual:median(residuals.map(Math.abs))};
  }
  const eligible=context.split==="development"&&cases.length>=minimumCases;
  result.groups.push({procedure:first.procedure,...Object.fromEntries(contexts.map(k=>[k,context[k]])),
   split:context.split,independentCases:cases.length,eligibleForExpertReview:eligible,
   status:context.split==="holdout"?"holdout_evaluation_only":eligible?"expert_provenance_review_required":"insufficient_independent_cases",
   metrics:metricSummary,calibrationApplied:false,clinicalValidationComplete:false});
 }
 return result;
}
