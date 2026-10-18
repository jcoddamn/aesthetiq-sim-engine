import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { getJourneySelection, comparisonDescription } from '../js/journeyPage.js';

const procedures = ['lip-filler', 'glabella-neuromodulator'];
const select = (procedure, params = {}) => getJourneySelection(
  '?' + new URLSearchParams({ procedure, ...params }));

test('fractional day links agree with the whole-day slider and export label', () => {
  const dom = new JSDOM(readFileSync(new URL('../journey.html', import.meta.url), 'utf8'));
  try {
    const slider = dom.window.document.getElementById('journeyDaySlider');
    for (const procedure of procedures) {
      for (const [input, expected] of [['0.49', 0], ['0.5', 1], ['2.49', 2], ['2.5', 3], ['13.6', 14]]) {
        const selection = select(procedure, { day: input });
        assert.equal(selection.stage.day, expected, `${procedure}, day=${input}`);
        slider.max = selection.journey.stages.at(-1).day;
        slider.value = selection.stage.day;
        assert.equal(slider.valueAsNumber, expected);
        assert.equal(slider.validity.stepMismatch, false);
        const label = comparisonDescription(selection, {
          stage: selection.stage, intensity: selection.intensity, expression: 'neutral',
          showRecovery: true, showBruising: false, crop: 'face'
        });
        assert.ok(label.includes(`Day ${expected} ·`), label);
      }
    }
  } finally { dom.window.close(); }
});

test('generated day stage links resolve to the same checkpoint as explicit day links', () => {
  for (const procedure of procedures) {
    for (const day of ['0', '1', '2', '7', '10', '14', '28', '30', '90', '120', '2.5']) {
      const explicit = select(procedure, { day });
      const generated = select(procedure, { stage: `day-${day}` });
      assert.deepEqual(generated.stage, explicit.stage, `${procedure}, stage=day-${day}`);
    }
    for (const checkpoint of select(procedure).journey.stages) {
      assert.deepEqual(select(procedure, { stage: checkpoint.id }).stage, checkpoint);
    }
  }
  assert.equal(select('lip-filler', { stage: 'day-10' }).stage.day, 10);
  assert.equal(select('glabella-neuromodulator', { stage: 'day-30' }).stage.id, 'final');
});

test('explicit days take priority while before and same-day treatment stay distinct', () => {
  for (const procedure of procedures) {
    assert.equal(select(procedure, { stage: 'before' }).stage.id, 'before');
    assert.equal(select(procedure, { stage: 'day-0' }).stage.id, 'immediate');
    assert.equal(select(procedure, { stage: 'before', day: '0' }).stage.id, 'immediate');
    assert.equal(select(procedure, { stage: 'day-10', day: '2' }).stage.id, 'early');
  }
});

test('day links retain the existing horizons and invalid-input fallback', () => {
  for (const [procedure, horizon, finalDay] of [
    ['lip-filler', 28, 28], ['glabella-neuromodulator', 120, 30]
  ]) {
    assert.equal(select(procedure, { day: '-3.8' }).stage.id, 'immediate');
    assert.equal(select(procedure, { day: '1000.5' }).stage.day, horizon);
    assert.equal(select(procedure, { stage: 'day-1000.5' }).stage.day, horizon);
    for (const input of ['', ' ', 'invalid']) {
      assert.equal(select(procedure, { day: input }).stage.day, finalDay);
      assert.equal(select(procedure, { stage: `day-${input}` }).stage.day, finalDay);
    }
  }
  assert.equal(select('lip-filler', { day: '30' }).stage.day, 28);
  assert.equal(select('lip-filler', { day: '90' }).stage.day, 28);
});

test('canonical treatment links keep the selected product, intensity and recovery options', () => {
  const lip = getJourneySelection('?procedure=lip-filler&style=classic&option=hyaluronic-acid&product=restylane-kysse&intensity=enhanced&stage=day-10&recovery=0&bruising=1');
  assert.deepEqual(lip.context, { productId: 'restylane-kysse', optionId: 'hyaluronic-acid' });
  assert.equal(lip.stage.day, 10);
  assert.equal(lip.intensity, 'enhanced');
  assert.equal(lip.showRecovery, false);
  assert.equal(lip.showBruising, true);
  const botox = getJourneySelection('?procedure=glabella-neuromodulator&neuromodulator=botox&product=botox&option=botox&intensity=natural&stage=day-30');
  assert.deepEqual(botox.context, { productId: 'botox', optionId: 'botox' });
  assert.equal(botox.stage.day, 30);
  assert.equal(botox.intensity, 'natural');
  assert.equal(botox.showBruising, false);
});
