// AesthetIQ offline calibration-review aggregation.
// Produces research suggestions only; never mutates simulation coefficients.
// Minimum 20 comparable, independently collected cases per procedure and goal.
const finite=Number.isFinite;
const median=values=>{
 const a=values.filter(finite).sort((x,y)=>x-y);
 if(!a.length)return null;
 const k=Math.floor(a.length/2);
 return a.length%2?a[k]:(a[k-1]+a[k])/2;
};
export function summarizeCalibrationEvidence(records,{minimumCases=20}={}){
 if(!Array.isArray(records))throw Error("Expected an array of comparison reports.");
 const groups=new Map();
 for(const record of records){
  if(record?.status!=="comparison_available"||!record.procedure||record.warnings?.length)continue;
  if(!groups.has(record.procedure))groups.set(record.procedure,[]);
  groups.get(record.procedure).push(record);
 }
 const result={minimumCases,procedures:{}};
 for(const [procedure,cases] of groups){
  const metrics={};
  const names=new Set(cases.flatMap(c=>Object.keys(c.measurements||{})));
  for(const name of names){
   const observed=cases.map(c=>c.measurements?.[name]).filter(finite);
   const natural=cases.map(c=>c.simulated?.natural?.[name]).filter(finite);
   const balanced=cases.map(c=>c.simulated?.balanced?.[name]).filter(finite);
   const enhanced=cases.map(c=>c.simulated?.enhanced?.[name]).filter(finite);
   if(!observed.length)continue;
   metrics[name]={
    sampleSize:observed.length,
    medianObservedDelta:median(observed),
    medianNaturalDelta:median(natural),
    medianBalancedDelta:median(balanced),
    medianEnhancedDelta:median(enhanced),
    medianBalancedResidual:median(cases.map(c=>{
     const a=c.measurements?.[name],b=c.simulated?.balanced?.[name];
     return finite(a)&&finite(b)?b-a:null;
    }))
   };
  }
  result.procedures[procedure]={
   cases:cases.length,
   eligibleForExpertReview:cases.length>=minimumCases,
   metrics,
   calibrationApplied:false,
   status:cases.length>=minimumCases?"expert_review_required":"insufficient_independent_cases",
   caveat:"No automatic coefficient adjustment. Must evaluate patient variation, technique, treatment type, camera calibration and independent holdout performance."
  };
 }
 return result;
}
