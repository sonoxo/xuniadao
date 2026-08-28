import test from 'ava';

import { XUNIAVERSE, XUNIAVERSE_REPOSITORIES } from './xuniaverse';

test('XuniaDAO is the XUNIAverse root', (t) => {
  t.is(XUNIAVERSE.rootRepository, 'sonoxo/xuniadao');
  t.is(XUNIAVERSE.face, 'XUNIA / XuniaDAO');
  t.is(XUNIAVERSE.version, '1.3.0');
  t.true(XUNIAVERSE.rules.xuniadaoIsRoot);
  t.is(XUNIAVERSE_REPOSITORIES[0].role, 'ROOT');
});

test('all indexed repository nodes preserve upstream ownership and license boundaries', (t) => {
  t.is(XUNIAVERSE_REPOSITORIES.length, 66);
  t.true(XUNIAVERSE_REPOSITORIES.some((node) => node.repository === 'sonoxo/xrpl-dev-portalXUNIA' && node.role === 'XUNIA_EXTENSION'));
  for (const repository of [
    'sonoxo/XRPL-StandardsXUNIA-',
    'sonoxo/xrpl.jsXUNIA',
    'sonoxo/rippledXUNIA',
    'sonoxo/xrpl4jXUNIA',
    'sonoxo/NASA-3D-ResourcesXUNIA-',
    'sonoxo/openai-pythonXUNIA',
  ]) {
    t.true(XUNIAVERSE_REPOSITORIES.some((node) => node.repository === repository && node.role === 'XUNIA_EXTENSION'));
  }
  t.true(XUNIAVERSE_REPOSITORIES.some((node) => node.repository === 'sonoxo/nsacyber.github.ioZYRA' && node.role === 'DEFENSE'));
  for (const repository of XUNIAVERSE_REPOSITORIES) {
    t.true(repository.preservesUpstreamOwnership);
    t.is(repository.root, 'sonoxo/xuniadao');
  }
});
