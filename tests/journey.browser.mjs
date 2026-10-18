// Actual Chromium UI and Canvas tests with a synthetic face.
// FaceMesh is stubbed; this does not test face detection or clinical accuracy.
// Run: CHROMIUM_EXECUTABLE_PATH=/path/to/chrome node tests/journey.browser.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdir, readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? `${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/playwright` : 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const artifacts = process.env.JOURNEY_BROWSER_ARTIFACTS || join(tmpdir(), 'aesthetiq-journey-browser');
const landmarks = (await readFile(join(root, 'models/mediapipe_canonical_face.obj'), 'utf8'))
  .split('\n').filter(line => line.startsWith('v ')).map(line => {
    const [x, y, z] = line.split(/\s+/).slice(1).map(Number);
    return { x: .5 + x / 24, y: .5 - y / 24, z: -z / 24 };
  });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) throw new Error('Invalid path');
    const data = await readFile(path);
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream',
      'Cache-Control': 'no-store' });
    response.end(data);
  } catch { response.writeHead(404); response.end('Not found'); }
});
await mkdir(artifacts, { recursive: true });
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const base = `http://127.0.0.1:${server.address().port}`;
let browser;

async function syntheticPhoto(page, severity) {
  const encoded = await page.evaluate(({ landmarks, severity }) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 600;
    const context = canvas.getContext('2d'), image = context.createImageData(600, 600);
    for (let y = 0; y < 600; y++) for (let x = 0; x < 600; x++) {
      const gate = Math.max(0, Math.min(1, (y - 146) / 12)) * Math.max(0, Math.min(1, (217 - y) / 12));
      const shadow = severity * (Math.exp(-((x - 289) ** 2) / 13) + Math.exp(-((x - 311) ** 2) / 13)) * gate;
      const tone = ((x + y) % 2 ? 3 : -3) + x * .016 + y * .006 - shadow;
      const inside = ((x - 300) / 240) ** 2 + ((y - 300) / 277) ** 2 < 1;
      const offset = (y * 600 + x) * 4;
      for (let channel = 0; channel < 3; channel++) image.data[offset + channel] = inside
        ? [184, 145, 119][channel] + tone : [238, 234, 242][channel];
      image.data[offset + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    const polygon = (ids, color) => {
      context.fillStyle = color; context.beginPath();
      ids.forEach((id, index) => context[index ? 'lineTo' : 'moveTo'](landmarks[id].x * 600, landmarks[id].y * 600));
      context.closePath(); context.fill();
    };
    polygon([61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146], '#7d3d44');
    polygon([78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95], '#e8e2d9');
    for (const ids of [[33, 160, 158, 133, 153, 144], [362, 385, 387, 263, 373, 380]]) {
      polygon(ids, '#eee9e3');
      const x = (landmarks[ids[0]].x + landmarks[ids[3]].x) * 300;
      const y = (landmarks[ids[0]].y + landmarks[ids[3]].y) * 300;
      context.fillStyle = '#3a4245'; context.beginPath(); context.arc(x, y, 8, 0, Math.PI * 2); context.fill();
    }
    for (const ids of [[70, 63, 105, 66, 107, 55, 65, 52, 53, 46], [336, 296, 334, 293, 300, 276, 283, 282, 295, 285]]) polygon(ids, '#47352c');
    context.font = 'bold 17px sans-serif'; context.fillStyle = '#3e344b';
    context.fillText('SYNTHETIC TEST FACE', 18, 24);
    return canvas.toDataURL('image/png').split(',')[1];
  }, { landmarks, severity });
  return { name: `synthetic-${severity}.png`, mimeType: 'image/png', buffer: Buffer.from(encoded, 'base64') };
}

async function noOverflow(page, label) {
  const size = await page.evaluate(() => ({ width: document.documentElement.clientWidth,
    content: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) }));
  assert.ok(size.content <= size.width + 1, `${label}: page overflow ${JSON.stringify(size)}`);
}
async function waitRender(page) {
  await page.waitForFunction(() => !document.getElementById('journeyResults').hidden
    && !document.getElementById('saveJourneyComparison').disabled);
}
async function scrub(page, day) {
  await page.locator('#journeyDaySlider').evaluate((slider, value) => {
    slider.value = value; slider.dispatchEvent(new Event('input', { bubbles: true }));
  }, String(day));
  await waitRender(page);
  assert.equal(await page.locator('#journeyDay').innerText(), `Day ${day}`);
}
async function snapshot(page) {
  return page.evaluate(async () => {
    const hash = async id => {
      const canvas = document.getElementById(id);
      const bytes = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
    };
    return { original: await hash('journeyOriginal'), preview: await hash('journeyPreview'),
      caption: document.getElementById('previewCaption').textContent };
  });
}
async function upload(page, slot, photo) {
  const chooser = page.waitForEvent('filechooser');
  await page.locator(`[data-upload="${slot}"]`).click();
  await (await chooser).setFiles(photo);
  await page.waitForFunction(slot => document.getElementById(`${slot}Badge`).textContent === 'Photo ready', slot);
}

async function runJourney(view, procedure, query) {
  const lip = procedure === 'lip-filler', name = `${view.name}-${lip ? 'lips' : 'botox'}`;
  const context = await browser.newContext({ viewport: view.viewport, isMobile: view.mobile,
    hasTouch: view.mobile, deviceScaleFactor: 1, acceptDownloads: true, reducedMotion: 'reduce' });
  await context.addInitScript(points => {
    window.__journeyTest = { sends: 0, closes: 0 };
    window.FaceMesh = class {
      setOptions() {} onResults(callback) { this.callback = callback; }
      async send() { window.__journeyTest.sends++; await Promise.resolve();
        this.callback({ multiFaceLandmarks: [points.map(point => ({ ...point }))] }); }
      async close() { window.__journeyTest.closes++; this.callback = null; }
    };
  }, landmarks);
  // Remote artwork is replaced so the test never acquires photographs.
  await context.route('**/*', route => {
    const request = route.request();
    if (request.resourceType() === 'image' && !request.url().startsWith(base)) return route.fulfill({
      contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#eeeaf2"/></svg>' });
    return route.continue();
  });
  const page = await context.newPage(), errors = [];
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(`${base}/procedure.html?id=${procedure}&${query}`);
    await page.locator('#bottomCameraButton').waitFor({ state: 'visible' });
    await noOverflow(page, `${name} procedure page`);
    await page.locator('#bottomCameraButton').click();
    const choices = lip ? [['lipStyle', 'classic'], ['lipProduct', 'provider'], ['lipIntensity', 'balanced']]
      : [['neuromodulatorProduct', 'botox'], ['neuromodulatorIntensity', 'balanced']];
    for (const [field, value] of choices) {
      await page.locator(`label:has(input[name="${field}"][value="${value}"])`).click();
      await page.locator('#continueToCamera').click();
    }
    await page.waitForURL('**/journey.html?**');
    const sources = page.locator('details').filter({ has: page.locator('#journeySources') });
    await sources.locator('summary').click();
    await page.locator('#journeySources a').first().waitFor({ state: 'visible' });
    const links = await page.locator('#journeySources a').evaluateAll(items => items.map(item => ({
      href: item.href, title: item.textContent, visible: item.getBoundingClientRect().width > 0 })));
    assert.ok(links.length >= 3 && links.every(link => link.visible && link.title && link.href.startsWith('https:')));
    await noOverflow(page, `${name} expanded sources`);
    await sources.locator('summary').click();
    assert.equal(await page.locator('#generateJourney').isDisabled(), true);
    const neutral = await syntheticPhoto(page, 8), frown = lip ? null : await syntheticPhoto(page, 48);
    if (!lip) assert.equal(await page.locator('[data-upload="frown"]').isDisabled(), true);
    await upload(page, 'neutral', neutral);
    assert.equal(await page.locator('#generateJourney').isDisabled(), true, 'Consent must gate generation');
    if (!lip) {
      await upload(page, 'frown', neutral);
      await page.locator('#journeyConsent').check();
      await page.locator('#generateJourney').click();
      await page.waitForFunction(() => document.getElementById('captureStatus').classList.contains('is-error'));
      assert.match(await page.locator('#captureStatus').innerText(), /same photo/i);
      await upload(page, 'frown', frown);
    } else await page.locator('#journeyConsent').check();
    await page.locator('#generateJourney').click(); await waitRender(page);
    const expectedDay = query.includes('13.6') ? 14 : 10;
    assert.equal(await page.locator('#journeyDaySlider').inputValue(), String(expectedDay));
    assert.equal(await page.locator('#journeyDay').innerText(), `Day ${expectedDay}`);
    assert.equal(await page.locator('#journeyDaySlider').evaluate(element => element.validity.stepMismatch), false);
    await noOverflow(page, `${name} generated view`);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(() => window.scrollY === 0);
    await page.screenshot({ path: join(artifacts, `${name}-page.png`), fullPage: true });

    await page.locator('#showJourneyRecovery').uncheck(); await waitRender(page);
    await page.locator('#jumpToSettled').click(); await waitRender(page);
    const intensityHashes = new Set();
    for (const intensity of ['natural', 'balanced', 'enhanced']) {
      await page.locator(`[data-intensity="${intensity}"]`).click(); await waitRender(page);
      intensityHashes.add((await snapshot(page)).preview);
    }
    assert.equal(intensityHashes.size, 3, 'All three intensities must change the rendered pixels');
    if (!lip) {
      await scrub(page, 0);
      const atFrown = await snapshot(page); assert.equal(atFrown.preview, atFrown.original);
      await page.locator('[data-expression="neutral"]').click(); await waitRender(page);
      const atRest = await snapshot(page); assert.equal(atRest.preview, atRest.original);
      assert.notEqual(atRest.original, atFrown.original, 'The expression switch must use its own capture');
      assert.match(await page.locator('#originalCaption').innerText(), /At rest/);
      await page.locator('[data-expression="frown"]').click(); await waitRender(page);
    }
    await scrub(page, 2);
    const hidden = await snapshot(page);
    await page.locator('#showJourneyRecovery').check(); await waitRender(page);
    const recovery = await snapshot(page); assert.notEqual(recovery.preview, hidden.preview);
    await page.locator('#showJourneyBruising').check(); await waitRender(page);
    const bruised = await snapshot(page); assert.notEqual(bruised.preview, recovery.preview);
    await scrub(page, lip ? 28 : 120); await scrub(page, 2);
    assert.equal((await snapshot(page)).preview, bruised.preview, 'Scrubbing must restore the same pixels');
    await page.locator('[data-crop="detail"]').click(); await waitRender(page);
    await noOverflow(page, `${name} close-up`);
    await page.locator('.journey-comparison').screenshot({ path: join(artifacts, `${name}-detail.png`) });
    const downloading = page.waitForEvent('download');
    await page.locator('#saveJourneyComparison').click();
    const download = await downloading;
    assert.match(download.suggestedFilename(), lip ? /lip-filler-neutral-day-2\.png$/ : /frown-lines-frown-day-2\.png$/);
    const downloadPath = join(artifacts, `${view.name}-${download.suggestedFilename()}`);
    await download.saveAs(downloadPath);
    const png = await readFile(downloadPath);
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.ok(png.length > 2000 && png.readUInt32BE(16) >= 1200 && png.readUInt32BE(20) > 100);
    await page.locator('#clearJourney').click();
    await page.waitForFunction(() => document.getElementById('journeyResults').hidden);
    assert.equal(await page.locator('#generateJourney').isDisabled(), true);
    assert.equal(await page.locator('#journeyConsent').isChecked(), false);
    assert.equal(await page.locator('#neutralThumbnail').isVisible(), false);
    assert.equal(await page.locator('#journeyPreview').evaluate(canvas => canvas.width), 1);
    const detector = await page.evaluate(() => window.__journeyTest);
    assert.ok(detector.sends >= (lip ? 1 : 3) && detector.closes >= 1);
    assert.deepEqual(errors, [], `${name}: page errors`);
    console.log(`PASS ${name}: procedure wizard, ${links.length} source links, consent, captures, three intensities, timeline, toggles, PNG export and clear`);
  } catch (error) {
    await page.screenshot({ path: join(artifacts, `${name}-failure.png`), fullPage: true }).catch(() => {});
    throw error;
  } finally { await context.close(); }
}

try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
    args: ['--disable-dev-shm-usage'] });
  for (const view of [
    { name: 'desktop', viewport: { width: 1440, height: 1000 }, mobile: false },
    { name: 'mobile', viewport: { width: 390, height: 844 }, mobile: true }
  ]) {
    await runJourney(view, 'lip-filler', view.mobile ? 'day=13.6' : 'stage=day-10');
    await runJourney(view, 'glabella-neuromodulator', view.mobile ? 'stage=day-10' : 'day=13.6');
  }
  console.log(`Synthetic browser artifacts: ${artifacts}`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
