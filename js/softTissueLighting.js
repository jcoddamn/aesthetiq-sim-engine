// =========================================================
// AESTHETIQ — SOFT TISSUE LIGHTING
// File: js/softTissueLighting.js
// =========================================================

function cloneCanvas(sourceCanvas) {
  if (!sourceCanvas) {
    return null;
  }

  const output =
    document.createElement("canvas");

  output.width =
    sourceCanvas.width;

  output.height =
    sourceCanvas.height;

  const context =
    output.getContext("2d");

  if (!context) {
    return sourceCanvas;
  }

  context.drawImage(
    sourceCanvas,
    0,
    0
  );

  return output;
}

function getMaskBounds(maskCanvas) {
  if (!maskCanvas) {
    return null;
  }

  const context =
    maskCanvas.getContext(
      "2d",
      {
        willReadFrequently: true
      }
    );

  if (!context) {
    return null;
  }

  const {
    width,
    height
  } = maskCanvas;

  const pixels =
    context.getImageData(
      0,
      0,
      width,
      height
    ).data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (
    let y = 0;
    y < height;
    y += 2
  ) {
    for (
      let x = 0;
      x < width;
      x += 2
    ) {
      const alphaIndex =
        (
          y * width +
          x
        ) * 4 + 3;

      if (pixels[alphaIndex] < 12) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (
    maxX < minX ||
    maxY < minY
  ) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width:
      Math.max(
        1,
        maxX - minX
      ),
    height:
      Math.max(
        1,
        maxY - minY
      )
  };
}

function maskLayer(
  layerCanvas,
  maskCanvas
) {
  const context =
    layerCanvas.getContext("2d");

  if (!context) {
    return layerCanvas;
  }

  context.save();

  context.globalCompositeOperation =
    "destination-in";

  context.drawImage(
    maskCanvas,
    0,
    0,
    layerCanvas.width,
    layerCanvas.height
  );

  context.restore();

  return layerCanvas;
}

export function applySoftTissueLighting(
  sourceCanvas,
  maskCanvas,
  level = "balanced"
) {
  if (
    !sourceCanvas ||
    !maskCanvas
  ) {
    return sourceCanvas;
  }

  const output =
    cloneCanvas(sourceCanvas);

  const outputContext =
    output?.getContext("2d");

  if (
    !output ||
    !outputContext
  ) {
    return sourceCanvas;
  }

  const bounds =
    getMaskBounds(maskCanvas);

  if (!bounds) {
    return output;
  }

  const strength =
    level === "natural"
      ? 0.3
      : level === "enhanced"
      ? 0.75
      : 0.5;

  const centerX =
    bounds.x +
    bounds.width / 2;

  const centerY =
    bounds.y +
    bounds.height / 2;

  // -------------------------------------------------------
  // TEXTURE-PRESERVING HIGHLIGHT
  // -------------------------------------------------------

  const highlightLayer =
    cloneCanvas(sourceCanvas);

  const highlightContext =
    highlightLayer.getContext("2d");

  highlightContext.clearRect(
    0,
    0,
    highlightLayer.width,
    highlightLayer.height
  );

  const highlightGradient =
    highlightContext.createRadialGradient(
      centerX,
      centerY +
        bounds.height * 0.08,
      0,
      centerX,
      centerY +
        bounds.height * 0.08,
      Math.max(
        bounds.width * 0.42,
        bounds.height
      )
    );

  highlightGradient.addColorStop(
    0,
    `rgba(255,255,255,${
      0.11 * strength
    })`
  );

  highlightGradient.addColorStop(
    0.45,
    `rgba(255,255,255,${
      0.045 * strength
    })`
  );

  highlightGradient.addColorStop(
    1,
    "rgba(255,255,255,0)"
  );

  highlightContext.fillStyle =
    highlightGradient;

  highlightContext.fillRect(
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height
  );

  maskLayer(
    highlightLayer,
    maskCanvas
  );

  outputContext.save();

  outputContext.globalCompositeOperation =
    "soft-light";

  outputContext.drawImage(
    highlightLayer,
    0,
    0
  );

  outputContext.restore();

  // -------------------------------------------------------
  // LOWER-LIP DEPTH
  // -------------------------------------------------------

  const shadowLayer =
    document.createElement("canvas");

  shadowLayer.width =
    sourceCanvas.width;

  shadowLayer.height =
    sourceCanvas.height;

  const shadowContext =
    shadowLayer.getContext("2d");

  const shadowGradient =
    shadowContext.createLinearGradient(
      0,
      bounds.y,
      0,
      bounds.y +
        bounds.height
    );

  shadowGradient.addColorStop(
    0,
    "rgba(0,0,0,0)"
  );

  shadowGradient.addColorStop(
    0.58,
    "rgba(0,0,0,0)"
  );

  shadowGradient.addColorStop(
    1,
    `rgba(25,10,18,${
      0.09 * strength
    })`
  );

  shadowContext.fillStyle =
    shadowGradient;

  shadowContext.fillRect(
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height
  );

  maskLayer(
    shadowLayer,
    maskCanvas
  );

  outputContext.save();

  outputContext.globalCompositeOperation =
    "multiply";

  outputContext.drawImage(
    shadowLayer,
    0,
    0
  );

  outputContext.restore();

  // -------------------------------------------------------
  // SUBTLE COLOR DEPTH
  // -------------------------------------------------------

  const colorLayer =
    document.createElement("canvas");

  colorLayer.width =
    sourceCanvas.width;

  colorLayer.height =
    sourceCanvas.height;

  const colorContext =
    colorLayer.getContext("2d");

  colorContext.fillStyle =
    `rgba(120,35,55,${
      0.025 * strength
    })`;

  colorContext.fillRect(
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height
  );

  maskLayer(
    colorLayer,
    maskCanvas
  );

  outputContext.save();

  outputContext.globalCompositeOperation =
    "soft-light";

  outputContext.drawImage(
    colorLayer,
    0,
    0
  );

  outputContext.restore();

  return output;
}
