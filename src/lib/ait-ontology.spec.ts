import test from 'ava';

import {
  AIT_ONTOLOGY,
  createAITSeed,
  evaluateAITAction,
  linkAITObjects,
  validateAITObject,
} from './ait-ontology';

test('AIT ontology identity and command are locked', (t) => {
  t.is(AIT_ONTOLOGY.id, 'AIT-ONTOLOGY');
  t.is(AIT_ONTOLOGY.command, '/glass ait');
  t.true(AIT_ONTOLOGY.objectTypes.includes('AIT_EVIDENCE'));
  t.true(AIT_ONTOLOGY.relationTypes.includes('CORROBORATES'));
});

test('AIT seed produces governed Glass Onion graph', (t) => {
  const seed = createAITSeed();
  t.is(seed.objects.length, 4);
  t.is(seed.relations.length, 3);
  t.true(seed.relations.some((relation) => relation.type === 'GOVERNS'));
  t.true(seed.relations.some((relation) => relation.type === 'ROUTES_TO'));
});

test('evidence requires provenance', (t) => {
  const error = t.throws(() =>
    validateAITObject({
      id: 'ait:evidence:test',
      type: 'AIT_EVIDENCE',
      name: 'Test Evidence',
      properties: {},
      provenance: [],
    }),
  );
  t.is(error?.message, 'AIT_PROVENANCE_REQUIRED');
});

test('relations require valid endpoints and provenance', (t) => {
  const seed = createAITSeed();
  const error = t.throws(() =>
    linkAITObjects(
      {
        from: seed.objects[0].id,
        to: 'ait:missing',
        type: 'SUPPORTED_BY',
        provenance: ['test'],
      },
      seed.objects,
    ),
  );
  t.is(error?.message, 'AIT_RELATION_ENDPOINT_REQUIRED');
});

test('read-only AIT analysis can use fast path', (t) => {
  const result = evaluateAITAction({
    action: 'CORRELATE_EVIDENCE',
    objectIds: ['ait:system:glass-onion'],
  });
  t.is(result.decision, 'ALLOW');
  t.false(result.humanApprovalRequired);
});

test('intelligence promotion and high-impact work require review', (t) => {
  const result = evaluateAITAction({
    action: 'PROMOTE_HYPOTHESIS',
    objectIds: ['ait:hypothesis:test'],
    provenance: ['source:test'],
    promotesIntelligence: true,
    highImpact: true,
  });
  t.is(result.decision, 'REVIEW');
  t.true(result.reasons.includes('AIT_PROMOTION_REQUIRES_REVIEW'));
  t.true(result.reasons.includes('AIT_HIGH_IMPACT_REQUIRES_REVIEW'));
});

test('fund movement, governance voting, and arbitrary shell remain blocked', (t) => {
  const result = evaluateAITAction({
    action: 'AUTONOMOUS_ACTION',
    objectIds: ['ait:action:test'],
    movesFunds: true,
    castsGovernanceVote: true,
    arbitraryRemoteShell: true,
  });
  t.is(result.decision, 'BLOCK');
  t.true(result.reasons.includes('AUTOMATIC_FUND_MOVEMENT_BLOCKED'));
  t.true(result.reasons.includes('AUTOMATIC_GOVERNANCE_VOTING_BLOCKED'));
  t.true(result.reasons.includes('ARBITRARY_REMOTE_SHELL_BLOCKED'));
});
