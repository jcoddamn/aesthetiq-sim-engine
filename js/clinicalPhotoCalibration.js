// Compatibility entry point; shares the current procedure-specific metric gate.
import {compareProcedureLandmarks} from './procedureEvidenceComparison.js?v=4';
export function measureClinicalPhotoPair(before,after,procedure,{beforeImageSize,afterImageSize}={}){
 const report=compareProcedureLandmarks({procedure,beforeLandmarks:before,afterLandmarks:after,beforeImageSize,afterImageSize,
  simulatedLandmarksByLevel:{natural:after,balanced:after,enhanced:after}});
 const measurements=Object.fromEntries(Object.entries(report.measurements||{}).map(([key,absoluteChange])=>[key,{absoluteChange}]));
 return {procedure,measurementProtocol:report.measurementProtocol,measurements,warnings:report.warnings||[],
  comparable:report.status==='comparison_available',status:report.status,reason:report.reason,
  clinicalValidationComplete:false,disclaimer:'Descriptive normalized 2D changes only; unsupported procedures require additional measurements.'};
}
