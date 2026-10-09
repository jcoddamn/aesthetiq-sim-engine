import {procedures} from './procedureData.js?v=3';
import {CLINICAL_METRICS,MEASUREMENT_SOURCES,getMeasurementRequirements} from './clinicalMeasurementRegistry.js';
import {renderMeasurementCoverage} from './measurementCoverageUI.js';
import {measureGeometry,measureDensity,colorDifference76,compareClinicalMeasurements} from './clinicalMeasurements.js';
if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname)){
 document.body.textContent='Developer-only measurement tool. Run in an isolated local development environment.';
 throw Error('Measurement workbench is disabled on public hosts.');
}
const $=id=>document.getElementById(id);let report=null;
for(const p of procedures){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;$('procedure').append(o);}
function template(){
 const procedure=$('procedure').value,spec=getMeasurementRequirements(procedure);
 const observations=spec.metrics.map(metricId=>{const d=CLINICAL_METRICS[metricId];return {metricId,value:null,unit:d.unit,method:d.methods[0],region:'',side:'',expression:'',view:'',protocolId:'',calibrationId:'',...(d.quantity==='score'?{scaleId:'',scaleMin:null,scaleMax:null}:{}),...(d.quantity==='color'?{illuminant:'',observer:''}:{})};});
 return {schemaVersion:1,procedure,caseContext:{caseId:'',cohortId:'',techniqueId:'',adultConfirmed:false,samePersonConfirmed:false,authorizedUse:false,captureMatched:false,isolatedProcedureConfirmed:false},followupDays:null,before:observations,after:structuredClone(observations)};
}
function invalidate(){report=null;$('export').disabled=true;$('report').textContent='No current comparison.';}
function update(){
 const spec=getMeasurementRequirements($('procedure').value);renderMeasurementCoverage($('requirements'),spec.id);$('sources').replaceChildren();
 for(const key of spec.sources){const source=MEASUREMENT_SOURCES[key],li=document.createElement('li'),a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener';a.textContent=source.scope;li.append(a);$('sources').append(li);}
 if(!spec.sources.length){const li=document.createElement('li');li.textContent='Proposed endpoints: clinician review and procedure-specific references remain required.';$('sources').append(li);}
 invalidate();
}
function download(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function parse(id){const raw=$(id).value;if(raw.length>2000000)throw Error('Input exceeds the 2 MB limit.');return JSON.parse(raw);}
$('procedure').onchange=update;
$('template').onclick=()=>{$('observations').value=JSON.stringify(template(),null,2);invalidate();};
$('downloadTemplate').onclick=()=>download(template(),'aesthetiq-'+$('procedure').value+'-measurement-template.json');
$('observations').oninput=invalidate;
$('compare').onclick=()=>{invalidate();try{const input=parse('observations');if(input.procedure!==$('procedure').value)throw Error('Select the procedure declared in the observations.');report=compareClinicalMeasurements(input);$('report').textContent=JSON.stringify(report,null,2);$('export').disabled=false;}catch(e){$('report').textContent=e.message;}};
$('export').onclick=()=>{if(report)download(report,'aesthetiq-measurement-report.json');};
$('clear').onclick=()=>{$('observations').value='';$('geometry').value='';$('geometryReport').textContent='Cleared.';invalidate();};
function geometryTemplate(){
 const operation=$('operation').value;
 let value={operation,space:'image_pixels',calibration:{referenceId:'',samePlaneConfirmed:false,referencePixels:null,referenceMm:null},points:[]};
 if(['circumference','volume'].includes(operation))value={operation,space:'metric_3d_mm',calibration:{referenceId:'',metricScaleVerified:false},points:[],...(operation==='volume'?{triangles:[],closureProtocolConfirmed:false,nonSelfIntersectingMeshConfirmed:false}:{closedSectionConfirmed:false})};
 if(operation==='density')value={kind:'hair',count:null,areaCm2:null};
 if(operation==='color')value={before:[null,null,null],after:[null,null,null],calibratedCIELABConfirmed:false,matchedIlluminantObserverConfirmed:false};
 $('geometry').value=JSON.stringify(value,null,2);$('geometryReport').textContent='Enter calibrated data.';
}
$('operation').onchange=geometryTemplate;
$('geometry').oninput=()=>{$('geometryReport').textContent='Input changed; calculate again.';};
$('calculate').onclick=()=>{try{const input=parse('geometry'),op=$('operation').value;let result;
 if(op==='density')result=measureDensity(input);
 else if(op==='color'){if(input.calibratedCIELABConfirmed!==true||input.matchedIlluminantObserverConfirmed!==true)throw Error('Confirm calibrated CIELAB and matched illuminant/observer.');result={value:colorDifference76(input.before,input.after),unit:'deltaE76'};}
 else{if(input.operation!==op)throw Error('Select the operation declared in the geometry.');result=measureGeometry(input);}
 $('geometryReport').textContent=JSON.stringify(result,null,2);
 }catch(e){$('geometryReport').textContent=e.message;}};
update();geometryTemplate();
