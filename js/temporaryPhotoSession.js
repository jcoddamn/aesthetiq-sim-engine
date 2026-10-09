// Invalidates in-flight work so Discard cannot be undone by an async callback.
export function createTemporaryPhotoSession(){
 let generation=0;
 const canvases=new Set();
 const erase=canvas=>{if(canvas){canvas.width=0;canvas.height=0;}};
 const assertCurrent=token=>{
  if(token!==generation)throw new DOMException("Temporary analysis discarded.","AbortError");
 };
 return {
  current:()=>generation,
  assertCurrent,
  track(canvas,token){
   if(token!==generation){erase(canvas);assertCurrent(token);}
   if(canvas)canvases.add(canvas);
   return canvas;
  },
  discard(){generation++;for(const c of canvases)erase(c);canvases.clear();}
 };
}
