// ==========================================================
// AESTHETIQ — LIP TEXTURE REPAIR V1
// File: js/lipTextureRepair.js
// ==========================================================

function toCanvasPoint(point, width, height) {
  if (!point) {
    return null;
  }

  return {
    x: point.x * width,
    y: point.y * height
  };
}

function getAveragePoint(
  landmarks,
  indices,
  width,
  height
) {
  const points = indices
    .map((index) =>
      toCanvasPoint(
        landmarks[index],
        width,
        height
      )
    )
    .filter(Boolean);

  if (!points.length) {
    return null;
  }

  return {
    x:
      points.reduce(
        (sum, point) => sum + point.x,
        0
      ) / points.length,

    y:
      points.reduce(
        (sum, point) => sum + point.y,
        0
      ) / points.length
  };
}

export function repairLowerLipTexture(
  renderedCanvas,
  originalLandmarks,
  warpedLandmarks,
  strength = 0.7
) {
  if (
    !renderedCanvas ||
    !Array.isArray(originalLandmarks) ||
    !Array.isArray(warpedLandmarks) ||
    originalLandmarks.length < 468 ||
    warpedLandmarks.length < 468
  ) {
    return renderedCanvas;
  }

  const width = renderedCanvas.width;
  const height = renderedCanvas.height;

  const output =
    document.createElement("canvas");

  output.width = width;
  output.height = height;

  const ctx =
    output.getContext("2d");

  if (!ctx) {
    return renderedCanvas;
  }

  ctx.drawImage(
    renderedCanvas,
    0,
    0
  );

  /*
   * MediaPipe lower-lip landmarks.
   *
   * 17  = outer lower-lip center
   * 14  = inner lower-lip center
   *
   * Additional points stabilize the estimate.
   */
  const lowerOuter = [
    146,
    91,
    181,
    84,
    17,
    314,
    405,
    321,
    375
  ];

  const originalCenter =
    getAveragePoint(
      originalLandmarks,
      lowerOuter,
      width,
      height
    );

  const warpedCenter =
    getAveragePoint(
      warpedLandmarks,
      lowerOuter,
      width,
      height
    );

  if (
    !originalCenter ||
    !warpedCenter
  ) {
    return output;
  }

  /*
   * Measure how far the lower lip moved.
   */
  const displacementY =
    warpedCenter.y -
    originalCenter.y;

  if (
    !Number.isFinite(displacementY) ||
    Math.abs(displacementY) < 1
  ) {
    return output;
  }

  const left =
    toCanvasPoint(
      warpedLandmarks[146],
      width,
      height
    );

  const right =
    toCanvasPoint(
      warpedLandmarks[375],
      width,
      height
    );

  if (!left || !right) {
    return output;
  }

  const mouthWidth =
    Math.abs(
      right.x - left.x
    );

  /*
   * Repair only a narrow strip around the old
   * lower-lip boundary.
   */
  const repairWidth =
    mouthWidth * 0.82;

  const repairHeight =
    Math.max(
      4,
      Math.min(
        Math.abs(displacementY) * 1.25,
        height * 0.035
      )
    );

  const repairX =
    warpedCenter.x -
    repairWidth / 2;

  const repairY =
    originalCenter.y -
    repairHeight * 0.45;

  /*
   * Sample texture slightly above the artifact.
   * This generally contains lip texture rather than
   * the dark original lower-lip boundary.
   */
  const sampleOffset =
    Math.max(
      3,
      repairHeight * 0.75
    );

  const sampleY =
    repairY - sampleOffset;

  const safeX =
    Math.max(
      0,
      Math.min(
        width - repairWidth,
        repairX
      )
    );

  const safeSampleY =
    Math.max(
      0,
      Math.min(
        height - repairHeight,
        sampleY
      )
    );

  /*
   * Temporary canvas gives us a texture patch
   * that can be feathered before compositing.
   */
  const patch =
    document.createElement("canvas");

  patch.width =
    Math.max(
      1,
      Math.round(repairWidth)
    );

  patch.height =
    Math.max(
      1,
      Math.round(repairHeight)
    );

  const patchCtx =
    patch.getContext("2d");

  if (!patchCtx) {
    return output;
  }

  patchCtx.drawImage(
    renderedCanvas,

    safeX,
    safeSampleY,
    repairWidth,
    repairHeight,

    0,
    0,
    patch.width,
    patch.height
  );

  /*
   * Feather the patch vertically so there is no
   * obvious rectangular replacement edge.
   */
  patchCtx.globalCompositeOperation =
    "destination-in";

  const gradient =
    patchCtx.createLinearGradient(
      0,
      0,
      0,
      patch.height
    );

  gradient.addColorStop(
    0,
    "rgba(0,0,0,0)"
  );

  gradient.addColorStop(
    0.25,
    "rgba(0,0,0,1)"
  );

  gradient.addColorStop(
    0.75,
    "rgba(0,0,0,1)"
  );

  gradient.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );

  patchCtx.fillStyle =
    gradient;

  patchCtx.fillRect(
    0,
    0,
    patch.width,
    patch.height
  );

  patchCtx.globalCompositeOperation =
    "source-over";

  ctx.save();

  ctx.globalAlpha =
    Math.max(
      0,
      Math.min(
        1,
        strength
      )
    );

  ctx.drawImage(
    patch,
    repairX,
    repairY,
    repairWidth,
    repairHeight
  );

  ctx.restore();

  return output;
}
