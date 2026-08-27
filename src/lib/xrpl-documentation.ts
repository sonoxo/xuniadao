export type XrplDocumentationSource = 'XUNIA_MIRROR' | 'AUTHORITATIVE_UPSTREAM' | 'CANONICAL_SITE';

export interface XrplDocumentationTarget {
  readonly source: XrplDocumentationSource;
  readonly url: string;
  readonly authoritative: boolean;
}

const normalizePath = (path: string): string =>
  path
    .trim()
    .replace(/^\/+/, '')
    .split('/')
    .filter((segment) => segment.length > 0 && segment !== '.' && segment !== '..')
    .join('/');

export const resolveXrplDocumentation = (path = ''): readonly XrplDocumentationTarget[] => {
  const normalized = normalizePath(path);
  const suffix = normalized ? `/${normalized}` : '';

  return [
    {
      source: 'XUNIA_MIRROR',
      url: `https://github.com/sonoxo/xrpl-dev-portalXUNIA/tree/master${suffix}`,
      authoritative: false,
    },
    {
      source: 'AUTHORITATIVE_UPSTREAM',
      url: `https://github.com/XRPLF/xrpl-dev-portal/tree/master${suffix}`,
      authoritative: true,
    },
    {
      source: 'CANONICAL_SITE',
      url: 'https://xrpl.org',
      authoritative: true,
    },
  ] as const;
};

export const XRPL_DOCUMENTATION_BRIDGE = {
  id: 'XUNIA-XRPL-DOCUMENTATION-BRIDGE',
  version: '1.0.0',
  command: '/glass xrpl',
  integrationMode: 'FEDERATED_READ_ONLY',
  xuniaRoot: 'sonoxo/xuniadao',
  xuniaRepository: 'sonoxo/xrpl-dev-portalXUNIA',
  authoritativeUpstream: 'XRPLF/xrpl-dev-portal',
  canonicalDocumentation: 'https://xrpl.org',
  capabilities: ['DOCUMENTATION_DISCOVERY', 'SOURCE_ATTRIBUTION', 'UPSTREAM_LINK_RESOLUTION'],
  boundaries: {
    preserveRepositoryHistory: true,
    preserveUpstreamOwnership: true,
    claimXRPLFEndorsement: false,
    walletSeedStorage: false,
    transactionSigning: false,
    fundMovement: false,
  },
} as const;
