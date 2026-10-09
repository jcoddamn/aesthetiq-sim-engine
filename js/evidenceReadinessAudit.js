// AesthetIQ: research readiness gates for every procedure.
// This does NOT calibrate medical outcomes or authorize image reuse.
export function auditEvidenceReadiness(matrix){
 if(!Array.isArray(matrix?.procedures))throw Error("Missing procedure evidence matrix.");
 const seen=new Set(),issues=[],results=[];
 for(const p of matrix.procedures){
  if(!p.procedure_id||seen.has(p.procedure_id)){issues.push("Missing or duplicate procedure ID: "+p.procedure_id);continue;}
  seen.add(p.procedure_id);
  const count=value=>Number.isSafeInteger(value)&&value>=0;
  if(!count(p.measured_real_before_after_pairs)||!count(p.individual_patient_image_files_downloaded))issues.push("Invalid evidence counts: "+p.procedure_id);
  const actualPairs=count(p.measured_real_before_after_pairs)?p.measured_real_before_after_pairs:0;
  const images=count(p.individual_patient_image_files_downloaded)?p.individual_patient_image_files_downloaded:0;
  const hasFigurePermission=p.figure_reuse_permission==="confirmed";
  const metricDefined=!!p.target_measurement&&!!p.measurement_modality;
  const comparisons=p.actual_app_simulation_compared_to_real_pairs===true;
  const calibrated=p.clinically_calibrated===true;
  const eligible=hasFigurePermission&&actualPairs>=20&&comparisons&&metricDefined&&
   p.quantitative_compatibility==="validated_matched_metric_pipeline"&&
   p.independent_cases_verified===true&&p.adult_authorized_cases_verified===true&&
   p.procedure_attribution_verified===true&&p.holdout_separation_verified===true;
  if(calibrated&&!eligible){
   issues.push("Unsubstantiated calibration status: "+p.procedure_id);
  }
  results.push({
   procedure:p.procedure_id,
   modality:p.measurement_modality,
   targetMetric:p.target_measurement,
   metricDefined,
   candidateStudies:(p.article_license_candidate_sources||[]).length,
   figureReuseConfirmed:hasFigurePermission,
   imageFilesAcquired:images,
   pairedCasesMeasured:actualPairs,
   appComparedToRealPairs:comparisons,
   calibrationEligibleForExpertReview:eligible,
   clinicalValidationComplete:false,
   nextAction:p.next_action
  });
 }
 if(seen.size!==54)issues.push("Expected 54 distinct procedures; found "+seen.size);
 return {
  valid:issues.length===0,
  issues,
  totalProcedures:results.length,
  withMeasurementDefinitions:results.filter(x=>x.metricDefined).length,
  withArticleCandidates:results.filter(x=>x.candidateStudies>0).length,
  articlesWithVerifiedLicense:(matrix.open_license_studies||[]).filter(x=>x.article_license_verified===true).length,
  readyForExpertCalibrationReview:results.filter(x=>x.calibrationEligibleForExpertReview).length,
  clinicallyValidated:0,
  rows:results
 };
}
