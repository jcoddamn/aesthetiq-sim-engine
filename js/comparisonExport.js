// Export a matched pair from the same frozen capture, never separate screenshots.
export function createComparisonCanvas(original,result,label){
 if(!original||!result||original.width!==result.width||original.height!==result.height)throw Error('Comparison requires matching capture dimensions.');
 const canvas=document.createElement('canvas'),gap=16,header=76;
 canvas.width=original.width*2+gap;canvas.height=original.height+header;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Comparison could not be drawn.');
 ctx.fillStyle='#13121c';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='#ffffff';ctx.font='18px sans-serif';
 ctx.fillText('Original',12,26);ctx.fillText('Simulation',original.width+gap+12,26);
 ctx.font='13px sans-serif';ctx.fillText(label,12,52,canvas.width-24);
 ctx.drawImage(original,0,header);ctx.drawImage(result,original.width+gap,header);
 return canvas;
}
