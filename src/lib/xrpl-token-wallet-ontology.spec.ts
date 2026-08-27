import test from 'ava';

import {
  createXrplOntologySeed,
  evaluateXrplAction,
  XRPL_READ_PIPELINE,
  XRPL_TOKEN_WALLET_ONTOLOGY,
  XRPL_TRANSACTION_PIPELINE,
} from './xrpl-token-wallet-ontology';

const provenance = ['contract:ecosystem/xrpl-token-wallet.json'];

test('XRPL repositories map to authoritative upstreams without affiliation claims', (t) => {
  t.is(XRPL_TOKEN_WALLET_ONTOLOGY.repositories.standards, 'sonoxo/XRPL-StandardsXUNIA-');
  t.is(XRPL_TOKEN_WALLET_ONTOLOGY.repositories.client, 'sonoxo/xrpl.jsXUNIA');
  t.is(XRPL_TOKEN_WALLET_ONTOLOGY.repositories.node, 'sonoxo/rippledXUNIA');
  t.is(XRPL_TOKEN_WALLET_ONTOLOGY.authoritativeUpstreams.client, 'XRPLF/xrpl.js');
  t.false(XRPL_TOKEN_WALLET_ONTOLOGY.controls.upstreamAffiliationClaim);
});

test('read pathway joins standards client node and audit', (t) => {
  t.deepEqual(XRPL_READ_PIPELINE.map((stage) => stage.component), [
    'XRPL_STANDARDS', 'XRPL_JS', 'RIPPLED', 'XRPL_JS', 'XRPL_JS', 'XRPL_JS', 'AUDIT',
  ]);
  t.is(evaluateXrplAction({ action: 'READ_ACCOUNT', network: 'MAINNET', provenance }), 'ALLOW');
  t.is(evaluateXrplAction({ action: 'READ_TOKEN', network: 'TESTNET', provenance }), 'ALLOW');
});

test('transaction pathway requires policy approval and an external signer', (t) => {
  t.is(XRPL_TRANSACTION_PIPELINE[0].action, 'DISCOVER_STANDARD');
  t.is(XRPL_TRANSACTION_PIPELINE[XRPL_TRANSACTION_PIPELINE.length - 1].action, 'WRITE_AUDIT_EVIDENCE');
  t.is(evaluateXrplAction({ action: 'BUILD_UNSIGNED_TRANSACTION', network: 'TESTNET', provenance }), 'REVIEW');
  t.is(evaluateXrplAction({ action: 'SIGN_WITH_EXTERNAL_WALLET', network: 'TESTNET', provenance }), 'BLOCK');
  t.is(evaluateXrplAction({
    action: 'SIGN_WITH_EXTERNAL_WALLET',
    network: 'TESTNET',
    provenance,
    humanApproved: true,
    externalSigner: true,
  }), 'REVIEW');
});

test('secrets and automatic signing paths are blocked', (t) => {
  t.is(evaluateXrplAction({
    action: 'READ_ACCOUNT',
    network: 'MAINNET',
    provenance,
    containsSecret: true,
  }), 'BLOCK');
  t.is(evaluateXrplAction({
    action: 'SUBMIT_TRANSACTION',
    network: 'MAINNET',
    provenance,
    humanApproved: true,
    externalSigner: true,
    storesSeed: true,
  }), 'BLOCK');
  t.is(evaluateXrplAction({ action: 'READ_LEDGER', network: 'MAINNET', provenance: [] }), 'BLOCK');
});

test('ontology graph connects standards client node signer and audit evidence', (t) => {
  const graph = createXrplOntologySeed();
  t.true(graph.objects.some((object) => object.id === 'standard:xrpl'));
  t.true(graph.objects.some((object) => object.id === 'wallet:external'));
  t.true(graph.links.some((link) => link.from === 'client:xrpl-js' && link.to === 'node:rippled'));
  t.true(graph.links.some((link) => link.to === 'evidence:audit'));
});
