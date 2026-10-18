import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { renderGlabellaPreview } from '../js/glabellaSimulation2D.js';
import { compareExpressionCaptures } from '../js/expressionCapture.js';

globalThis.document = { createElement: () => createCanvas(1, 1) };
const landmarks = readFileSync(new URL('../models/mediapipe_canonical_face.obj', import.meta.url), 'utf8')
  .split('\n').filter(line => line.startsWith('v ')).map(line => {
    const [x, y, z] = line.split(/\s+/).slice(1).map(Number);
    return { x: 0.5 + x / 24, y: 0.5 - y / 24, z: -z / 24 };
  });
const clonePoints = () => landmarks.map(p => ({ ...p }));
const dataOf = canvas => canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function face({ severity = 0, horizontal = false, slope = 0, points = landmarks, exposure = 1 } = {}) {
  const canvas = createCanvas(600, 600), context = canvas.getContext('2d');
  const image = context.createImageData(600, 600);
  for (let y = 0; y < 600; y++) for (let x = 0; x < 600; x++) {
    const texture = ((x + y) % 2 ? 3 : -3);
    const light = x * 0.016 + y * 0.006;
    const envelope = clamp((y - 146) / 12, 0, 1) * clamp((217 - y) / 12, 0, 1);
    const shadow = horizontal
      ? severity * Math.exp(-((y - 183) ** 2) / 8) * clamp((x - 270) / 10, 0, 1) * clamp((330 - x) / 10, 0, 1)
      : severity * (Math.exp(-((x - 289 - slope * (y - 188)) ** 2) / 13) +
        Math.exp(-((x - 311 - slope * (y - 188)) ** 2) / 13)) * envelope;
    const i = (y * 600 + x) * 4;
    for (let c = 0; c < 3; c++) image.data[i + c] = Math.round(([184, 145, 119][c] + light + texture - shadow) * exposure);
    image.data[i + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  context.fillStyle = '#47352c';
  for (const ids of [[70, 63, 105, 66, 107, 55, 65, 52, 53, 46], [336, 296, 334, 293, 300, 276, 283, 282, 295, 285]]) {
    context.beginPath();
    ids.forEach((id, index) => context[index ? 'lineTo' : 'moveTo'](points[id].x * 600, points[id].y * 600));
    context.closePath(); context.fill();
  }
  return canvas;
}

function meanCreaseValue(canvas) {
  const pixels = dataOf(canvas);
  const values = [];
  for (const x of [289, 311]) for (let y = 177; y < 201; y++) values.push(pixels[(y * 600 + x) * 4]);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

test('glabella correction softens visible vertical creases while preserving color, eyes and brows', () => {
  const source = face({ severity: 48 });
  const original = new Uint8ClampedArray(dataOf(source));
  const result = renderGlabellaPreview(source, landmarks);
  const pixels = dataOf(result.canvas);
  assert.equal(result.quality.valid, true);
  assert.ok(result.quality.metrics.changedPixels > 120, JSON.stringify(result.quality));
  assert.ok(meanCreaseValue(result.canvas) > meanCreaseValue(source) + 8);
  assert.deepEqual(dataOf(source), original, 'rendering must leave the captured photo untouched');
  for (let y = 0; y < 600; y++) for (let x = 0; x < 600; x++) {
    const i = (y * 600 + x) * 4;
    assert.equal(pixels[i] - pixels[i + 1], original[i] - original[i + 1], 'source color differences stay intact');
    assert.equal(pixels[i + 1] - pixels[i + 2], original[i + 1] - original[i + 2]);
    if (x < 248 || x > 352 || y < 138 || y > 226) {
      assert.equal(pixels[i], original[i], 'the effect stays in the space between the eyebrows');
    }
  }
  for (const id of [33, 133, 159, 145, 362, 263, 386, 374, 105, 107, 55, 336, 285, 334]) {
    const x = Math.round(landmarks[id].x * 600), y = Math.round(landmarks[id].y * 600);
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const i = ((y + dy) * 600 + x + dx) * 4;
      assert.equal(pixels[i], original[i], `protected eye/brow landmark ${id}`);
    }
  }
});

test('natural to enhanced levels remain ordered and neutral softening remains smaller', () => {
  const source = face({ severity: 48 });
  const values = ['natural', 'balanced', 'enhanced'].map(level => meanCreaseValue(
    renderGlabellaPreview(source, landmarks, { level, expression: 'frown' }).canvas));
  const neutral = meanCreaseValue(renderGlabellaPreview(source, landmarks, { expression: 'neutral' }).canvas);
  assert.ok(values[0] > meanCreaseValue(source));
  assert.ok(values[0] < values[1] && values[1] < values[2]);
  assert.ok(neutral > meanCreaseValue(source) && neutral < values[0]);
  assert.ok(values[2] < meanCreaseValue(face()) - 10, 'deep resting shadows are not promised to disappear');
});

test('slanted frown creases soften in either direction without changing nearby skin', () => {
  for (const slope of [-.58, .58]) {
    const source = face({ severity: 48, slope });
    const rendered = renderGlabellaPreview(source, landmarks);
    assert.equal(rendered.quality.valid, true);
    const before = dataOf(source), after = dataOf(rendered.canvas);
    let change = 0, samples = 0;
    for (const center of [289, 311]) for (let y = 178; y < 199; y++) {
      const x = Math.round(center + slope * (y - 188)), offset = (y * 600 + x) * 4;
      change += after[offset] - before[offset]; samples++;
    }
    assert.ok(change / samples > 8, `slanted crease change was only ${change / samples}`);
    for (const [x, y] of [[300, 125], [240, 190], [360, 190], [300, 240]]) {
      const offset = (y * 600 + x) * 4;
      assert.deepEqual(after.slice(offset, offset + 4), before.slice(offset, offset + 4));
    }
  }
});

test('fine skin texture survives correction and horizontal lines are not generally blurred', () => {
  const source = face({ severity: 48 });
  const result = renderGlabellaPreview(source, landmarks).canvas;
  const amplitude = canvas => {
    const pixels = dataOf(canvas), changes = [];
    for (const x of [288, 289, 290, 310, 311, 312]) for (let y = 179; y < 196; y++) {
      changes.push(Math.abs(pixels[(y * 600 + x) * 4] - pixels[((y + 1) * 600 + x) * 4]));
    }
    return changes.reduce((sum, value) => sum + value, 0) / changes.length;
  };
  assert.ok(amplitude(result) >= amplitude(source) * 0.9);
  const horizontal = face({ severity: 48, horizontal: true });
  const horizontalResult = renderGlabellaPreview(horizontal, landmarks);
  const a = dataOf(horizontal), b = dataOf(horizontalResult.canvas);
  for (let x = 291; x <= 309; x++) {
    assert.ok(Math.abs(a[(183 * 600 + x) * 4] - b[(183 * 600 + x) * 4]) <= 1,
      'a horizontal line must not be treated as a vertical frown crease');
  }
});

test('unclear inputs return an unchanged preview with useful quality guidance', () => {
  const source = face();
  const missing = renderGlabellaPreview(source, []);
  assert.equal(missing.quality.valid, false);
  assert.match(missing.quality.reason, /capture/i);
  assert.deepEqual(dataOf(missing.canvas), dataOf(source));
  const noLines = renderGlabellaPreview(source, landmarks);
  assert.equal(noLines.quality.valid, true);
  assert.equal(noLines.quality.metrics.changedPixels, 0);
  assert.match(noLines.quality.warnings.join(' '), /Few clear frown lines/);
  assert.equal(renderGlabellaPreview(null, landmarks).canvas, null);
});

test('capture comparison rejects duplicated photos and an exposure-only darkened copy', () => {
  const neutral = { canvas: face({ severity: 8 }), landmarks };
  assert.equal(compareExpressionCaptures(neutral, neutral).code, 'duplicate-capture');
  assert.equal(compareExpressionCaptures(neutral, { canvas: face({ severity: 8 }), landmarks }).code, 'duplicate-capture');
  const darker = createCanvas(600, 600), context = darker.getContext('2d');
  const image = context.createImageData(600, 600); image.data.set(dataOf(neutral.canvas));
  for (let i = 0; i < image.data.length; i += 4) for (let c = 0; c < 3; c++) image.data[i + c] *= 0.72;
  context.putImageData(image, 0, 0);
  const comparison = compareExpressionCaptures(neutral, { canvas: darker, landmarks });
  assert.equal(comparison.valid, false, JSON.stringify(comparison));
  assert.equal(comparison.code, 'expression-not-clear');
});

test('capture comparison accepts visible vertical crease development and real brow contraction', () => {
  const neutral = { canvas: face({ severity: 3 }), landmarks };
  const creases = compareExpressionCaptures(neutral, { canvas: face({ severity: 48 }), landmarks });
  assert.equal(creases.valid, true, JSON.stringify(creases));
  assert.equal(creases.metrics.expressionCue, 'creases');
  const contracted = clonePoints();
  for (const id of [107, 55, 66, 65]) { contracted[id].x += 0.007; contracted[id].y += 0.004; }
  for (const id of [336, 285, 296, 295]) { contracted[id].x -= 0.007; contracted[id].y += 0.004; }
  const brow = compareExpressionCaptures({ canvas: face(), landmarks }, { canvas: face({ points: contracted }), landmarks: contracted });
  assert.equal(brow.valid, true, JSON.stringify(brow));
  assert.equal(brow.metrics.expressionCue, 'brows');
});

test('capture comparison rejects a head turn, changed framing and gross proportion mismatch', () => {
  const neutral = { canvas: face(), landmarks };
  const turned = clonePoints(); turned[1].x += 0.052;
  const turn = compareExpressionCaptures(neutral, { canvas: face({ severity: 48 }), landmarks: turned });
  assert.equal(turn.code, 'pose-mismatch', JSON.stringify(turn));
  const smaller = landmarks.map(p => ({ ...p, x: 0.5 + (p.x - 0.5) * 0.6, y: 0.5 + (p.y - 0.5) * 0.6 }));
  const scale = compareExpressionCaptures(neutral, { canvas: face({ severity: 48, points: smaller }), landmarks: smaller });
  assert.equal(scale.code, 'framing-mismatch', JSON.stringify(scale));
  const differentShape = clonePoints();
  differentShape[234].x -= 0.16; differentShape[454].x += 0.16;
  differentShape[152].y += 0.06; differentShape[10].y -= 0.06;
  const shape = compareExpressionCaptures(neutral, { canvas: face({ severity: 48 }), landmarks: differentShape });
  assert.equal(shape.code, 'face-shape-mismatch', JSON.stringify(shape));
});
