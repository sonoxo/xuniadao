import test from 'ava';

import { GLASS_ONION, getXuniaLayer } from './ecosystem';
import { VA3LMClient } from './va3lm';

test('Glass Onion locks the five XUNIA layers', (t) => {
  t.is(GLASS_ONION.codename, 'GLASS ONION');
  t.is(GLASS_ONION.umbrella, 'XUNIA');
  t.deepEqual(
    GLASS_ONION.layers.map((layer) => layer.id),
    ['xunia', 'zyra', 'sonoxo', 'almighty-sonoxo', 'va3lm']
  );
});

test('VA3LM remains the 8088 coding command layer', (t) => {
  const va3lm = getXuniaLayer('va3lm');
  t.truthy(va3lm);
  t.is(va3lm?.runtime, 'http://127.0.0.1:8088');
  t.true(va3lm?.repository.includes('/gpt-doug-llm/tree/main/va3lm'));
});

test('mutating DAO and governance actions remain human gated', (t) => {
  t.true(GLASS_ONION.rules.humanApprovalForMutation);
  t.false(GLASS_ONION.rules.automaticFundMovement);
  t.false(GLASS_ONION.rules.automaticGovernanceVoting);
  t.false(GLASS_ONION.rules.arbitraryRemoteShell);
  t.true(GLASS_ONION.rules.provenanceRequired);
});

test('leadership credential intelligence is represented', (t) => {
  t.true(GLASS_ONION.leadership.credentialAreas.includes('Palantir'));
  t.true(GLASS_ONION.leadership.credentialAreas.includes('IBM / Red Hat'));
  t.true(GLASS_ONION.leadership.credentialAreas.includes('AWS'));
});

test('VA3LM client defaults to 8088', (t) => {
  const client = new VA3LMClient();
  t.truthy(client);
});
