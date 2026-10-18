import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCanvas, ImageData } from '@napi-rs/canvas';
import { runProcedureSimulationFromLandmarks } from '../js/simulationPipeline.js';

globalThis.document = { createElement: () => createCanvas(1, 1) };
globalThis.ImageData = ImageData;

const canonical = readFileSync(new URL('../models/mediapipe_canonical_face.obj', import.meta.url), 'utf8')
  .split('\n').filter(line => line.startsWith('v ')).map(line => {
    const [x, y, z] = line.split(/\s+/).slice(1).map(Number);
    return { x: .5 + x / 24, y: .5 - y / 24, z: -z / 24 };
  });

const outerLip = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291,
  375, 321, 405, 314, 17, 84, 181, 91, 146];
const innerLip = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308,
  324, 318, 402, 317, 14, 87, 178, 88, 95];

function fixture(extraRoundness, { width = 480, height = 480, angle = 0, closed = false } = {}) {
  let points = canonical.map(point => ({ ...point }));
  points[17].y += extraRoundness;
  for (const id of [84, 314]) points[id].y += extraRoundness * .5;
  for (const id of [181, 405]) points[id].y += extraRoundness * .15;

  if (closed) {
    const upper = [191, 80, 81, 82, 13, 312, 311, 310, 415];
    const lower = [95, 88, 178, 87, 14, 317, 402, 318, 324];
    upper.forEach((id, i) => {
      for (const axis of ['x', 'y']) {
        points[id][axis] = points[lower[i]][axis] = (points[id][axis] + points[lower[i]][axis]) / 2;
      }
    });
  }
  const cos = Math.cos(angle), sin = Math.sin(angle);
  points = points.map(point => ({ ...point,
    x: .5 + ((point.x - .5) * cos - (point.y - .5) * sin) * 480 / width,
    y: .5 + ((point.x - .5) * sin + (point.y - .5) * cos) * 480 / height,
    z: point.z * 480 / width
  }));

  const canvas = createCanvas(width, height), ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c9a68f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const fill = (ids, color) => {
    ctx.beginPath();
    ids.forEach((id, i) => ctx[i ? 'lineTo' : 'moveTo'](points[id].x * width, points[id].y * height));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  fill(outerLip, '#954553');
  fill(innerLip, '#eee9e5');
  return { canvas, points };
}

function simulate({ canvas, points }, lipStyle = 'classic') {
  return runProcedureSimulationFromLandmarks({
    procedure: 'lip-filler', procedureOption: 'hyaluronic-acid',
    lipStyle, fillerProduct: 'provider', fillerGoal: 'balanced',
    landmarks: points, imageSource: canvas,
    anatomyProfile: { anatomyStrength: 1, measurements: { lipHeight: .03, mouthWidth: .12, lipProjection: .055 } },
    tissueModel: { elasticity: 1, projectionResistance: 1, skinMobility: 1 }
  });
}

const lowerThickness = points => (points[17].y - points[14].y) * 480;
const lowerCurvature = points => (points[17].y - (points[84].y + points[314].y) / 2) * 480;

// These are synthetic shapes. They check preservation of the starting anatomy,
// not the size of a clinical outcome from a published photograph.
for (const [name, roundness] of [['canonical', 0], ['rounded', .005], ['fuller centre', .01]]) {
  test(`Classic filler preserves the ${name} lower-lip contour`, t => {
    t.mock.method(console, 'log', () => {});
    t.mock.method(console, 'debug', () => {});
    const { canvas, points } = fixture(roundness);
    const snapshot = structuredClone(points);
    const result = simulate({ canvas, points });
    const thicknesses = [];
    for (const level of ['natural', 'balanced', 'enhanced']) {
      const moved = result.landmarksByLevel[level];
      const thickness = lowerThickness(moved);
      assert.ok(thickness > lowerThickness(points),
        `${level} thinned the lower lip from ${lowerThickness(points).toFixed(3)} to ${thickness.toFixed(3)} px`);
      assert.ok(lowerCurvature(moved) >= lowerCurvature(points) - 1e-8,
        `${level} flattened the original lower-lip curve`);
      assert.equal(result.quality[level].warp.valid, true);
      thicknesses.push(thickness);
    }
    assert.ok(thicknesses[0] < thicknesses[1] && thicknesses[1] < thicknesses[2],
      'Increasing intensity should increase lower-lip fullness');
    assert.deepEqual(points, snapshot, 'Rendering must leave the original landmarks intact');
  });
}

for (const closed of [true, false]) {
  test(`Classic filler keeps an initially ${closed ? 'closed' : 'open'} mouth in the same position`, t => {
    t.mock.method(console, 'log', () => {});
    t.mock.method(console, 'debug', () => {});
    const source = fixture(.005, { closed });
    const result = simulate(source);
    for (const level of ['natural', 'balanced', 'enhanced']) {
      const moved = result.landmarksByLevel[level];
      for (const id of innerLip) for (const axis of ['x', 'y']) {
        assert.ok(Math.abs(moved[id][axis] - source.points[id][axis]) < 1e-10,
          `${level} moved mouth-opening landmark ${id} on ${axis}`);
      }
      assert.ok(lowerThickness(moved) > lowerThickness(source.points),
        'Lip tissue should grow around the original mouth opening');
    }
  });
}

test('Classic style aliases and fallbacks preserve the same mouth geometry', t => {
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'debug', () => {});
  const source = fixture(.005, { closed: true });
  const classic = simulate(source);
  for (const style of ['Classic', ' classic ', '', null, 'unknown']) {
    const result = simulate(source, style);
    for (const level of ['natural', 'balanced', 'enhanced']) {
      assert.deepEqual(result.landmarksByLevel[level], classic.landmarksByLevel[level],
        `The Classic fallback for ${JSON.stringify(style)} changed the mouth geometry`);
    }
  }
  const keyhole = simulate(source, 'keyhole');
  assert.notDeepEqual(keyhole.landmarksByLevel.balanced, classic.landmarksByLevel.balanced,
    'Resolving Classic must not collapse other styles into the same shape');
});

test('the settled Classic render preserves the original teeth pixels', t => {
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'debug', () => {});
  const source = fixture(.005);
  const { points, canvas } = source;
  const left = Math.ceil(Math.max(points[82].x, points[87].x) * 480) + 3;
  const right = Math.floor(Math.min(points[312].x, points[317].x) * 480) - 3;
  const top = Math.ceil(Math.max(points[82].y, points[13].y, points[312].y) * 480) + 3;
  const bottom = Math.floor(Math.min(points[87].y, points[14].y, points[317].y) * 480) - 3;
  const width = right - left, height = bottom - top;
  assert.ok(width >= 10 && height >= 3, 'The tooth patch needs a margin inside the mouth contour');

  // Small tooth seams make stretching visible without sampling the lip edge.
  const ctx = canvas.getContext('2d');
  for (let x = left; x < right; x += 3) {
    ctx.fillStyle = x % 2 ? '#908b87' : '#bbb5b0';
    ctx.fillRect(x, top, 1, height);
  }
  const patch = view => Buffer.from(view.getContext('2d').getImageData(left, top, width, height).data);
  const originalTeeth = patch(canvas);
  const result = simulate(source);
  for (const level of ['natural', 'balanced', 'enhanced']) {
    assert.deepEqual(patch(result[`${level}Canvas`]), originalTeeth,
      `${level} stretched or repainted the original teeth`);
  }
});

test('Classic lip changes follow the mouth when the same portrait is tilted or reframed', t => {
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'debug', () => {});
  const original = fixture(.005);
  const baseline = simulate(original);
  for (const [width, height] of [[480, 480], [480, 640], [640, 480]]) {
    for (const degrees of [-20, -10, 10, 20]) {
      const angle = degrees * Math.PI / 180;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const source = fixture(.005, { width, height, angle });
      const result = simulate(source);
      for (const level of ['natural', 'balanced', 'enhanced']) {
        const moved = result.landmarksByLevel[level];
        for (let i = 0; i < moved.length; i++) {
          const dx = (moved[i].x - source.points[i].x) * width;
          const dy = (moved[i].y - source.points[i].y) * height;
          const actual = { x: dx * cos + dy * sin, y: -dx * sin + dy * cos,
            z: (moved[i].z - source.points[i].z) * width };
          for (const axis of ['x', 'y', 'z']) {
            const expected = (baseline.landmarksByLevel[level][i][axis] - original.points[i][axis]) * 480;
            assert.ok(Math.abs(actual[axis] - expected) < 1e-8,
              `${level}, ${width}x${height}, ${degrees}°: landmark ${i} ${axis} changed with head roll`);
          }
        }
        assert.equal(result.quality[level].warp.valid, true);
      }
    }
  }
});
