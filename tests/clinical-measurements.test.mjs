import test from 'node:test';
import assert from 'node:assert/strict';
import {procedures} from '../js/procedureData.js';
import {CLINICAL_METRICS,PROCEDURE_MEASUREMENTS,MEASUREMENT_SOURCES} from '../js/clinicalMeasurementRegistry.js';
import {measureGeometry,measureDensity,colorDifference76,compareClinicalMeasurements} from '../js/clinicalMeasurements.js';
const calibration={referenceId:'synthetic-ruler',samePlaneConfirmed:true,referencePixels:100,referenceMm:10};
const photo=(operation,points)=>({operation,points,space:'image_pixels',calibration});
const scan=(operation,points,extra={})=>({operation,points,space:'metric_3d_mm',calibration:{referenceId:'synthetic-scan',metricScaleVerified:true},...extra});
const observation=(metricId='upperVermilion',value=5)=>({metricId,value,unit:CLINICAL_METRICS[metricId].unit,method:CLINICAL_METRICS[metricId].methods[0],region:'upper-lip',side:'midline',expression:'rest',view:'front',protocolId:'synthetic-v1',calibrationId:'synthetic-ruler'});
const pair=()=>({schemaVersion:1,procedure:'lip-filler',caseContext:{caseId:'synthetic-1',cohortId:'test',techniqueId:'test',adultConfirmed:true,samePersonConfirmed:true,authorizedUse:true,captureMatched:true,isolatedProcedureConfirmed:true},followupDays:90,before:[observation()],after:[observation('upperVermilion',6)]});
test('all 54 catalog procedures have internally valid measurement requirements',()=>{
 assert.equal(procedures.length,54);assert.deepEqual(Object.keys(PROCEDURE_MEASUREMENTS).sort(),procedures.map(p=>p.id).sort());
 for(const p of Object.values(PROCEDURE_MEASUREMENTS)){assert.ok(p.metrics.length);assert.equal(p.clinicalValidationComplete,false);for(const id of p.metrics)assert.ok(CLINICAL_METRICS[id],id);for(const s of p.sources)assert.ok(MEASUREMENT_SOURCES[s]);}
});
test('physical distances, angles, ratios and areas use calibrated scale',()=>{
 assert.equal(measureGeometry(photo('distance',[[0,0],[30,40]])).value,5);
 assert.equal(measureGeometry(photo('angle',[[10,0],[0,0],[0,10]])).value,90);
 assert.equal(measureGeometry(photo('ratio',[[0,0],[20,0],[0,0],[10,0]])).value,2);
 const area=measureGeometry(photo('area',[[0,0],[20,0],[20,10],[0,10]]));assert.equal(area.value,2);assert.equal(area.unit,'mm2');
 assert.throws(()=>measureGeometry({...photo('distance',[[0,0],[1,1]]),calibration:{}}),/scale/);
 assert.throws(()=>measureGeometry(photo('ratio',[[0,0],[1,1],[0,0],[0,0]])),/denominator/);
 assert.throws(()=>measureGeometry(photo('area',[[0,0],[10,10],[0,10],[10,0]])),/self/);
});
test('circumference uses the complete planar section and converts mm to cm',()=>{
 const p=[[0,0,0],[10,0,0],[10,10,0],[0,10,0]];
 assert.equal(measureGeometry(scan('circumference',p,{closedSectionConfirmed:true})).value,4);
 assert.throws(()=>measureGeometry(scan('circumference',p)),/complete/);
 assert.throws(()=>measureGeometry(scan('circumference',p.map((v,i)=>i===3?[0,10,2]:v),{closedSectionConfirmed:true})),/planar/);
 assert.throws(()=>measureGeometry(scan('circumference',[p[0],p[2],p[1],p[3]],{closedSectionConfirmed:true})),/self/);
});
test('closed mesh volume is translation invariant and rejects missing geometry',()=>{
 const p=[[0,0,0],[10,0,0],[0,10,0],[0,0,10]],triangles=[[0,2,1],[0,1,3],[0,3,2],[1,2,3]];
 const options={triangles,closureProtocolConfirmed:true,nonSelfIntersectingMeshConfirmed:true};
 for(const points of [p,p.map(v=>v.map(x=>x+100000))])assert.ok(Math.abs(measureGeometry(scan('volume',points,options)).value-1/6)<1e-12);
 assert.throws(()=>measureGeometry(scan('volume',p,{...options,triangles:triangles.slice(1)})),/mesh/);
 assert.throws(()=>measureGeometry(scan('volume',p,{...options,triangles:[...triangles.slice(0,3),[1,3,2]]})),/oriented/);
 assert.throws(()=>measureGeometry(scan('volume',p,{...options,nonSelfIntersectingMeshConfirmed:false})),/self/);
});
test('density and calibrated Lab retain distinct units',()=>{
 assert.deepEqual(measureDensity({count:80,areaCm2:2,kind:'hair'}),{value:40,unit:'hairs/cm2'});
 assert.equal(measureDensity({count:40,areaCm2:2,kind:'follicular_unit'}).unit,'FU/cm2');
 assert.throws(()=>measureDensity({count:1,areaCm2:0,kind:'hair'}));
 assert.equal(colorDifference76([50,0,0],[50,3,4]),5);assert.throws(()=>colorDifference76([255,0,0],[0,0,0]));
});
test('observed comparisons preserve units, missing endpoints and no calibration claim',()=>{
 const r=compareClinicalMeasurements(pair());assert.equal(r.results[0].delta,1);assert.equal(r.results[0].relativeChangePercent,20);assert.equal(r.status,'partial_measurements');assert.ok(r.missingMetrics.includes('regionalVolume'));assert.equal(r.automaticCalibrationApplied,false);assert.equal(r.clinicalValidationComplete,false);
 const p=pair();p.before[0].value=0;assert.equal(compareClinicalMeasurements(p).results[0].relativeChangePercent,null);
});
test('incompatible methods, regions and protocol versions cannot be pooled',()=>{
 const p=pair();p.after[0].protocolId='other';assert.equal(compareClinicalMeasurements(p).results[0].status,'incompatible_protocol');
 p.after[0]=observation('upperVermilion',6);p.after[0].side='left';assert.ok(compareClinicalMeasurements(p).results.every(r=>r.status==='missing_pair'));
 p.after[0].unit='cm';assert.throws(()=>compareClinicalMeasurements(p),/Unit/);
 p.after=[observation(),observation()];assert.throws(()=>compareClinicalMeasurements(p),/Duplicate/);
 p.after=[observation('regionalVolume',2)];p.after[0].method='calibrated_photo';assert.throws(()=>compareClinicalMeasurements(p),/Method/);
});
test('context and score/color definitions are required',()=>{
 const p=pair();p.caseContext.adultConfirmed=false;assert.throws(()=>compareClinicalMeasurements(p),/adult/);
 const c=pair();c.procedure='teeth-whitening';const o={...observation('toothColor',[50,0,0]),illuminant:'D65',observer:'2deg'};c.before=[o];c.after=[{...o,value:[50,3,4]}];
 assert.equal(compareClinicalMeasurements(c).results[0].deltaUnit,'deltaE76');c.after[0].illuminant='other';assert.equal(compareClinicalMeasurements(c).results[0].status,'incompatible_protocol');
 const s=pair();s.procedure='breast-lift';s.before=[observation('ptosis',2)];s.after=[];assert.throws(()=>compareClinicalMeasurements(s),/scale/);
});
