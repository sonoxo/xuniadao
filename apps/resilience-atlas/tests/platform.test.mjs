import test from 'ava';
import assert from 'node:assert/strict';
import { assertSafeScenario } from '../lib/governance.mjs';
import { runScenario, toOntologyEnvelope } from '../lib/engine.mjs';

test('runs a safe emergency exercise scenario', () => {
  const admitted = assertSafeScenario({ type:'radiological', severity:3, populationContext:'moderate', weather:'stable' });
  const scenario = runScenario(admitted);
  assert.equal(scenario.severity, 3);
  assert.ok(scenario.metrics.peopleInExerciseZones > 0);
  assert.equal(scenario.zones.length, 3);
  assert.equal(admitted.governance.humanApprovalRequired, true);
});

test('rejects offensive optimization fields', () => {
  assert.throws(() => assertSafeScenario({ severity:3, target:'facility-a' }), /prohibited/i);
  assert.throws(() => assertSafeScenario({ severity:3, yield:500 }), /prohibited/i);
  assert.throws(() => assertSafeScenario({ severity:3, strikeSequence:['a','b'] }), /prohibited/i);
});

test('exports ontology envelope', () => {
  const scenario = runScenario(assertSafeScenario({ type:'grid', severity:2 }));
  const envelope = toOntologyEnvelope(scenario);
  assert.equal(envelope.ontologyObject, 'CivilDefenseScenario');
  assert.equal(envelope.objectId, scenario.id);
  assert.equal(envelope.links.approvalState, 'PENDING_HUMAN_REVIEW');
});
