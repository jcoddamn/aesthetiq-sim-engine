import {getMeasurementRequirements,CLINICAL_METRICS} from './clinicalMeasurementRegistry.js';
export function renderMeasurementCoverage(container,procedure){
 if(!container)return;
 container.replaceChildren();
 const spec=getMeasurementRequirements(procedure);if(!spec)return;
 const heading=document.createElement('strong');heading.textContent='Measurements behind this procedure';
 const note=document.createElement('p');note.textContent='This preview is not clinically calibrated. A photograph alone cannot measure tissue volume, treatment response or surgical suitability.';
 const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='View measurement requirements';
 const list=document.createElement('ul');
 for(const id of spec.metrics){const m=CLINICAL_METRICS[id],li=document.createElement('li');li.textContent=m.label+' ('+m.unit+') — '+m.definition;list.append(li);}
 const capture=document.createElement('p');capture.textContent='Required capture: '+spec.capture+'.';
 details.append(summary,capture,list);container.append(heading,note,details);
}
export function renderPreviewMeasurements(container,report,level){
 if(!container)return;container.replaceChildren();if(!report)return;
 const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Illustrated geometry';details.append(summary);
 const note=document.createElement('p');note.textContent='Ratios describe the underlying preview landmarks, not healed outcomes or physical volume. Recovery overlays are not measured.';details.append(note);
 const rows=report.levels?.[level];
 if(rows){const list=document.createElement('ul');for(const [key,m] of Object.entries(rows)){const li=document.createElement('li');li.textContent=key.replace(/([A-Z])/g,' $1')+': '+m.before.toFixed(3)+' → '+m.after.toFixed(3)+' (ratio)';list.append(li);}details.append(list);}
 else{const p=document.createElement('p');p.textContent='This preview does not supply the calibrated measurements this procedure requires.';details.append(p);}
 container.append(details);
}
