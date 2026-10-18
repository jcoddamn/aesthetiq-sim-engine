import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { getProcedureById } from '../js/procedureData.js';
import { getFillerProductsForProcedure } from '../js/fillerProfiles.js';
import { getFillerGoalsForProcedure } from '../js/fillerGoals.js';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
async function open(file, query = '') {
  return new JSDOM(await read(file), {
    url: 'https://aesthetiq.example/' + file + query,
    runScripts: 'outside-only'
  });
}

async function procedurePage(id, query = '') {
  const dom = await open('procedure.html', '?id=' + id + query);
  Object.assign(dom.window, { getProcedureById, getFillerProductsForProcedure,
    getFillerGoalsForProcedure, navigations: [] });
  const source = dom.window.document.querySelector('script[type="module"]:not([src])').textContent
    .replace(/import\s*\{[^}]*\}\s*from\s*["'][^"']+["'];/g, '')
    .replace(/window\.location\.href\s*=\s*([^;]+);/g, 'window.navigations.push($1);');
  dom.window.eval(source);
  dom.window.document.getElementById('bottomCameraButton').click();
  return dom;
}

function choose(dom, name, value) {
  const input = dom.window.document.querySelector(`input[name="${name}"][value="${value}"]`);
  assert.ok(input, `${name}: ${value} is available`);
  input.checked = true;
  input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  const button = dom.window.document.getElementById('continueToCamera');
  assert.equal(button.disabled, false);
  button.click();
}

function finishLips(dom, { style = 'classic', product = 'provider', intensity = 'balanced' } = {}) {
  choose(dom, 'lipStyle', style);
  choose(dom, 'lipProduct', product);
  choose(dom, 'lipIntensity', intensity);
  assert.equal(dom.window.navigations.length, 1);
  return new URL(dom.window.navigations[0]);
}

function finishNeuromodulator(dom, product = 'botox', intensity = 'balanced') {
  choose(dom, 'neuromodulatorProduct', product);
  choose(dom, 'neuromodulatorIntensity', intensity);
  assert.equal(dom.window.navigations.length, 1);
  return new URL(dom.window.navigations[0]);
}

test('home provides direct entries for both guided treatment journeys', async () => {
  const dom = await open('index.html');
  try {
    const cards = [...dom.window.document.querySelectorAll('#guided-previews a')];
    assert.equal(cards.length, 2);
    const lip = new URL(cards[0].href), botox = new URL(cards[1].href);
    assert.equal(lip.pathname, '/journey.html');
    assert.equal(lip.searchParams.get('procedure'), 'lip-filler');
    assert.equal(lip.searchParams.get('style'), 'classic');
    assert.equal(lip.searchParams.get('option'), 'hyaluronic-acid');
    assert.equal(lip.searchParams.get('product'), 'provider');
    assert.equal(botox.pathname, '/journey.html');
    assert.equal(botox.searchParams.get('procedure'), 'glabella-neuromodulator');
    assert.equal(botox.searchParams.get('neuromodulator'), 'botox');
    assert.equal(botox.searchParams.get('product'), 'botox');
    assert.match(cards[0].textContent, /immediately after.*settling/s);
    assert.match(cards[1].textContent, /immediately after.*peak effect/s);
    assert.doesNotMatch(cards.map(card => card.textContent).join(' '), /clinically validated|guaranteed|predict your results/i);
  } finally { dom.window.close(); }
});

test('journey page marks Preview as the active primary navigation item', async () => {
  const dom = await open('journey.html');
  try {
    dom.window.eval((await read('js/productUI.js')).replace(/export function /g, 'function '));
    const current = dom.window.document.querySelectorAll('.bottom-nav [aria-current="page"]');
    assert.equal(current.length, 1);
    assert.equal(current[0].textContent, 'Preview');
    assert.equal(current[0].getAttribute('href'), 'simulation.html');
  } finally { dom.window.close(); }
});

test('Classic HA lip wizard carries every intensity and selected product to the guided timeline', async () => {
  for (const intensity of ['natural', 'balanced', 'enhanced']) {
    const dom = await procedurePage('lip-filler', '&stage=day-14&day=14');
    try {
      const product = intensity === 'enhanced' ? 'volbella' : 'provider';
      const url = finishLips(dom, { intensity, product });
      assert.equal(url.pathname, '/journey.html');
      assert.deepEqual(Object.fromEntries(url.searchParams), { procedure: 'lip-filler',
        style: 'classic', product, intensity, stage: 'day-14', day: '14', option: 'hyaluronic-acid' });
    } finally { dom.window.close(); }
  }
});

test('BOTOX glabella wizard preserves its product, intensity and timeline selection', async () => {
  const dom = await procedurePage('glabella-neuromodulator', '&stage=peak&day=30');
  try {
    const url = finishNeuromodulator(dom, 'botox', 'enhanced');
    assert.equal(url.pathname, '/journey.html');
    assert.deepEqual(Object.fromEntries(url.searchParams), { procedure: 'glabella-neuromodulator',
      option: 'botox', neuromodulator: 'botox', intensity: 'enhanced', stage: 'peak', day: '30', product: 'botox' });
  } finally { dom.window.close(); }
});

test('other lip styles, fat transfer and explicit 3D requests keep the existing preview', async () => {
  for (const entry of [
    { query: '', style: 'russian' },
    { query: '&option=fat-transfer', style: 'classic' },
    { query: '&mode=3d', style: 'classic' },
    { query: '&view=3d', style: 'classic' }
  ]) {
    const dom = await procedurePage('lip-filler', entry.query);
    try {
      const url = finishLips(dom, { style: entry.style });
      assert.equal(url.pathname, '/simulation.html');
      assert.equal(url.searchParams.get('style'), entry.style);
      for (const [key, value] of new URLSearchParams(entry.query)) assert.equal(url.searchParams.get(key), value);
    } finally { dom.window.close(); }
  }
});

test('other neuromodulators, other treatment areas and body previews keep their routes', async () => {
  for (const [id, product] of [['glabella-neuromodulator', 'dysport'], ['forehead-neuromodulator', 'botox'], ['lip-flip', 'botox']]) {
    const dom = await procedurePage(id);
    try {
      const url = finishNeuromodulator(dom, product);
      assert.equal(url.pathname, '/simulation.html');
      assert.equal(url.searchParams.get('neuromodulator'), product);
      assert.equal(url.searchParams.get('procedure'), id);
    } finally { dom.window.close(); }
  }
  const body = await procedurePage('tummy-tuck');
  try {
    assert.equal(body.window.navigations.length, 1);
    assert.equal(new URL(body.window.navigations[0], body.window.location.href).pathname, '/body-simulation.html');
  } finally { body.window.close(); }
});
