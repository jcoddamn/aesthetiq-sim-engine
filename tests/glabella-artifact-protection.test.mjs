import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { getGlabellaFrame, glabellaWeight, renderGlabellaPreview } from '../js/glabellaSimulation2D.js';
import { renderRecoveryIllustration } from '../js/recoveryIllustration2D.js';

globalThis.document = { createElement: () => createCanvas(1, 1) };
const SIZE = 600;
const landmarks = readFileSync(new URL('../models/mediapipe_canonical_face.obj', import.meta.url), 'utf8')
  .split('\n').filter(line => line.startsWith('v ')).map(line => {
    const [x, y, z] = line.split(/\s+/).slice(1).map(Number);
    return { x: .5 + x / 24, y: .5 - y / 24, z: -z / 24 };
  });
const dataOf = canvas => canvas.getContext('2d').getImageData(0, 0, SIZE, SIZE).data;

function skin({ tone = [184, 145, 119], mark = true, markSlope = 0, shading = 'additive' } = {}) {
  const canvas = createCanvas(SIZE, SIZE), context = canvas.getContext('2d');
  const image = context.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const texture = (x + y) % 2 ? 2 : -2;
    const length = Math.max(0, Math.min(1, (y - 150) / 12, (215 - y) / 12));
    const crease = Math.exp(-((x - 289) ** 2) / 13) * length;
    const markCenter = 311 + markSlope * (y - 183);
    const coloredMark = mark ? Math.exp(-((x - markCenter) ** 2) / 10 - ((y - 183) ** 2) / 170) : 0;
    const i = (y * SIZE + x) * 4;
    for (let c = 0; c < 3; c++) {
      const shadow = shading === 'multiply' ? tone[c] * .38 : tone[2] * .38;
      const tint = tone[2] * (c === 0 ? .12 : .56);
      image.data[i + c] = tone[c] + texture - shadow * crease - tint * coloredMark;
    }
    image.data[i + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

function meanChange(a, b, x, top, bottom) {
  let sum = 0;
  for (let y = top; y < bottom; y++) sum += b[(y * SIZE + x) * 4] - a[(y * SIZE + x) * 4];
  return sum / (bottom - top);
}

test('colored marks survive while nearby crease shadows still soften across source tones', () => {
  for (const tone of [[225, 197, 174], [184, 145, 119], [94, 65, 50]]) {
    for (const expression of ['neutral', 'frown']) {
      const source = skin({ tone }), before = new Uint8ClampedArray(dataOf(source));
      const result = renderGlabellaPreview(source, landmarks, { expression });
      const after = dataOf(result.canvas);
      assert.equal(result.quality.valid, true);
      assert.deepEqual(dataOf(source), before, 'The captured source must remain untouched');
      for (let y = 173; y <= 193; y++) for (let x = 309; x <= 313; x++) {
        const i = (y * SIZE + x) * 4;
        for (let c = 0; c < 3; c++) assert.ok(Math.abs(after[i + c] - before[i + c]) <= 1,
          `A colored mark was lightened at ${x},${y}: tone ${tone}, ${expression}`);
      }
      assert.ok(meanChange(before, after, 289, 177, 197) > (expression === 'neutral' ? .5 : 2),
        `The nearby crease disappeared from the correction: tone ${tone}, ${expression}`);
    }
  }
});

test('the color guard accepts both additive and proportional ordinary shadows', () => {
  for (const tone of [[225, 197, 174], [184, 145, 119], [94, 65, 50]]) {
    for (const shading of ['additive', 'multiply']) {
      const source = skin({ tone, mark: false, shading });
      const result = renderGlabellaPreview(source, landmarks);
      assert.ok(meanChange(dataOf(source), dataOf(result.canvas), 289, 177, 197) > 2,
        `An ordinary ${shading} shadow was suppressed for source tone ${tone}`);
    }
  }
});

test('slanted colored marks cannot bypass the guard through another crease direction', () => {
  for (const markSlope of [-Math.tan(Math.PI / 6), Math.tan(Math.PI / 6)]) {
    const source = skin({ markSlope }), before = dataOf(source);
    const after = dataOf(renderGlabellaPreview(source, landmarks).canvas);
    for (let y = 175; y <= 191; y++) {
      const center = Math.round(311 + markSlope * (y - 183));
      for (let x = center - 1; x <= center + 1; x++) {
        const i = (y * SIZE + x) * 4;
        assert.ok(Math.abs(after[i] - before[i]) <= 1, `A slanted colored mark was lightened at ${x},${y}`);
      }
    }
    assert.ok(meanChange(before, after, 289, 177, 197) > 2, 'The nearby ordinary crease still needs to soften');
  }
});

test('reaction tint stays inside protected glabella skin when the inner brows are close', () => {
  const points = landmarks.map(p => ({ ...p }));
  for (const id of [107, 55, 66, 65]) points[id].x += .043;
  for (const id of [336, 285, 296, 295]) points[id].x -= .043;
  const frame = getGlabellaFrame(points, SIZE, SIZE);
  assert.equal(frame.valid, true);
  assert.ok(points[55].x < points[285].x, 'The fixture must keep the inner brows separate');
  const source = skin({ mark: false });
  const before = new Uint8ClampedArray(dataOf(source));
  const options = { sourceLandmarks: points, showBruising: true };
  const stage = { id: 'immediate', effectProgress: 0, redness: 1, bruising: 1 };
  const result = renderRecoveryIllustration(source, source, stage, 'glabella-neuromodulator', options);
  const after = dataOf(result);
  let reactionPixels = 0;
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4;
    const changed = [0, 1, 2].some(c => before[i + c] !== after[i + c]);
    if (!glabellaWeight(frame, x, y)) assert.equal(changed, false,
      `Tint reached the protected brow/eye boundary or untreated skin at ${x},${y}`);
    if (changed) reactionPixels++;
  }
  assert.ok(reactionPixels > 5, 'The localized reaction should remain visible');
  assert.deepEqual(dataOf(source), before, 'Recovery must leave the capture untouched');
  assert.deepEqual(dataOf(renderRecoveryIllustration(source, source, stage,
    'glabella-neuromodulator', { ...options, showRecovery: false })), before);
});
