import { renderWarp } from './warpRenderer.js';

// Recovery examples. Strengths control the drawing, not a patient's healing.
const UPPER_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
const LOWER_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
const UPPER_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
const LOWER_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308];
const OUTER = [...UPPER_OUTER, ...LOWER_OUTER.slice(1, -1).reverse()];
const INNER = [...UPPER_INNER, ...LOWER_INNER.slice(1, -1).reverse()];
const FIXED_LIP_POINTS = new Set([...INNER, 61, 291]);
const SKIN_PROCEDURES = new Set(['chemical-peel', 'laser-resurfacing', 'co2-laser', 'microneedling', 'rf-microneedling', 'ipl']);

function unit(value, fallback = 0) {
  const number = typeof value === 'number' ? value
    : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback;
}

function copyCanvas(source, width = source.width, height = source.height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function pixelLandmarks(points, width, height) {
  if (!Array.isArray(points) || points.length < 468) return null;
  const face = Array.from({ length: 468 }, (_, i) => points[i]);
  if (!face.every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y))) return null;
  return face.map(p => Math.abs(p.x) <= 1.5 && Math.abs(p.y) <= 1.5
    ? { ...p, x: p.x * width, y: p.y * height } : { ...p });
}

function normalized(points, width, height) {
  return points.map(p => ({ ...p, x: p.x / width, y: p.y / height }));
}

function path(ctx, points, ids) {
  ctx.beginPath();
  ids.forEach((id, i) => ctx[i ? 'lineTo' : 'moveTo'](points[id].x, points[id].y));
  ctx.closePath();
}

function mouthFrame(points) {
  const left = points[61], right = points[291];
  const width = Math.hypot(right.x - left.x, right.y - left.y);
  if (width < 5) return null;
  const ux = (right.x - left.x) / width, uy = (right.y - left.y) / width;
  const center = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
  const local = p => ({ u: (p.x - center.x) * ux + (p.y - center.y) * uy,
    v: -(p.x - center.x) * uy + (p.y - center.y) * ux });
  const curve = ids => ids.map(i => local(points[i])).sort((a, b) => a.u - b.u);
  return { width, ux, uy, local, upperOuter: curve(UPPER_OUTER), lowerOuter: curve(LOWER_OUTER),
    upperInner: curve(UPPER_INNER), lowerInner: curve(LOWER_INNER) };
}

function heightAt(curve, u) {
  if (u <= curve[0].u) return curve[0].v;
  for (let i = 1; i < curve.length; i++) {
    if (u <= curve[i].u) {
      const a = curve[i - 1], b = curve[i];
      const ratio = (u - a.u) / Math.max(.001, b.u - a.u);
      return a.v + (b.v - a.v) * ratio;
    }
  }
  return curve.at(-1).v;
}

function swellLips(points, strength) {
  const frame = mouthFrame(points);
  if (!frame || !strength) return points;
  const { width, ux, uy, local, upperOuter, lowerOuter, upperInner, lowerInner } = frame;
  const support = width * .17;
  return points.map((point, id) => {
    if (FIXED_LIP_POINTS.has(id)) return { ...point };
    const { u, v } = local(point);
    const across = Math.abs(u) / (width / 2);
    if (across >= 1) return { ...point };
    const upper = heightAt(upperInner, u), lower = heightAt(lowerInner, u);
    // Leave the mouth opening and teeth alone.
    if (v >= upper && v <= lower) return { ...point };
    const isUpper = v < upper;
    const inside = isUpper ? upper : lower;
    const outside = heightAt(isUpper ? upperOuter : lowerOuter, u);
    const thickness = Math.abs(outside - inside);
    if (thickness < .2) return { ...point };
    const distance = Math.abs(v - inside);
    const weight = distance <= thickness ? distance / thickness
      : Math.max(0, 1 - (distance - thickness) / support) ** 2;
    const amount = Math.min(width * .035, Math.max(thickness * .32, width * .014));
    const delta = (isUpper ? -1 : 1) * amount * strength * weight * (1 - across * across);
    return { ...point, x: point.x - uy * delta, y: point.y + ux * delta };
  });
}

function ellipse(ctx, x, y, rx, ry, color, alpha, angle = 0) {
  if (!alpha || rx <= 0 || ry <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(rx, ry);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, `rgba(${color},${alpha})`);
  gradient.addColorStop(.4, `rgba(${color},${alpha * .65})`);
  gradient.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function lipReactions(canvas, points, redness, bruising) {
  const frame = mouthFrame(points);
  if (!frame || (!redness && !bruising)) return canvas;
  const layer = document.createElement('canvas');
  layer.width = canvas.width;
  layer.height = canvas.height;
  const ctx = layer.getContext('2d');
  if (!ctx) return canvas;
  const { width, ux, uy } = frame;
  if (redness) {
    ctx.save();
    ctx.filter = `blur(${Math.max(.6, width * .012)}px)`;
    ctx.fillStyle = `rgba(170,61,59,${redness * .10})`;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = width * .035;
    ctx.lineJoin = 'round';
    path(ctx, points, OUTER);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  if (bruising) {
    // Fixed example patches keep the slider from changing at random.
    const upper = { x: (points[37].x + points[82].x) / 2, y: (points[37].y + points[82].y) / 2 };
    const lower = { x: (points[314].x + points[317].x) / 2, y: (points[314].y + points[317].y) / 2 };
    const angle = Math.atan2(uy, ux);
    ellipse(ctx, upper.x, upper.y, width * .09, width * .055, '94,48,76', bruising * .22, angle);
    ellipse(ctx, lower.x, lower.y, width * .10, width * .06, '108,66,74', bruising * .18, angle);
  }
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = Math.max(1, width * .012);
  path(ctx, points, INNER);
  ctx.fill();
  ctx.stroke();
  const output = copyCanvas(canvas);
  if (output !== canvas) output.getContext('2d').drawImage(layer, 0, 0);
  return output;
}

function glabellaReactions(canvas, points, redness, bruising) {
  if (!points || (!redness && !bruising)) return canvas;
  const left = points[107], right = points[336];
  const width = Math.hypot(right.x - left.x, right.y - left.y);
  if (width < 4) return canvas;
  const angle = Math.atan2(right.y - left.y, right.x - left.x);
  const x = (left.x + right.x) / 2, y = (left.y + right.y) / 2;
  const output = copyCanvas(canvas);
  if (output === canvas) return canvas;
  const ctx = output.getContext('2d');
  // A diffuse reaction example between the brows, not an injection map.
  ellipse(ctx, x, y, width * .32, width * .40, '175,64,59', redness * .10, angle);
  ellipse(ctx, x, y, width * .20, width * .22, '101,59,81', bruising * .15, angle);
  return output;
}

export function renderRecoveryIllustration(original, finalCanvas, stage, procedure, options = {}) {
  if (!original || !finalCanvas) return finalCanvas || original;
  const width = original.width, height = original.height;
  if (!(width > 0 && height > 0 && finalCanvas.width > 0 && finalCanvas.height > 0)) return finalCanvas;
  const settings = options && typeof options === 'object' ? options : {};
  const progress = unit(stage?.effectProgress, unit(stage?.resultProgress, 1));
  const before = ['before', 'baseline', 'pre-treatment'].includes(stage?.id);
  if (before) return copyCanvas(original);
  const showRecovery = settings.showRecovery !== false;
  const swelling = showRecovery ? unit(stage?.swelling) : 0;
  const redness = showRecovery ? unit(stage?.redness) : 0;
  const bruising = showRecovery && settings.showBruising === true ? unit(stage?.bruising) : 0;
  const sourcePoints = pixelLandmarks(settings.sourceLandmarks, width, height);
  const resultPoints = pixelLandmarks(settings.resultLandmarks, width, height);
  let canvas, currentPoints = resultPoints;

  if (procedure === 'lip-filler') {
    if (progress === 0) {
      canvas = copyCanvas(original);
      currentPoints = sourcePoints;
    } else if (progress < 1 && sourcePoints && resultPoints) {
      currentPoints = sourcePoints.map((point, i) => ({ ...point,
        x: point.x + (resultPoints[i].x - point.x) * progress,
        y: point.y + (resultPoints[i].y - point.y) * progress }));
      canvas = renderWarp(original, normalized(sourcePoints, width, height), normalized(currentPoints, width, height));
    } else {
      canvas = copyCanvas(finalCanvas, width, height);
    }
    if (swelling && currentPoints) {
      const swollenPoints = swellLips(currentPoints, swelling);
      canvas = renderWarp(canvas, normalized(currentPoints, width, height), normalized(swollenPoints, width, height));
      currentPoints = swollenPoints;
    }
    return currentPoints ? lipReactions(canvas, currentPoints, redness, bruising) : canvas;
  }

  if (progress === 0) canvas = copyCanvas(original);
  else if (progress === 1) canvas = copyCanvas(finalCanvas, width, height);
  else {
    canvas = copyCanvas(original);
    if (canvas !== original) {
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.globalAlpha = progress;
      ctx.drawImage(finalCanvas, 0, 0, width, height);
      ctx.restore();
    }
  }
  if (procedure === 'glabella-neuromodulator') {
    return glabellaReactions(canvas, sourcePoints || resultPoints, redness, bruising);
  }
  if (showRecovery && SKIN_PROCEDURES.has(procedure) && stage?.id === 'immediate' && canvas !== original && canvas !== finalCanvas) {
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(220,100,100,0.035)';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
  return canvas;
}
