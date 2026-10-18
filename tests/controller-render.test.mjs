import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createCanvas, ImageData, loadImage} from '@napi-rs/canvas';

async function controllerFixture(query = 'procedure=lip-filler') {
  const html = await readFile(new URL('../simulation.html', import.meta.url), 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://example.test/project/simulation.html?' + query,
    runScripts: 'outside-only'
  });
  const w = dom.window;
  const canvases = new WeakMap();
  const downloads = [];
  const comparisons = [];
  const renders = [];
  const backing = el => {
    if (!(el instanceof w.HTMLCanvasElement)) return el;
    let canvas = canvases.get(el);
    if (!canvas || canvas.width !== el.width || canvas.height !== el.height) {
      canvas = createCanvas(el.width || 1, el.height || 1);
      canvases.set(el, canvas);
    }
    return canvas;
  };
  w.HTMLCanvasElement.prototype.getContext = function(kind) {
    const element = this;
    const context = backing(this).getContext(kind);
    return new Proxy(context, {
      get(target, key) {
        const current = backing(element).getContext(kind);
        if (key === 'drawImage') return (source, ...args) => current.drawImage(backing(source), ...args);
        const value = Reflect.get(current, key, current);
        return typeof value === 'function' ? value.bind(current) : value;
      },
      set(target, key, value) { backing(element).getContext(kind)[key] = value; return true; }
    });
  };
  w.HTMLCanvasElement.prototype.toDataURL = function(...args) { return backing(this).toDataURL(...args); };
  w.HTMLAnchorElement.prototype.click = function() { downloads.push({href: this.href, filename: this.download}); };
  w.HTMLElement.prototype.scrollIntoView = function() {};
  w.requestAnimationFrame = () => 1;
  w.cancelAnimationFrame = () => {};
  globalThis.document = w.document;
  globalThis.window = w;
  globalThis.ImageData = ImageData;
  globalThis.requestAnimationFrame = w.requestAnimationFrame;
  const obj = await readFile(new URL('../models/mediapipe_canonical_face.obj', import.meta.url), 'utf8');
  const lines = obj.split('\n');
  const landmarks = lines.filter(line => line.startsWith('v ')).map(line => {
    const [x, y, z] = line.split(/\s+/).slice(1).map(Number);
    return {x: .5 + x / 24, y: .5 - y / 24, z: -z / 24};
  });
  globalThis.FACEMESH_TESSELATION = lines.filter(line => line.startsWith('f ')).flatMap(line => {
    const ids = line.split(/\s+/).slice(1).map(value => Number(value.split('/')[0]) - 1);
    return ids.map((id, index) => [id, ids[(index + 1) % ids.length]]);
  });
  let source = await readFile(new URL('../js/appController.js', import.meta.url), 'utf8');
  const imports = [...source.matchAll(/import\s*\{([\s\S]*?)\}\s*from\s*["']([^"']+)["'];/g)];
  for (const match of imports) {
    const module = await import(new URL('../js/' + match[2].replace(/^\.\//, ''), import.meta.url));
    for (const name of match[1].split(',').map(value => value.trim()).filter(Boolean)) w[name] = module[name];
  }
  const renderRecovery = w.renderRecoveryIllustration;
  w.renderRecoveryIllustration = (...args) => { renders.push(args); return renderRecovery(...args); };
  const createComparison = w.createComparisonCanvas;
  w.createComparisonCanvas = (...args) => { comparisons.push(args); return createComparison(...args); };
  w.startFaceTracking = () => {};
  w.stopFaceTracking = () => {};
  source = source.replace(/import\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];/g, '');
  w.eval(source + '\nwindow.inspectTestResult=()=>({simulationResults,selectedLevel,capturedCanvas,capturedLandmarks,stage:getCurrentRecoveryStage(),context:getRecoveryContext()});');
  const canvas = w.document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  for (let y = 0; y < 256; y += 4) for (let x = 0; x < 256; x += 4) {
    context.fillStyle = (x + y) % 8 ? '#b38d77' : '#795340';
    context.fillRect(x, y, 4, 4);
  }
  const generate = () => {
    w.testCaptures = {
      straight: {imageCanvas: canvas, landmarks},
      left: {imageCanvas: canvas, landmarks},
      right: {imageCanvas: canvas, landmarks}
    };
    w.eval('handlePrecisionScanComplete(testCaptures)');
  };
  const pixels = (target = w.document.getElementById('resultCanvas')) =>
    Buffer.from(backing(target).getContext('2d').getImageData(0, 0, target.width, target.height).data);
  return {w, backing, canvas, landmarks, downloads, comparisons, renders, generate, pixels, close: () => w.close()};
}

async function readDownload(download) {
  const image = await loadImage(download.href);
  const canvas = createCanvas(image.width, image.height);
  canvas.getContext('2d').drawImage(image, 0, 0);
  return canvas;
}

test('precision results, recovery controls and exports use the same frozen capture', async () => {
  const fixture = await controllerFixture();
  const {w, canvas, landmarks, downloads, comparisons, renders, generate, pixels} = fixture;
  try {
    generate();
    assert.match(w.document.getElementById('trackingStatus').textContent, /Preview ready/);
    const result = w.document.getElementById('resultCanvas');
    assert.equal(result.width, 256);
    assert.equal(w.document.getElementById('resultsSection').style.display, 'block');
    const balanced = pixels();
    const lipArea = points => {
      const ids = [61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146];
      return Math.abs(ids.reduce((sum, id, index) => {
        const next = points[ids[(index + 1) % ids.length]], point = points[id];
        return sum + point.x * next.y - next.x * point.y;
      }, 0)) / 2;
    };
    assert.ok(lipArea(w.inspectTestResult().simulationResults.landmarksByLevel.balanced) > lipArea(landmarks) * 1.02,
      'Classic Balanced must grow lip area after the Precision anatomy/tissue path');
    assert.match(w.document.getElementById('resultLabel').textContent, /balanced/i);

    const enhancedButton = w.document.querySelector('[data-level="enhanced"]');
    enhancedButton.click();
    const enhanced = pixels();
    assert.ok(!enhanced.equals(balanced), 'enhanced must change the balanced pixels');
    assert.equal(enhancedButton.getAttribute('aria-pressed'), 'true');
    assert.equal(w.document.querySelector('[data-level="balanced"]').getAttribute('aria-pressed'), 'false');
    w.document.getElementById('showOriginalButton').click();
    assert.ok(pixels().equals(pixels(canvas)), 'original view must match the capture');
    assert.equal(w.document.getElementById('showOriginalButton').getAttribute('aria-pressed'), 'true');
    w.document.getElementById('showSimulationButton').click();

    const earlyButton = w.document.querySelector('[data-stage="early"]');
    earlyButton.click();
    const early = pixels();
    assert.ok(!early.equals(enhanced), 'swelling must change the first-days view');
    assert.equal(earlyButton.getAttribute('aria-pressed'), 'true');
    assert.equal(w.document.querySelector('[data-stage="final"]').getAttribute('aria-pressed'), 'false');
    assert.equal(renders.at(-1)[2].id, 'early');
    assert.equal(renders.at(-1)[4].resultLandmarks, w.inspectTestResult().simulationResults.landmarksByLevel.enhanced);
    assert.notEqual(w.inspectTestResult().capturedLandmarks, landmarks);

    w.liveTestPoints = landmarks.map(point => ({...point, x: point.x + .2}));
    w.eval('latestLandmarks=liveTestPoints; renderSelectedResult();');
    assert.ok(pixels().equals(early), 'moving the camera must not move the recovery drawing');
    landmarks[61].x = .05;
    w.eval('renderSelectedResult();');
    assert.ok(pixels().equals(early), 'changing the input array must not change the saved capture');

    const effects = w.document.getElementById('recoveryEffectsToggle');
    const bruising = w.document.getElementById('recoveryBruisingToggle');
    assert.equal(effects.checked, true);
    assert.equal(bruising.checked, false);
    effects.checked = false;
    effects.dispatchEvent(new w.Event('change'));
    assert.ok(pixels().equals(enhanced), 'hiding recovery must preserve the selected lip shape');
    assert.equal(bruising.disabled, true);
    effects.checked = true;
    effects.dispatchEvent(new w.Event('change'));
    assert.ok(pixels().equals(early), 'restoring recovery must restore the same pixels');
    bruising.checked = true;
    bruising.dispatchEvent(new w.Event('change'));
    const withBruising = pixels();
    assert.ok(!withBruising.equals(early), 'bruising must be independently selectable');

    w.document.getElementById('saveSimulationButton').click();
    let saved = await readDownload(downloads.at(-1));
    assert.match(downloads.at(-1).filename, /enhanced-early/);
    assert.ok(Buffer.from(saved.getContext('2d').getImageData(0, 0, 256, 256).data).equals(withBruising),
      'saved recovery must match the displayed pixels');

    w.document.getElementById('saveComparisonButton').click();
    saved = await readDownload(downloads.at(-1));
    assert.match(downloads.at(-1).filename, /enhanced-early-comparison/);
    assert.match(comparisons.at(-1)[2], /Days 1–3/);
    assert.match(comparisons.at(-1)[2], /Provider Will Decide/);
    assert.match(comparisons.at(-1)[2], /bruising example/);
    assert.ok(Buffer.from(saved.getContext('2d').getImageData(272, 76, 256, 256).data).equals(withBruising),
      'comparison recovery must match the displayed pixels');
    assert.ok(Buffer.from(saved.getContext('2d').getImageData(0, 76, 256, 256).data).equals(pixels(canvas)),
      'comparison original must match the capture');

    w.document.getElementById('showOriginalButton').click();
    w.document.getElementById('saveSimulationButton').click();
    saved = await readDownload(downloads.at(-1));
    assert.match(downloads.at(-1).filename, /original/);
    assert.ok(Buffer.from(saved.getContext('2d').getImageData(0, 0, 256, 256).data).equals(pixels(canvas)),
      'saved original must match the capture');
  } finally { fixture.close(); }
});

test('guided links preserve the page base and selections, with invalid intensity normalized', async () => {
  const fixture = await controllerFixture('procedure=lip-filler&style=classic&product=restylane-kysse&option=hyaluronic-acid&goal=balanced&intensity=invalid&stage=early');
  const {w} = fixture;
  try {
    const entry = w.document.getElementById('guidedTimelineEntry');
    const link = w.document.getElementById('guidedTimelineLink');
    assert.equal(entry.hidden, false);
    let target = new URL(link.href);
    assert.equal(target.pathname, '/project/journey.html');
    assert.equal(target.searchParams.get('product'), 'restylane-kysse');
    assert.equal(target.searchParams.get('option'), 'hyaluronic-acid');
    assert.equal(target.searchParams.get('goal'), 'balanced');
    assert.equal(target.searchParams.get('style'), 'classic');
    assert.equal(target.searchParams.get('stage'), 'early');
    assert.equal(target.searchParams.get('intensity'), 'balanced');
    fixture.generate();
    assert.equal(w.inspectTestResult().selectedLevel, 'balanced');
    w.document.querySelector('[data-level="natural"]').click();
    target = new URL(link.href);
    assert.equal(target.searchParams.get('intensity'), 'natural');
    assert.equal(w.document.querySelector('[data-level="natural"]').getAttribute('aria-pressed'), 'true');
  } finally { fixture.close(); }
});

test('legacy contexts do not offer an unsupported guided procedure', async () => {
  for (const query of [
    'procedure=lip-filler&option=fat-transfer',
    'procedure=lip-filler&style=russian&option=hyaluronic-acid',
    'procedure=glabella-neuromodulator&option=daxxify&neuromodulator=daxxify',
    'procedure=chin-filler'
  ]) {
    const fixture = await controllerFixture(query);
    try {
      const {document} = fixture.w;
      assert.equal(document.getElementById('guidedTimelineEntry').hidden, true, query);
      assert.equal(document.getElementById('guidedTimelineLink').hasAttribute('href'), false, query);
      if (!query.includes('style=russian')) {
        assert.equal(document.querySelectorAll('.recovery-stage-button').length, 4, query);
        assert.equal(document.getElementById('recoveryEffectsControls').hidden, true, query);
      }
    } finally { fixture.close(); }
  }
  const fixture = await controllerFixture('procedure=glabella-neuromodulator');
  try {
    assert.equal(fixture.w.inspectTestResult().context.productId, 'botox');
    assert.equal(fixture.w.document.querySelectorAll('.recovery-stage-button').length, 8);
    assert.equal(fixture.w.document.getElementById('guidedTimelineEntry').hidden, false);
    assert.match(fixture.w.document.getElementById('guidedTimelineNote').textContent, /paired relaxed and frown photos/);
  } finally { fixture.close(); }
});

test('an upload without a detected face cannot replace the image used in an export', async () => {
  const fixture = await controllerFixture();
  const {w, canvas, downloads, pixels} = fixture;
  try {
    fixture.generate();
    const originalCapture = w.inspectTestResult().capturedCanvas;
    w.document.getElementById('showOriginalButton').click();
    const rejectedCanvas = w.document.createElement('canvas');
    rejectedCanvas.width = 256;
    rejectedCanvas.height = 256;
    rejectedCanvas.getContext('2d').fillStyle = '#ffffff';
    rejectedCanvas.getContext('2d').fillRect(0, 0, 256, 256);
    w.preparePreviewSource = () => rejectedCanvas;
    w.detectFaceLandmarksFromImage = async () => null;
    w.URL.createObjectURL = () => 'blob:test-upload';
    w.URL.revokeObjectURL = () => {};
    w.Image = class { set src(value) { this.onload(); } };
    w.eval('handlePhotoUpload({target:{files:[new Blob(["photo"])],value:"photo"}})');
    await new Promise(resolve => setImmediate(resolve));
    assert.match(w.document.getElementById('trackingStatus').textContent, /No face detected in uploaded photo/);
    assert.equal(w.inspectTestResult().capturedCanvas, originalCapture);
    w.document.getElementById('saveSimulationButton').click();
    const saved = await readDownload(downloads.at(-1));
    assert.ok(Buffer.from(saved.getContext('2d').getImageData(0, 0, 256, 256).data).equals(pixels(canvas)),
      'rejected upload must preserve the saved capture');
  } finally { fixture.close(); }
});
