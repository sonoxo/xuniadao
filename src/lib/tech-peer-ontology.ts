export type PeerKind = 'COMMUNITY' | 'PLATFORM' | 'SECURITY_DOMAIN' | 'ONTOLOGY_REFERENCE';
export type PeerRelation = 'BENCHMARKS_AGAINST' | 'LEARNS_FROM' | 'VALIDATES_WITH' | 'MODELS_AFTER';

export interface TechnologyPeerReference {
  readonly id: string;
  readonly name: string;
  readonly kind: PeerKind;
  readonly domain: string;
  readonly source: string;
  readonly relation: PeerRelation;
  readonly affiliationClaim: false;
}

export const TECHNOLOGY_PEERS: readonly TechnologyPeerReference[] = [
  { id: 'peer:gcp-security-community', name: 'Google Cloud Security Community', kind: 'COMMUNITY', domain: 'cloud security peer exchange', source: 'https://security.googlecloudcommunity.com/', relation: 'LEARNS_FROM', affiliationClaim: false },
  { id: 'peer:gcp-secops', name: 'Google Security Operations', kind: 'SECURITY_DOMAIN', domain: 'security operations', source: 'https://security.googlecloudcommunity.com/security-forums-1', relation: 'BENCHMARKS_AGAINST', affiliationClaim: false },
  { id: 'peer:gcp-threat-intel', name: 'Google Threat Intelligence', kind: 'SECURITY_DOMAIN', domain: 'threat intelligence', source: 'https://security.googlecloudcommunity.com/security-forums-1', relation: 'BENCHMARKS_AGAINST', affiliationClaim: false },
  { id: 'peer:gcp-scc', name: 'Security Command Center', kind: 'SECURITY_DOMAIN', domain: 'cloud posture and findings', source: 'https://security.googlecloudcommunity.com/security-command-center-4', relation: 'BENCHMARKS_AGAINST', affiliationClaim: false },
  { id: 'peer:gcp-validation', name: 'Security Validation', kind: 'SECURITY_DOMAIN', domain: 'security validation', source: 'https://security.googlecloudcommunity.com/security-forums-1', relation: 'VALIDATES_WITH', affiliationClaim: false },
  { id: 'peer:gcp-foundation', name: 'Cloud Security Foundation', kind: 'SECURITY_DOMAIN', domain: 'IAM, network, data security and compliance', source: 'https://security.googlecloudcommunity.com/cloud-security-foundation-7', relation: 'LEARNS_FROM', affiliationClaim: false },
  { id: 'peer:palantir-ontology', name: 'Palantir Ontology', kind: 'ONTOLOGY_REFERENCE', domain: 'objects, properties, links, actions and governance', source: 'https://www.palantir.com/docs/foundry/ontology/overview', relation: 'MODELS_AFTER', affiliationClaim: false },
] as const;

export const TECH_PEER_ONTOLOGY = {
  id: 'XUNIAVERSE-TECH-PEER-ONTOLOGY',
  version: '1.0.0',
  command: '/glass peers',
  root: 'sonoxo/xuniadao',
  status: 'EVIDENCE_BACKED_REFERENCE_GRAPH',
  objectTypes: ['TECH_PEER', 'SECURITY_DOMAIN', 'SOURCE', 'CREDENTIAL_EVIDENCE', 'ASSESSMENT'] as const,
  linkTypes: ['BENCHMARKS_AGAINST', 'LEARNS_FROM', 'VALIDATES_WITH', 'MODELS_AFTER', 'SUPPORTED_BY_EVIDENCE'] as const,
  actions: ['ADD_PEER_REFERENCE', 'ATTACH_CREDENTIAL_EVIDENCE', 'VERIFY_SOURCE', 'ASSESS_ALIGNMENT', 'REVOKE_UNSUPPORTED_CLAIM'] as const,
  peerReviewCredentialState: 'EVIDENCE_REQUIRED_FOR_PUBLIC_CLAIM',
  peers: TECHNOLOGY_PEERS,
  rules: {
    primarySourcesPreferred: true,
    affiliationMustNotBeInferred: true,
    credentialClaimsRequireEvidence: true,
    communityParticipationIsNotVendorEndorsement: true,
  },
} as const;
