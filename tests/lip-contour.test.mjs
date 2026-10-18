import test from 'node:test';
import assert from 'node:assert/strict';
import { smoothLowerLipDisplacement } from '../js/lipContour.js';

function lip() {
  const points = Array.from({ length: 468 }, () => ({ x: .5, y: .5, z: 0 }));
  // Uneven sides and a rounded center are part of this person's starting shape.
  for (const [id, x, y] of [[84, .46, .62], [17, .5, .65], [314, .54, .63],
    [87, .47, .57], [14, .5, .59], [317, .53, .58]]) points[id] = { x, y, z: 0 };
  return points;
}

test('zero added movement leaves an uneven lower-lip contour unchanged', () => {
  const original = lip();
  assert.deepEqual(smoothLowerLipDisplacement(original, original), original);
});

test('uniform added fullness keeps the original curvature and asymmetry', () => {
  const original = lip(), warped = original.map(p => ({ ...p, y: p.y + .02 }));
  const snapshot = structuredClone(warped);
  const result = smoothLowerLipDisplacement(original, warped);
  for (const id of [17, 14]) assert.ok(Math.abs(result[id].y - warped[id].y) < 1e-12);
  assert.deepEqual(warped, snapshot);
  assert.deepEqual(result[84], warped[84]);
  assert.deepEqual(result[314], warped[314]);
});

test('a new center spike is reduced without flattening the starting curve', () => {
  const original = lip(), warped = original.map(p => ({ ...p }));
  warped[17].y += .04;
  const result = smoothLowerLipDisplacement(original, warped);
  assert.ok(result[17].y > original[17].y && result[17].y < warped[17].y);
  for (let id = 0; id < 468; id++) if (id !== 17) assert.deepEqual(result[id], original[id]);
});
