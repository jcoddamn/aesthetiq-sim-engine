import { getGlabellaFrame, glabellaWeight } from './glabellaSimulation2D.js';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const mean = values => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const fail = (code, reason, metrics = {}, warnings = []) => ({ valid: false, code, reason, warnings, metrics });

function pixelsOf(canvas) {
  return canvas.getContext('2d', { willReadFrequently: true })
    .getImageData(0, 0, canvas.width, canvas.height);
}

function grayAt(image, x, y) {
  x = clamp(x, 0, image.width - 1); y = clamp(y, 0, image.height - 1);
  const left = Math.floor(x), top = Math.floor(y);
  const right = Math.min(image.width - 1, left + 1), bottom = Math.min(image.height - 1, top + 1);
  const gray = (u, v) => {
    const p = (v * image.width + u) * 4;
    return image.data[p] * 0.2126 + image.data[p + 1] * 0.7152 + image.data[p + 2] * 0.0722;
  };
  return (gray(left, top) * (1 - x + left) + gray(right, top) * (x - left)) * (1 - y + top) +
    (gray(left, bottom) * (1 - x + left) + gray(right, bottom) * (x - left)) * (y - top);
}

function fitExposure(a, b) {
  const aMean = mean(a), bMean = mean(b);
  let aa = 0, bb = 0, ab = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] - aMean, y = b[i] - bMean;
    aa += x * x; bb += y * y; ab += x * y;
  }
  const gain = aa > 0.01 ? ab / aa : 1;
  const offset = bMean - gain * aMean;
  let error = 0;
  for (let i = 0; i < a.length; i++) error += (b[i] - gain * a[i] - offset) ** 2;
  return { gain, offset, residual: Math.sqrt(error / Math.max(1, a.length)),
    correlation: aa * bb > 0.01 ? ab / Math.sqrt(aa * bb) : 1,
    neutralMean: aMean, frownMean: bMean };
}

function wholePhotoExposure(neutral, frown) {
  const a = [], b = [];
  for (let y = 0; y < 80; y++) for (let x = 0; x < 80; x++) {
    a.push(grayAt(neutral, (x + 0.5) * neutral.width / 80, (y + 0.5) * neutral.height / 80));
    b.push(grayAt(frown, (x + 0.5) * frown.width / 80, (y + 0.5) * frown.height / 80));
  }
  return fitExposure(a, b);
}

function stableSkinExposure(neutralPixels, frownPixels, neutralFrame, frownFrame) {
  const a = [], b = [];
  for (const id of [50, 280, 101, 330, 117, 346]) {
    const n = neutralFrame.point(id), f = frownFrame.point(id);
    for (const dy of [-0.025, 0, 0.025]) for (const dx of [-0.025, 0, 0.025]) {
      a.push(grayAt(neutralPixels, n.x + neutralFrame.eyeDistance * dx, n.y + neutralFrame.eyeDistance * dy));
      b.push(grayAt(frownPixels, f.x + frownFrame.eyeDistance * dx, f.y + frownFrame.eyeDistance * dy));
    }
  }
  const fit = fitExposure(a, b);
  const gain = fit.correlation > 0.7 && fit.gain > 0.4 && fit.gain < 2
    ? fit.gain : fit.frownMean / Math.max(1, fit.neutralMean);
  return { ...fit, gain, offset: fit.frownMean - gain * fit.neutralMean };
}

function alignedPatches(neutralPixels, frownPixels, neutralFrame, frownFrame) {
  const width = 64, height = 64;
  const neutral = new Float32Array(width * height), frown = new Float32Array(width * height);
  const weights = new Float32Array(width * height);
  const centerX = (neutralFrame.center.x / neutralFrame.eyeDistance + frownFrame.center.x / frownFrame.eyeDistance) / 2;
  const centerY = (neutralFrame.center.y / neutralFrame.eyeDistance + frownFrame.center.y / frownFrame.eyeDistance) / 2;
  const radiusX = Math.max(neutralFrame.radiusX / neutralFrame.eyeDistance, frownFrame.radiusX / frownFrame.eyeDistance);
  const radiusY = Math.max(neutralFrame.radiusY / neutralFrame.eyeDistance, frownFrame.radiusY / frownFrame.eyeDistance);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const u = centerX + ((x + 0.5) / width * 2 - 1) * radiusX;
    const v = centerY + ((y + 0.5) / height * 2 - 1) * radiusY;
    const n = neutralFrame.toImage(u * neutralFrame.eyeDistance, v * neutralFrame.eyeDistance);
    const f = frownFrame.toImage(u * frownFrame.eyeDistance, v * frownFrame.eyeDistance);
    const i = y * width + x;
    neutral[i] = grayAt(neutralPixels, n.x, n.y);
    frown[i] = grayAt(frownPixels, f.x, f.y);
    weights[i] = Math.min(glabellaWeight(neutralFrame, n.x, n.y), glabellaWeight(frownFrame, f.x, f.y));
  }
  return { width, height, neutral, frown, weights };
}

function creaseScore(values, weights, width, height) {
  const scores = [];
  const tone = (x, y) => (values[y * width + x] * 2 +
    values[(y - 2) * width + x] + values[(y + 2) * width + x]) / 4;
  for (let y = 5; y < height - 5; y++) for (let x = 5; x < width - 5; x++) {
    if (weights[y * width + x] < 0.4) continue;
    const center = tone(x, y);
    const trough = Math.min(tone(x - 4, y), tone(x + 4, y)) - center;
    const horizontalLine = Math.max(0, (tone(x, y - 3) + tone(x, y + 3)) / 2 - center);
    scores.push(Math.max(0, trough - horizontalLine - 1));
  }
  scores.sort((a, b) => b - a);
  return mean(scores.slice(0, Math.max(1, Math.ceil(scores.length * 0.15))));
}

function stableGeometryDifference(neutral, frown) {
  const differences = [];
  for (const id of [1, 4, 6, 10, 152, 234, 454]) {
    const a = neutral.toLocal(neutral.point(id)), b = frown.toLocal(frown.point(id));
    differences.push(Math.hypot(a.x / neutral.eyeDistance - b.x / frown.eyeDistance,
      a.y / neutral.eyeDistance - b.y / frown.eyeDistance));
  }
  return mean(differences);
}

// Capture heuristics compare expression and framing; they are not identity checks.
export function compareExpressionCaptures(neutral, frown) {
  if (!neutral?.canvas?.getContext || !frown?.canvas?.getContext) {
    return fail('missing-capture', 'Capture both a relaxed photo and a separate frown photo.');
  }
  if (neutral.canvas === frown.canvas) {
    return fail('duplicate-capture', 'These are the same photo. Keep the relaxed photo and take a new frown photo.');
  }
  const n = getGlabellaFrame(neutral.landmarks, neutral.canvas.width, neutral.canvas.height);
  const f = getGlabellaFrame(frown.landmarks, frown.canvas.width, frown.canvas.height);
  if (!n.valid) return fail(n.code, `Relaxed photo: ${n.reason}`, n.metrics);
  if (!f.valid) return fail(f.code, `Frown photo: ${f.reason}`, f.metrics);
  const controls = [50, 280, 101, 330, 117, 346];
  if (!controls.every(id => [neutral.landmarks[id], frown.landmarks[id]].every(p =>
    p && Number.isFinite(p.x) && Number.isFinite(p.y)))) {
    return fail('missing-landmarks', 'Face alignment is unclear. Capture both expressions again.');
  }
  let neutralPixels, frownPixels;
  try { neutralPixels = pixelsOf(neutral.canvas); frownPixels = pixelsOf(frown.canvas); } catch {
    return fail('unreadable-photo', 'Use photos captured or uploaded in this app.');
  }
  if (neutralPixels.width === frownPixels.width && neutralPixels.height === frownPixels.height &&
      neutralPixels.data.every((value, i) => value === frownPixels.data[i])) {
    return fail('duplicate-capture', 'These are the same photo. Keep the relaxed photo and take a new frown photo.');
  }
  const scaleRatio = f.eyeDistance / n.eyeDistance * Math.min(n.width, n.height) / Math.min(f.width, f.height);
  const centerShift = Math.hypot(n.origin.x / n.width - f.origin.x / f.width,
    n.origin.y / n.height - f.origin.y / f.height);
  const yawDifference = Math.abs(n.pose.yaw - f.pose.yaw);
  const pitchDifference = Math.abs(n.pose.pitch - f.pose.pitch);
  const rollDifference = Math.abs(n.metrics.roll - f.metrics.roll);
  const shapeDifference = stableGeometryDifference(n, f);
  const gap = frame => Math.abs(frame.innerBrows[1].x - frame.innerBrows[0].x) / frame.eyeDistance;
  const height = frame => mean(frame.innerBrows.map(p => p.y)) / frame.eyeDistance;
  const browContraction = gap(n) - gap(f);
  const browLowering = height(f) - height(n);
  const metrics = { scaleRatio, centerShift, yawDifference, pitchDifference, rollDifference,
    shapeDifference, browContraction, browLowering };
  if (yawDifference > 0.13 || pitchDifference > 0.1 || rollDifference > 0.16) {
    return fail('pose-mismatch', 'Keep the same straight-on head position for both photos. Move your eyebrows, then retake the frown photo.', metrics);
  }
  if (scaleRatio < 0.7 || scaleRatio > 1.4 || centerShift > 0.18) {
    return fail('framing-mismatch', 'Keep the camera at the same distance and your face in the same position, then retake the frown photo.', metrics);
  }
  if (shapeDifference > 0.22) {
    return fail('face-shape-mismatch', 'The face proportions do not line up. Retake both photos in the same framing without a filter.', metrics);
  }
  const exposure = stableSkinExposure(neutralPixels, frownPixels, n, f);
  const photoExposure = wholePhotoExposure(neutralPixels, frownPixels);
  Object.assign(metrics, { exposureGain: exposure.gain, exposureOffset: exposure.offset,
    wholePhotoResidual: photoExposure.residual });
  if (exposure.neutralMean < 12 || exposure.frownMean < 12 ||
      exposure.neutralMean > 247 || exposure.frownMean > 247 ||
      exposure.gain < 0.5 || exposure.gain > 1.8) {
    return fail('lighting-mismatch', 'Use the same even lighting for both photos, then retake them without flash or a filter.', metrics);
  }
  const patches = alignedPatches(neutralPixels, frownPixels, n, f);
  let error = 0, count = 0;
  for (let i = 0; i < patches.neutral.length; i++) {
    if (patches.weights[i] < 0.4) continue;
    error += (patches.frown[i] - (patches.neutral[i] * exposure.gain + exposure.offset)) ** 2;
    count++;
  }
  const regionResidual = Math.sqrt(error / Math.max(1, count));
  const neutralCreaseScore = creaseScore(patches.neutral, patches.weights, patches.width, patches.height);
  const frownCreaseScore = creaseScore(patches.frown, patches.weights, patches.width, patches.height);
  const creaseIncrease = frownCreaseScore / Math.max(0.5, exposure.gain) - neutralCreaseScore;
  const browChanged = browContraction > 0.024 || (browContraction > 0.008 && browLowering > 0.03);
  const onlyExposureChanged = photoExposure.residual < 0.75 && photoExposure.correlation > 0.995;
  const creasesChanged = creaseIncrease > 0.7 && regionResidual > 1.5 && !onlyExposureChanged;
  Object.assign(metrics, { neutralCreaseScore, frownCreaseScore, creaseIncrease, regionResidual,
    expressionCue: browChanged && creasesChanged ? 'brows-and-creases' : browChanged ? 'brows' : creasesChanged ? 'creases' : 'unclear' });
  if (!browChanged && !creasesChanged) {
    return fail('expression-not-clear', 'The frown is not clear enough. Keep your head still, gently bring your eyebrows together and down, and take a new frown photo.', metrics);
  }
  const warnings = [];
  if (scaleRatio < 0.84 || scaleRatio > 1.2 || centerShift > 0.1) warnings.push('The framing changed slightly. Matching the camera position will improve the comparison.');
  if (exposure.gain < 0.8 || exposure.gain > 1.25 || Math.abs(exposure.offset) > 20) warnings.push('Lighting changed between photos. More even lighting will make the preview easier to compare.');
  return { valid: true, code: 'ready', reason: null, warnings, metrics };
}
