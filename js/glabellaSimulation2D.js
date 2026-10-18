import { estimateHeadPose } from './headPose.js';
import { MEDIAPIPE_MASKS } from './mediapipeMasks.js';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const smoothstep = value => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
const eyeIds = [[33, 133, 159, 145], [362, 263, 386, 374]];
const excludedIds = [
  MEDIAPIPE_MASKS.leftBrow, MEDIAPIPE_MASKS.rightBrow,
  MEDIAPIPE_MASKS.leftEye, MEDIAPIPE_MASKS.rightEye
];
const requiredIds = [...new Set([
  1, 4, 6, 8, 9, 10, 152, 168, 234, 454, 93, 132, 323, 361,
  ...eyeIds.flat(), ...excludedIds.flat()
])];

function failure(code, reason, metrics = {}) {
  return { valid: false, code, reason, warnings: [], metrics };
}

// This frame locates visible skin. It does not reconstruct muscles or verify identity.
export function getGlabellaFrame(landmarks, width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 160 || height < 160) {
    return failure('small-image', 'Use a larger, clear front-facing photo.');
  }
  if (!Array.isArray(landmarks) || landmarks.length < 468 || !requiredIds.every(id => {
    const p = landmarks[id];
    return p && Number.isFinite(p.x) && Number.isFinite(p.y);
  })) {
    return failure('missing-landmarks', 'Keep your full face in view and capture the photo again.');
  }
  const point = id => ({ x: landmarks[id].x * width, y: landmarks[id].y * height });
  const average = ids => {
    const points = ids.map(point);
    return { x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length };
  };
  let [leftEye, rightEye] = eyeIds.map(average);
  if (leftEye.x > rightEye.x) [leftEye, rightEye] = [rightEye, leftEye];
  const eyeDistance = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
  if (eyeDistance < 42) {
    return failure('small-face', 'Move closer so the space between your eyebrows is clear.');
  }
  const origin = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
  const axis = { x: (rightEye.x - leftEye.x) / eyeDistance, y: (rightEye.y - leftEye.y) / eyeDistance };
  const toLocal = p => ({ x: (p.x - origin.x) * axis.x + (p.y - origin.y) * axis.y,
    y: -(p.x - origin.x) * axis.y + (p.y - origin.y) * axis.x });
  const toImage = (x, y) => ({ x: origin.x + x * axis.x - y * axis.y,
    y: origin.y + x * axis.y + y * axis.x });
  const innerBrows = [average([107, 55]), average([336, 285])].map(toLocal);
  const browTop = Math.min(toLocal(point(107)).y, toLocal(point(336)).y);
  const top = browTop - eyeDistance * 0.19;
  const bottom = Math.min(toLocal(point(168)).y + eyeDistance * 0.035, -eyeDistance * 0.055);
  const center = { x: (toLocal(point(8)).x + toLocal(point(9)).x) / 2, y: (top + bottom) / 2 };
  const radiusX = clamp(Math.abs(innerBrows[1].x - innerBrows[0].x) * 0.65,
    eyeDistance * 0.16, eyeDistance * 0.29);
  const radiusY = (bottom - top) / 2;
  const imageCenter = toImage(center.x, center.y);
  const pose = estimateHeadPose(landmarks);
  const faceWidth = Math.hypot(point(454).x - point(234).x, point(454).y - point(234).y);
  const faceHeight = Math.hypot(point(152).x - point(10).x, point(152).y - point(10).y);
  if (radiusY < eyeDistance * 0.08 || faceHeight < eyeDistance || faceWidth < eyeDistance * 1.3) {
    return failure('unclear-face', 'Face alignment is unclear. Look straight ahead and retake the photo.');
  }
  if (Math.abs(pose.yaw) > 0.25 || Math.abs(Math.atan2(axis.y, axis.x)) > 0.32) {
    return failure('off-angle', 'Look straight ahead with your head upright, then retake the photo.');
  }
  const margin = Math.max(radiusX, radiusY) * 1.2;
  if (imageCenter.x - margin < 0 || imageCenter.y - margin < 0 ||
      imageCenter.x + margin >= width || imageCenter.y + margin >= height) {
    return failure('cropped-face', 'Keep your forehead and both eyes inside the photo.');
  }
  return { valid: true, point, toLocal, toImage, origin, axis, eyeDistance, center,
    imageCenter, radiusX, radiusY, innerBrows, pose, width, height,
    exclusions: excludedIds.map(ids => ids.map(point)),
    metrics: { eyeDistance, faceWidth, faceHeight, yaw: pose.yaw, pitch: pose.pitch,
      roll: Math.atan2(axis.y, axis.x) } };
}

function polygonDistance(x, y, points) {
  let inside = false;
  let distance = Infinity;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[j], b = points[i];
    if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = clamp(((x - a.x) * dx + (y - a.y) * dy) / Math.max(1e-8, dx * dx + dy * dy), 0, 1);
    distance = Math.min(distance, Math.hypot(x - a.x - t * dx, y - a.y - t * dy));
  }
  return inside ? 0 : distance;
}

export function glabellaWeight(frame, x, y) {
  const local = frame.toLocal({ x, y });
  const radius = Math.hypot((local.x - frame.center.x) / frame.radiusX,
    (local.y - frame.center.y) / frame.radiusY);
  if (radius >= 1) return 0;
  let weight = smoothstep((1 - radius) / 0.28);
  for (let index = 0; index < frame.exclusions.length; index++) {
    const padding = Math.max(2, frame.eyeDistance * (index < 2 ? 0.023 : 0.055));
    const distance = polygonDistance(x, y, frame.exclusions[index]);
    weight *= smoothstep((distance - padding) / Math.max(2, padding));
    if (!weight) return 0;
  }
  return weight;
}

function boxBlur(values, width, height, radius) {
  const horizontal = new Float32Array(values.length);
  const output = new Float32Array(values.length);
  const count = radius * 2 + 1;
  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let i = -radius; i <= radius; i++) sum += values[y * width + clamp(i, 0, width - 1)];
    for (let x = 0; x < width; x++) {
      horizontal[y * width + x] = sum / count;
      sum += values[y * width + clamp(x + radius + 1, 0, width - 1)] -
        values[y * width + clamp(x - radius, 0, width - 1)];
    }
  }
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let i = -radius; i <= radius; i++) sum += horizontal[clamp(i, 0, height - 1) * width + x];
    for (let y = 0; y < height; y++) {
      output[y * width + x] = sum / count;
      sum += horizontal[clamp(y + radius + 1, 0, height - 1) * width + x] -
        horizontal[clamp(y - radius, 0, height - 1) * width + x];
    }
  }
  return output;
}

function sample(values, width, height, x, y) {
  x = clamp(x, 0, width - 1); y = clamp(y, 0, height - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(width - 1, x0 + 1), y1 = Math.min(height - 1, y0 + 1);
  const u = x - x0, v = y - y0;
  return (values[y0 * width + x0] * (1 - u) + values[y0 * width + x1] * u) * (1 - v) +
    (values[y1 * width + x0] * (1 - u) + values[y1 * width + x1] * u) * v;
}

function copyCanvas(source) {
  const canvas = globalThis.document?.createElement('canvas') ??
    (typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(source.width, source.height) : null);
  if (!canvas) return null;
  canvas.width = source.width; canvas.height = source.height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(source, 0, 0);
  return canvas;
}

export function renderGlabellaPreview(sourceCanvas, landmarks, { level = 'balanced', expression = 'frown' } = {}) {
  if (!sourceCanvas?.getContext || !sourceCanvas.width || !sourceCanvas.height) {
    return { canvas: null, quality: failure('missing-photo', 'Capture a photo before opening the preview.') };
  }
  let canvas;
  try { canvas = copyCanvas(sourceCanvas); } catch { canvas = null; }
  if (!canvas) return { canvas: sourceCanvas,
    quality: failure('canvas-unavailable', 'The preview could not open. Try capturing the photo again.') };
  const frame = getGlabellaFrame(landmarks, sourceCanvas.width, sourceCanvas.height);
  if (!frame.valid) return { canvas, quality: frame };
  if (!['neutral', 'frown'].includes(expression)) {
    return { canvas, quality: failure('unknown-expression', 'Choose either the relaxed or frown photo.') };
  }
  const amount = { natural: 0.36, balanced: 0.59, enhanced: 0.76 }[level] ?? 0.59;
  const strength = amount * (expression === 'neutral' ? 0.36 : 1);
  const padding = Math.ceil(frame.eyeDistance * 0.16);
  const extent = Math.hypot(frame.radiusX, frame.radiusY) + padding;
  const x0 = Math.max(0, Math.floor(frame.imageCenter.x - extent));
  const y0 = Math.max(0, Math.floor(frame.imageCenter.y - extent));
  const width = Math.min(canvas.width, Math.ceil(frame.imageCenter.x + extent)) - x0;
  const height = Math.min(canvas.height, Math.ceil(frame.imageCenter.y + extent)) - y0;
  let pixels;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  try { pixels = context.getImageData(x0, y0, width, height); } catch {
    return { canvas, quality: failure('unreadable-photo', 'Use a photo captured or uploaded in this app.') };
  }
  const luminance = new Float32Array(width * height);
  for (let i = 0; i < luminance.length; i++) {
    const p = i * 4;
    luminance[i] = pixels.data[p] * 0.2126 + pixels.data[p + 1] * 0.7152 + pixels.data[p + 2] * 0.0722;
  }
  const fine = boxBlur(luminance, width, height, Math.max(1, Math.round(frame.eyeDistance / 220)));
  const correction = new Float32Array(luminance.length);
  const weights = new Float32Array(luminance.length);
  const across = Math.max(3, frame.eyeDistance * 0.045);
  const along = Math.max(2, frame.eyeDistance * 0.026);
  const { axis } = frame;
  const tone = (x, y) => (sample(fine, width, height, x, y) * 2 +
    sample(fine, width, height, x - axis.y * along, y + axis.x * along) +
    sample(fine, width, height, x + axis.y * along, y - axis.x * along) +
    0.5 * sample(fine, width, height, x - axis.y * along * 2, y + axis.x * along * 2) +
    0.5 * sample(fine, width, height, x + axis.y * along * 2, y - axis.x * along * 2)) / 5;
  let creasePixels = 0;
  // Only coherent vertical shadows contribute. Texture is never replaced by a blurred image.
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = y * width + x;
    const weight = glabellaWeight(frame, x + x0, y + y0);
    weights[index] = weight;
    if (!weight || pixels.data[index * 4 + 3] < 250) continue;
    const center = tone(x, y);
    const left = tone(x - axis.x * across, y - axis.y * across);
    const right = tone(x + axis.x * across, y + axis.y * across);
    const trough = Math.min(left, right) - center;
    if (trough <= 1.5) continue;
    const verticalContrast = Math.max(0, (sample(fine, width, height, x - axis.y * across, y + axis.x * across) +
      sample(fine, width, height, x + axis.y * across, y - axis.x * across)) / 2 -
      sample(fine, width, height, x, y));
    const orientation = clamp(1 - verticalContrast / Math.max(2, trough), 0, 1);
    correction[index] = Math.min(45, trough - 1.5) * strength * orientation * weight;
    if (correction[index] > 1) creasePixels++;
  }
  const smoothCorrection = boxBlur(correction, width, height, 1);
  let changedPixels = 0, sumCorrection = 0, maximumCorrection = 0;
  for (let i = 0; i < luminance.length; i++) {
    if (!weights[i]) continue;
    const p = i * 4;
    if (pixels.data[p + 3] < 250) continue;
    const room = 255 - Math.max(pixels.data[p], pixels.data[p + 1], pixels.data[p + 2]);
    const delta = Math.min(room, Math.round(smoothCorrection[i] * weights[i]));
    if (delta < 1) continue;
    // Equal channel offsets retain the source color differences and fine skin detail.
    pixels.data[p] += delta; pixels.data[p + 1] += delta; pixels.data[p + 2] += delta;
    changedPixels++; sumCorrection += delta; maximumCorrection = Math.max(maximumCorrection, delta);
  }
  context.putImageData(pixels, x0, y0);
  const warnings = [];
  if (changedPixels < Math.max(12, frame.eyeDistance * 0.12)) {
    warnings.push(expression === 'neutral'
      ? 'Few resting lines are visible. A relaxed photo can show little visible change.'
      : 'Few clear vertical frown lines were detected. Use even lighting and capture a clear frown.');
  }
  return { canvas, quality: { valid: true, code: 'ready', reason: null, warnings,
    metrics: { ...frame.metrics, expression, level, creasePixels, changedPixels,
      meanCorrection: changedPixels ? sumCorrection / changedPixels : 0, maximumCorrection } } };
}
