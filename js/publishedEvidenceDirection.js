// Research-only directional comparison with a published open-license adult cohort.
// NOT a clinical accuracy score, dosing rule, or automated calibration.
const sign=n=>Number.isFinite(n)?(Math.abs(n)<1e-8?"unchanged":n>0?"increase":"decrease"):"unavailable";
export function comparePublishedRhinoplastyDirection(landmarksByLevel,published){
 const before=published?.adult_only_summary;
 if(!before)throw Error("Published adult-only benchmark missing.");
 const output={
  source:published.provenance.source_url,
  procedure:"revision-rhinoplasty",
  published_cases:before.cases,
  expected_alar_width_direction:before.alar_width_direction,
  expected_tip_projection_direction:before.tip_projection_direction,
  warning:"Directional comparison only. Published side-view tip projection and 2D FaceMesh front-view metrics are not interchangeable.",
  coefficient_changes_applied:false,
  levels:{}
 };
 for(const [level,record] of Object.entries(landmarksByLevel||{})){
  const original=record?.original;
  const warped=record?.warped;
  if(!Array.isArray(original)||!Array.isArray(warped))continue;
  const measure=l=>{
   const a=l[129],b=l[358],left=l[133],right=l[362];
   if(!a||!b||!left||!right)return null;
   const denominator=Math.hypot(right.x-left.x,right.y-left.y);
   return denominator>1e-8?Math.hypot(a.x-b.x,a.y-b.y)/denominator:null;
  };
  const a=measure(original),b=measure(warped);
  const delta=Number.isFinite(a)&&Number.isFinite(b)?b-a:null;
  output.levels[level]={
   before_ratio:a,after_ratio:b,delta,
   direction:sign(delta),
   matches_published_direction:sign(delta)===before.alar_width_direction,
   side_view_tip_projection:"not_measured"
  };
 }
 return output;
}
