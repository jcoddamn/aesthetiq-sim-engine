// Anatomical exclusions applied to procedure masks.
// Uses existing MediaPipe landmark contours, not true skin segmentation.
import {getMaskPolygons} from "./mediapipeMasks.js";
const EYES=["leftEye","rightEye"];
const INNER_MOUTH=["mouthInterior"];
const BROWS=["leftBrow","rightBrow"];
const EXCLUDE_EYES=new Set(["forehead-neuromodulator","glabella-neuromodulator","crows-feet-neuromodulator","under-eye-filler","cheek-filler","cheek-implants","facelift","mini-facelift","laser-resurfacing","chemical-peel","microneedling","rf-microneedling","ipl","co2-laser"]);
const EXCLUDE_MOUTH=new Set(["cheek-filler","cheek-implants","facelift","mini-facelift","laser-resurfacing","chemical-peel","microneedling","rf-microneedling","ipl","co2-laser","chin-filler","jawline-filler"]);
function paint(ctx,polygon){
 if(!polygon||polygon.length<3)return;
 ctx.beginPath();ctx.moveTo(polygon[0].x,polygon[0].y);
 for(let i=1;i<polygon.length;i++)ctx.lineTo(polygon[i].x,polygon[i].y);
 ctx.closePath();ctx.fill();
}
export function refineProcedureMask(mask,procedure,landmarks,mirrorX=false){
 if(!mask||!Array.isArray(landmarks)||landmarks.length<468)return mask;
 const names=[];
 if(EXCLUDE_EYES.has(procedure))names.push(...EYES);
 if(EXCLUDE_MOUTH.has(procedure))names.push(...INNER_MOUTH);
 if(procedure==="forehead-neuromodulator")names.push(...BROWS);
 if(!names.length)return mask;
 const out=document.createElement("canvas");out.width=mask.width;out.height=mask.height;
 const ctx=out.getContext("2d");if(!ctx)return mask;
 ctx.drawImage(mask,0,0);
 ctx.save();ctx.globalCompositeOperation="destination-out";ctx.fillStyle="#fff";
 for(const name of names){
  const polygons=getMaskPolygons(name,landmarks,out.width,out.height,mirrorX);
  for(const polygon of polygons)paint(ctx,polygon);
 }
 ctx.restore();
 return out;
}
