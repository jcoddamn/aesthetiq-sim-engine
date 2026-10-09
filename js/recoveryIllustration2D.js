// Image-space recovery illustration. Not a clinical prediction.
// Does not draw injuries, bruises, wounds or guaranteed timelines.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function renderRecoveryIllustration(original,finalCanvas,stage,procedure){
 if(!original||!finalCanvas)return finalCanvas;
 const canvas=document.createElement("canvas");
 canvas.width=original.width;canvas.height=original.height;
 const ctx=canvas.getContext("2d");if(!ctx)return finalCanvas;
 const progress=clamp(Number(stage?.resultProgress)??1,0,1);
 ctx.drawImage(original,0,0);
 ctx.save();ctx.globalAlpha=progress;ctx.drawImage(finalCanvas,0,0);ctx.restore();
 // Deliberately avoid fabricating patient-specific swelling or bruising.
 // A tiny temporary color cast is an optional illustrative visual cue for
 // superficial skin recovery; never applied to structural surgery or fillers.
 const skin=new Set(["chemical-peel","laser-resurfacing","co2-laser","microneedling","rf-microneedling","ipl"]);
 if(skin.has(procedure)&&stage?.id==="immediate"){
  ctx.save();ctx.globalCompositeOperation="soft-light";
  ctx.fillStyle="rgba(220,100,100,0.035)";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.restore();
 }
 return canvas;
}
