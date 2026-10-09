import {FACE_TRIANGLES} from './faceTopology.js';
// =========================================================
// AESTHETIQ — FACE WARP RENDERER
// File: js/warpRenderer.js
// =========================================================

// ---------------------------------------------------------
// POINT HELPERS
// ---------------------------------------------------------

function isNormalizedPoint(point) {
  return (
    point &&
    Math.abs(point.x) <= 1.5 &&
    Math.abs(point.y) <= 1.5
  );
}

function toCanvasPoint(
  point,
  width,
  height
) {
  if (!point) {
    return null;
  }

  if (isNormalizedPoint(point)) {
    return {
      x: point.x * width,
      y: point.y * height
    };
  }

  return {
    x: point.x,
    y: point.y
  };
}

// ---------------------------------------------------------
// TRIANGLE HELPERS
// ---------------------------------------------------------

// Rendering connectivity must exist even when detector script globals do not.
// Never cache an empty mesh and silently return an unchanged image.
export function getFaceTriangles() {
  return FACE_TRIANGLES;
}

// ---------------------------------------------------------
// AFFINE TRANSFORM
// ---------------------------------------------------------

function getAffineTransform(
  sourceTriangle,
  targetTriangle
) {
  const [s0, s1, s2] =
    sourceTriangle;

  const [t0, t1, t2] =
    targetTriangle;

  const denominator =
    s0.x * (s1.y - s2.y) +
    s1.x * (s2.y - s0.y) +
    s2.x * (s0.y - s1.y);

  if (
    !Number.isFinite(denominator) ||
    Math.abs(denominator) < 0.00001
  ) {
    return null;
  }

  const a =
    (
      t0.x * (s1.y - s2.y) +
      t1.x * (s2.y - s0.y) +
      t2.x * (s0.y - s1.y)
    ) / denominator;

  const c =
    (
      t0.x * (s2.x - s1.x) +
      t1.x * (s0.x - s2.x) +
      t2.x * (s1.x - s0.x)
    ) / denominator;

  const e =
    (
      t0.x *
        (
          s1.x * s2.y -
          s2.x * s1.y
        ) +
      t1.x *
        (
          s2.x * s0.y -
          s0.x * s2.y
        ) +
      t2.x *
        (
          s0.x * s1.y -
          s1.x * s0.y
        )
    ) / denominator;

  const b =
    (
      t0.y * (s1.y - s2.y) +
      t1.y * (s2.y - s0.y) +
      t2.y * (s0.y - s1.y)
    ) / denominator;

  const d =
    (
      t0.y * (s2.x - s1.x) +
      t1.y * (s0.x - s2.x) +
      t2.y * (s1.x - s0.x)
    ) / denominator;

  const f =
    (
      t0.y *
        (
          s1.x * s2.y -
          s2.x * s1.y
        ) +
      t1.y *
        (
          s2.x * s0.y -
          s0.x * s2.y
        ) +
      t2.y *
        (
          s0.x * s1.y -
          s1.x * s0.y
        )
    ) / denominator;

  return {
    a,
    b,
    c,
    d,
    e,
    f
  };
}

// ---------------------------------------------------------
// TRIANGLE DRAWING
// ---------------------------------------------------------

function drawWarpedTriangle(
  context,
  sourceCanvas,
  sourceTriangle,
  targetTriangle
) {
  const transform =
    getAffineTransform(
      sourceTriangle,
      targetTriangle
    );

  if (!transform) {
    return;
  }

  // Overlap clipping edges by half a pixel to reduce antialiased seams.
  // Keep the affine transform anchored to the original target triangle.
  const cx=(targetTriangle[0].x+targetTriangle[1].x+targetTriangle[2].x)/3;
  const cy=(targetTriangle[0].y+targetTriangle[1].y+targetTriangle[2].y)/3;
  const clipTriangle=targetTriangle.map(point=>{
    const dx=point.x-cx,dy=point.y-cy;
    const distance=Math.hypot(dx,dy)||1;
    return {x:point.x+dx/distance*.45,y:point.y+dy/distance*.45};
  });
  context.save();
  context.setTransform(1,0,0,1,0,0);
  context.beginPath();
  context.moveTo(clipTriangle[0].x,clipTriangle[0].y);
  context.lineTo(clipTriangle[1].x,clipTriangle[1].y);
  context.lineTo(clipTriangle[2].x,clipTriangle[2].y);

  context.closePath();
  context.clip();

  context.setTransform(
    transform.a,
    transform.b,
    transform.c,
    transform.d,
    transform.e,
    transform.f
  );

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    sourceCanvas,
    0,
    0
  );

  context.restore();
}

// ---------------------------------------------------------
// MAIN RENDERER
// ---------------------------------------------------------

export function renderWarp(
  sourceCanvas,
  originalLandmarks,
  warpedLandmarks
) {
  if (
    !sourceCanvas ||
    !Array.isArray(originalLandmarks) ||
    !Array.isArray(warpedLandmarks)
  ) {
    return sourceCanvas;
  }

  if (
    originalLandmarks.length < 468 ||
    warpedLandmarks.length < 468
  ) {
    console.warn(
      "[AesthetIQ] Not enough landmarks for face warp."
    );

    return sourceCanvas;
  }

  const outputCanvas =
    document.createElement("canvas");

  outputCanvas.width =
    sourceCanvas.width;

  outputCanvas.height =
    sourceCanvas.height;

  const context =
    outputCanvas.getContext("2d");

  if (!context) {
    return sourceCanvas;
  }

  context.drawImage(
    sourceCanvas,
    0,
    0
  );

  const triangles =
    getFaceTriangles();

  if (triangles.length === 0) {
    return outputCanvas;
  }

  // Warp an exterior support ring first, so moving the face outline replaces
  // its old pixels instead of drawing a new outline over an unchanged face.
  const oval=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
  const sourceOval=oval.map(i=>toCanvasPoint(originalLandmarks[i],outputCanvas.width,outputCanvas.height));
  const targetOval=oval.map(i=>toCanvasPoint(warpedLandmarks[i],outputCanvas.width,outputCanvas.height));
  if(sourceOval.every(Boolean)&&targetOval.every(Boolean)){
    const center=sourceOval.reduce((p,v)=>({x:p.x+v.x/oval.length,y:p.y+v.y/oval.length}),{x:0,y:0});
    const outer=sourceOval.map(p=>({x:center.x+(p.x-center.x)*1.3,y:center.y+(p.y-center.y)*1.3}));
    for(let i=0;i<oval.length;i++){
      const j=(i+1)%oval.length;
      if(sourceOval[i].x===targetOval[i].x&&sourceOval[i].y===targetOval[i].y&&sourceOval[j].x===targetOval[j].x&&sourceOval[j].y===targetOval[j].y)continue;
      drawWarpedTriangle(context,sourceCanvas,[sourceOval[i],outer[i],outer[j]],[targetOval[i],outer[i],outer[j]]);
      drawWarpedTriangle(context,sourceCanvas,[sourceOval[i],outer[j],sourceOval[j]],[targetOval[i],outer[j],targetOval[j]]);
    }
  }

  triangles.forEach(
    ([first, second, third]) => {
      const sourceTriangle = [
        toCanvasPoint(
          originalLandmarks[first],
          outputCanvas.width,
          outputCanvas.height
        ),
        toCanvasPoint(
          originalLandmarks[second],
          outputCanvas.width,
          outputCanvas.height
        ),
        toCanvasPoint(
          originalLandmarks[third],
          outputCanvas.width,
          outputCanvas.height
        )
      ];

      const targetTriangle = [
        toCanvasPoint(
          warpedLandmarks[first],
          outputCanvas.width,
          outputCanvas.height
        ),
        toCanvasPoint(
          warpedLandmarks[second],
          outputCanvas.width,
          outputCanvas.height
        ),
        toCanvasPoint(
          warpedLandmarks[third],
          outputCanvas.width,
          outputCanvas.height
        )
      ];

      if (
        sourceTriangle.some(
          (point) => !point
        ) ||
        targetTriangle.some(
          (point) => !point
        )
      ) {
        return;
      }

      if(sourceTriangle.every((p,i)=>p.x===targetTriangle[i].x&&p.y===targetTriangle[i].y))return;

      drawWarpedTriangle(
        context,
        sourceCanvas,
        sourceTriangle,
        targetTriangle
      );
    }
  );

  context.setTransform(
    1,
    0,
    0,
    1,
    0,
    0
  );

  return outputCanvas;
}

export function clearWarpTriangleCache() {
  cachedTriangles = null;
}
