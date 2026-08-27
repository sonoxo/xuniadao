import test from 'ava';

import { TECH_PEER_ONTOLOGY, TECHNOLOGY_PEERS } from './tech-peer-ontology';

test('technology peer graph is source-backed', (t) => {
  t.is(TECH_PEER_ONTOLOGY.command, '/glass peers');
  t.true(TECHNOLOGY_PEERS.length >= 7);
  for (const peer of TECHNOLOGY_PEERS) {
    t.true(peer.source.startsWith('https://'));
    t.false(peer.affiliationClaim);
  }
});

test('credential and affiliation rules stay evidence-gated', (t) => {
  t.is(TECH_PEER_ONTOLOGY.peerReviewCredentialState, 'EVIDENCE_REQUIRED_FOR_PUBLIC_CLAIM');
  t.true(TECH_PEER_ONTOLOGY.rules.credentialClaimsRequireEvidence);
  t.true(TECH_PEER_ONTOLOGY.rules.affiliationMustNotBeInferred);
});
