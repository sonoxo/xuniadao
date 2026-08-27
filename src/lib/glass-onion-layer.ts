import { getXuniaLayer, XuniaLayerId } from './ecosystem';

export type GlassOnionCapability =
  | 'INTELLIGENCE_QUERY'
  | 'AIT_ONTOLOGY'
  | 'CRM'
  | 'CRM_PORT'
  | 'CRM_CERTIFICATION'
  | 'LICENSE_REGISTRY'
  | 'EXCHANGE_MARKET_DATA'
  | 'COMPLIANCE_EVIDENCE'
  | 'AGENT_IDENTITY_SECURITY'
  | 'GCPXUNIA_DEFENSE'
  | 'TECH_PEER_ONTOLOGY'
  | 'XUNIAVERSE_REGISTRY'
  | 'CODE_PLAN'
  | 'ONTOLOGY_WORKFLOW'
  | 'MEDIA_WORKFLOW'
  | 'QUANTUM_BLUEPRINT'
  | 'CADENCE_FLOW'
  | 'UAP_AGENT_RUNTIME'
  | 'CI_VALIDATION';

export type GlassOnionDecision = 'ALLOW' | 'REVIEW' | 'BLOCK';

export interface GlassOnionRequest {
  readonly objective: string;
  readonly capability: GlassOnionCapability;
  readonly targets: readonly XuniaLayerId[];
  readonly provenance?: readonly string[];
  readonly mutatesRepository?: boolean;
  readonly signsTransaction?: boolean;
  readonly deploysProduction?: boolean;
  readonly movesFunds?: boolean;
  readonly castsGovernanceVote?: boolean;
  readonly arbitraryRemoteShell?: boolean;
}

export interface GlassOnionRoute {
  readonly codename: 'GLASS ONION';
  readonly decision: GlassOnionDecision;
  readonly humanApprovalRequired: boolean;
  readonly targets: readonly XuniaLayerId[];
  readonly pipeline: readonly string[];
  readonly reasons: readonly string[];
}

const PIPELINES: Readonly<Record<GlassOnionCapability, readonly string[]>> = {
  INTELLIGENCE_QUERY: ['XUNIA_INGEST', 'PROVENANCE_CHECK', 'SONOXO_ONTOLOGY', 'VA3LM_REASON', 'ZYRA_VERIFY'],
  AIT_ONTOLOGY: ['AIT_INGEST', 'AIT_PROVENANCE_CHECK', 'AIT_NORMALIZE', 'AIT_CORRELATE', 'AIT_ANALYZE', 'VA3LM_COMMAND_REVIEW', 'ZYRA_ACTION_GATE'],
  CRM: ['CRM_INGEST', 'AIT_NORMALIZE', 'CRM_RELATIONSHIP_GRAPH', 'VA3LM_ANALYZE', 'ZYRA_WORKFLOW', 'UAP_AGENT_TASKS'],
  CRM_PORT: ['PORT_INGEST', 'FORMAT_PARSE', 'SCHEMA_MAP', 'DEDUPE', 'CONSENT_PROVENANCE_CHECK', 'DRY_RUN', 'HUMAN_REVIEW', 'BATCH_WRITE_OR_EXPORT', 'AUDIT', 'ROLLBACK_MANIFEST'],
  CRM_CERTIFICATION: ['CRM_CONTROL_SCOPE', 'PALANTIR_ONTOLOGY_GRAPH', 'EVIDENCE_VERIFICATION', 'CONTROL_ASSESSMENT', 'RISK_CHECK', 'ATTESTATION_GATE'],
  LICENSE_REGISTRY: ['REPOSITORY_DISCOVERY', 'LICENSE_FILE_VERIFY', 'SPDX_VALIDATE', 'OBLIGATION_EVALUATE', 'ATTRIBUTION_EVIDENCE'],
  EXCHANGE_MARKET_DATA: ['TOKEN_SCOPE', 'LISTING_PACKET_VALIDATE', 'LIVE_EXCHANGE_DISCOVERY', 'LISTING_STATUS_VERIFY', 'READ_ONLY_TICKER'],
  COMPLIANCE_EVIDENCE: ['FRAMEWORK_SCOPE', 'REQUIREMENT_MAP', 'EVIDENCE_INGEST', 'PROVENANCE_VERIFY', 'EXPIRY_CHECK', 'READINESS_ASSESSMENT'],
  AGENT_IDENTITY_SECURITY: ['AGENT_INVENTORY', 'SPIFFE_IDENTITY_VERIFY', 'AGENT_ATTESTATION', 'AUTH_MANAGER_BROKER', 'LEAST_PRIVILEGE_POLICY', 'DPOP_OR_MTLS_BINDING', 'AUDIT_EVIDENCE'],
  GCPXUNIA_DEFENSE: ['XUNIA_SCOPE', 'AGENT_IDENTITY_VERIFY', 'GCPXUNIA_AUTH_BROKER', 'VIRGINIA_POLICY_BOUNDARY', 'VA3LM_REASON_AND_PLAN', 'RUNTIME_GUARDRAIL', 'ZYRA_ACTION_GATE', 'AUDIT_EVIDENCE'],
  TECH_PEER_ONTOLOGY: ['PEER_SOURCE_DISCOVERY', 'PRIMARY_SOURCE_VERIFY', 'DOMAIN_MAP', 'ONTOLOGY_LINK', 'CREDENTIAL_EVIDENCE_CHECK', 'ALIGNMENT_ASSESSMENT'],
  XUNIAVERSE_REGISTRY: ['REPOSITORY_DISCOVERY', 'UPSTREAM_PROVENANCE', 'NODE_ROLE_MAP', 'XUNIADAO_ROOT_LINK', 'LICENSE_BOUNDARY', 'REGISTRY_EVIDENCE'],
  CODE_PLAN: ['XUNIA_SCOPE', 'VA3LM_PLAN', 'SONOXO_CODE_INTELLIGENCE', 'ZYRA_VALIDATE'],
  ONTOLOGY_WORKFLOW: ['XUNIA_OBJECTS', 'SONOXO_ONTOLOGY', 'VA3LM_FUNCTION_PLAN', 'ZYRA_ACTION_GATE'],
  MEDIA_WORKFLOW: ['ALMIGHTY_SONOXO_MEDIA', 'XUNIA_PROVENANCE', 'SONOXO_INDEX', 'ZYRA_WORKFLOW'],
  QUANTUM_BLUEPRINT: ['XUNIA_SCOPE', 'VA3LM_QUANTUM_PLAN', 'SONOXO_ONTOLOGY', 'ZYRA_VERIFY'],
  CADENCE_FLOW: ['XUNIA_CADENCE_INTENT', 'VA3LM_PLAN', 'ZYRA_TRANSACTION_GATE', 'XUNIA_VERIFY'],
  UAP_AGENT_RUNTIME: ['XUNIA_SCOPE', 'GPT_UAP_XO_PLAN', 'GPT_UAP_XO_BOUNDED_WORKERS', 'PROVENANCE_CHECK', 'ZYRA_ACTION_GATE'],
  CI_VALIDATION: ['XUNIA_SCOPE', 'ZYRA_CI', 'SONOXO_EVIDENCE', 'XUNIA_VERIFY'],
};

const PROVENANCE_CAPABILITIES: readonly GlassOnionCapability[] = [
  'INTELLIGENCE_QUERY',
  'AIT_ONTOLOGY',
  'CRM',
  'CRM_PORT',
  'CRM_CERTIFICATION',
  'LICENSE_REGISTRY',
  'EXCHANGE_MARKET_DATA',
  'COMPLIANCE_EVIDENCE',
  'AGENT_IDENTITY_SECURITY',
  'GCPXUNIA_DEFENSE',
  'TECH_PEER_ONTOLOGY',
  'XUNIAVERSE_REGISTRY',
];

const uniqueTargets = (targets: readonly XuniaLayerId[]): XuniaLayerId[] =>
  targets.filter((target, index) => targets.indexOf(target) === index);

export const routeGlassOnion = (request: GlassOnionRequest): GlassOnionRoute => {
  const reasons: string[] = [];
  const targets = uniqueTargets(request.targets);

  if (!request.objective.trim()) {
    return { codename: 'GLASS ONION', decision: 'BLOCK', humanApprovalRequired: true, targets, pipeline: PIPELINES[request.capability], reasons: ['OBJECTIVE_REQUIRED'] };
  }

  const invalidTarget = targets.find((target) => !getXuniaLayer(target));
  if (invalidTarget || targets.length === 0) {
    return { codename: 'GLASS ONION', decision: 'BLOCK', humanApprovalRequired: true, targets, pipeline: PIPELINES[request.capability], reasons: ['VALID_TARGET_REQUIRED'] };
  }

  if (request.movesFunds) reasons.push('AUTOMATIC_FUND_MOVEMENT_BLOCKED');
  if (request.castsGovernanceVote) reasons.push('AUTOMATIC_GOVERNANCE_VOTING_BLOCKED');
  if (request.arbitraryRemoteShell) reasons.push('ARBITRARY_REMOTE_SHELL_BLOCKED');

  if (reasons.length > 0) {
    return { codename: 'GLASS ONION', decision: 'BLOCK', humanApprovalRequired: true, targets, pipeline: PIPELINES[request.capability], reasons };
  }

  if (PROVENANCE_CAPABILITIES.includes(request.capability) && (!request.provenance || request.provenance.length === 0)) {
    reasons.push('PROVENANCE_REQUIRED_FOR_INTELLIGENCE_PROMOTION');
  }

  if (request.mutatesRepository) reasons.push('REPOSITORY_MUTATION_REQUIRES_REVIEW');
  if (request.signsTransaction) reasons.push('TRANSACTION_SIGNING_REQUIRES_REVIEW');
  if (request.deploysProduction) reasons.push('PRODUCTION_DEPLOY_REQUIRES_REVIEW');

  const humanApprovalRequired = reasons.length > 0;
  return {
    codename: 'GLASS ONION',
    decision: humanApprovalRequired ? 'REVIEW' : 'ALLOW',
    humanApprovalRequired,
    targets,
    pipeline: PIPELINES[request.capability],
    reasons,
  };
};

export const GLASS_ONION_LAYER = {
  codename: 'GLASS ONION',
  version: '2.6.0',
  command: '/glass',
  aitCommand: '/glass ait',
  crmCommand: '/glass crm',
  crmPortCommand: '/glass crm port',
  crmCertificationCommand: '/glass certify crm',
  licensesCommand: '/glass licenses',
  exchangesCommand: '/glass exchanges',
  evidenceCommand: '/glass evidence',
  identityCommand: '/glass identity',
  defenseCommand: '/glass defense',
  peersCommand: '/glass peers',
  xuniaverseCommand: '/glass xuniaverse',
  uapCommand: '/glass uap',
  umbrella: 'XUNIA',
  face: 'XUNIA / XuniaDAO',
  layers: ['xunia', 'zyra', 'sonoxo', 'almighty-sonoxo', 'va3lm', 'gpt-uap-xo'] as readonly XuniaLayerId[],
  capabilities: Object.keys(PIPELINES) as readonly GlassOnionCapability[],
  invariants: {
    xuniadaoIsXuniaverseRoot: true,
    provenanceRequired: true,
    humanApprovalForMutation: true,
    agentIdentityRequiredForBrokeredAuth: true,
    sharedAgentCredentialsBlocked: true,
    longLivedAgentCredentialsBlocked: true,
    exchangeMarketDataReadOnly: true,
    externalExchangeListingCannotBeSelfDeclared: true,
    productionComplianceEvidenceCannotBeInferred: true,
    automaticFundMovement: false,
    automaticGovernanceVoting: false,
    arbitraryRemoteShell: false,
  },
} as const;
