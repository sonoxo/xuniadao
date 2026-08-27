export type DefenseObjectType =
  | 'XUNIAVERSE_ROOT'
  | 'CLOUD_SECURITY_LAYER'
  | 'POLICY_BOUNDARY'
  | 'VA3LM_RUNTIME'
  | 'AGENT_IDENTITY'
  | 'AUTH_PROVIDER'
  | 'ACCESS_POLICY'
  | 'GUARDRAIL'
  | 'EVIDENCE'
  | 'SECURITY_EVENT';

export type DefenseLinkType =
  | 'ROOTS'
  | 'IDENTIFIES'
  | 'AUTHORIZES'
  | 'BROKERS_AUTH_FOR'
  | 'ENFORCES'
  | 'PROTECTS'
  | 'PRODUCES_EVIDENCE'
  | 'OBSERVES'
  | 'BLOCKS';

export type DefenseDecision = 'ALLOW' | 'REVIEW' | 'BLOCK';

export interface AgentIdentity {
  readonly id: string;
  readonly spiffeId: string;
  readonly runtime: 'VA3LM' | 'ZYRA' | 'GPT_UAP_XO' | 'OTHER';
  readonly credentialMode: 'SHORT_LIVED' | 'USER_DELEGATED';
  readonly tokenBinding: readonly ('DPOP' | 'MTLS')[];
  readonly scopes: readonly string[];
  readonly provenance: readonly string[];
}

export interface AgentAuthRequest {
  readonly identity: AgentIdentity;
  readonly provider: string;
  readonly requestedScopes: readonly string[];
  readonly projectWideGrant?: boolean;
  readonly organizationWideGrant?: boolean;
  readonly longLivedCredential?: boolean;
  readonly sharedCredential?: boolean;
  readonly humanApproved?: boolean;
}

export interface AgentAuthDecision {
  readonly decision: DefenseDecision;
  readonly reasons: readonly string[];
}

const validSpiffeId = (value: string): boolean => /^spiffe:\/\/[a-z0-9.-]+\/[A-Za-z0-9._\/-]+$/.test(value);

export const evaluateAgentAuth = (request: AgentAuthRequest): AgentAuthDecision => {
  const reasons: string[] = [];
  if (!validSpiffeId(request.identity.spiffeId)) reasons.push('SPIFFE_ID_REQUIRED');
  if (request.identity.provenance.length === 0) reasons.push('IDENTITY_PROVENANCE_REQUIRED');
  if (!request.provider.trim()) reasons.push('AUTH_PROVIDER_REQUIRED');
  if (request.sharedCredential) reasons.push('SHARED_AGENT_CREDENTIAL_BLOCKED');
  if (request.longLivedCredential) reasons.push('LONG_LIVED_AGENT_CREDENTIAL_BLOCKED');
  if (request.projectWideGrant || request.organizationWideGrant) reasons.push('BROAD_AGENT_GRANT_REQUIRES_REVIEW');
  const outOfScope = request.requestedScopes.filter((scope) => !request.identity.scopes.includes(scope));
  if (outOfScope.length > 0) reasons.push('REQUESTED_SCOPE_EXCEEDS_AGENT_SCOPE');

  const hardBlock = reasons.some((reason) =>
    reason === 'SHARED_AGENT_CREDENTIAL_BLOCKED' ||
    reason === 'LONG_LIVED_AGENT_CREDENTIAL_BLOCKED' ||
    reason === 'SPIFFE_ID_REQUIRED'
  );
  if (hardBlock) return { decision: 'BLOCK', reasons };
  if (reasons.length > 0 && !request.humanApproved) return { decision: 'REVIEW', reasons };
  return { decision: 'ALLOW', reasons };
};

export const GCPXUNIA_DEFENSE_ONTOLOGY = {
  id: 'GCPXUNIA-VIRGINIA-VA3LM-DEFENSE',
  version: '1.0.0',
  command: '/glass defense',
  status: 'ACTIVE_DEFENSIVE_CONTROL_MODEL',
  architecture: 'PALANTIR_ONTOLOGY_ALIGNED',
  root: 'XUNIA / XuniaDAO',
  layers: ['GCPXUNIA', 'VIRGINIA', 'VA3LM', 'ZYRA_ACTION_GATE'] as const,
  flow: [
    'XUNIA_SCOPE',
    'AGENT_IDENTITY_VERIFY',
    'GCPXUNIA_AUTH_BROKER',
    'VIRGINIA_POLICY_BOUNDARY',
    'VA3LM_REASON_AND_PLAN',
    'RUNTIME_GUARDRAIL',
    'ZYRA_ACTION_GATE',
    'AUDIT_EVIDENCE',
  ] as const,
  objectTypes: [
    'XUNIAVERSE_ROOT',
    'CLOUD_SECURITY_LAYER',
    'POLICY_BOUNDARY',
    'VA3LM_RUNTIME',
    'AGENT_IDENTITY',
    'AUTH_PROVIDER',
    'ACCESS_POLICY',
    'GUARDRAIL',
    'EVIDENCE',
    'SECURITY_EVENT',
  ] as readonly DefenseObjectType[],
  linkTypes: [
    'ROOTS', 'IDENTIFIES', 'AUTHORIZES', 'BROKERS_AUTH_FOR', 'ENFORCES',
    'PROTECTS', 'PRODUCES_EVIDENCE', 'OBSERVES', 'BLOCKS',
  ] as readonly DefenseLinkType[],
  actions: [
    'REGISTER_AGENT_IDENTITY',
    'VERIFY_AGENT_IDENTITY',
    'REQUEST_SHORT_LIVED_CREDENTIAL',
    'BROKER_USER_DELEGATED_AUTH',
    'EVALUATE_AGENT_SCOPE',
    'REQUIRE_HUMAN_REVIEW',
    'REVOKE_AGENT_ACCESS',
    'RECORD_SECURITY_EVIDENCE',
  ] as const,
  controls: {
    agentIsFirstClassPrincipal: true,
    spiffeIdentityPreferred: true,
    shortLivedCredentialsRequired: true,
    sharedAgentCredentialsBlocked: true,
    longLivedAgentCredentialsBlocked: true,
    dpopSupported: true,
    mtlsSupported: true,
    leastPrivilegeRequired: true,
    broadAgentGrantsRequireReview: true,
    userDelegationSeparatedFromAgentAuthority: true,
    humanApprovalForSensitiveMutation: true,
    runtimeGuardrailsRequired: true,
    auditEvidenceRequired: true,
    arbitraryRemoteShell: false,
    automaticFundMovement: false,
  },
  sources: [
    'https://docs.cloud.google.com/iam/docs/auth-agent-own-identity',
    'https://docs.cloud.google.com/iam/docs/auth-manager-overview',
    'https://security.googlecloudcommunity.com/cloud-security-foundation-7/whats-new-in-iam-next-2026-7522',
    'https://www.palantir.com/docs/foundry/ontology/overview',
  ] as const,
  claims: {
    googleCloudDeploymentClaimed: false,
    palantirDeploymentClaimed: false,
    vendorEndorsementClaimed: false,
  },
} as const;
