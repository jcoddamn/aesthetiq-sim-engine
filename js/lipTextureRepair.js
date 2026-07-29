// ==========================================================
// AESTHETIQ — LIP TEXTURE REPAIR V3
// File: js/lipTextureRepair.js
// ==========================================================

function toCanvasPoint(
  point,
  width,
  height
) {
  if (!point) {
    return null;
  }

  return {
    x: point.x * width,
    y: point.y * height
  };
}

function clamp(
  value,
  min,
  max
) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

function getContourPoints(
  landmarks,
  indices,
  width,
  height
) {
  return indices
    .map((index) =>
      toCanvasPoint(
        landmarks[index],
        width,
        height
      )
    )
    .filter(Boolean);
}

function getAverageY(points) {
  if (!points.length) {
    return 0;
  }

  return (
    points.reduce(
      (sum, point) =>
        sum + point.y,
      0
    ) / points.length
  );
}

function getBounds(points) {
  if (!points.length) {
    return null;
  }

  const xs =
    points.map(
      (point) => point.x
    );

  const ys =
    points.map(
      (point) => point.y
    );

  return {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys)
  };
}

function createRepairMask(
  width,
  height,
  originalContour,
  warpedContour
) {
  const mask =
    document.createElement(
      "canvas"
    );

  mask.width = width;
  mask.height = height;

  const ctx =
    mask.getContext("2d");

  if (!ctx) {
    return null;
  }

  /*
   * Build a polygon bounded by the old
   * lower-lip contour and the new contour.
   *
   * This is the exposed region created by
   * moving the lower lip.
   */
  ctx.beginPath();

  ctx.moveTo(
    originalContour[0].x,
    originalContour[0].y
  );

  for (
    let index = 1;
    index < originalContour.length;
    index += 1
  ) {
    ctx.lineTo(
      originalContour[index].x,
      originalContour[index].y
    );
  }

  /*
   * Travel backwards across the warped
   * contour to close the region.
   */
  for (
    let index =
      warpedContour.length - 1;
    index >= 0;
    index -= 1
  ) {
    ctx.lineTo(
      warpedContour[index].x,
      warpedContour[index].y
    );
  }

  ctx.closePath();

  ctx.fillStyle =
    "rgba(255,255,255,1)";

  ctx.fill();

  return mask;
}

function softenMask(
  sourceMask,
  blurAmount
) {
  const output =
    document.createElement(
      "canvas"
    );

  output.width =
    sourceMask.width;

  output.height =
    sourceMask.height;

  const ctx =
    output.getContext("2d");

  if (!ctx) {
    return sourceMask;
  }

  ctx.filter =
    `blur(${blurAmount}px)`;

  ctx.drawImage(
    sourceMask,
    0,
    0
  );

  ctx.filter = "none";

  return output;
}

export function repairLowerLipTexture(
  renderedCanvas,
  originalLandmarks,
  warpedLandmarks,
  strength = 0.78
) {
  if (
    !renderedCanvas ||
    !Array.isArray(
      originalLandmarks
    ) ||
    !Array.isArray(
      warpedLandmarks
    ) ||
    originalLandmarks.length < 468 ||
    warpedLandmarks.length < 468
  ) {
    return renderedCanvas;
  }

  const width =
    renderedCanvas.width;

  const height =
    renderedCanvas.height;

  /*
   * IMPORTANT:
   *
   * These points follow the OUTER lower-lip
   * contour from left toward right.
   */
  const lowerContourIndices = [
    61,
    146,
    91,
    181,
    84,
    17,
    314,
    405,
    321,
    375,
    291
  ];

  const originalContour =
    getContourPoints(
      originalLandmarks,
      lowerContourIndices,
      width,
      height
    );

  const warpedContour =
    getContourPoints(
      warpedLandmarks,
      lowerContourIndices,
      width,
      height
    );

  if (
    originalContour.length !==
      lowerContourIndices.length ||
    warpedContour.length !==
      lowerContourIndices.length
  ) {
    return renderedCanvas;
  }

  /*
   * Determine whether the lower lip actually
   * moved enough to require repair.
   */
  const originalAverageY =
    getAverageY(
      originalContour
    );

  const warpedAverageY =
    getAverageY(
      warpedContour
    );

  const displacementY =
    warpedAverageY -
    originalAverageY;

  if (
    !Number.isFinite(
      displacementY
    ) ||
    Math.abs(
      displacementY
    ) < 0.75
  ) {
    return renderedCanvas;
  }

  /*
   * This repair is specifically designed for
   * downward lower-lip displacement.
   */
  if (displacementY <= 0) {
    return renderedCanvas;
  }

  const combinedBounds =
    getBounds([
      ...originalContour,
      ...warpedContour
    ]);

  if (!combinedBounds) {
    return renderedCanvas;
  }

  const output =
    document.createElement(
      "canvas"
    );

  output.width = width;
  output.height = height;

  const outputCtx =
    output.getContext("2d");

  if (!outputCtx) {
    return renderedCanvas;
  }

  outputCtx.drawImage(
    renderedCanvas,
    0,
    0
  );

  /*
   * Create the exact exposed-region mask.
   */
  const rawMask =
    createRepairMask(
      width,
      height,
      originalContour,
      warpedContour
    );

  if (!rawMask) {
    return output;
  }

  /*
   * Feather only a few pixels around the
   * contour. This prevents a hard repair edge.
   */
  const displacementRatio =
  clamp(
    Math.abs(displacementY) /
      Math.max(1, height * 0.03),
    0,
    1
  );

const featherAmount =
  clamp(
    1.1 +
      displacementRatio * 2.4,
    1.1,
    3.5
  );

  const repairMask =
    softenMask(
      rawMask,
      featherAmount
    );

  /*
   * Build the replacement texture.
   *
   * We sample skin immediately BELOW the new
   * lower-lip contour and shift that texture
   * upward into the exposed region.
   *
   * Unlike V2, we are not copying a horizontal
   * strip across the visible lip.
   */
  const textureCanvas =
    document.createElement(
      "canvas"
    );

  textureCanvas.width =
    width;

  textureCanvas.height =
    height;

  const textureCtx =
    textureCanvas.getContext(
      "2d"
    );

  if (!textureCtx) {
    return output;
  }

  const sampleOffset =
    clamp(
      displacementY * 0.65,
      2,
      12
    );

  /*
   * Copy the rendered image upward slightly.
   *
   * The mask will ensure that only the tiny
   * exposed seam receives this texture.
   */
  textureCtx.drawImage(
    renderedCanvas,
    0,
    sampleOffset,
    width,
    height - sampleOffset,

    0,
    0,
    width,
    height - sampleOffset
  );

  /*
   * Restrict replacement texture to the
   * contour-shaped exposed region.
   */
  textureCtx.globalCompositeOperation =
    "destination-in";

  textureCtx.drawImage(
    repairMask,
    0,
    0
  );

  textureCtx.globalCompositeOperation =
    "source-over";

  /*
   * Composite repaired texture.
   */
  outputCtx.save();

/*
 * Small deformations need very little repair.
 * Larger deformations get progressively stronger
 * texture cleanup.
 */
const adaptiveStrength =
  clamp(
    0.42 +
      displacementRatio * 0.38,
    0.42,
    0.8
  );

outputCtx.globalAlpha =
  clamp(
    adaptiveStrength * strength,
    0,
    1
  );

outputCtx.drawImage(
  textureCanvas,
  0,
  0
);

outputCtx.restore();

return output;
}
