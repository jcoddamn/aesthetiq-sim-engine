import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, ImageData } from '@napi-rs/canvas';
import { runProcedureSimulationFromLandmarks } from '../js/simulationPipeline.js';
import { getRecoveryTimeline } from '../js/recoveryTimeline.js';
import { renderRecoveryIllustration } from '../js/recoveryIllustration2D.js';

globalThis.document = { createElement: () => createCanvas(1, 1) };
globalThis.ImageData = ImageData;
const canonical = readFileSync(new URL('../models/mediapipe_canonical_face.obj', import.meta.url), 'utf8')
  .split('\n').filter(line => line.startsWith('v ')).map(line => {
    const [x, y, z] = line.split(/\s+/).slice(1).map(Number);
    return { x: .5 + x / 24, y: .5 - y / 24, z: -z / 24 };
  });
const outer = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];
const inner = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
const scenarios = [
  { id: 'light-portrait', width: 480, height: 640, skin: [201, 166, 143], lips: [149, 69, 83] },
  { id: 'medium-landscape', width: 640, height: 480, skin: [118, 80, 60], lips: [75, 36, 48] },
  { id: 'deep-square', width: 480, height: 480, skin: [71, 48, 35], lips: [48, 22, 35] }
];

function fixture({ width, height, skin, lips }) {
  const canvas = createCanvas(width, height), ctx = canvas.getContext('2d');
  const scale = 460;
  const points = canonical.map(p => ({ ...p, x: .5 + (p.x - .5) * scale / width,
    y: .5 + (p.y - .5) * scale / height, z: p.z * scale / width }));
  const data = ctx.createImageData(width, height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 4;
    const shade = Math.sin(x * .13) * 1.6 + Math.cos(y * .17) * 1.4 + ((x * 17 + y * 31) % 7 - 3) * .5;
    for (let c = 0; c < 3; c++) data.data[offset + c] = skin[c] + shade;
    data.data[offset + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  const path = ids => {
    ctx.beginPath();
    ids.forEach((id, i) => ctx[i ? 'lineTo' : 'moveTo'](points[id].x * width, points[id].y * height));
    ctx.closePath();
  };
  ctx.fillStyle = `rgb(${lips.join(',')})`; path(outer); ctx.fill();
  ctx.save(); path(outer); ctx.clip();
  ctx.strokeStyle = 'rgba(230,230,230,.12)'; ctx.lineWidth = .6;
  for (let x = width / 2 - 55; x < width / 2 + 55; x += 5) {
    ctx.beginPath(); ctx.moveTo(x, height / 2 + 60); ctx.lineTo(x + 2, height / 2 + 115); ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#eee9e5'; path(inner); ctx.fill();
  ctx.save(); path(inner); ctx.clip();
  ctx.fillStyle = '#9f9994';
  for (let x = width / 2 - 42; x < width / 2 + 42; x += 10) ctx.fillRect(x, height / 2 + 60, 1, 60);
  ctx.restore();
  ctx.fillStyle = '#2e2019';
  for (const id of [107, 336, 66, 296, 33, 133, 263, 362]) {
    ctx.beginPath(); ctx.ellipse(points[id].x * width, points[id].y * height, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
  }
  return { canvas, points };
}

const pixels = canvas => canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
const same = (a, b) => Buffer.compare(Buffer.from(pixels(a)), Buffer.from(pixels(b))) === 0;
function lipArea(canvas) {
  const data = pixels(canvas);
  let count = 0;
  for (let i = 0; i < data.length; i += 4) if (data[i + 2] - data[i + 1] > 6) count++;
  return count;
}
function mouthBands(canvas, x, top, bottom) {
  const data = pixels(canvas);
  let bands = 0, inside = false;
  for (let y = top; y < bottom; y++) {
    const offset = (y * canvas.width + x) * 4;
    const lip = data[offset + 2] - data[offset + 1] > 6;
    if (lip && !inside) bands++;
    inside = lip;
  }
  return bands;
}

for (const scenario of scenarios) test(`${scenario.id}: every intensity keeps one lip contour through recovery`, t => {
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'debug', () => {});
  const { canvas: original, points } = fixture(scenario);
  const result = runProcedureSimulationFromLandmarks({ procedure: 'lip-filler', landmarks: points, imageSource: original });
  const stages = getRecoveryTimeline('lip-filler');
  const beforeStage = stages.find(stage => stage.id === 'before');
  const earlyStage = stages.find(stage => stage.id === 'early');
  const settledStage = stages.find(stage => stage.id === 'final');
  const originalArea = lipArea(original), areas = [];
  const examples = [['Before', original]];
  for (const level of ['natural', 'balanced', 'enhanced']) {
    const final = result[`${level}Canvas`], resultPoints = result.landmarksByLevel[level];
    const options = { sourceLandmarks: points, resultLandmarks: resultPoints };
    const before = renderRecoveryIllustration(original, final, beforeStage, 'lip-filler', options);
    const early = renderRecoveryIllustration(original, final, earlyStage, 'lip-filler', options);
    const settled = renderRecoveryIllustration(original, final, settledStage, 'lip-filler', options);
    const area = lipArea(final); areas.push(area);
    assert.ok(area > originalArea * 1.01, `${level} did not produce a fuller lip shape`);
    assert.ok(lipArea(early) > area * 1.015, `${level} swelling is missing`);
    assert.ok(same(before, original), `${level} changed the before photo`);
    assert.ok(same(settled, final), `${level} lost the treatment shape after settling`);
    assert.ok(same(renderRecoveryIllustration(original, final, earlyStage, 'lip-filler', { ...options, showRecovery: false }), final));
    const mouthTop = Math.floor(points[0].y * scenario.height - 18);
    const mouthBottom = Math.ceil(points[17].y * scenario.height + 20);
    for (const view of [final, early]) for (const offset of [-12, 0, 12]) {
      assert.equal(mouthBands(view, scenario.width / 2 + offset, mouthTop, mouthBottom), 2,
        `${level} left an extra contour or a gap inside the upper/lower lip`);
    }
    const toothY = Math.round((resultPoints[13].y + resultPoints[14].y) * scenario.height / 2);
    const patch = canvas => Buffer.from(canvas.getContext('2d').getImageData(scenario.width / 2 - 8, toothY - 1, 16, 3).data);
    assert.deepEqual(patch(early), patch(final), `${level} recovery distorted teeth`);
    for (const id of [107, 336, 66, 296, 33, 133, 263, 362]) {
      const x = Math.round(points[id].x * scenario.width), y = Math.round(points[id].y * scenario.height);
      const sample = canvas => Buffer.from(canvas.getContext('2d').getImageData(x - 4, y - 3, 9, 7).data);
      assert.deepEqual(sample(early), sample(original), `${level} altered the eye/brow marker ${id}`);
    }
    if (level === 'balanced') examples.push(['Early swelling example', early], ['Settled', settled]);
  }
  assert.ok(areas[0] < areas[1] && areas[1] < areas[2], 'Intensity order is not visible in the lip contour');
  if (process.env.AESTHETIQ_QA_OUTPUT) {
    mkdirSync(process.env.AESTHETIQ_QA_OUTPUT, { recursive: true });
    const sheet = createCanvas(900, 240), ctx = sheet.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 900, 240);
    ctx.font = '16px sans-serif';
    examples.forEach(([label, view], i) => {
      ctx.fillStyle = '#222'; ctx.fillText(label, i * 300 + 12, 23);
      ctx.drawImage(view, scenario.width / 2 - 70, scenario.height / 2 + 38, 140, 90, i * 300 + 10, 40, 280, 180);
    });
    writeFileSync(join(process.env.AESTHETIQ_QA_OUTPUT, `${scenario.id}.png`), sheet.toBuffer('image/png'));
  }
});

test('the same face gets the same lip change in portrait, landscape and padded photos', t => {
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'debug', () => {});
  const sizes = [[480, 480], [480, 640], [640, 480], [720, 960]];
  const references = new Map();
  for (const [width, height] of sizes) {
    const { canvas, points } = fixture({ ...scenarios[0], width, height });
    const result = runProcedureSimulationFromLandmarks({
      procedure: 'lip-filler', landmarks: points, imageSource: canvas,
      anatomyProfile: { anatomyStrength: 1.08, measurements: { lipHeight: .03, mouthWidth: .12, lipProjection: .055 } },
      tissueModel: { elasticity: 1.03, projectionResistance: 1.06, skinMobility: 1.1 }
    });
    for (const level of ['natural', 'balanced', 'enhanced']) {
      const output = result[`${level}Canvas`];
      assert.equal(output.width, width); assert.equal(output.height, height);
      const moved = result.landmarksByLevel[level];
      const displacements = moved.map((p, i) => ({
        x: (p.x - points[i].x) * width,
        y: (p.y - points[i].y) * height,
        z: (p.z - points[i].z) * width
      }));
      if (!references.has(level)) references.set(level, displacements);
      else for (let i = 0; i < moved.length; i++) for (const axis of ['x', 'y', 'z']) {
        assert.ok(Math.abs(displacements[i][axis] - references.get(level)[i][axis]) < 1e-8,
          `${level} ${width}x${height}: landmark ${i} ${axis} changed with framing (${displacements[i][axis]} vs ${references.get(level)[i][axis]})`);
      }
      assert.equal(result.quality[level].warp.valid, true, `${level} frame normalization failed its geometry check`);
      assert.ok(moved.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1),
        'Output landmarks must stay in the original image coordinates');
    }
  }
});
