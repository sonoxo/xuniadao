import test from 'ava';

import { resolveXrplDocumentation, XRPL_DOCUMENTATION_BRIDGE } from './xrpl-documentation';

test('XRPL bridge preserves authoritative upstream attribution', (t) => {
  t.is(XRPL_DOCUMENTATION_BRIDGE.xuniaRoot, 'sonoxo/xuniadao');
  t.is(XRPL_DOCUMENTATION_BRIDGE.xuniaRepository, 'sonoxo/xrpl-dev-portalXUNIA');
  t.is(XRPL_DOCUMENTATION_BRIDGE.authoritativeUpstream, 'XRPLF/xrpl-dev-portal');
  t.false(XRPL_DOCUMENTATION_BRIDGE.boundaries.claimXRPLFEndorsement);
});

test('XRPL bridge is read-only and cannot move funds', (t) => {
  t.is(XRPL_DOCUMENTATION_BRIDGE.integrationMode, 'FEDERATED_READ_ONLY');
  t.false(XRPL_DOCUMENTATION_BRIDGE.boundaries.walletSeedStorage);
  t.false(XRPL_DOCUMENTATION_BRIDGE.boundaries.transactionSigning);
  t.false(XRPL_DOCUMENTATION_BRIDGE.boundaries.fundMovement);
});

test('resolver links XUNIA mirror and authoritative sources', (t) => {
  const targets = resolveXrplDocumentation('docs/concepts');
  t.is(targets.length, 3);
  t.true(targets.some((target) => target.url.includes('sonoxo/xrpl-dev-portalXUNIA')));
  t.true(targets.some((target) => target.url.includes('XRPLF/xrpl-dev-portal') && target.authoritative));
  t.true(targets.some((target) => target.url === 'https://xrpl.org' && target.authoritative));
});

test('resolver removes unsafe relative path segments', (t) => {
  const [mirror] = resolveXrplDocumentation('../../docs/../concepts');
  t.false(mirror.url.includes('..'));
});
