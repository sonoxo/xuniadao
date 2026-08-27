import test from 'ava';

import { GLASS_ONION_LAYER, routeGlassOnion } from './glass-onion-layer';

test('Glass Onion identity and six-layer membrane are locked', (t) => {
  t.is(GLASS_ONION_LAYER.codename, 'GLASS ONION');
  t.is(GLASS_ONION_LAYER.command, '/glass');
  t.is(GLASS_ONION_LAYER.uapCommand, '/glass uap');
  t.deepEqual(GLASS_ONION_LAYER.layers, [
    'xunia',
    'zyra',
    'sonoxo',
    'almighty-sonoxo',
    'va3lm',
    'gpt-uap-xo',
  ]);
});

test('read-only routed work can use the fast path', (t) => {
  const route = routeGlassOnion({
    objective: 'Build a typed ontology workflow plan',
    capability: 'ONTOLOGY_WORKFLOW',
    targets: ['xunia', 'sonoxo', 'va3lm', 'zyra'],
  });

  t.is(route.decision, 'ALLOW');
  t.false(route.humanApprovalRequired);
  t.true(route.pipeline.includes('SONOXO_ONTOLOGY'));
});

test('GPT-UAP-XO routes bounded agent runtime work through Glass Onion', (t) => {
  const route = routeGlassOnion({
    objective: 'Run bounded parallel agents against a local task',
    capability: 'UAP_AGENT_RUNTIME',
    targets: ['xunia', 'gpt-uap-xo', 'zyra'],
    provenance: ['repo:sonoxo/gpt-uap-xo'],
  });

  t.is(route.decision, 'ALLOW');
  t.true(route.pipeline.includes('GPT_UAP_XO_PLAN'));
  t.true(route.pipeline.includes('GPT_UAP_XO_BOUNDED_WORKERS'));
  t.true(route.pipeline.includes('ZYRA_ACTION_GATE'));
});

test('AIT ontology routes through the dedicated intelligence pipeline', (t) => {
  const route = routeGlassOnion({
    objective: 'Correlate AIT intelligence with provenance',
    capability: 'AIT_ONTOLOGY',
    targets: ['xunia', 'sonoxo', 'va3lm', 'zyra'],
    provenance: ['source:test'],
  });

  t.is(route.decision, 'ALLOW');
  t.true(route.pipeline.includes('AIT_PROVENANCE_CHECK'));
  t.true(route.pipeline.includes('AIT_CORRELATE'));
  t.true(route.pipeline.includes('VA3LM_COMMAND_REVIEW'));
});

test('intelligence promotion without provenance is held for review', (t) => {
  const route = routeGlassOnion({
    objective: 'Correlate cross-repo intelligence',
    capability: 'INTELLIGENCE_QUERY',
    targets: ['xunia', 'sonoxo'],
  });

  t.is(route.decision, 'REVIEW');
  t.true(route.reasons.includes('PROVENANCE_REQUIRED_FOR_INTELLIGENCE_PROMOTION'));
});

test('AIT routing without provenance is held for review', (t) => {
  const route = routeGlassOnion({
    objective: 'Promote AIT intelligence',
    capability: 'AIT_ONTOLOGY',
    targets: ['xunia', 'sonoxo'],
  });

  t.is(route.decision, 'REVIEW');
  t.true(route.reasons.includes('PROVENANCE_REQUIRED_FOR_INTELLIGENCE_PROMOTION'));
});

test('repository mutation, transaction signing and production deployment require review', (t) => {
  const route = routeGlassOnion({
    objective: 'Prepare and deploy a Cadence integration',
    capability: 'CADENCE_FLOW',
    targets: ['xunia', 'zyra', 'va3lm'],
    mutatesRepository: true,
    signsTransaction: true,
    deploysProduction: true,
  });

  t.is(route.decision, 'REVIEW');
  t.true(route.humanApprovalRequired);
});

test('automatic funds, governance votes and arbitrary remote shell are blocked', (t) => {
  const route = routeGlassOnion({
    objective: 'Attempt prohibited autonomous action',
    capability: 'CADENCE_FLOW',
    targets: ['xunia'],
    movesFunds: true,
    castsGovernanceVote: true,
    arbitraryRemoteShell: true,
  });

  t.is(route.decision, 'BLOCK');
  t.true(route.reasons.includes('AUTOMATIC_FUND_MOVEMENT_BLOCKED'));
  t.true(route.reasons.includes('AUTOMATIC_GOVERNANCE_VOTING_BLOCKED'));
  t.true(route.reasons.includes('ARBITRARY_REMOTE_SHELL_BLOCKED'));
});
