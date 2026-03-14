export function drawPolygon(ctx, points) {
  if (!points || !points.length) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.closePath();
  ctx.fill();
}

export function drawPolygonOutline(ctx, points, color = '#00bcd4', lineWidth = 2) {
  if (!points || !points.length) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.closePath();
  ctx.stroke();
}

export function createFeatheredMask(width, height, polygons, blurPx = 16) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'white';

  polygons.forEach((poly) => drawPolygon(ctx, poly));

  const blurred = document.createElement('canvas');
  blurred.width = width;
  blurred.height = height;

  const bctx = blurred.getContext('2d');
  bctx.filter = `blur(${blurPx}px)`;
  bctx.drawImage(canvas, 0, 0);

  return blurred;
}
