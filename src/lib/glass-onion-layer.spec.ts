import test from 'ava';

import { GLASS_ONION_LAYER, routeGlassOnion } from './glass-onion-layer';

test('Glass Onion identity and six-layer membrane are locked', (t) => {
  t.is(GLASS_ONION_LAYER.codename, 'GLASS ONION');
  t.is(GLASS_ONION_LAYER.command, '/glass');
  t.is(GLASS_ONION_LAYER.crmCommand, '/glass crm');
  t.is(GLASS_ONION_LAYER.crmPortCommand, '/glass crm port');
  t.is(GLASS_ONION_LAYER.crmCertificationCommand, '/glass certify crm');
  t.is(GLASS_ONION_LAYER.licensesCommand, '/glass licenses');
  t.is(GLASS_ONION_LAYER.exchangesCommand, '/glass exchanges');
  t.is(GLASS_ONION_LAYER.evidenceCommand, '/glass evidence');
  t.is(GLASS_ONION_LAYER.identityCommand, '/glass identity');
  t.is(GLASS_ONION_LAYER.defenseCommand, '/glass defense');
  t.is(GLASS_ONION_LAYER.peersCommand, '/glass peers');
  t.is(GLASS_ONION_LAYER.xuniaverseCommand, '/glass xuniaverse');
  t.is(GLASS_ONION_LAYER.uapCommand, '/glass uap');
  t.is(GLASS_ONION_LAYER.face, 'XUNIA / XuniaDAO');
  t.deepEqual(GLASS_ONION_LAYER.layers, ['xunia', 'zyra', 'sonoxo', 'almighty-sonoxo', 'va3lm', 'gpt-uap-xo']);
});

test('read-only routed work can use the fast path', (t) => {
  const route = routeGlassOnion({ objective: 'Build a typed ontology workflow plan', capability: 'ONTOLOGY_WORKFLOW', targets: ['xunia', 'sonoxo', 'va3lm', 'zyra'] });
  t.is(route.decision, 'ALLOW');
  t.false(route.humanApprovalRequired);
});

test('CRM routes through relationship graph and workflow agents', (t) => {
  const route = routeGlassOnion({ objective: 'Analyze CRM pipeline and plan follow-ups', capability: 'CRM', targets: ['xunia', 'sonoxo', 'va3lm', 'zyra', 'gpt-uap-xo'], provenance: ['source:crm'] });
  t.is(route.decision, 'ALLOW');
  t.true(route.pipeline.includes('CRM_RELATIONSHIP_GRAPH'));
  t.true(route.pipeline.includes('UAP_AGENT_TASKS'));
});

test('CRM port routes bulk migration through governed stages', (t) => {
  const route = routeGlassOnion({ objective: 'Port CRM records in bulk', capability: 'CRM_PORT', targets: ['xunia', 'zyra', 'gpt-uap-xo'], provenance: ['source:crm-port'] });
  t.is(route.decision, 'ALLOW');
  t.true(route.pipeline.includes('SCHEMA_MAP'));
  t.true(route.pipeline.includes('DEDUPE'));
  t.true(route.pipeline.includes('HUMAN_REVIEW'));
  t.true(route.pipeline.includes('ROLLBACK_MANIFEST'));
});

test('CRM certification routes evidence through ontology and attestation gates', (t) => {
  const route = routeGlassOnion({ objective: 'Assess CRM internal control attestation evidence', capability: 'CRM_CERTIFICATION', targets: ['xunia', 'sonoxo', 'va3lm', 'zyra'], provenance: ['repo:sonoxo/xuniadao'] });
  t.is(route.decision, 'ALLOW');
  t.true(route.pipeline.includes('PALANTIR_ONTOLOGY_GRAPH'));
  t.true(route.pipeline.includes('ATTESTATION_GATE'));
});

test('license registry is a first-class provenance-gated route', (t) => {
  const route = routeGlassOnion({ objective: 'Audit repository licenses', capability: 'LICENSE_REGISTRY', targets: ['xunia', 'gpt-uap-xo'], provenance: ['repo-license-files'] });
  t.is(route.decision, 'ALLOW');
  t.true(route.pipeline.includes('SPDX_VALIDATE'));
  t.true(route.pipeline.includes('ATTRIBUTION_EVIDENCE'));
});

test('exchange market route is read-only discovery and listing verification', (t) => {
  const route = routeGlassOnion({ objective: 'Verify live exchange listing state', capability: 'EXCHANGE_MARKET_DATA', targets: ['xunia', 'zyra'], provenance: ['source:coinbase', 'source:kraken'] });
  t.is(route.decision, 'ALLOW');
  t.true(route.pipeline.includes('LIVE_EXCHANGE_DISCOVERY'));
  t.true(route.pipeline.includes('READ_ONLY_TICKER'));
  t.true(GLASS_ONION_LAYER.invariants.externalExchangeListingCannotBeSelfDeclared);
});

test('compliance evidence route does not infer production proof from code', (t) => {
  const route = routeGlassOnion({ objective: 'Assess GDPR and HIPAA production evidence', capability: 'COMPLIANCE_EVIDENCE', targets: ['xunia', 'zyra'], provenance: ['evidence:index'] });
  t.is(route.decision, 'ALLOW');
  t.true(route.pipeline.includes('EVIDENCE_INGEST'));
  t.true(route.pipeline.includes('READINESS_ASSESSMENT'));
  t.true(GLASS_ONION_LAYER.invariants.productionComplianceEvidenceCannotBeInferred);
});

test('agent identity route uses SPIFFE verification and brokered auth', (t) => {
  const route = routeGlassOnion({ objective: 'Verify VA3LM agent identity before outbound auth', capability: 'AGENT_IDENTITY_SECURITY', targets: ['xunia', 'va3lm', 'zyra'], provenance: ['google-iam-agent-identity'] });
  t.is(route.decision, 'ALLOW');
  t.true(route.pipeline.includes('SPIFFE_IDENTITY_VERIFY'));
  t.true(route.pipeline.includes('AUTH_MANAGER_BROKER'));
  t.true(route.pipeline.includes('DPOP_OR_MTLS_BINDING'));
});

test('GCPXUNIA defense routes through Virginia and VA3LM', (t) => {
  const route = routeGlassOnion({ objective: 'Run defensive cloud identity policy evaluation', capability: 'GCPXUNIA_DEFENSE', targets: ['xunia', 'va3lm', 'zyra'], provenance: ['contract:ecosystem/gcpxunia-defense.json'] });
  t.is(route.decision, 'ALLOW');
  t.true(route.pipeline.includes('GCPXUNIA_AUTH_BROKER'));
  t.true(route.pipeline.includes('VIRGINIA_POLICY_BOUNDARY'));
  t.true(route.pipeline.includes('VA3LM_REASON_AND_PLAN'));
  t.true(route.pipeline.includes('ZYRA_ACTION_GATE'));
});

test('technology peer ontology requires sourced peer evidence', (t) => {
  const route = routeGlassOnion({ objective: 'Update credible technology peer graph', capability: 'TECH_PEER_ONTOLOGY', targets: ['xunia', 'va3lm'], provenance: ['https://security.googlecloudcommunity.com/', 'https://www.palantir.com/docs/foundry/ontology/overview'] });
  t.is(route.decision, 'ALLOW');
  t.true(route.pipeline.includes('PRIMARY_SOURCE_VERIFY'));
  t.true(route.pipeline.includes('CREDENTIAL_EVIDENCE_CHECK'));
});

test('XUNIAverse registry makes XuniaDAO the repository root', (t) => {
  const route = routeGlassOnion({ objective: 'Index Sonoxo repositories under the XUNIAverse root', capability: 'XUNIAVERSE_REGISTRY', targets: ['xunia', 'zyra', 'sonoxo'], provenance: ['contract:ecosystem/xuniaverse.json'] });
  t.is(route.decision, 'ALLOW');
  t.true(route.pipeline.includes('XUNIADAO_ROOT_LINK'));
  t.true(GLASS_ONION_LAYER.invariants.xuniadaoIsXuniaverseRoot);
});

test('provenance-sensitive capabilities without provenance are held for review', (t) => {
  const capabilities = [
    'INTELLIGENCE_QUERY', 'AIT_ONTOLOGY', 'CRM', 'CRM_PORT', 'CRM_CERTIFICATION',
    'LICENSE_REGISTRY', 'EXCHANGE_MARKET_DATA', 'COMPLIANCE_EVIDENCE', 'AGENT_IDENTITY_SECURITY',
    'GCPXUNIA_DEFENSE', 'TECH_PEER_ONTOLOGY', 'XUNIAVERSE_REGISTRY',
  ] as const;
  for (const capability of capabilities) {
    const route = routeGlassOnion({ objective: 'Promote governed information', capability, targets: ['xunia', 'zyra'] });
    t.is(route.decision, 'REVIEW');
    t.true(route.reasons.includes('PROVENANCE_REQUIRED_FOR_INTELLIGENCE_PROMOTION'));
  }
});

test('GPT-UAP-XO routes bounded agent runtime work through Glass Onion', (t) => {
  const route = routeGlassOnion({ objective: 'Run bounded parallel agents', capability: 'UAP_AGENT_RUNTIME', targets: ['xunia', 'gpt-uap-xo', 'zyra'], provenance: ['repo:sonoxo/gpt-uap-xo'] });
  t.is(route.decision, 'ALLOW');
  t.true(route.pipeline.includes('GPT_UAP_XO_BOUNDED_WORKERS'));
});

test('repository mutation, transaction signing and production deployment require review', (t) => {
  const route = routeGlassOnion({ objective: 'Prepare and deploy a Cadence integration', capability: 'CADENCE_FLOW', targets: ['xunia', 'zyra', 'va3lm'], mutatesRepository: true, signsTransaction: true, deploysProduction: true });
  t.is(route.decision, 'REVIEW');
  t.true(route.humanApprovalRequired);
});

test('automatic funds, governance votes and arbitrary remote shell are blocked', (t) => {
  const route = routeGlassOnion({ objective: 'Attempt prohibited autonomous action', capability: 'CADENCE_FLOW', targets: ['xunia'], movesFunds: true, castsGovernanceVote: true, arbitraryRemoteShell: true });
  t.is(route.decision, 'BLOCK');
  t.true(route.reasons.includes('AUTOMATIC_FUND_MOVEMENT_BLOCKED'));
  t.true(route.reasons.includes('AUTOMATIC_GOVERNANCE_VOTING_BLOCKED'));
  t.true(route.reasons.includes('ARBITRARY_REMOTE_SHELL_BLOCKED'));
});
