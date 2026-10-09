// Skin-only, luminance-guided detail preservation.
// This does not diagnose pigmentation, scarring or medical skin conditions.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function preserveSkinDetail(original,effect,mask,level="balanced",procedure=""){
 if(!original||!effect||!mask)return effect;
 const w=original.width,h=original.height;
 if(w*h>2600000)return effect; // avoid excessive mobile memory
 const a=original.getContext("2d",{willReadFrequently:true});
 const b=effect.getContext("2d",{willReadFrequently:true});
 const m=mask.getContext("2d",{willReadFrequently:true});
 if(!a||!b||!m)return effect;
 const src=a.getImageData(0,0,w,h),dst=b.getImageData(0,0,w,h),mat=m.getImageData(0,0,w,h);
 const output=document.createElement("canvas");output.width=w;output.height=h;
 const ctx=output.getContext("2d");if(!ctx)return effect;
 const intensity=level==="natural"?.13:level==="enhanced"?.27:.2;
 const isTone=["ipl","chemical-peel","laser-resurfacing","co2-laser"].includes(procedure);
 const factor=isTone?intensity*.65:intensity;
 const data=ctx.createImageData(w,h);
 data.data.set(dst.data);
 // Retain original high-frequency luminance while leaving low-frequency
 // color/tone changes from the treatment effect intact.
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
  const i=(y*w+x)*4,alpha=mat.data[i+3]/255;
  if(alpha<.05)continue;
  const aLum=.2126*src.data[i]+.7152*src.data[i+1]+.0722*src.data[i+2];
  let neighborhood=0;
  for(const off of [-w-1,-w,-w+1,-1,0,1,w-1,w,w+1]){
   const k=i+off*4;
   neighborhood+=.2126*src.data[k]+.7152*src.data[k+1]+.0722*src.data[k+2];
  }
  const detail=clamp(aLum-neighborhood/9,-14,14)*factor*alpha;
  for(let c=0;c<3;c++)data.data[i+c]=clamp(Math.round(dst.data[i+c]+detail),0,255);
 }
 ctx.putImageData(data,0,0);
 return output;
}
