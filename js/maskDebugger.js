// =========================================================
// AESTHETIQ — MASK DEBUGGER
// File: js/maskDebugger.js
// =========================================================

function isValidPoint(point) {
  return (
    point &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y)
  );
}

function isValidPolygon(polygon) {
  return (
    Array.isArray(polygon) &&
    polygon.length >= 3 &&
    polygon.every(isValidPoint)
  );
}

export function drawPolygonPath(
  context,
  polygon
) {
  if (!context || !isValidPolygon(polygon)) {
    return false;
  }

  context.beginPath();
  context.moveTo(
    polygon[0].x,
    polygon[0].y
  );

  for (
    let index = 1;
    index < polygon.length;
    index += 1
  ) {
    context.lineTo(
      polygon[index].x,
      polygon[index].y
    );
  }

  context.closePath();

  return true;
}

export function drawMaskOverlay(
  targetCanvas,
  polygons,
  options = {}
) {
  if (
    !targetCanvas ||
    !Array.isArray(polygons)
  ) {
    return;
  }

  const context =
    targetCanvas.getContext("2d");

  if (!context) {
    return;
  }

  const {
    fillStyle =
      "rgba(123, 92, 255, 0.28)",

    strokeStyle =
      "rgba(255, 255, 255, 0.95)",

    pointStyle =
      "rgba(255, 210, 80, 1)",

    lineWidth = 2,
    pointRadius = 2.5,
    drawPoints = true,
    drawFill = true,
    drawStroke = true
  } = options;

  context.save();

  polygons.forEach((polygon) => {
    if (!isValidPolygon(polygon)) {
      return;
    }

    const pathCreated =
      drawPolygonPath(
        context,
        polygon
      );

    if (!pathCreated) {
      return;
    }

    if (drawFill) {
      context.fillStyle = fillStyle;
      context.fill();
    }

    if (drawStroke) {
      context.strokeStyle = strokeStyle;
      context.lineWidth = lineWidth;
      context.stroke();
    }

    if (drawPoints) {
      polygon.forEach((point) => {
        context.beginPath();

        context.arc(
          point.x,
          point.y,
          pointRadius,
          0,
          Math.PI * 2
        );

        context.fillStyle = pointStyle;
        context.fill();
      });
    }
  });

  context.restore();
}

export function createMaskDebugCanvas(
  sourceCanvas,
  polygons,
  options = {}
) {
  if (!sourceCanvas) {
    return null;
  }

  const debugCanvas =
    document.createElement("canvas");

  debugCanvas.width =
    sourceCanvas.width;

  debugCanvas.height =
    sourceCanvas.height;

  const context =
    debugCanvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.drawImage(
    sourceCanvas,
    0,
    0,
    debugCanvas.width,
    debugCanvas.height
  );

  drawMaskOverlay(
    debugCanvas,
    polygons,
    options
  );

  return debugCanvas;
}
