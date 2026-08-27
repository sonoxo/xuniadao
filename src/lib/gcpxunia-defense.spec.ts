import test from 'ava';

import { evaluateAgentAuth, GCPXUNIA_DEFENSE_ONTOLOGY } from './gcpxunia-defense';

const identity = {
  id: 'agent:va3lm:test',
  spiffeId: 'spiffe://xuniaverse.local/va3lm/agent/test',
  runtime: 'VA3LM' as const,
  credentialMode: 'SHORT_LIVED' as const,
  tokenBinding: ['DPOP', 'MTLS'] as const,
  scopes: ['crm.read', 'evidence.read'] as const,
  provenance: ['test:identity'] as const,
};

test('scoped short-lived VA3LM identity can be allowed', (t) => {
  const decision = evaluateAgentAuth({ identity, provider: 'test-provider', requestedScopes: ['crm.read'] });
  t.is(decision.decision, 'ALLOW');
});

test('shared and long-lived agent credentials are blocked', (t) => {
  t.is(evaluateAgentAuth({ identity, provider: 'test-provider', requestedScopes: ['crm.read'], sharedCredential: true }).decision, 'BLOCK');
  t.is(evaluateAgentAuth({ identity, provider: 'test-provider', requestedScopes: ['crm.read'], longLivedCredential: true }).decision, 'BLOCK');
});

test('broad agent grants require review', (t) => {
  const decision = evaluateAgentAuth({ identity, provider: 'test-provider', requestedScopes: ['crm.read'], projectWideGrant: true });
  t.is(decision.decision, 'REVIEW');
});

test('scope expansion requires review', (t) => {
  const decision = evaluateAgentAuth({ identity, provider: 'test-provider', requestedScopes: ['crm.write'] });
  t.is(decision.decision, 'REVIEW');
});

test('GCPXUNIA defense identity is locked', (t) => {
  t.is(GCPXUNIA_DEFENSE_ONTOLOGY.command, '/glass defense');
  t.true(GCPXUNIA_DEFENSE_ONTOLOGY.controls.shortLivedCredentialsRequired);
  t.true(GCPXUNIA_DEFENSE_ONTOLOGY.controls.sharedAgentCredentialsBlocked);
  t.false(GCPXUNIA_DEFENSE_ONTOLOGY.claims.googleCloudDeploymentClaimed);
  t.false(GCPXUNIA_DEFENSE_ONTOLOGY.claims.palantirDeploymentClaimed);
});
