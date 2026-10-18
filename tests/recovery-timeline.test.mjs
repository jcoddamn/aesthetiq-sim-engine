import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getProcedureJourney,
  getRecoveryTimeline,
  getRecoveryTimelineType,
  getRecoveryStage,
  getRecoveryStageAtDay
} from '../js/recoveryTimeline.js';

test('lip volume is present immediately and remains as recovery effects ease', () => {
  const stages = getRecoveryTimeline('lip-filler');
  assert.deepEqual(stages.map(stage => stage.day), [0, 0, 2, 7, 14, 28]);
  assert.equal(stages[0].id, 'before');
  assert.equal(stages[0].effectProgress, 0);
  for (const stage of stages.slice(1)) {
    assert.equal(stage.effectProgress, 1, stage.id);
    assert.equal(stage.resultProgress, 1, stage.id);
  }
  const early = getRecoveryStage('lip-filler', 'early');
  const settling = getRecoveryStage('lip-filler', 'settling');
  assert.ok(early.swelling > settling.swelling);
  assert.ok(early.bruising > settling.bruising);
  const final = getRecoveryStage('lip-filler');
  assert.deepEqual([final.swelling, final.redness, final.bruising], [0, 0, 0]);
});

test('Botox starts without an instant effect and later allows movement to return', () => {
  const stages = getRecoveryTimeline('glabella-neuromodulator');
  assert.deepEqual(stages.map(stage => stage.day), [0, 0, 2, 7, 14, 30, 90, 120]);
  assert.equal(getRecoveryStage('glabella-neuromodulator', 'immediate').effectProgress, 0);
  const finalIndex = stages.findIndex(stage => stage.id === 'final');
  for (let index = 2; index <= finalIndex; index++) {
    assert.ok(stages[index].effectProgress > stages[index - 1].effectProgress);
  }
  assert.ok(stages[finalIndex + 1].effectProgress < stages[finalIndex].effectProgress);
  assert.ok(stages[finalIndex + 2].effectProgress < stages[finalIndex + 1].effectProgress);
  assert.ok(stages[finalIndex + 2].effectProgress > 0, 'month four is not a guaranteed zero-effect date');
  assert.equal(getRecoveryStage('glabella-neuromodulator', 'old-stage-id').id, 'final');
});

test('other products cannot inherit the Botox-specific duration', () => {
  for (const productId of ['daxxify', 'dysport', 'xeomin', 'jeuveau', 'unknown']) {
    const context = { productId };
    assert.equal(getProcedureJourney('glabella-neuromodulator', context), null);
    const stages = getRecoveryTimeline('glabella-neuromodulator', context);
    assert.deepEqual(stages.map(stage => stage.id), ['immediate', 'early', 'settling', 'final']);
    assert.ok(stages.every(stage => stage.day === undefined));
    assert.equal(getRecoveryStageAtDay('glabella-neuromodulator', 90, context), null);
  }
  assert.equal(getProcedureJourney('glabella-neuromodulator', { productId: 'botox', optionId: 'daxxify' }), null);
  assert.equal(getProcedureJourney('glabella-neuromodulator', { neuromodulatorProduct: 'daxxify' }), null);
  assert.equal(getProcedureJourney('glabella-neuromodulator', 'daxxify'), null);
  assert.equal(getProcedureJourney('forehead-neuromodulator', { productId: 'botox' }), null);
  assert.equal(getProcedureJourney('glabella-neuromodulator', { productId: ' BOTOX ', optionId: 'botox' }).id, 'botox-frown-lines');
});

test('lip fat transfer falls back to a volume timeline instead of the HA journey', () => {
  for (const context of [{ optionId: 'fat-transfer' }, { optionId: 'fat-grafting' }, { fillerProduct: 'fat-transfer' }]) {
    assert.equal(getProcedureJourney('lip-filler', context), null);
    assert.deepEqual(getRecoveryTimeline('lip-filler', context), getRecoveryTimeline('facial-fat-transfer'));
    assert.equal(getRecoveryStageAtDay('lip-filler', 14, context), null);
  }
  assert.equal(getProcedureJourney('lip-filler', { optionId: 'prf' }), null);
  assert.equal(getProcedureJourney('lip-filler', { productId: 'unknown' }), null);
  assert.equal(getProcedureJourney('lip-filler', { optionId: 'hyaluronic-acid', fillerProduct: 'restylane-kysse' }).id, 'ha-lip-filler');
  assert.equal(getProcedureJourney('lip-filler', { optionId: 'hyaluronic-acid', productId: 'volbella' }).id, 'ha-lip-filler');
});

test('existing procedure categories and generic stage values stay compatible', () => {
  for (const [procedureId, type] of [
    ['lip-filler', 'filler'], ['chin-filler', 'filler'],
    ['glabella-neuromodulator', 'neuromodulator'], ['rhinoplasty', 'surgery'],
    ['chemical-peel', 'skin'], ['facial-fat-transfer', 'volume'],
    ['veneers', 'smile'], ['eyebrow-transplant', 'brow'], ['unknown', 'generic']
  ]) {
    assert.equal(getRecoveryTimelineType(procedureId), type);
  }
  assert.deepEqual(getRecoveryTimeline('rhinoplasty').map(stage => stage.resultProgress), [0.42, 0.62, 0.86, 1]);
  assert.deepEqual(getRecoveryTimeline('chin-filler').map(stage => stage.resultProgress), [0.78, 0.88, 0.96, 1]);
  assert.deepEqual(getRecoveryTimeline('unknown').map(stage => stage.id), ['immediate', 'early', 'settling', 'final']);
  assert.equal(getRecoveryStage('unknown', 'missing').id, 'final');
  assert.equal(getProcedureJourney('rhinoplasty'), null);
  assert.equal(getRecoveryStageAtDay('rhinoplasty', 90), null);
});

test('journey guidance has working source references and bounded drawing settings', () => {
  for (const procedureId of ['lip-filler', 'glabella-neuromodulator']) {
    const journey = getProcedureJourney(procedureId);
    const sourceIds = new Set(journey.sources.map(source => source.id));
    assert.equal(journey.bruisingDefault, false);
    assert.match(journey.coefficientNote, /interpolates the picture, not a clinical recovery percentage/);
    assert.ok(journey.safetyInfo.contactClinician.length);
    assert.ok(journey.safetyInfo.urgent.length);
    for (const source of journey.sources) {
      assert.equal(new URL(source.url).protocol, 'https:');
      assert.ok(source.title && source.publisher);
    }
    for (const stage of journey.stages) {
      assert.equal(stage.resultProgress, stage.effectProgress);
      assert.ok(stage.note && stage.care);
      assert.ok(stage.sourceIds.length);
      assert.ok(stage.sourceIds.every(id => sourceIds.has(id)), stage.id);
      for (const key of ['effectProgress', 'swelling', 'redness', 'bruising']) {
        assert.ok(Number.isFinite(stage[key]) && stage[key] >= 0 && stage[key] <= 1, `${stage.id}: ${key}`);
      }
    }
  }
});

test('callers cannot change a later journey by editing their copy', () => {
  const original = getProcedureJourney('lip-filler');
  const edited = getProcedureJourney('lip-filler');
  edited.stages[1].swelling = 900;
  edited.stages[1].sourceIds.push('wrong-source');
  edited.sources[0].title = 'Changed';
  edited.safetyInfo.urgent.length = 0;
  edited.limits.push('Changed');
  assert.deepEqual(getProcedureJourney('lip-filler'), original);
  const single = getRecoveryStage('lip-filler', 'early');
  single.sourceIds.length = 0;
  assert.ok(getRecoveryStage('lip-filler', 'early').sourceIds.length);
  const generic = getRecoveryTimeline('unknown');
  generic[0].label = 'Changed';
  assert.equal(getRecoveryTimeline('unknown')[0].label, 'Immediate');
});

test('day lookup preserves anchors, clamps the range and keeps before separate', () => {
  for (const procedureId of ['lip-filler', 'glabella-neuromodulator']) {
    const stages = getRecoveryTimeline(procedureId);
    for (const anchor of stages.filter(stage => stage.id !== 'before')) {
      assert.deepEqual(getRecoveryStageAtDay(procedureId, anchor.day), anchor);
    }
    assert.equal(getRecoveryStageAtDay(procedureId, -10).id, 'immediate');
    assert.equal(getRecoveryStageAtDay(procedureId, 1000).id, stages.at(-1).id);
    assert.equal(getRecoveryStageAtDay(procedureId, NaN).id, 'final');
    assert.equal(getRecoveryStageAtDay(procedureId, 'invalid').id, 'final');
    assert.equal(getRecoveryStageAtDay(procedureId, undefined).id, 'final');
    assert.equal(getRecoveryStageAtDay(procedureId, '14').id, 'settling');
    assert.equal(getRecoveryStage(procedureId, 'before').effectProgress, 0);
  }
});

test('scrubbing changes recovery separately from lip shape and respects delayed Botox onset', () => {
  const lip = getRecoveryStageAtDay('lip-filler', 4);
  assert.equal(lip.id, 'day-4');
  assert.equal(lip.interpolated, true);
  assert.equal(lip.day, 4);
  assert.equal(lip.effectProgress, 1);
  assert.equal(lip.resultProgress, 1);
  assert.ok(lip.swelling < getRecoveryStage('lip-filler', 'early').swelling);
  assert.ok(lip.swelling > getRecoveryStage('lip-filler', 'developing').swelling);
  assert.ok(lip.sourceIds.includes('cleveland-lip-fillers'));
  assert.ok(lip.sourceIds.includes('aad-fillers'));

  const onset = getRecoveryStageAtDay('glabella-neuromodulator', 1);
  assert.ok(onset.effectProgress > 0 && onset.effectProgress < getRecoveryStage('glabella-neuromodulator', 'early').effectProgress);
  const later = getRecoveryStageAtDay('glabella-neuromodulator', 60);
  assert.equal(later.phase, 'wearing-off');
  assert.ok(later.effectProgress < 1 && later.effectProgress > getRecoveryStage('glabella-neuromodulator', 'wearing-off').effectProgress);
  assert.match(later.note, /return/);
  for (const procedureId of ['lip-filler', 'glabella-neuromodulator']) {
    const lastDay = getRecoveryTimeline(procedureId).at(-1).day;
    for (let day = 0; day <= lastDay; day += 0.5) {
      const stage = getRecoveryStageAtDay(procedureId, day);
      assert.equal(stage.effectProgress, stage.resultProgress);
      for (const key of ['effectProgress', 'swelling', 'redness', 'bruising']) {
        assert.ok(stage[key] >= 0 && stage[key] <= 1, `${procedureId}, day ${day}, ${key}`);
      }
    }
  }
});
