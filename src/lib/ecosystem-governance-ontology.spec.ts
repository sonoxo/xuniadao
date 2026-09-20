import test from 'ava';

import {
  createGovernanceSeed,
  ECOSYSTEM_GOVERNANCE_ONTOLOGY,
  evaluateGovernanceAction,
  validateGovernanceLink,
} from './ecosystem-governance-ontology';

test('governance ontology exposes object-link-action model', (t) => {
  t.is(ECOSYSTEM_GOVERNANCE_ONTOLOGY.command, '/glass ontology governance');
  t.true(ECOSYSTEM_GOVERNANCE_ONTOLOGY.objectTypes.includes('LICENSE'));
  t.true(ECOSYSTEM_GOVERNANCE_ONTOLOGY.objectTypes.includes('EXCHANGE'));
  t.true(ECOSYSTEM_GOVERNANCE_ONTOLOGY.objectTypes.includes('COMPLIANCE_REQUIREMENT'));
  t.true(ECOSYSTEM_GOVERNANCE_ONTOLOGY.actions.includes('DISCOVER_LISTING'));
  t.true(ECOSYSTEM_GOVERNANCE_ONTOLOGY.actions.includes('ATTACH_EVIDENCE'));
  t.true(ECOSYSTEM_GOVERNANCE_ONTOLOGY.domains.includes('XRPL_TOKEN_WALLET'));
  t.true(ECOSYSTEM_GOVERNANCE_ONTOLOGY.domains.includes('UNIVERSAL_HIVE_XRPL'));
  t.true(ECOSYSTEM_GOVERNANCE_ONTOLOGY.domains.includes('PALANTIR_FLOW_XRPL'));
  t.true(ECOSYSTEM_GOVERNANCE_ONTOLOGY.objectTypes.includes('BUILDER_REWARD_EVENT'));
  t.true(ECOSYSTEM_GOVERNANCE_ONTOLOGY.actions.includes('BUILD_XRPL_PAYMENT_INTENT'));
  t.true(ECOSYSTEM_GOVERNANCE_ONTOLOGY.domains.includes('COLLECTIVE_CYBER_DEFENSE'));
});

test('seed graph links repository license and compliance requirements', (t) => {
  const seed = createGovernanceSeed();
  t.true(seed.objects.some((object) => object.id === 'repo:xuniadao'));
  t.true(seed.objects.some((object) => object.id === 'license:apache-2.0'));
  t.true(seed.links.some((link) => link.type === 'LICENSED_UNDER'));
  t.true(seed.links.some((link) => link.type === 'GOVERNS'));
});

test('governance actions allow reads but review external claims and mutations', (t) => {
  t.is(evaluateGovernanceAction({ action: 'READ_TICKER', objectIds: ['exchange:coinbase'], provenance: ['api:coinbase'] }), 'ALLOW');
  t.is(evaluateGovernanceAction({ action: 'DISCOVER_LISTING', objectIds: ['exchange:coinbase'], provenance: ['api:coinbase'], externalListingClaim: true }), 'REVIEW');
  t.is(evaluateGovernanceAction({ action: 'ASSESS_READINESS', objectIds: ['requirement:gdpr-production-evidence'], provenance: ['evidence:index'], productionComplianceClaim: true }), 'REVIEW');
  t.is(evaluateGovernanceAction({ action: 'VERIFY_LICENSE', objectIds: ['repo:xuniadao'], provenance: ['path:LICENSE'], mutatesRepository: true }), 'REVIEW');
  t.is(evaluateGovernanceAction({ action: 'READ_TICKER', objectIds: [], provenance: ['x'] }), 'BLOCK');
  t.is(evaluateGovernanceAction({ action: 'READ_TICKER', objectIds: ['x'], provenance: ['x'], movesFunds: true }), 'BLOCK');
});

test('links cannot point outside the ontology graph', (t) => {
  const seed = createGovernanceSeed();
  t.throws(() => validateGovernanceLink({ from: 'repo:xuniadao', to: 'missing', type: 'SUPPORTED_BY', provenance: ['test'] }, seed.objects), { message: 'ONTOLOGY_LINK_ENDPOINT_REQUIRED' });
});


test('Universal Hive monetary governance keeps fund movement behind the execution boundary', (t) => {
  t.is(evaluateGovernanceAction({
    action: 'BUILD_XRPL_PAYMENT_INTENT',
    objectIds: ['reward:1'],
    provenance: ['contract:ecosystem/universal-hive-xrpl.json'],
  }), 'ALLOW');

  t.is(evaluateGovernanceAction({
    action: 'AUTHORIZE_REWARD_SETTLEMENT',
    objectIds: ['reward:1'],
    provenance: ['contract:ecosystem/universal-hive-xrpl.json'],
    movesFunds: true,
  }), 'BLOCK');

  t.true(ECOSYSTEM_GOVERNANCE_ONTOLOGY.invariants.xrplPrivateKeyStorageBlocked);
  t.true(ECOSYSTEM_GOVERNANCE_ONTOLOGY.invariants.xrplAutomaticSigningBlocked);
  t.true(ECOSYSTEM_GOVERNANCE_ONTOLOGY.invariants.xrplExternalSignerRequired);
});
