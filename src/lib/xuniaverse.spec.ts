import test from 'ava';

import { XUNIAVERSE, XUNIAVERSE_REPOSITORIES } from './xuniaverse';

test('XuniaDAO is the XUNIAverse root', (t) => {
  t.is(XUNIAVERSE.rootRepository, 'sonoxo/xuniadao');
  t.is(XUNIAVERSE.face, 'XUNIA / XuniaDAO');
  t.true(XUNIAVERSE.rules.xuniadaoIsRoot);
  t.is(XUNIAVERSE_REPOSITORIES[0].role, 'ROOT');
});

test('all indexed repository nodes preserve upstream ownership and license boundaries', (t) => {
  t.is(XUNIAVERSE_REPOSITORIES.length, 57);
  t.true(XUNIAVERSE_REPOSITORIES.some((node) => node.repository === 'sonoxo/xrpl-dev-portalXUNIA' && node.role === 'XUNIA_EXTENSION'));
  for (const repository of ['sonoxo/XRPL-StandardsXUNIA-', 'sonoxo/xrpl.jsXUNIA', 'sonoxo/rippledXUNIA']) {
    t.true(XUNIAVERSE_REPOSITORIES.some((node) => node.repository === repository && node.role === 'XUNIA_EXTENSION'));
  }
  for (const repository of XUNIAVERSE_REPOSITORIES) {
    t.true(repository.preservesUpstreamOwnership);
    t.is(repository.root, 'sonoxo/xuniadao');
  }
});
