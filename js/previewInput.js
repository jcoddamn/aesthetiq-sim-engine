// Keep multi-pass previews within a bounded canvas budget on mobile devices.
export const MAX_PREVIEW_EDGE = 1200;
export function previewDimensions(width,height){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw Error('The image has no usable dimensions.');
 const scale=Math.min(1,MAX_PREVIEW_EDGE/Math.max(width,height));
 return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
export function preparePreviewSource(source){
 const size=previewDimensions(source.naturalWidth||source.videoWidth||source.width,source.naturalHeight||source.videoHeight||source.height);
 const canvas=document.createElement('canvas');canvas.width=size.width;canvas.height=size.height;
 const context=canvas.getContext('2d');if(!context)throw Error('Image processing is unavailable in this browser.');
 context.drawImage(source,0,0,size.width,size.height);return canvas;
}
