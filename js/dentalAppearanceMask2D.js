// Experimental dental appearance segmentation within MediaPipe mouth boundary.
// Thresholding estimates bright tooth pixels; does NOT identify actual tooth anatomy.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function refineDentalAppearanceMask(source,mask,procedure){
 if(!source||!mask||!["veneers","dental-bonding","teeth-whitening","smile-makeover","gum-contouring"].includes(procedure))return mask;
 const w=mask.width,h=mask.height;
 if(w*h>2500000)return mask;
 const ctx=source.getContext("2d",{willReadFrequently:true});
 const m=mask.getContext("2d",{willReadFrequently:true});
 if(!ctx||!m)return mask;
 const img=ctx.getImageData(0,0,w,h),input=m.getImageData(0,0,w,h);
 const output=document.createElement("canvas");output.width=w;output.height=h;
 const out=output.getContext("2d");if(!out)return mask;
 const d=out.createImageData(w,h);
 for(let i=0;i<d.data.length;i+=4){
  const alpha=input.data[i+3]/255;
  if(alpha<.02)continue;
  const r=img.data[i],g=img.data[i+1],b=img.data[i+2];
  const brightness=.2126*r+.7152*g+.0722*b;
  const spread=Math.max(r,g,b)-Math.min(r,g,b);
  // Dental enamel tends to be brighter and less saturated than adjacent gums.
  // Preserve some low-confidence regions instead of creating hard white cutouts.
  const tooth=clamp((brightness-65)/105,0,1)*clamp((110-spread)/90,0,1);
  const confidence=procedure==="gum-contouring"?1-tooth:tooth;
  const value=Math.round(255*alpha*(.12+.88*confidence));
  d.data[i]=255;d.data[i+1]=255;d.data[i+2]=255;d.data[i+3]=value;
 }
 out.putImageData(d,0,0);
 return output;
}
