export function drawMaskOverlay(
  targetCanvas,
  polygons,
  options = {}
) {
  if (!targetCanvas || !Array.isArray(polygons)) {
    return;
  }

  const {
    fillStyle = "rgba(125, 85, 255, 0.25)",
    strokeStyle = "rgba(255, 255, 255, 0.95)",
    lineWidth = 2,
    drawPoints = false
  } = options;

  const ctx = targetCanvas.getContext("2d");

  polygons.forEach((polygon) => {
    if (!Array.isArray(polygon) || polygon.length < 3) {
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(polygon[0].x, polygon[0].y);

    for (let index = 1; index < polygon.length; index += 1) {
      ctx.lineTo(
        polygon[index].x,
        polygon[index].y
      );
    }

    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.fill();
    ctx.stroke();

    if (drawPoints) {
      polygon.forEach((point) => {
        ctx.beginPath();
        ctx.arc(
          point.x,
          point.y,
          3,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = strokeStyle;
        ctx.fill();
      });
    }

    ctx.restore();
  });
}
