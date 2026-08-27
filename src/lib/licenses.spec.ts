import test from 'ava';

import { ECOSYSTEM_LICENSES, getRepositoryLicense, LICENSE_REGISTRY, validateEcosystemLicenses } from './licenses';

test('verified repository licenses are represented exactly', (t) => {
  t.is(getRepositoryLicense('sonoxo/xuniadao')?.licenseId, 'Apache-2.0');
  t.is(getRepositoryLicense('sonoxo/zyra')?.licenseId, 'BUSL-1.1');
  t.is(getRepositoryLicense('sonoxo/zyra')?.changeLicense, 'Apache-2.0');
  t.is(getRepositoryLicense('sonoxo/gpt-doug-llm')?.licenseId, 'MIT');
  t.is(getRepositoryLicense('sonoxo/AlmightySonoxo')?.licenseId, 'MIT');
  t.is(getRepositoryLicense('sonoxo/gpt-uap-xo')?.licenseId, 'Apache-2.0');
});

test('GPT-UAP-XO now has explicit permissive license rights and obligations', (t) => {
  const record = getRepositoryLicense('sonoxo/gpt-uap-xo');
  t.truthy(record);
  t.is(record?.licenseClass, 'PERMISSIVE');
  t.true(record?.permissions.includes('commercial-use') ?? false);
  t.true(record?.obligations.includes('include-license') ?? false);
  t.is(record?.licenseFile, 'LICENSE');
});

test('Business Source License is source available and not mislabeled permissive', (t) => {
  const record = getRepositoryLicense('sonoxo/zyra');
  t.is(record?.licenseClass, 'SOURCE_AVAILABLE');
  t.true(record?.restrictions.includes('production-use-may-be-restricted') ?? false);
});

test('registry has no structural license errors', (t) => {
  t.deepEqual(validateEcosystemLicenses(), []);
  t.is(LICENSE_REGISTRY.command, '/glass licenses');
  t.is(LICENSE_REGISTRY.version, '1.1.0');
  t.is(ECOSYSTEM_LICENSES.length, 5);
});
