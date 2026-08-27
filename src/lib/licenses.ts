export type VerifiedLicenseId = 'Apache-2.0' | 'MIT' | 'BUSL-1.1' | 'UNDECLARED';

export type LicenseClass = 'PERMISSIVE' | 'SOURCE_AVAILABLE' | 'UNDECLARED';

export interface RepositoryLicenseRecord {
  readonly repository: string;
  readonly licenseId: VerifiedLicenseId;
  readonly licenseName: string;
  readonly licenseClass: LicenseClass;
  readonly licenseFile: string | null;
  readonly verified: boolean;
  readonly source: string;
  readonly obligations: readonly string[];
  readonly permissions: readonly string[];
  readonly restrictions: readonly string[];
  readonly changeLicense?: VerifiedLicenseId;
  readonly changeDateRule?: string;
  readonly notes?: readonly string[];
}

export const LICENSE_CATALOG: Readonly<Record<Exclude<VerifiedLicenseId, 'UNDECLARED'>, {
  readonly id: Exclude<VerifiedLicenseId, 'UNDECLARED'>;
  readonly name: string;
  readonly class: Exclude<LicenseClass, 'UNDECLARED'>;
  readonly spdx: string;
  readonly canonicalUrl: string;
  readonly permissions: readonly string[];
  readonly obligations: readonly string[];
  readonly restrictions: readonly string[];
}>> = {
  'Apache-2.0': {
    id: 'Apache-2.0',
    name: 'Apache License 2.0',
    class: 'PERMISSIVE',
    spdx: 'Apache-2.0',
    canonicalUrl: 'https://spdx.org/licenses/Apache-2.0.html',
    permissions: ['commercial-use', 'modification', 'distribution', 'patent-use', 'private-use'],
    obligations: ['include-license', 'state-changes', 'retain-notices', 'include-notice-when-present'],
    restrictions: ['no-trademark-grant', 'warranty-disclaimed', 'liability-limited'],
  },
  MIT: {
    id: 'MIT',
    name: 'MIT License',
    class: 'PERMISSIVE',
    spdx: 'MIT',
    canonicalUrl: 'https://spdx.org/licenses/MIT.html',
    permissions: ['commercial-use', 'modification', 'distribution', 'sublicensing', 'private-use'],
    obligations: ['include-copyright', 'include-license'],
    restrictions: ['warranty-disclaimed', 'liability-limited'],
  },
  'BUSL-1.1': {
    id: 'BUSL-1.1',
    name: 'Business Source License 1.1',
    class: 'SOURCE_AVAILABLE',
    spdx: 'BUSL-1.1',
    canonicalUrl: 'https://spdx.org/licenses/BUSL-1.1.html',
    permissions: ['copy', 'modify', 'create-derivatives', 'redistribute', 'non-production-use', 'production-use-only-as-additional-grant-allows'],
    obligations: ['display-license', 'comply-with-additional-use-grant', 'observe-change-date-and-change-license'],
    restrictions: ['production-use-may-be-restricted', 'rights-terminate-on-violation', 'no-trademark-grant', 'warranty-disclaimed'],
  },
} as const;

export const ECOSYSTEM_LICENSES: readonly RepositoryLicenseRecord[] = [
  {
    repository: 'sonoxo/xuniadao',
    licenseId: 'Apache-2.0',
    licenseName: 'Apache License 2.0',
    licenseClass: 'PERMISSIVE',
    licenseFile: 'LICENSE',
    verified: true,
    source: 'https://github.com/sonoxo/xuniadao/blob/main/LICENSE',
    permissions: LICENSE_CATALOG['Apache-2.0'].permissions,
    obligations: LICENSE_CATALOG['Apache-2.0'].obligations,
    restrictions: LICENSE_CATALOG['Apache-2.0'].restrictions,
  },
  {
    repository: 'sonoxo/zyra',
    licenseId: 'BUSL-1.1',
    licenseName: 'Business Source License 1.1',
    licenseClass: 'SOURCE_AVAILABLE',
    licenseFile: 'LICENSE',
    verified: true,
    source: 'https://github.com/sonoxo/zyra/blob/main/LICENSE',
    permissions: LICENSE_CATALOG['BUSL-1.1'].permissions,
    obligations: LICENSE_CATALOG['BUSL-1.1'].obligations,
    restrictions: LICENSE_CATALOG['BUSL-1.1'].restrictions,
    changeLicense: 'Apache-2.0',
    changeDateRule: 'Four years from the date the Licensed Work is published',
    notes: ['Additional Use Grant prohibits production use as a competing hosted or managed service.'],
  },
  {
    repository: 'sonoxo/gpt-doug-llm',
    licenseId: 'MIT',
    licenseName: 'MIT License',
    licenseClass: 'PERMISSIVE',
    licenseFile: 'LICENSE',
    verified: true,
    source: 'https://github.com/sonoxo/gpt-doug-llm/blob/main/LICENSE',
    permissions: LICENSE_CATALOG.MIT.permissions,
    obligations: LICENSE_CATALOG.MIT.obligations,
    restrictions: LICENSE_CATALOG.MIT.restrictions,
  },
  {
    repository: 'sonoxo/AlmightySonoxo',
    licenseId: 'MIT',
    licenseName: 'MIT License text',
    licenseClass: 'PERMISSIVE',
    licenseFile: 'LICENSE',
    verified: true,
    source: 'https://github.com/sonoxo/AlmightySonoxo/blob/main/LICENSE',
    permissions: LICENSE_CATALOG.MIT.permissions,
    obligations: LICENSE_CATALOG.MIT.obligations,
    restrictions: LICENSE_CATALOG.MIT.restrictions,
    notes: ['The file contains the standard MIT grant text although the heading is omitted.'],
  },
  {
    repository: 'sonoxo/gpt-uap-xo',
    licenseId: 'UNDECLARED',
    licenseName: 'No repository license file verified',
    licenseClass: 'UNDECLARED',
    licenseFile: null,
    verified: true,
    source: 'https://github.com/sonoxo/gpt-uap-xo',
    permissions: [],
    obligations: ['do-not-assume-permission-to-copy-modify-or-redistribute'],
    restrictions: ['all-rights-reserved-by-default-unless-another-grant-applies'],
    notes: ['A LICENSE file was not found when the registry was built.'],
  },
] as const;

export const getRepositoryLicense = (repository: string): RepositoryLicenseRecord | undefined =>
  ECOSYSTEM_LICENSES.find((record) => record.repository === repository);

export const validateEcosystemLicenses = (): readonly string[] => {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const record of ECOSYSTEM_LICENSES) {
    if (seen.has(record.repository)) errors.push(`DUPLICATE_REPOSITORY:${record.repository}`);
    seen.add(record.repository);
    if (!record.repository.trim()) errors.push('REPOSITORY_REQUIRED');
    if (!record.source.startsWith('https://github.com/')) errors.push(`SOURCE_REQUIRED:${record.repository}`);
    if (record.licenseId !== 'UNDECLARED' && !record.licenseFile) errors.push(`LICENSE_FILE_REQUIRED:${record.repository}`);
    if (record.licenseId === 'UNDECLARED' && record.permissions.length > 0) errors.push(`UNDECLARED_LICENSE_MUST_NOT_GRANT_PERMISSIONS:${record.repository}`);
  }
  return errors;
};

export const LICENSE_REGISTRY = {
  id: 'GLASS-ONION-LICENSE-REGISTRY',
  version: '1.0.0',
  command: '/glass licenses',
  status: 'VERIFIED_REPOSITORY_LICENSES',
  catalog: ['Apache-2.0', 'MIT', 'BUSL-1.1'] as const,
  repositories: ECOSYSTEM_LICENSES.map((record) => record.repository),
  rules: {
    useSPDXIdentifiers: true,
    preserveLicenseFiles: true,
    preserveCopyrightAndAttribution: true,
    doNotInferUndeclaredRights: true,
    sourceAvailableIsNotOpenSource: true,
  },
} as const;
