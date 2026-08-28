export type CollectiveAlignmentState = 'TARGET' | 'IMPLEMENTED' | 'EVIDENCED' | 'EXTERNALLY_ATTESTED';
export type CollectiveDecision = 'ALLOW' | 'REVIEW' | 'BLOCK';

export type CollectiveControlFamily =
  | 'LEADERSHIP_PRIORITY'
  | 'RISK_REMEDIATION'
  | 'LEAST_PRIVILEGE'
  | 'STRONG_ACCESS_CONTROL'
  | 'DEFENSE_IN_DEPTH'
  | 'SECURE_SOFTWARE'
  | 'CONTINUOUS_TESTING'
  | 'VERIFIED_FIXES'
  | 'THREAT_INTELLIGENCE_SHARING'
  | 'INCIDENT_RESPONSE'
  | 'CRITICAL_INFRASTRUCTURE'
  | 'AGENT_IDENTITY'
  | 'OBSERVABILITY'
  | 'AUTHORIZED_TESTING_DISCLOSURE'
  | 'MEASURABLE_OUTCOMES';

export interface CollectiveAlignmentRequest {
  readonly organization: string;
  readonly control: CollectiveControlFamily;
  readonly requestedState: CollectiveAlignmentState;
  readonly evidence: readonly string[];
  readonly attestationReference?: string;
  readonly authorized?: boolean;
  readonly endorsementClaim?: boolean;
  readonly partnershipClaim?: boolean;
  readonly certificationClaim?: boolean;
  readonly proprietaryStandardsClaim?: boolean;
  readonly offensiveAction?: boolean;
}

export interface CollectiveGap {
  readonly control: CollectiveControlFamily;
  readonly currentState: CollectiveAlignmentState;
  readonly targetState: CollectiveAlignmentState;
}

export const evaluateCollectiveAlignment = (request: CollectiveAlignmentRequest): CollectiveDecision => {
  if (!request.organization.trim() || !request.authorized) return 'BLOCK';
  if (request.endorsementClaim || request.partnershipClaim || request.certificationClaim) return 'BLOCK';
  if (request.proprietaryStandardsClaim || request.offensiveAction) return 'BLOCK';

  if (request.requestedState === 'TARGET') return 'ALLOW';
  const hasEvidence = request.evidence.some((item) => item.trim().length > 0);
  if (!hasEvidence) return 'BLOCK';
  if (request.requestedState === 'EXTERNALLY_ATTESTED' && !request.attestationReference?.trim()) return 'BLOCK';
  return 'REVIEW';
};

export const createCollectiveGapReport = (
  states: Readonly<Partial<Record<CollectiveControlFamily, CollectiveAlignmentState>>>,
): readonly CollectiveGap[] =>
  COLLECTIVE_CONTROL_FAMILIES
    .filter((control) => states[control] !== 'EVIDENCED' && states[control] !== 'EXTERNALLY_ATTESTED')
    .map((control) => ({
      control,
      currentState: states[control] ?? 'TARGET',
      targetState: 'EVIDENCED',
    }));

export const COLLECTIVE_CONTROL_FAMILIES: readonly CollectiveControlFamily[] = [
  'LEADERSHIP_PRIORITY',
  'RISK_REMEDIATION',
  'LEAST_PRIVILEGE',
  'STRONG_ACCESS_CONTROL',
  'DEFENSE_IN_DEPTH',
  'SECURE_SOFTWARE',
  'CONTINUOUS_TESTING',
  'VERIFIED_FIXES',
  'THREAT_INTELLIGENCE_SHARING',
  'INCIDENT_RESPONSE',
  'CRITICAL_INFRASTRUCTURE',
  'AGENT_IDENTITY',
  'OBSERVABILITY',
  'AUTHORIZED_TESTING_DISCLOSURE',
  'MEASURABLE_OUTCOMES',
] as const;

export const COLLECTIVE_CYBER_DEFENSE_ONTOLOGY = {
  id: 'XUNIA-COLLECTIVE-CYBER-DEFENSE-ONTOLOGY',
  version: '1.0.0',
  command: '/glass collective defense',
  source: {
    article: 'https://openai.com/collective-cyberdefense/',
    xPost: 'https://x.com/OpenAI/status/2093074192636018977',
    publisher: 'OpenAI',
    rosterCount: 128,
  },
  alignmentStates: ['TARGET', 'IMPLEMENTED', 'EVIDENCED', 'EXTERNALLY_ATTESTED'] as const,
  claims: {
    officialXuniaUpgrade: true,
    signatoryRelationshipOnly: true,
    endorsementClaim: false,
    partnershipClaim: false,
    certificationClaim: false,
    proprietaryStandardsClaim: false,
  },
  controls: COLLECTIVE_CONTROL_FAMILIES,
} as const;
