// Synthetic pixels check the drawing path, not a clinical response.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { renderGlabellaPreview } from '../js/glabellaSimulation2D.js';
import { renderRecoveryIllustration } from '../js/recoveryIllustration2D.js';
import { getRecoveryStageAtDay } from '../js/recoveryTimeline.js';

globalThis.document = { createElement: () => createCanvas(1, 1) };
const SIZE = 600;
const landmarks = readFileSync(new URL('../models/mediapipe_canonical_face.obj', import.meta.url), 'utf8')
  .split('\n').filter(line => line.startsWith('v ')).map(line => {
    const [x, y, z] = line.split(/\s+/).slice(1).map(Number);
    return { x: .5 + x / 24, y: .5 - y / 24, z: -z / 24 };
  });
const pixels = canvas => Buffer.from(canvas.getContext('2d')
  .getImageData(0, 0, canvas.width, canvas.height).data);
const same = (a, b, message) => assert.deepEqual(pixels(a), pixels(b), message);

function face(severity) {
  const canvas = createCanvas(SIZE, SIZE), context = canvas.getContext('2d');
  const image = context.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const gate = Math.max(0, Math.min(1, (y - 146) / 12))
      * Math.max(0, Math.min(1, (217 - y) / 12));
    const shadow = severity * (Math.exp(-((x - 289) ** 2) / 13)
      + Math.exp(-((x - 311) ** 2) / 13)) * gate;
    const tone = ((x + y) % 2 ? 3 : -3) + x * .016 + y * .006 - shadow;
    const offset = (y * SIZE + x) * 4;
    for (let channel = 0; channel < 3; channel++) {
      image.data[offset + channel] = [184, 145, 119][channel] + tone;
    }
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

function creaseValue(canvas) {
  const data = pixels(canvas);
  let sum = 0, count = 0;
  for (const x of [289, 311]) for (let y = 177; y < 201; y++) {
    sum += data[(y * SIZE + x) * 4]; count++;
  }
  return sum / count;
}

function renderDay(source, final, day, recovery = false) {
  return renderRecoveryIllustration(source, final,
    getRecoveryStageAtDay('glabella-neuromodulator', day, { productId: 'botox', optionId: 'botox' }),
    'glabella-neuromodulator', {
      sourceLandmarks: landmarks, resultLandmarks: landmarks,
      showRecovery: recovery, showBruising: recovery
    });
}

function assertProtectedRegions(source, rendered) {
  for (const id of [33, 133, 263, 362, 107, 336, 55, 285]) {
    const x = Math.round(landmarks[id].x * SIZE), y = Math.round(landmarks[id].y * SIZE);
    const patch = canvas => Buffer.from(canvas.getContext('2d').getImageData(x - 2, y - 2, 5, 5).data);
    const before = patch(source), after = patch(rendered);
    const difference = Math.max(...before.map((value, index) => Math.abs(value - after[index])));
    // Canvas alpha blending can round an unchanged channel by one level.
    assert.ok(difference <= 1, `Eye or brow ${id} changed by ${difference}`);
  }
}

test('both BOTOX expression views develop and recede through the actual timeline', () => {
  for (const expression of ['neutral', 'frown']) {
    const source = face(expression === 'neutral' ? 24 : 48);
    const originalBytes = pixels(source), baseline = creaseValue(source);
    for (const level of ['natural', 'balanced', 'enhanced']) {
      const result = renderGlabellaPreview(source, landmarks, { expression, level });
      assert.equal(result.quality.valid, true);
      const values = new Map();
      for (const day of [0, 2, 7, 14, 30, 90, 120]) {
        const rendered = renderDay(source, result.canvas, day);
        if (day === 0) same(rendered, source, `${expression}/${level}: same-day lines changed`);
        if (day === 30) same(rendered, result.canvas, `${expression}/${level}: full-effect drawing differs`);
        values.set(day, creaseValue(rendered) - baseline);
        assertProtectedRegions(source, rendered);
        rendered.width = 1;
      }
      for (const [earlier, later] of [[0, 2], [2, 7], [7, 14], [14, 30]]) {
        assert.ok(values.get(later) >= values.get(earlier), `${expression}/${level}: effect went backwards at day ${later}`);
      }
      assert.ok(values.get(30) > 0, `${expression}/${level}: no visible effect`);
      assert.ok(values.get(90) < values.get(30), `${expression}/${level}: day 90 did not move toward baseline`);
      assert.ok(values.get(120) < values.get(90), `${expression}/${level}: day 120 did not move toward baseline`);
      assert.ok(values.get(120) >= 0, `${expression}/${level}: lines became stronger than baseline`);
      result.canvas.width = 1;
    }
    assert.deepEqual(pixels(source), originalBytes, 'The source capture changed');
    source.width = 1;
  }
});

test('recovery toggles preserve partial onset and repeat scrubbing restores the same pixels', () => {
  const source = face(48), originalBytes = pixels(source);
  const final = renderGlabellaPreview(source, landmarks, { expression: 'frown' }).canvas;
  const finalBytes = pixels(final);
  const withRecovery = renderDay(source, final, 2, true);
  const hidden = renderDay(source, final, 2, false);
  assert.notDeepEqual(pixels(withRecovery), pixels(hidden), 'The reaction toggle had no visible effect');
  assert.ok(creaseValue(hidden) > creaseValue(source), 'Hiding reactions removed the developing effect');
  assert.ok(creaseValue(hidden) < creaseValue(final), 'Hiding reactions jumped to full effect');
  for (const day of [30, 120, 0, 7]) renderDay(source, final, day, true).width = 1;
  const restored = renderDay(source, final, 2, true);
  const hiddenAgain = renderDay(source, final, 2, false);
  same(restored, withRecovery, 'Returning to day 2 changed the recovery drawing');
  same(hiddenAgain, hidden, 'Toggling recovery changed the developing effect');
  assert.deepEqual(pixels(source), originalBytes);
  assert.deepEqual(pixels(final), finalBytes);
  for (const canvas of [source, final, withRecovery, hidden, restored, hiddenAgain]) canvas.width = 1;
});
