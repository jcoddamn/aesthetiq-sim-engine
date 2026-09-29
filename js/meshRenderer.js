// ==========================================================
// AESTHETIQ
// Mesh Renderer V2
// File: js/meshRenderer.js
// ==========================================================

export class MeshRenderer {
  constructor() {
    this.triangles = [];
  }

  toCanvasPoint(
  point,
  width,
  height
) {
  if (!point) {
    return null;
  }

  const x =
    Number(point.x);

  const y =
    Number(point.y);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  ) {
    return null;
  }

  if (
    Math.abs(x) <= 1.5 &&
    Math.abs(y) <= 1.5
  ) {
    return {
      x: x * width,
      y: y * height
    };
  }

  return {
    x,
    y
  };
}

  triangleToCanvas(
    indices,
    landmarks,
    width,
    height
  ) {
    if (
      !Array.isArray(indices) ||
      !Array.isArray(landmarks)
    ) {
      return [];
    }

    return indices.map((index) =>
      this.toCanvasPoint(
        landmarks[index],
        width,
        height
      )
    );
  }

  getAffineTransform(
    source,
    target
  ) {
    const [s0, s1, s2] = source;
    const [t0, t1, t2] = target;
    const allPoints = [
  s0,
  s1,
  s2,
  t0,
  t1,
  t2
];

const valid =
  allPoints.every(
    (point) =>
      point &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y)
  );

if (!valid) {
  return null;
}

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

    const b =
      (
        t0.y * (s1.y - s2.y) +
        t1.y * (s2.y - s0.y) +
        t2.y * (s0.y - s1.y)
      ) / denominator;

    const c =
      (
        t0.x * (s2.x - s1.x) +
        t1.x * (s0.x - s2.x) +
        t2.x * (s1.x - s0.x)
      ) / denominator;

    const d =
      (
        t0.y * (s2.x - s1.x) +
        t1.y * (s0.x - s2.x) +
        t2.y * (s1.x - s0.x)
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

    const values = [
  a,
  b,
  c,
  d,
  e,
  f
];

if (
  !values.every(
    Number.isFinite
  )
) {
  return null;
}

return {
  a,
  b,
  c,
  d,
  e,
  f
};
  }

  setTriangles(triangles) {
    this.triangles =
      Array.isArray(triangles)
        ? triangles
        : [];
  }

  render(
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

  const width =
    sourceCanvas.width;

  const height =
    sourceCanvas.height;

  /*
   * Final canvas starts as the untouched
   * original image.
   */
  const output =
    document.createElement("canvas");

  output.width = width;
  output.height = height;

  const outputCtx =
    output.getContext("2d");

  if (!outputCtx) {
    return sourceCanvas;
  }

  outputCtx.drawImage(
    sourceCanvas,
    0,
    0
  );

  /*
   * Render all warped triangles onto a
   * separate temporary canvas first.
   */
  const warpedCanvas =
    document.createElement("canvas");

  warpedCanvas.width = width;
  warpedCanvas.height = height;

  const warpedCtx =
    warpedCanvas.getContext("2d");

  if (!warpedCtx) {
    return output;
  }

  /*
   * Start with the original so there are
   * no transparent gaps between triangles.
   */
  warpedCtx.drawImage(
    sourceCanvas,
    0,
    0
  );

  for (
    const triangle
    of this.triangles
  ) {
    this.drawTriangle(
      warpedCtx,
      sourceCanvas,
      triangle,
      originalLandmarks,
      warpedLandmarks
    );
  }

  warpedCtx.setTransform(
    1,
    0,
    0,
    1,
    0,
    0
  );

  /*
   * Build ONE mask around the complete
   * warped mouth instead of exposing
   * individual triangle edges.
   */
  const lipIndices = [
    61,
    185,
    40,
    39,
    37,
    0,
    267,
    269,
    270,
    409,
    291,

    375,
    321,
    405,
    314,
    17,
    84,
    181,
    91,
    146
  ];

  const lipPoints =
    lipIndices
      .map((index) =>
        this.toCanvasPoint(
          warpedLandmarks[index],
          width,
          height
        )
      )
      .filter(Boolean);

  if (lipPoints.length < 3) {
    return warpedCanvas;
  }

  const mask =
    document.createElement("canvas");

  mask.width = width;
  mask.height = height;

  const maskCtx =
    mask.getContext("2d");

  if (!maskCtx) {
    return warpedCanvas;
  }

  /*
   * Draw the outer mouth shape.
   */
  maskCtx.beginPath();

  maskCtx.moveTo(
    lipPoints[0].x,
    lipPoints[0].y
  );

  for (
    let i = 1;
    i < lipPoints.length;
    i++
  ) {
    maskCtx.lineTo(
      lipPoints[i].x,
      lipPoints[i].y
    );
  }

  maskCtx.closePath();

  maskCtx.fillStyle =
    "rgba(255,255,255,1)";

  maskCtx.fill();

  /*
   * Slight feather only at the outside
   * boundary of the whole lip region.
   *
   * This does NOT blur the lip texture.
   */
  maskCtx.globalCompositeOperation =
    "destination-out";

  maskCtx.filter =
    "blur(2px)";

  maskCtx.globalAlpha =
    0.22;

  maskCtx.strokeStyle =
    "rgba(0,0,0,1)";

  maskCtx.lineWidth = 3;

  maskCtx.stroke();

  maskCtx.filter =
    "none";

  maskCtx.globalAlpha = 1;

  maskCtx.globalCompositeOperation =
    "source-over";

  /*
   * Apply the single lip mask to the
   * completed warped image.
   */
  const composite =
    document.createElement("canvas");

  composite.width = width;
  composite.height = height;

  const compositeCtx =
    composite.getContext("2d");

  if (!compositeCtx) {
    return warpedCanvas;
  }

  compositeCtx.drawImage(
    warpedCanvas,
    0,
    0
  );

  compositeCtx.globalCompositeOperation =
    "destination-in";

  compositeCtx.drawImage(
    mask,
    0,
    0
  );

  compositeCtx.globalCompositeOperation =
    "source-over";

  /*
   * Put the completed warped lip region
   * over the untouched original.
   */
  outputCtx.drawImage(
    composite,
    0,
    0
  );

  return output;
}

  blendLowerLipSeam(
  outputCanvas,
  sourceCanvas,
  warpedLandmarks
) {
  const width =
    outputCanvas.width;

  const height =
    outputCanvas.height;

  const lowerLipIndices = [
    146, 91, 181, 84,
    17,
    314, 405, 321, 375
  ];

  const points =
    lowerLipIndices
      .map((index) =>
        this.toCanvasPoint(
          warpedLandmarks[index],
          width,
          height
        )
      )
      .filter(Boolean);

  if (points.length < 2) {
  return;
}

  const minX =
    Math.min(
      ...points.map(
        (point) => point.x
      )
    );

  const maxX =
    Math.max(
      ...points.map(
        (point) => point.x
      )
    );

  const maxY =
    Math.max(
      ...points.map(
        (point) => point.y
      )
    );

  const seamWidth =
    Math.max(
      10,
      maxX - minX
    );

  /*
   * Narrow area directly beneath
   * the lower lip.
   */
  const seamTop =
    maxY - 2;

  const seamHeight =
    Math.max(
      8,
      height * 0.018
    );

  const featherCanvas =
    document.createElement(
      "canvas"
    );

  featherCanvas.width =
    width;

  featherCanvas.height =
    height;

  const featherCtx =
    featherCanvas.getContext("2d");

  if (!featherCtx) {
    return;
  }

  /*
   * Use a lightly blurred copy of the already
   * warped result so we're blending the new
   * lip position, not restoring the old one.
   */
  featherCtx.filter =
    "blur(3px)";

  featherCtx.drawImage(
    outputCanvas,
    0,
    0
  );

  featherCtx.filter =
    "none";

  const ctx =
    outputCanvas.getContext("2d");

  if (!ctx) {
    return;
  }

  ctx.save();

  const gradient =
    ctx.createLinearGradient(
      0,
      seamTop,
      0,
      seamTop + seamHeight
    );

  gradient.addColorStop(
    0,
    "rgba(0,0,0,0.55)"
  );

  gradient.addColorStop(
    0.45,
    "rgba(0,0,0,0.32)"
  );

  gradient.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );

  ctx.beginPath();

  ctx.rect(
    minX - seamWidth * 0.08,
    seamTop,
    seamWidth * 1.16,
    seamHeight
  );

  ctx.clip();

  ctx.globalAlpha =
    0.55;

  ctx.drawImage(
    featherCanvas,
    0,
    0
  );

  ctx.restore();
}

expandTriangle(
  points,
  pixels = 1.2
) {
  if (
    !Array.isArray(points) ||
    points.length < 3
  ) {
    return points;
  }

  const centerX =
    (
      points[0].x +
      points[1].x +
      points[2].x
    ) / 3;

  const centerY =
    (
      points[0].y +
      points[1].y +
      points[2].y
    ) / 3;

  return points.map((point) => {
    const deltaX =
      point.x - centerX;

    const deltaY =
      point.y - centerY;

    const distance =
      Math.sqrt(
        deltaX * deltaX +
        deltaY * deltaY
      );

    if (
      !Number.isFinite(distance) ||
      distance < 0.0001
    ) {
      return {
        ...point
      };
    }

    return {
      x:
        point.x +
        (
          deltaX /
          distance
        ) * pixels,

      y:
        point.y +
        (
          deltaY /
          distance
        ) * pixels
    };
  });
}

  drawTriangle(
  ctx,
  sourceCanvas,
  triangle,
  original,
  warped
) {
  if (
    !Array.isArray(triangle) ||
    triangle.length < 3
  ) {
    return;
  }

  const sourceTriangle =
    this.triangleToCanvas(
      triangle,
      original,
      sourceCanvas.width,
      sourceCanvas.height
    );

  const targetTriangle =
    this.triangleToCanvas(
      triangle,
      warped,
      sourceCanvas.width,
      sourceCanvas.height
    );

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

  const transform =
    this.getAffineTransform(
      sourceTriangle,
      targetTriangle
    );

  if (!transform) {
    return;
  }

  /*
   * IMPORTANT:
   * Expand only the clipping triangle.
   *
   * The actual affine transform still uses the
   * real landmark positions.
   *
   * This creates a tiny overlap between neighboring
   * mesh triangles and prevents visible Safari seams.
   */
  const clipTriangle =
    this.expandTriangle(
      targetTriangle,
      0.5
    );

  ctx.save();

  ctx.setTransform(
    1,
    0,
    0,
    1,
    0,
    0
  );

  ctx.beginPath();

  ctx.moveTo(
    clipTriangle[0].x,
    clipTriangle[0].y
  );

  ctx.lineTo(
    clipTriangle[1].x,
    clipTriangle[1].y
  );

  ctx.lineTo(
    clipTriangle[2].x,
    clipTriangle[2].y
  );

  ctx.closePath();
  ctx.clip();

  ctx.imageSmoothingEnabled =
    true;

  ctx.imageSmoothingQuality =
    "high";

  ctx.setTransform(
    transform.a,
    transform.b,
    transform.c,
    transform.d,
    transform.e,
    transform.f
  );

  ctx.drawImage(
    sourceCanvas,
    0,
    0
  );

  ctx.restore();
}

}
