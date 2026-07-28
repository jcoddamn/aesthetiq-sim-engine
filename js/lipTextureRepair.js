// ==========================================================
// AESTHETIQ — LIP TEXTURE REPAIR V2
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

function getAveragePoint(
  landmarks,
  indices,
  width,
  height
) {
  const points =
    indices
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
        (sum, point) =>
          sum + point.x,
        0
      ) / points.length,

    y:
      points.reduce(
        (sum, point) =>
          sum + point.y,
        0
      ) / points.length
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

function createFeatherMask(
  width,
  height
) {
  const mask =
    document.createElement("canvas");

  mask.width = width;
  mask.height = height;

  const ctx =
    mask.getContext("2d");

  if (!ctx) {
    return null;
  }

  /*
   * Feather vertically.
   */
  const vertical =
    ctx.createLinearGradient(
      0,
      0,
      0,
      height
    );

  vertical.addColorStop(
    0,
    "rgba(255,255,255,0)"
  );

  vertical.addColorStop(
    0.18,
    "rgba(255,255,255,0.7)"
  );

  vertical.addColorStop(
    0.42,
    "rgba(255,255,255,1)"
  );

  vertical.addColorStop(
    0.75,
    "rgba(255,255,255,0.9)"
  );

  vertical.addColorStop(
    1,
    "rgba(255,255,255,0)"
  );

  ctx.fillStyle =
    vertical;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  /*
   * Feather horizontally too, so the repair
   * does not form a visible rectangle.
   */
  ctx.globalCompositeOperation =
    "destination-in";

  const horizontal =
    ctx.createLinearGradient(
      0,
      0,
      width,
      0
    );

  horizontal.addColorStop(
    0,
    "rgba(255,255,255,0)"
  );

  horizontal.addColorStop(
    0.12,
    "rgba(255,255,255,0.8)"
  );

  horizontal.addColorStop(
    0.5,
    "rgba(255,255,255,1)"
  );

  horizontal.addColorStop(
    0.88,
    "rgba(255,255,255,0.8)"
  );

  horizontal.addColorStop(
    1,
    "rgba(255,255,255,0)"
  );

  ctx.fillStyle =
    horizontal;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  ctx.globalCompositeOperation =
    "source-over";

  return mask;
}

export function repairLowerLipTexture(
  renderedCanvas,
  originalLandmarks,
  warpedLandmarks,
  strength = 0.72
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

  const width =
    renderedCanvas.width;

  const height =
    renderedCanvas.height;

  const output =
    document.createElement(
      "canvas"
    );

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

  const lowerOuter = [
    146, 91, 181, 84,
    17,
    314, 405, 321, 375
  ];

  const lowerInner = [
    95, 88, 178, 87,
    14,
    317, 402, 318, 324
  ];

  const originalOuterCenter =
    getAveragePoint(
      originalLandmarks,
      lowerOuter,
      width,
      height
    );

  const warpedOuterCenter =
    getAveragePoint(
      warpedLandmarks,
      lowerOuter,
      width,
      height
    );

  const warpedInnerCenter =
    getAveragePoint(
      warpedLandmarks,
      lowerInner,
      width,
      height
    );

  if (
    !originalOuterCenter ||
    !warpedOuterCenter ||
    !warpedInnerCenter
  ) {
    return output;
  }

  const displacementY =
    warpedOuterCenter.y -
    originalOuterCenter.y;

  if (
    !Number.isFinite(
      displacementY
    ) ||
    Math.abs(
      displacementY
    ) < 0.75
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

  const repairWidth =
    clamp(
      mouthWidth * 0.76,
      20,
      width * 0.34
    );

  /*
   * Keep this narrow. We want to replace the
   * old boundary, not the entire lower lip.
   */
  const repairHeight =
    clamp(
      Math.abs(
        displacementY
      ) * 1.35,
      5,
      height * 0.028
    );

  const repairX =
    warpedOuterCenter.x -
    repairWidth / 2;

  /*
   * Target the original lower-lip border,
   * slightly biased toward the new lip.
   */
  const repairY =
    originalOuterCenter.y -
    repairHeight * 0.35;

  /*
   * Source texture from inside the lower lip,
   * between the new inner and outer contours.
   *
   * This preserves actual lip texture instead
   * of sampling chin/skin.
   */
  const lipBandHeight =
    Math.max(
      5,
      Math.abs(
        warpedOuterCenter.y -
        warpedInnerCenter.y
      )
    );

  const sampleHeight =
    clamp(
      lipBandHeight * 0.72,
      5,
      repairHeight * 1.4
    );

  const sampleY =
    warpedInnerCenter.y +
    lipBandHeight * 0.16;

  const safeSampleX =
    clamp(
      repairX,
      0,
      Math.max(
        0,
        width - repairWidth
      )
    );

  const safeSampleY =
    clamp(
      sampleY,
      0,
      Math.max(
        0,
        height - sampleHeight
      )
    );

  const patch =
    document.createElement(
      "canvas"
    );

  patch.width =
    Math.max(
      1,
      Math.round(
        repairWidth
      )
    );

  patch.height =
    Math.max(
      1,
      Math.round(
        repairHeight
      )
    );

  const patchCtx =
    patch.getContext("2d");

  if (!patchCtx) {
    return output;
  }

  /*
   * Stretch a thin strip of genuine lower-lip
   * texture into the exposed repair region.
   */
  patchCtx.drawImage(
    renderedCanvas,

    safeSampleX,
    safeSampleY,
    repairWidth,
    sampleHeight,

    0,
    0,
    patch.width,
    patch.height
  );

  /*
   * Very small blur only to break up a hard
   * duplicate-texture edge.
   *
   * This is intentionally subtle.
   */
  const softenedPatch =
    document.createElement(
      "canvas"
    );

  softenedPatch.width =
    patch.width;

  softenedPatch.height =
    patch.height;

  const softenedCtx =
    softenedPatch.getContext("2d");

  if (!softenedCtx) {
    return output;
  }

  softenedCtx.filter =
    "blur(0.65px)";

  softenedCtx.drawImage(
    patch,
    0,
    0
  );

  softenedCtx.filter =
    "none";

  const featherMask =
    createFeatherMask(
      patch.width,
      patch.height
    );

  if (!featherMask) {
    return output;
  }

  softenedCtx.globalCompositeOperation =
    "destination-in";

  softenedCtx.drawImage(
    featherMask,
    0,
    0
  );

  softenedCtx.globalCompositeOperation =
    "source-over";

  ctx.save();

  ctx.globalAlpha =
    clamp(
      strength,
      0,
      1
    );

  ctx.drawImage(
    softenedPatch,
    repairX,
    repairY,
    repairWidth,
    repairHeight
  );

  ctx.restore();

  return output;
}
