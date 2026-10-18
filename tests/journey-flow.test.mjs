// These tests exercise browser-state handling with a mocked face detector.
// Synthetic images do not validate MediaPipe accuracy or clinical outcomes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { createCanvas, ImageData } from '@napi-rs/canvas';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const model = await read('models/mediapipe_canonical_face.obj');
const points = model.split('\n').filter(line => line.startsWith('v ')).map(line => {
  const [x, y, z] = line.split(/\s+/).slice(1).map(Number);
  return { x: 0.5 + x / 24, y: 0.5 - y / 24, z: -z / 24 };
});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

async function harness(procedure = 'lip-filler') {
  const dom = new JSDOM(await read('journey.html'), {
    url: `https://aesthetiq.example/journey.html?procedure=${procedure}`,
    runScripts: 'outside-only'
  });
  const w = dom.window, d = w.document, canvases = new WeakMap(), frames = new Map();
  const downloads = [], encodings = [], exportLabels = [];
  let frameId = 0;
  const oldGlobals = new Map(['document', 'window', 'ImageData', 'requestAnimationFrame', 'cancelAnimationFrame']
    .map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const backing = element => {
    if (!(element instanceof w.HTMLCanvasElement)) return element;
    let canvas = canvases.get(element);
    if (!canvas || canvas.width !== element.width || canvas.height !== element.height) {
      canvas = createCanvas(element.width || 1, element.height || 1); canvases.set(element, canvas);
    }
    return canvas;
  };
  w.HTMLCanvasElement.prototype.getContext = function (kind) {
    const ctx = backing(this).getContext(kind);
    return new Proxy(ctx, {
      get(target, key) {
        if (key === 'drawImage') return (source, ...args) => target.drawImage(backing(source), ...args);
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set(target, key, value) { target[key] = value; return true; }
    });
  };
  w.HTMLCanvasElement.prototype.toBlob = function (callback) {
    const bytes = backing(this).toBuffer('image/png');
    const entry = { bytes, resolve: () => callback(new w.Blob([bytes], { type: 'image/png' })),
      reject: () => callback(null) };
    encodings.push(entry);
    if (!h.delayEncoding) queueMicrotask(entry.resolve);
  };
  w.HTMLAnchorElement.prototype.click = function () { downloads.push({ href: this.href, filename: this.download }); };
  w.URL.createObjectURL = () => 'blob:journey-test-' + encodings.length;
  w.URL.revokeObjectURL = () => {};
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.HTMLMediaElement.prototype.play = async function () {};
  w.HTMLMediaElement.prototype.pause = function () {};
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; };
  w.matchMedia = () => ({ matches: false });
  w.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
  w.cancelAnimationFrame = id => frames.delete(id);
  Object.assign(globalThis, { document: d, window: w, ImageData,
    requestAnimationFrame: w.requestAnimationFrame, cancelAnimationFrame: w.cancelAnimationFrame });
  const h = { dom, w, d, backing, downloads, encodings, exportLabels, delayEncoding: false,
    readPhoto: async () => h.photo(), detect: async canvas => ({ canvas,
      landmarks: points.map(p => ({ ...p })), warnings: [] }),
    release: async () => {}, camera: async () => ({ getTracks: () => [] }) };
  Object.defineProperty(w.navigator, 'mediaDevices', { configurable: true,
    value: { getUserMedia: constraints => h.camera(constraints) } });
  let source = await read('js/journeyPage.js');
  for (const match of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];?/g)) {
    const imported = await import(new URL('../js/' + match[2].replace(/^\.\//, ''), import.meta.url));
    for (const name of match[1].split(',').map(value => value.trim())) w[name] = imported[name];
  }
  w.loadJourneyPhoto = file => h.readPhoto(file);
  w.detectJourneyFace = (canvas, id) => h.detect(canvas, id);
  w.releaseJourneyDetector = () => h.release();
  const exportCanvas = w.createComparisonCanvas;
  w.createComparisonCanvas = (original, preview, label, options) => {
    exportLabels.push({ label, width: original.width, height: original.height });
    return exportCanvas(original, preview, label, options);
  };
  source = source.replace(/import\s*\{[^}]+\}\s*from\s*['"][^'"]+['"];?/g, '')
    .replace(/export function /g, 'function ');
  w.eval(source);
  h.photo = (severity = 0) => {
    const canvas = d.createElement('canvas'); canvas.width = 600; canvas.height = 600;
    const ctx = canvas.getContext('2d'), image = ctx.createImageData(600, 600);
    for (let y = 0; y < 600; y++) for (let x = 0; x < 600; x++) {
      const gate = Math.max(0, Math.min(1, (y - 146) / 12)) * Math.max(0, Math.min(1, (217 - y) / 12));
      const shadow = severity * (Math.exp(-((x - 289) ** 2) / 13) + Math.exp(-((x - 311) ** 2) / 13)) * gate;
      const tone = ((x + y) % 2 ? 3 : -3) + x * 0.016 + y * 0.006 - shadow;
      const i = (y * 600 + x) * 4;
      for (let c = 0; c < 3; c++) image.data[i + c] = [184, 145, 119][c] + tone;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    ctx.fillStyle = '#7d3d44'; ctx.beginPath();
    [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146]
      .forEach((id, i) => ctx[i ? 'lineTo' : 'moveTo'](points[id].x * 600, points[id].y * 600));
    ctx.closePath(); ctx.fill();
    return canvas;
  };
  h.tick = async () => {
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(callback => callback(w.performance.now()));
    await new Promise(resolve => setTimeout(resolve, 0));
  };
  h.until = async condition => {
    for (let i = 0; i < 35 && !condition(); i++) await h.tick();
    assert.ok(condition(), 'UI did not settle: ' + d.getElementById('captureStatus').textContent);
  };
  h.upload = (slot = 'neutral', photo = h.photo()) => {
    h.readPhoto = () => Promise.resolve(photo);
    d.querySelector(`[data-upload="${slot}"]`).click();
    const input = d.getElementById('journeyPhotoInput');
    Object.defineProperty(input, 'files', { configurable: true, value: [new w.File(['test'], 'face.png', { type: 'image/png' })] });
    input.dispatchEvent(new w.Event('change', { bubbles: true }));
  };
  h.consent = () => {
    const checkbox = d.getElementById('journeyConsent'); checkbox.checked = true;
    checkbox.dispatchEvent(new w.Event('change', { bubbles: true }));
  };
  h.ready = async () => {
    h.upload(); await h.until(() => d.getElementById('neutralBadge').textContent === 'Photo ready');
    if (procedure !== 'lip-filler') { h.upload('frown', h.photo(48)); await h.until(() => d.getElementById('frownBadge').textContent === 'Photo ready'); }
    h.consent(); d.getElementById('generateJourney').click();
    await h.until(() => !d.getElementById('journeyResults').hidden);
  };
  h.close = () => {
    d.getElementById('clearJourney').click(); frames.clear(); w.close();
    for (const [key, descriptor] of oldGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  };
  return h;
}

test('lip journey gates consent and exports the chosen close-up, day and intensity', async () => {
  const h = await harness();
  try {
    h.upload(); await h.until(() => h.d.getElementById('neutralBadge').textContent === 'Photo ready');
    assert.equal(h.d.getElementById('generateJourney').disabled, true);
    h.consent(); h.d.getElementById('generateJourney').click();
    await h.until(() => !h.d.getElementById('journeyResults').hidden);
    const slider = h.d.getElementById('journeyDaySlider'); slider.value = 13;
    slider.dispatchEvent(new h.w.Event('input', { bubbles: true }));
    h.d.querySelector('[data-intensity="enhanced"]').click();
    h.d.querySelector('[data-crop="detail"]').click();
    assert.equal(h.d.getElementById('saveJourneyComparison').disabled, true);
    await h.tick();
    assert.match(h.d.getElementById('previewCaption').textContent, /Day 13.*Enhanced/);
    assert.ok(h.d.getElementById('journeyPreview').width < 600);
    assert.equal(h.d.getElementById('journeyOriginal').width, h.d.getElementById('journeyPreview').width);
    h.d.getElementById('saveJourneyComparison').click();
    await h.until(() => h.downloads.length === 1);
    assert.match(h.downloads[0].filename, /lip-filler-neutral-day-13\.png$/);
    assert.match(h.exportLabels[0].label, /Enhanced.*Relaxed lips.*Day 13.*Close-up.*Visual example/);
    assert.ok(h.encodings[0].bytes.length > 1000);
  } finally { h.close(); }
});

test('a late face check cannot restore a cleared capture', async () => {
  const h = await harness(), pending = deferred();
  let detected;
  try {
    h.detect = canvas => { detected = canvas; return pending.promise; };
    h.upload(); await h.until(() => !!detected);
    h.d.getElementById('clearJourney').click();
    pending.resolve({ canvas: detected, landmarks: points, warnings: [] });
    await h.tick();
    assert.equal(h.d.getElementById('neutralThumbnail').hidden, true);
    assert.equal(h.d.getElementById('generateJourney').disabled, true);
    assert.equal(h.d.getElementById('journeyConsent').checked, false);
    assert.equal(detected.width, 1);
    assert.match(h.d.getElementById('captureStatus').textContent, /Photos cleared/);
  } finally { h.close(); }
});

test('a failed thumbnail cannot leave a freed capture eligible for generation', async () => {
  const h = await harness();
  try {
    h.d.getElementById('neutralThumbnail').getContext = () => null;
    h.upload(); await h.until(() => h.d.getElementById('captureStatus').classList.contains('is-error'));
    h.consent();
    assert.equal(h.d.getElementById('generateJourney').disabled, true);
    assert.equal(h.d.getElementById('neutralBadge').textContent, 'Photo needed');
  } finally { h.close(); }
});

test('camera cancellation stops a late stream and page exit stops an active stream', async () => {
  const h = await harness(), pending = deferred();
  let oldStopped = 0, currentStopped = 0;
  try {
    h.camera = () => pending.promise;
    h.d.querySelector('[data-camera="neutral"]').click();
    assert.equal(h.d.getElementById('journeyCameraDialog').open, true);
    h.d.getElementById('closeJourneyCamera').click();
    pending.resolve({ getTracks: () => [{ stop: () => oldStopped++ }] });
    await h.tick();
    assert.equal(oldStopped, 1);
    assert.equal(h.d.getElementById('journeyCameraDialog').open, false);
    h.camera = async () => ({ getTracks: () => [{ stop: () => currentStopped++ }] });
    h.d.querySelector('[data-camera="neutral"]').click();
    await h.until(() => !h.d.getElementById('takeJourneyPhoto').disabled);
    h.w.dispatchEvent(new h.w.Event('pagehide'));
    assert.equal(currentStopped, 1);
    assert.equal(h.d.getElementById('journeyCamera').srcObject, null);
    assert.equal(h.d.getElementById('journeyCameraDialog').open, false);
  } finally { h.close(); }
});

test('changing the view or clearing photos cancels a pending comparison export', async () => {
  const h = await harness();
  try {
    await h.ready(); h.delayEncoding = true;
    h.d.getElementById('saveJourneyComparison').click();
    assert.equal(h.encodings.length, 1);
    h.d.getElementById('jumpToSettled').click(); await h.tick();
    assert.equal(h.d.getElementById('saveJourneyComparison').disabled, true);
    h.encodings[0].resolve(); await h.tick();
    assert.equal(h.downloads.length, 0);
    assert.equal(h.d.getElementById('saveJourneyComparison').disabled, false);
    h.d.getElementById('saveJourneyComparison').click();
    assert.equal(h.encodings.length, 2);
    h.d.getElementById('clearJourney').click();
    h.encodings[1].resolve(); await h.tick();
    assert.equal(h.downloads.length, 0);
    assert.equal(h.d.getElementById('journeyResults').hidden, true);
    assert.equal(h.d.getElementById('saveJourneyComparison').disabled, true);
    assert.doesNotMatch(h.d.getElementById('renderStatus').textContent, /saved/i);
  } finally { h.close(); }
});

test('invalid alternate strengths stay disabled instead of reusing an earlier preview', async () => {
  const h = await harness();
  try {
    const render = h.w.runProcedureSimulationFromLandmarks;
    h.w.runProcedureSimulationFromLandmarks = options => {
      const result = render(options);
      result.quality.enhanced = { valid: false, reason: 'A clearer photo is needed.', warnings: [] };
      return result;
    };
    await h.ready();
    assert.equal(h.d.querySelector('[data-intensity="enhanced"]').disabled, true);
    assert.equal(h.d.querySelector('[data-intensity="balanced"]').getAttribute('aria-pressed'), 'true');
    assert.match(h.d.getElementById('previewCaption').textContent, /Balanced/);
  } finally { h.close(); }
});

test('the frown journey rejects duplicate photos, accepts a new expression and keeps same-day lines', async () => {
  const h = await harness('glabella-neuromodulator');
  try {
    h.upload(); await h.until(() => h.d.getElementById('neutralBadge').textContent === 'Photo ready');
    h.upload('frown'); await h.until(() => h.d.getElementById('frownBadge').textContent === 'Photo ready');
    h.consent(); h.d.getElementById('generateJourney').click();
    await h.until(() => h.d.getElementById('captureStatus').classList.contains('is-error'));
    assert.equal(h.d.getElementById('journeyResults').hidden, true);
    assert.match(h.d.getElementById('captureStatus').textContent, /same photo/i);
    h.upload('frown', h.photo(48)); await h.until(() => h.d.getElementById('frownBadge').textContent === 'Photo ready');
    h.d.getElementById('generateJourney').click();
    await h.until(() => !h.d.getElementById('journeyResults').hidden);
    const reaction = h.d.getElementById('showJourneyRecovery'); reaction.checked = false;
    reaction.dispatchEvent(new h.w.Event('change', { bubbles: true })); await h.tick();
    const bytes = id => h.backing(h.d.getElementById(id)).getContext('2d').getImageData(0, 0, 600, 600).data;
    assert.deepEqual(bytes('journeyPreview'), bytes('journeyOriginal'));
    assert.match(h.d.getElementById('renderStatus').textContent, /Same-day frown lines remain/);
    h.d.querySelector('[data-expression="neutral"]').click(); await h.tick();
    assert.match(h.d.getElementById('originalCaption').textContent, /At rest/);
    assert.deepEqual(bytes('journeyPreview'), bytes('journeyOriginal'));
    h.d.getElementById('jumpToSettled').click();
    h.d.querySelector('[data-expression="frown"]').click(); await h.tick();
    assert.notDeepEqual(bytes('journeyPreview'), bytes('journeyOriginal'));
  } finally { h.close(); }
});

test('clearing during frown rendering cannot publish partial results', async () => {
  const h = await harness('glabella-neuromodulator');
  const generated = [];
  try {
    const render = h.w.renderGlabellaPreview;
    h.w.renderGlabellaPreview = (...args) => { const result = render(...args); generated.push(result.canvas); return result; };
    h.upload(); await h.until(() => h.d.getElementById('neutralBadge').textContent === 'Photo ready');
    h.upload('frown', h.photo(48)); await h.until(() => h.d.getElementById('frownBadge').textContent === 'Photo ready');
    h.consent(); h.d.getElementById('generateJourney').click();
    await h.until(() => generated.length > 0);
    h.d.getElementById('clearJourney').click(); await h.tick(); await h.tick();
    assert.equal(h.d.getElementById('journeyResults').hidden, true);
    assert.equal(h.d.getElementById('neutralThumbnail').hidden, true);
    assert.ok(generated.every(canvas => canvas.width === 1));
  } finally { h.close(); }
});
