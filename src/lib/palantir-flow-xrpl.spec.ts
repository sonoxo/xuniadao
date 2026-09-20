import test from 'ava';

import {
  createPalantirFlowSeed,
  PALANTIR_FLOW_XRPL,
  routePalantirFlowXrpl,
} from './palantir-flow-xrpl';

test('Palantir Flow bridge preserves source boundaries', (t) => {
  t.is(PALANTIR_FLOW_XRPL.sourceBoundaries.flowUpstream, 'FlowFans/flow-token-list');
  t.false(PALANTIR_FLOW_XRPL.sourceBoundaries.palantirCodeCopied);
  t.false(PALANTIR_FLOW_XRPL.sourceBoundaries.palantirAffiliationClaim);
  t.true(PALANTIR_FLOW_XRPL.sourceBoundaries.flowHistoryAndLicensePreserved);
});

test('Palantir Flow seed links Flow provenance, ontology reference and XRPL', (t) => {
  const graph = createPalantirFlowSeed();
  t.true(graph.objects.some((object) => object.id === 'repo:flow-token-list'));
  t.true(graph.objects.some((object) => object.id === 'reference:palantir-ontology'));
  t.true(graph.objects.some((object) => object.id === 'hive:universal'));
  t.true(graph.links.some((link) => link.relation === 'DERIVED_FROM'));
  t.true(graph.links.some((link) => link.relation === 'MODELS_AFTER'));
  t.true(graph.links.some((link) => link.relation === 'SUBMITS_TO'));
});

test('Palantir Flow route terminates in externally signed XRPL settlement', (t) => {
  const route = routePalantirFlowXrpl(
    'Settle a verified Universal Hive builder reward',
    ['contract:ecosystem/universal-hive-xrpl.json'],
  );
  t.true(route.pipeline.includes('UNIVERSAL_HIVE_EVENT_GRAPH'));
  t.true(route.pipeline.includes('XRPL_UNSIGNED_PAYMENT_INTENT'));
  t.true(route.pipeline.includes('VALIDATED_LEDGER_RECEIPT'));
  t.true(route.humanApprovalRequired);
  t.true(route.externalSignerRequired);
});

test('Palantir Flow route requires provenance', (t) => {
  const error = t.throws(() => routePalantirFlowXrpl('Build flow', []));
  t.is(error?.message, 'PROVENANCE_REQUIRED');
});
