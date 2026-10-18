import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { renderRecoveryIllustration } from '../js/recoveryIllustration2D.js';
import { renderWarp } from '../js/warpRenderer.js';

globalThis.document = { createElement: () => createCanvas(1, 1) };
const SIZE = 600;
const points = readFileSync(new URL('../models/mediapipe_canonical_face.obj', import.meta.url), 'utf8')
  .split('\n').filter(line => line.startsWith('v ')).map(line => {
    const [x, y, z] = line.split(/\s+/).slice(1).map(Number);
    return { x: .5 + x / 24, y: .5 - y / 24, z: -z / 24 };
  });
const upper = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
const lower = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
const outer = [...upper, ...lower.slice(1, -1).reverse()];
const inner = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];

function polygon(ctx, ids) {
  ctx.beginPath();
  ids.forEach((id, i) => ctx[i ? 'lineTo' : 'moveTo'](points[id].x * SIZE, points[id].y * SIZE));
  ctx.closePath();
}

function fixture() {
  const original = createCanvas(SIZE, SIZE), ctx = original.getContext('2d');
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = '#505050';
  polygon(ctx, outer);
  ctx.fill();
  ctx.fillStyle = '#f4f4f4';
  polygon(ctx, inner);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#989898';
  for (const x of [286, 298, 310]) ctx.fillRect(x, 390, 1, 35);
  ctx.restore();
  const result = points.map(p => ({ ...p }));
  for (const [ids, direction] of [[upper, -1], [lower, 1]]) {
    ids.forEach((id, i) => { result[id].y += direction * .01 * Math.sin(i / (ids.length - 1) * Math.PI); });
  }
  const finalCanvas = renderWarp(original, points, result);
  return { original, finalCanvas, options: { sourceLandmarks: points, resultLandmarks: result } };
}

const pixels = canvas => canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
function samePixels(a, b, message) {
  assert.equal(Buffer.compare(Buffer.from(pixels(a)), Buffer.from(pixels(b))), 0, message);
}
function darkArea(canvas) {
  const data = pixels(canvas);
  let area = 0;
  for (let i = 0; i < data.length; i += 4) if (data[i] < 110) area++;
  return area;
}
function region(canvas, x, y, width, height) {
  return Buffer.from(canvas.getContext('2d').getImageData(x, y, width, height).data);
}

test('before and settled views preserve exact pixels without changing the shared images', () => {
  const { original, finalCanvas, options } = fixture();
  const sourceBytes = Buffer.from(pixels(original)), finalBytes = Buffer.from(pixels(finalCanvas));
  const landmarkBytes = JSON.stringify(options);
  const before = renderRecoveryIllustration(original, finalCanvas,
    { id: 'before', effectProgress: 1, swelling: 1, redness: 1, bruising: 1 }, 'lip-filler', { ...options, showBruising: true });
  samePixels(before, original, 'Before must be the untouched photo, even with stale effect values');
  assert.notEqual(before, original);
  const settled = renderRecoveryIllustration(original, finalCanvas,
    { id: 'final', effectProgress: 1, swelling: 0, redness: 0, bruising: 0 }, 'lip-filler', options);
  samePixels(settled, finalCanvas, 'Settled must preserve the treatment result');
  renderRecoveryIllustration(original, finalCanvas,
    { id: 'early', effectProgress: 1, swelling: 1, redness: 1, bruising: 1 }, 'lip-filler', { ...options, showBruising: true });
  assert.equal(Buffer.compare(sourceBytes, Buffer.from(pixels(original))), 0, 'Original was mutated');
  assert.equal(Buffer.compare(finalBytes, Buffer.from(pixels(finalCanvas))), 0, 'Final was mutated');
  assert.equal(JSON.stringify(options), landmarkBytes, 'Landmarks were mutated');
});

test('temporary swelling enlarges the completed lip result and settles independently', () => {
  const { original, finalCanvas, options } = fixture();
  const render = swelling => renderRecoveryIllustration(original, finalCanvas,
    { effectProgress: 1, swelling }, 'lip-filler', options);
  const early = render(1), settling = render(.25), final = render(0);
  assert.ok(darkArea(early) > darkArea(finalCanvas) * 1.06, 'Swelling must add visible lip geometry');
  assert.ok(darkArea(early) > darkArea(settling) && darkArea(settling) > darkArea(final), 'Swelling must diminish independently of filler');
  assert.deepEqual(region(early, 275, 404, 50, 5), region(finalCanvas, 275, 404, 50, 5), 'Swelling must preserve teeth and the inner mouth');
  assert.deepEqual(region(early, 0, 0, SIZE, 320), region(finalCanvas, 0, 0, SIZE, 320), 'Swelling leaked into the upper face');
  const data = pixels(early);
  for (let i = 0; i < data.length; i += 4) {
    assert.ok(Math.abs(data[i] - data[i + 1]) <= 1 && Math.abs(data[i + 1] - data[i + 2]) <= 1, 'Geometry added a pink tint');
  }
  samePixels(final, finalCanvas);
});

test('hiding recovery shows the full immediate filler result without a ghosted blend', () => {
  const { original, finalCanvas, options } = fixture();
  const stage = { id: 'immediate', effectProgress: 1, swelling: 1, redness: 1, bruising: 1 };
  const hidden = renderRecoveryIllustration(original, finalCanvas, stage, 'lip-filler',
    { ...options, showRecovery: false, showBruising: true });
  samePixels(hidden, finalCanvas, 'Recovery toggle removed treatment volume');
  const partial = renderRecoveryIllustration(original, finalCanvas,
    { effectProgress: .5 }, 'lip-filler', { ...options, showRecovery: false });
  assert.ok(darkArea(partial) > darkArea(original) && darkArea(partial) < darkArea(finalCanvas), 'Partial lip effect must move geometry');
});

test('redness stays near the lips and bruising is a stable opt-in example', () => {
  const { original, finalCanvas, options } = fixture();
  const stage = { effectProgress: 1, redness: 1, bruising: 1 };
  const plain = renderRecoveryIllustration(original, finalCanvas, stage, 'lip-filler', options);
  const off = renderRecoveryIllustration(original, finalCanvas, stage, 'lip-filler', { ...options, showBruising: false });
  const bruised = renderRecoveryIllustration(original, finalCanvas, stage, 'lip-filler', { ...options, showBruising: true });
  samePixels(plain, off, 'Bruising must stay off by default');
  assert.notEqual(Buffer.compare(Buffer.from(pixels(plain)), Buffer.from(pixels(finalCanvas))), 0, 'Redness did not render');
  assert.notEqual(Buffer.compare(Buffer.from(pixels(bruised)), Buffer.from(pixels(plain))), 0, 'Bruising toggle had no effect');
  samePixels(bruised, renderRecoveryIllustration(original, finalCanvas, stage, 'lip-filler', { ...options, showBruising: true }));
  assert.deepEqual(region(bruised, 0, 0, SIZE, 350), region(finalCanvas, 0, 0, SIZE, 350), 'Lip recovery affected the upper face');
  assert.deepEqual(region(bruised, 275, 404, 50, 5), region(finalCanvas, 275, 404, 50, 5), 'Recovery recolored the teeth');
});

test('portrait photos and pixel landmarks keep recovery in the same mouth region', () => {
  const square = fixture();
  const portrait = source => {
    const canvas = createCanvas(SIZE, 800), ctx = canvas.getContext('2d');
    ctx.fillStyle = '#c0c0c0'; ctx.fillRect(0, 0, SIZE, 800);
    ctx.drawImage(source, 0, 100);
    return canvas;
  };
  const original = portrait(square.original), finalCanvas = portrait(square.finalCanvas);
  const toPixels = values => values.map(p => ({ ...p, x: p.x * SIZE, y: p.y * SIZE + 100 }));
  const toNormalized = values => values.map(p => ({ ...p, x: p.x / SIZE, y: p.y / 800 }));
  const sourcePixels = toPixels(points), resultPixels = toPixels(square.options.resultLandmarks);
  const stage = { effectProgress: 1, swelling: 1, redness: .6 };
  const rendered = renderRecoveryIllustration(original, finalCanvas, stage, 'lip-filler',
    { sourceLandmarks: sourcePixels, resultLandmarks: resultPixels });
  const normalizedView = renderRecoveryIllustration(original, finalCanvas, stage, 'lip-filler',
    { sourceLandmarks: toNormalized(sourcePixels), resultLandmarks: toNormalized(resultPixels) });
  samePixels(rendered, normalizedView, 'Pixel and normalized landmarks disagree');
  assert.deepEqual(region(rendered, 0, 0, SIZE, 420), region(finalCanvas, 0, 0, SIZE, 420), 'Portrait geometry affected the upper face');
  assert.deepEqual(region(rendered, 275, 504, 50, 5), region(finalCanvas, 275, 504, 50, 5), 'Portrait recovery changed the teeth');
  assert.ok(darkArea(rendered) > darkArea(finalCanvas) * 1.04, 'Portrait swelling is missing');
});

test('glabella begins with no smoothing and reactions leave eyebrows and eyes alone', () => {
  const original = createCanvas(SIZE, SIZE), ctx = original.getContext('2d');
  ctx.fillStyle = '#b6b6b6'; ctx.fillRect(0, 0, SIZE, SIZE);
  const final = createCanvas(SIZE, SIZE), end = final.getContext('2d');
  end.drawImage(original, 0, 0);
  end.fillStyle = '#c8c8c8'; end.fillRect(290, 160, 20, 35);
  const immediate = renderRecoveryIllustration(original, final,
    { id: 'immediate', effectProgress: 0, redness: 1 }, 'glabella-neuromodulator', { sourceLandmarks: points });
  const hidden = renderRecoveryIllustration(original, final,
    { id: 'immediate', effectProgress: 0, redness: 1 }, 'glabella-neuromodulator', { sourceLandmarks: points, showRecovery: false });
  samePixels(hidden, original, 'Neuromodulator must not smooth wrinkles immediately');
  assert.notEqual(Buffer.compare(Buffer.from(pixels(immediate)), Buffer.from(pixels(original))), 0, 'Local reaction did not render');
  for (const id of [107, 336, 66, 296, 33, 133, 263, 362]) {
    const x = Math.round(points[id].x * SIZE), y = Math.round(points[id].y * SIZE);
    assert.deepEqual(region(immediate, x - 3, y - 3, 7, 7), region(original, x - 3, y - 3, 7, 7), `Recovery altered eye or brow ${id}`);
  }
  const mid = renderRecoveryIllustration(original, final, { effectProgress: .5 }, 'glabella-neuromodulator');
  const value = region(mid, 300, 175, 1, 1)[0];
  assert.ok(value > 182 && value < 200, 'Developing effect must be between original and final');
  samePixels(renderRecoveryIllustration(original, final, { effectProgress: 1 }, 'glabella-neuromodulator'), final);
});

test('missing stages, invalid geometry and old four-argument callers fail safely', () => {
  const { original, finalCanvas, options } = fixture();
  for (const stage of [undefined, null, {}, { effectProgress: NaN, resultProgress: null }]) {
    samePixels(renderRecoveryIllustration(original, finalCanvas, stage, 'lip-filler'), finalCanvas);
    samePixels(renderRecoveryIllustration(original, finalCanvas, stage, 'facelift', null), finalCanvas);
  }
  const broken = options.resultLandmarks.map(p => ({ ...p }));
  broken[17].x = Infinity;
  const stage = { effectProgress: 1, swelling: 1, redness: 1, bruising: 1 };
  samePixels(renderRecoveryIllustration(original, finalCanvas, stage, 'lip-filler',
    { ...options, resultLandmarks: broken, showBruising: true }), finalCanvas, 'Invalid mesh must not invent a lip position');
  samePixels(renderRecoveryIllustration(original, finalCanvas, stage, 'lip-filler',
    { sourceLandmarks: [], resultLandmarks: [] }), finalCanvas);
  samePixels(renderRecoveryIllustration(original, finalCanvas, stage, 'lip-filler',
    { sourceLandmarks: new Array(468), resultLandmarks: new Array(468) }), finalCanvas);
  const irisPoints = [...points, ...points.slice(0, 10)];
  assert.doesNotThrow(() => renderRecoveryIllustration(original, finalCanvas,
    { effectProgress: .5, swelling: .5 }, 'lip-filler', { ...options, sourceLandmarks: irisPoints }));
  assert.equal(renderRecoveryIllustration(null, finalCanvas, stage, 'lip-filler'), finalCanvas);
  assert.equal(renderRecoveryIllustration(original, null, stage, 'lip-filler'), original);
});
