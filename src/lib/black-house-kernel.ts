export const BLACK_HOUSE_KERNEL_VERSION = '3.0.0' as const;
export const BLACK_HOUSE_CONTROL_PLANE = 'THE_BLACK_HOUSE_V1' as const;

export const BLACK_HOUSE_OBJECT_TYPES = [
  'Mission', 'Agent', 'Model', 'User', 'Repository', 'Service', 'Tool', 'Resource', 'Evidence',
  'Source', 'Decision', 'Approval', 'Action', 'Deployment', 'Incident', 'Policy',
  'CredentialReference', 'Artifact', 'IntelligenceBrief',
] as const;

export const BLACK_HOUSE_RELATIONSHIP_TYPES = [
  'EXECUTES', 'USES', 'PRODUCES', 'DERIVED_FROM', 'AUTHORIZES', 'GOVERNS', 'DEPLOYED_TO',
  'IMPLEMENTS', 'RUNS_ON', 'ROUTES_TO', 'AUDITS', 'EVIDENCES',
] as const;

export type BlackHouseObjectType = typeof BLACK_HOUSE_OBJECT_TYPES[number];
export type BlackHouseRelationshipType = typeof BLACK_HOUSE_RELATIONSHIP_TYPES[number];

const XUNIA_OBJECT_BINDINGS: Readonly<Record<string, BlackHouseObjectType>> = {
  REPOSITORY: 'Repository',
  LICENSE: 'Resource',
  TOKEN: 'Resource',
  EXCHANGE: 'Service',
  MARKET: 'Resource',
  COMPLIANCE_REQUIREMENT: 'Policy',
  AGENT_IDENTITY: 'Agent',
  AUTH_PROVIDER: 'Service',
  ACCESS_POLICY: 'Policy',
  RUNTIME: 'Service',
  GUARDRAIL: 'Policy',
  SECURITY_EVENT: 'Incident',
  TECH_PEER: 'Source',
  SECURITY_DOMAIN: 'Resource',
  XUNIAVERSE_NODE: 'Service',
  EVIDENCE: 'Evidence',
  ASSESSMENT: 'Decision',
  ATTESTATION: 'Evidence',
};

export const toBlackHouseObjectType = (xuniaType: string): BlackHouseObjectType => {
  const canonical = XUNIA_OBJECT_BINDINGS[xuniaType];
  if (!canonical) throw new Error(`BLACK_HOUSE_UNREGISTERED_XUNIA_OBJECT:${xuniaType}`);
  return canonical;
};

export const requireBlackHouseRelationship = (relation: string): BlackHouseRelationshipType => {
  if (!(BLACK_HOUSE_RELATIONSHIP_TYPES as readonly string[]).includes(relation)) {
    throw new Error(`BLACK_HOUSE_UNREGISTERED_RELATIONSHIP:${relation}`);
  }
  return relation as BlackHouseRelationshipType;
};

export const BLACK_HOUSE_KERNEL = {
  kernelVersion: BLACK_HOUSE_KERNEL_VERSION,
  controlPlane: BLACK_HOUSE_CONTROL_PLANE,
  canonicalRoot: 'sonoxo/gpt-doug-llm/the-black-house',
  component: 'XUNIA',
  role: 'DOMAIN_ONTOLOGY_AND_AGENT_ORCHESTRATION',
  controlPlaneRoot: false,
  domainRoot: 'XUNIAverse',
  objectTypes: BLACK_HOUSE_OBJECT_TYPES,
  relationshipTypes: BLACK_HOUSE_RELATIONSHIP_TYPES,
  invariants: {
    typedObjectsRequired: true,
    registeredRelationshipsOnly: true,
    evidenceRequiresProvenance: true,
    consequentialMutationRequiresHumanApproval: true,
    unknownActionsFailClosed: true,
  },
} as const;
