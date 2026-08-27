export type GovernanceObjectType =
  | 'REPOSITORY'
  | 'LICENSE'
  | 'TOKEN'
  | 'EXCHANGE'
  | 'MARKET'
  | 'COMPLIANCE_REQUIREMENT'
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
  | 'BLOCKED_BY';

export type GovernanceAction =
  | 'VERIFY_LICENSE'
  | 'DISCOVER_LISTING'
  | 'READ_TICKER'
  | 'VALIDATE_LISTING_PACKET'
  | 'ATTACH_EVIDENCE'
  | 'ASSESS_READINESS'
  | 'ISSUE_INTERNAL_ATTESTATION';

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
  if (request.externalListingClaim) return 'REVIEW';
  if (request.productionComplianceClaim) return 'REVIEW';
  if (request.mutatesRepository) return 'REVIEW';
  return 'ALLOW';
};

export const createGovernanceSeed = (): { readonly objects: readonly GovernanceObject[]; readonly links: readonly GovernanceLink[] } => {
  const objects: GovernanceObject[] = [
    {
      id: 'repo:xuniadao', type: 'REPOSITORY', name: 'sonoxo/xuniadao',
      properties: { role: 'GLASS_ONION_REGISTRY' }, provenance: ['repo:sonoxo/xuniadao'],
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
    { from: 'repo:xuniadao', to: 'license:apache-2.0', type: 'LICENSED_UNDER', provenance: ['path:LICENSE'] },
    { from: 'requirement:gdpr-production-evidence', to: 'repo:xuniadao', type: 'GOVERNS', provenance: ['path:src/lib/compliance-evidence.ts'] },
    { from: 'requirement:hipaa-production-evidence', to: 'repo:xuniadao', type: 'GOVERNS', provenance: ['path:src/lib/compliance-evidence.ts'] },
  ];

  links.forEach((link) => validateGovernanceLink(link, objects));
  return { objects, links };
};

export const ECOSYSTEM_GOVERNANCE_ONTOLOGY = {
  id: 'GLASS-ONION-GOVERNANCE-ONTOLOGY',
  version: '1.0.0',
  command: '/glass ontology governance',
  architecture: 'OBJECT_PROPERTY_LINK_ACTION_EVIDENCE_DECISION',
  objectTypes: ['REPOSITORY', 'LICENSE', 'TOKEN', 'EXCHANGE', 'MARKET', 'COMPLIANCE_REQUIREMENT', 'EVIDENCE', 'ASSESSMENT', 'ATTESTATION'] as readonly GovernanceObjectType[],
  linkTypes: ['LICENSED_UNDER', 'DISCOVERED_ON', 'QUOTED_BY', 'REQUIRES_EVIDENCE', 'SUPPORTED_BY', 'SATISFIES', 'GOVERNS', 'DERIVED_FROM', 'BLOCKED_BY'] as readonly GovernanceLinkType[],
  actions: ['VERIFY_LICENSE', 'DISCOVER_LISTING', 'READ_TICKER', 'VALIDATE_LISTING_PACKET', 'ATTACH_EVIDENCE', 'ASSESS_READINESS', 'ISSUE_INTERNAL_ATTESTATION'] as readonly GovernanceAction[],
  invariants: {
    provenanceRequired: true,
    externalListingRequiresExchangeEvidence: true,
    productionComplianceRequiresOperationalEvidence: true,
    licenseRightsRequireVerifiedLicense: true,
    fundMovementBlocked: true,
  },
} as const;
