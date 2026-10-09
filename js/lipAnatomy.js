// Anatomy descriptors for preview weighting, not clinical targets.
// Vermilion thickness excludes the opening between the lips.
const fallback=()=>({upperRatio:.45,lowerRatio:.55,fullness:.18,cupidStrength:.5,philtrumLength:0});
export function getLipProfile(landmarks,imageSize=null){
 if(!Array.isArray(landmarks)||landmarks.length<468)return fallback();
 const ids=[0,13,14,17,61,291,37,267,2];
 if(!ids.every(i=>Number.isFinite(landmarks[i]?.x)&&Number.isFinite(landmarks[i]?.y)))return fallback();
 const aspect=Number.isFinite(imageSize?.width)&&Number.isFinite(imageSize?.height)&&imageSize.width>0&&imageSize.height>0
  ?imageSize.width/imageSize.height:1;
 const point=i=>({x:landmarks[i].x*aspect,y:landmarks[i].y});
 const left=point(61),right=point(291),dx=right.x-left.x,dy=right.y-left.y;
 const width=Math.hypot(dx,dy);
 if(width<1e-6)return fallback();
 const nx=-dy/width,ny=dx/width;
 const height=(a,b)=>{const p=point(a),q=point(b);return Math.abs((p.x-q.x)*nx+(p.y-q.y)*ny);};
 const upper=height(0,13),lower=height(17,14),total=upper+lower;
 const peak=point(0),a=point(37),b=point(267);
 const cupidDepth=Math.abs((peak.x-(a.x+b.x)/2)*nx+(peak.y-(a.y+b.y)/2)*ny);
 return {
  upperRatio:total>1e-6?upper/total:.45,
  lowerRatio:total>1e-6?lower/total:.55,
  fullness:total/width,
  cupidStrength:Math.max(0,Math.min(1,upper>1e-6?cupidDepth/upper:0)),
  philtrumLength:height(2,0)
 };
}
