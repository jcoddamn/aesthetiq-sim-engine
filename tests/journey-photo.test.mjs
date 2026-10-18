import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const model = await readFile(new URL('../models/mediapipe_canonical_face.obj', import.meta.url), 'utf8');
const points = model.split('\n').filter(line => line.startsWith('v ')).map(line => {
  const [x, y, z] = line.split(/\s+/).slice(1).map(Number);
  return { x: 0.5 + x / 24, y: 0.5 - y / 24, z: -z / 24 };
});
const clonePoints = () => points.map(point => ({ ...point }));
const nextTurn = () => new Promise(resolve => setImmediate(resolve));
let harnessId = 0;

async function harness(t, { preload = true } = {}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    url: 'https://aesthetiq.example/journey.html', runScripts: 'outside-only'
  });
  const w = dom.window, instances = [], objectURLs = [];
  const oldGlobals = new Map(['window', 'document', 'URL', 'Image']
    .map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  class FakeFaceMesh {
    constructor(config) { this.config = config; this.sent = []; this.closed = 0; instances.push(this); }
    setOptions(options) { this.options = options; }
    onResults(callback) { this.callback = callback; }
    async send({ image }) { this.sent.push(image); }
    emit(landmarks) { this.callback({ multiFaceLandmarks: landmarks }); }
    async close() { this.closed++; }
  }
  if (preload) w.FaceMesh = FakeFaceMesh;
  w.URL.createObjectURL = file => { objectURLs.push(file); return 'blob:photo-test'; };
  w.URL.revokeObjectURL = () => {};
  Object.assign(globalThis, { window: w, document: w.document, URL: w.URL, Image: w.Image });
  const moduleURL = new URL('../js/journeyPhoto.js', import.meta.url);
  moduleURL.searchParams.set('test', String(++harnessId));
  const api = await import(moduleURL.href);
  const canvas = w.document.createElement('canvas');
  canvas.width = canvas.height = 600;
  t.after(async () => {
    // Finish a stalled script so its timeout cannot outlive the test.
    const script = w.document.querySelector('script');
    if (script?.onload) { w.FaceMesh = FakeFaceMesh; script.dispatchEvent(new w.Event('load')); }
    await api.releaseJourneyDetector();
    w.close();
    for (const [key, descriptor] of oldGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { api, w, canvas, instances, objectURLs, FakeFaceMesh };
}

test('clearing during model preload prevents a late script load from creating a detector', async t => {
  const h = await harness(t, { preload: false });
  const pending = h.api.detectJourneyFace(h.canvas, 'lip-filler');
  const cancelled = assert.rejects(pending, /Photo check cancelled/);
  const script = h.w.document.querySelector('script');
  assert.ok(script, 'the model script should be waiting to load');
  assert.equal(h.instances.length, 0);

  await h.api.releaseJourneyDetector();
  h.w.FaceMesh = h.FakeFaceMesh;
  script.dispatchEvent(new h.w.Event('load'));
  await cancelled;
  assert.equal(h.instances.length, 0, 'a cancelled preload must not construct or run FaceMesh');

  const retry = h.api.detectJourneyFace(h.canvas, 'lip-filler');
  await nextTurn();
  assert.equal(h.instances.length, 1, 'a new photo should still be able to start');
  assert.deepEqual(h.instances[0].sent, [h.canvas]);
  h.instances[0].emit([clonePoints()]);
  assert.equal((await retry).canvas, h.canvas);
});

test('callbacks from a closed detector cannot settle or replace a newer photo check', async t => {
  const h = await harness(t);
  const first = h.api.detectJourneyFace(h.canvas, 'lip-filler');
  const cancelled = assert.rejects(first, /Photo check cancelled/);
  await nextTurn();
  const oldDetector = h.instances[0];
  await h.api.releaseJourneyDetector();
  await cancelled;
  assert.equal(oldDetector.closed, 1);

  const nextCanvas = h.w.document.createElement('canvas');
  nextCanvas.width = nextCanvas.height = 600;
  const next = h.api.detectJourneyFace(nextCanvas, 'lip-filler');
  let settled = false;
  next.then(() => { settled = true; }, () => { settled = true; });
  await nextTurn();
  assert.equal(h.instances.length, 2);
  oldDetector.emit([clonePoints()]);
  await nextTurn();
  assert.equal(settled, false, 'an old result must not resolve the new capture');
  await assert.rejects(h.api.detectJourneyFace(h.canvas, 'lip-filler'), /Wait for the current photo/);

  const freshPoints = clonePoints();
  freshPoints[0].x += 0.001;
  h.instances[1].emit([freshPoints]);
  const capture = await next;
  assert.equal(capture.canvas, nextCanvas);
  assert.equal(capture.landmarks[0].x, freshPoints[0].x);
  oldDetector.emit([clonePoints()]);
  assert.equal(capture.landmarks[0].x, freshPoints[0].x);
});

test('FaceMesh checks for two faces and rejects a photo containing exactly two', async t => {
  const h = await harness(t);
  const pending = h.api.detectJourneyFace(h.canvas, 'glabella-neuromodulator');
  const rejected = assert.rejects(pending, /only one face/);
  await nextTurn();
  const detector = h.instances[0];
  assert.equal(detector.options.maxNumFaces, 2, 'a one-face limit would hide the second face');
  detector.emit([clonePoints(), clonePoints()]);
  await rejected;

  const retry = h.api.detectJourneyFace(h.canvas, 'glabella-neuromodulator');
  await nextTurn();
  detector.emit([clonePoints()]);
  assert.equal((await retry).landmarks.length, points.length);
});

test('a valid capture owns its landmark copy and normalizes missing depth', async t => {
  const h = await harness(t), sourcePoints = clonePoints();
  delete sourcePoints[42].z;
  sourcePoints[43].z = NaN;
  const pending = h.api.detectJourneyFace(h.canvas, 'lip-filler');
  await nextTurn();
  h.instances[0].emit([sourcePoints]);
  const capture = await pending;
  assert.equal(capture.canvas, h.canvas);
  assert.notEqual(capture.landmarks, sourcePoints);
  for (let i = 0; i < sourcePoints.length; i++) assert.notEqual(capture.landmarks[i], sourcePoints[i]);
  assert.equal(capture.landmarks[42].z, 0);
  assert.equal(capture.landmarks[43].z, 0);
  const savedLip = { ...capture.landmarks[61] };
  sourcePoints[61].x = 0;
  sourcePoints[61].y = 0;
  sourcePoints[61].z = 0;
  assert.deepEqual(capture.landmarks[61], savedLip, 'later detector mutations must not move a captured lip');
  capture.landmarks[291].x = 0;
  assert.equal(sourcePoints[291].x, points[291].x, 'capture edits must not mutate the detector result');
  assert.ok(Array.isArray(capture.warnings));
});

test('missing, oversized and unsupported files are rejected before opening an image', async t => {
  const h = await harness(t);
  await assert.rejects(h.api.loadJourneyPhoto(null), /Choose a photo first/);
  await assert.rejects(h.api.loadJourneyPhoto({ name: 'face.jpg', type: 'image/jpeg', size: 20 * 1024 * 1024 + 1 }), /under 20 MB/);
  await assert.rejects(h.api.loadJourneyPhoto({ name: 'face.svg', type: 'image/svg+xml', size: 1024 }), /JPEG, PNG or WebP/);
  assert.equal(h.objectURLs.length, 0, 'invalid files must not enter image decoding');
});
