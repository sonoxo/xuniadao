export type GovernanceObjectType =
  | 'REPOSITORY'
  | 'LICENSE'
  | 'TOKEN'
  | 'EXCHANGE'
  | 'MARKET'
  | 'COMPLIANCE_REQUIREMENT'
  | 'AGENT_IDENTITY'
  | 'AUTH_PROVIDER'
  | 'ACCESS_POLICY'
  | 'RUNTIME'
  | 'GUARDRAIL'
  | 'SECURITY_EVENT'
  | 'TECH_PEER'
  | 'SECURITY_DOMAIN'
  | 'XUNIAVERSE_NODE'
  | 'EVIDENCE'
  | 'ASSESSMENT'
  | 'ATTESTATION';

export type GovernanceLinkType =
  | 'LICENSED_UNDER'
  | 'DISCOVERED_ON'
  | 'QUOTED_BY'
  | 'REQUIRES_EVIDENCE'
  | 'SUPPORTED_BY'
  | 'SATISFIES'
  | 'GOVERNS'
  | 'DERIVED_FROM'
  | 'BLOCKED_BY'
  | 'ROOTS'
  | 'IDENTIFIES'
  | 'AUTHORIZES'
  | 'BROKERS_AUTH_FOR'
  | 'ENFORCES'
  | 'PROTECTS'
  | 'BENCHMARKS_AGAINST'
  | 'LEARNS_FROM'
  | 'MODELS_AFTER'
  | 'VALIDATES_WITH';

export type GovernanceAction =
  | 'VERIFY_LICENSE'
  | 'DISCOVER_LISTING'
  | 'READ_TICKER'
  | 'VALIDATE_LISTING_PACKET'
  | 'ATTACH_EVIDENCE'
  | 'ASSESS_READINESS'
  | 'ISSUE_INTERNAL_ATTESTATION'
  | 'VERIFY_AGENT_IDENTITY'
  | 'BROKER_AGENT_AUTH'
  | 'REVOKE_AGENT_ACCESS'
  | 'VERIFY_PEER_SOURCE'
  | 'REGISTER_XUNIAVERSE_NODE';

export interface GovernanceObject {
  readonly id: string;
  readonly type: GovernanceObjectType;
  readonly name: string;
  readonly properties: Readonly<Record<string, string | number | boolean | readonly string[]>>;
  readonly provenance: readonly string[];
}

export interface GovernanceLink {
  readonly from: string;
  readonly to: string;
  readonly type: GovernanceLinkType;
  readonly provenance: readonly string[];
}

export interface GovernanceActionRequest {
  readonly action: GovernanceAction;
  readonly objectIds: readonly string[];
  readonly provenance: readonly string[];
  readonly mutatesRepository?: boolean;
  readonly externalListingClaim?: boolean;
  readonly productionComplianceClaim?: boolean;
  readonly movesFunds?: boolean;
  readonly sharedAgentCredential?: boolean;
  readonly longLivedAgentCredential?: boolean;
  readonly broadAgentGrant?: boolean;
}

export type GovernanceDecision = 'ALLOW' | 'REVIEW' | 'BLOCK';

export const validateGovernanceObject = (object: GovernanceObject): GovernanceObject => {
  if (!object.id.trim() || !object.name.trim()) throw new Error('ONTOLOGY_OBJECT_IDENTITY_REQUIRED');
  if (object.provenance.length === 0) throw new Error('ONTOLOGY_OBJECT_PROVENANCE_REQUIRED');
  return object;
};

export const validateGovernanceLink = (link: GovernanceLink, objects: readonly GovernanceObject[]): GovernanceLink => {
  const ids = new Set(objects.map((object) => object.id));
  if (!ids.has(link.from) || !ids.has(link.to)) throw new Error('ONTOLOGY_LINK_ENDPOINT_REQUIRED');
  if (link.provenance.length === 0) throw new Error('ONTOLOGY_LINK_PROVENANCE_REQUIRED');
  return link;
};

export const evaluateGovernanceAction = (request: GovernanceActionRequest): GovernanceDecision => {
  if (request.objectIds.length === 0 || request.provenance.length === 0) return 'BLOCK';
  if (request.movesFunds) return 'BLOCK';
  if (request.sharedAgentCredential || request.longLivedAgentCredential) return 'BLOCK';
  if (request.externalListingClaim) return 'REVIEW';
  if (request.productionComplianceClaim) return 'REVIEW';
  if (request.broadAgentGrant) return 'REVIEW';
  if (request.mutatesRepository) return 'REVIEW';
  return 'ALLOW';
};

export const createGovernanceSeed = (): { readonly objects: readonly GovernanceObject[]; readonly links: readonly GovernanceLink[] } => {
  const objects: GovernanceObject[] = [
    {
      id: 'repo:xuniadao', type: 'REPOSITORY', name: 'sonoxo/xuniadao',
      properties: { role: 'XUNIAVERSE_ROOT' }, provenance: ['repo:sonoxo/xuniadao'],
    },
    {
      id: 'node:xuniaverse', type: 'XUNIAVERSE_NODE', name: 'XUNIAverse Root',
      properties: { face: 'XUNIA / XuniaDAO', repositoryCount: 57 }, provenance: ['contract:ecosystem/xuniaverse.json'],
    },
    {
      id: 'runtime:va3lm', type: 'RUNTIME', name: 'VA3LM',
      properties: { port: 8088, boundary: 'VIRGINIA' }, provenance: ['repo:sonoxo/gpt-doug-llm', 'path:va3lm'],
    },
    {
      id: 'identity:va3lm-agent', type: 'AGENT_IDENTITY', name: 'VA3LM Agent Identity',
      properties: { identityFormat: 'SPIFFE', credentialMode: 'SHORT_LIVED' }, provenance: ['contract:ecosystem/gcpxunia-defense.json'],
    },
    {
      id: 'auth:gcpxunia', type: 'AUTH_PROVIDER', name: 'GCPXUNIA Auth Broker',
      properties: { mode: 'CENTRAL_BROKER', sharedCredentials: false }, provenance: ['contract:ecosystem/gcpxunia-defense.json'],
    },
    {
      id: 'peer:gcp-security-community', type: 'TECH_PEER', name: 'Google Cloud Security Community',
      properties: { relation: 'LEARNS_FROM', affiliationClaim: false }, provenance: ['https://security.googlecloudcommunity.com/'],
    },
    {
      id: 'peer:palantir-ontology', type: 'TECH_PEER', name: 'Palantir Ontology',
      properties: { relation: 'MODELS_AFTER', affiliationClaim: false }, provenance: ['https://www.palantir.com/docs/foundry/ontology/overview'],
    },
    {
      id: 'license:apache-2.0', type: 'LICENSE', name: 'Apache License 2.0',
      properties: { spdx: 'Apache-2.0', class: 'PERMISSIVE' }, provenance: ['spdx:Apache-2.0'],
    },
    {
      id: 'exchange:coinbase', type: 'EXCHANGE', name: 'Coinbase Exchange',
      properties: { adapter: 'PUBLIC_READ_ONLY', listingSelfDeclaration: false }, provenance: ['api:https://api.exchange.coinbase.com/products'],
    },
    {
      id: 'exchange:kraken', type: 'EXCHANGE', name: 'Kraken',
      properties: { adapter: 'PUBLIC_READ_ONLY', listingSelfDeclaration: false }, provenance: ['api:https://api.kraken.com/0/public/AssetPairs'],
    },
    {
      id: 'requirement:gdpr-production-evidence', type: 'COMPLIANCE_REQUIREMENT', name: 'GDPR Production Evidence',
      properties: { framework: 'GDPR', codeAloneSufficient: false }, provenance: ['contract:ecosystem/compliance-evidence.json'],
    },
    {
      id: 'requirement:hipaa-production-evidence', type: 'COMPLIANCE_REQUIREMENT', name: 'HIPAA Production Evidence',
      properties: { framework: 'HIPAA', codeAloneSufficient: false }, provenance: ['contract:ecosystem/compliance-evidence.json'],
    },
  ];

  objects.forEach(validateGovernanceObject);

  const links: GovernanceLink[] = [
    { from: 'repo:xuniadao', to: 'node:xuniaverse', type: 'ROOTS', provenance: ['contract:ecosystem/xuniaverse.json'] },
    { from: 'repo:xuniadao', to: 'license:apache-2.0', type: 'LICENSED_UNDER', provenance: ['path:LICENSE'] },
    { from: 'identity:va3lm-agent', to: 'runtime:va3lm', type: 'IDENTIFIES', provenance: ['contract:ecosystem/gcpxunia-defense.json'] },
    { from: 'auth:gcpxunia', to: 'identity:va3lm-agent', type: 'BROKERS_AUTH_FOR', provenance: ['contract:ecosystem/gcpxunia-defense.json'] },
    { from: 'repo:xuniadao', to: 'peer:gcp-security-community', type: 'LEARNS_FROM', provenance: ['https://security.googlecloudcommunity.com/'] },
    { from: 'repo:xuniadao', to: 'peer:palantir-ontology', type: 'MODELS_AFTER', provenance: ['https://www.palantir.com/docs/foundry/ontology/overview'] },
    { from: 'requirement:gdpr-production-evidence', to: 'repo:xuniadao', type: 'GOVERNS', provenance: ['path:src/lib/compliance-evidence.ts'] },
    { from: 'requirement:hipaa-production-evidence', to: 'repo:xuniadao', type: 'GOVERNS', provenance: ['path:src/lib/compliance-evidence.ts'] },
  ];

  links.forEach((link) => validateGovernanceLink(link, objects));
  return { objects, links };
};

export const ECOSYSTEM_GOVERNANCE_ONTOLOGY = {
  id: 'GLASS-ONION-GOVERNANCE-ONTOLOGY',
  version: '1.2.0',
  command: '/glass ontology governance',
  architecture: 'OBJECT_PROPERTY_LINK_ACTION_EVIDENCE_DECISION',
  objectTypes: [
    'REPOSITORY', 'LICENSE', 'TOKEN', 'EXCHANGE', 'MARKET', 'COMPLIANCE_REQUIREMENT',
    'AGENT_IDENTITY', 'AUTH_PROVIDER', 'ACCESS_POLICY', 'RUNTIME', 'GUARDRAIL', 'SECURITY_EVENT',
    'TECH_PEER', 'SECURITY_DOMAIN', 'XUNIAVERSE_NODE', 'EVIDENCE', 'ASSESSMENT', 'ATTESTATION',
  ] as readonly GovernanceObjectType[],
  linkTypes: [
    'LICENSED_UNDER', 'DISCOVERED_ON', 'QUOTED_BY', 'REQUIRES_EVIDENCE', 'SUPPORTED_BY',
    'SATISFIES', 'GOVERNS', 'DERIVED_FROM', 'BLOCKED_BY', 'ROOTS', 'IDENTIFIES', 'AUTHORIZES',
    'BROKERS_AUTH_FOR', 'ENFORCES', 'PROTECTS', 'BENCHMARKS_AGAINST', 'LEARNS_FROM', 'MODELS_AFTER', 'VALIDATES_WITH',
  ] as readonly GovernanceLinkType[],
  actions: [
    'VERIFY_LICENSE', 'DISCOVER_LISTING', 'READ_TICKER', 'VALIDATE_LISTING_PACKET', 'ATTACH_EVIDENCE',
    'ASSESS_READINESS', 'ISSUE_INTERNAL_ATTESTATION', 'VERIFY_AGENT_IDENTITY', 'BROKER_AGENT_AUTH',
    'REVOKE_AGENT_ACCESS', 'VERIFY_PEER_SOURCE', 'REGISTER_XUNIAVERSE_NODE',
  ] as readonly GovernanceAction[],
  domains: ['LICENSES', 'EXCHANGES', 'GDPR_HIPAA_EVIDENCE', 'AGENT_IDENTITY', 'GCPXUNIA_DEFENSE', 'TECH_PEERS', 'XUNIAVERSE', 'XRPL_TOKEN_WALLET'] as const,
  invariants: {
    provenanceRequired: true,
    externalListingRequiresExchangeEvidence: true,
    productionComplianceRequiresOperationalEvidence: true,
    licenseRightsRequireVerifiedLicense: true,
    agentIdentityRequiredForBrokeredAuth: true,
    sharedAgentCredentialsBlocked: true,
    longLivedAgentCredentialsBlocked: true,
    broadAgentGrantRequiresReview: true,
    peerClaimsRequireEvidence: true,
    xuniadaoIsXuniaverseRoot: true,
    fundMovementBlocked: true,
  },
} as const;
