export function drawPolygon(ctx, points) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fill();
}

export function createFeatheredMask(width, height, polygons, blurPx = 16) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';

  polygons.forEach(poly => drawPolygon(ctx, poly));

  const temp = document.createElement('canvas');
  temp.width = width;
  temp.height = height;
  const tctx = temp.getContext('2d');
  tctx.filter = `blur(${blurPx}px)`;
  tctx.drawImage(canvas, 0, 0);

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(temp, 0, 0);

  return canvas;
}
