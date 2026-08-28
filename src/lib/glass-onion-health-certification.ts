export type HealthCertificationFramework =
  | 'XUNIA_HEALTH_CONTROL_BASELINE'
  | 'HIPAA_SECURITY_READINESS'
  | 'HIPAA_PRIVACY_READINESS'
  | 'PSYCHOTHERAPY_NOTE_READINESS'
  | 'PART2_READINESS'
  | 'E_SIGNATURE_READINESS';

export type HealthControlStatus = 'IMPLEMENTED' | 'PENDING' | 'BLOCKED' | 'NOT_APPLICABLE';
export type HealthEvidenceStatus = 'VERIFIED_CODE' | 'OPERATIONAL_EVIDENCE_REQUIRED' | 'INDEPENDENT_EVIDENCE_REQUIRED';

export interface HealthCertificationControl {
  readonly id: string;
  readonly framework: HealthCertificationFramework;
  readonly title: string;
  readonly status: HealthControlStatus;
  readonly evidenceIds: readonly string[];
}

export interface HealthCertificationEvidence {
  readonly id: string;
  readonly source: string;
  readonly status: HealthEvidenceStatus;
  readonly provenance: readonly string[];
}

export interface HealthCertificationAssessment {
  readonly implemented: readonly string[];
  readonly pending: readonly string[];
  readonly blocked: readonly string[];
  readonly operationalEvidenceOutstanding: readonly string[];
}

export const HEALTH_CERTIFICATION_EVIDENCE: readonly HealthCertificationEvidence[] = [
  {
    id: 'health:evidence:source',
    source: 'src/lib/glass-onion-health.ts',
    status: 'VERIFIED_CODE',
    provenance: ['repo:sonoxo/xuniadao', 'path:src/lib/glass-onion-health.ts'],
  },
  {
    id: 'health:evidence:tests',
    source: 'src/lib/glass-onion-health.spec.ts',
    status: 'VERIFIED_CODE',
    provenance: ['repo:sonoxo/xuniadao', 'path:src/lib/glass-onion-health.spec.ts'],
  },
  {
    id: 'health:evidence:contract',
    source: 'ecosystem/glass-onion-health.json',
    status: 'VERIFIED_CODE',
    provenance: ['repo:sonoxo/xuniadao', 'path:ecosystem/glass-onion-health.json'],
  },
  {
    id: 'health:evidence:implementation-guide',
    source: 'docs/GLASS_ONION_HEALTH.md',
    status: 'VERIFIED_CODE',
    provenance: ['repo:sonoxo/xuniadao', 'path:docs/GLASS_ONION_HEALTH.md'],
  },
  {
    id: 'health:evidence:production-risk-analysis',
    source: 'production HIPAA security risk analysis',
    status: 'OPERATIONAL_EVIDENCE_REQUIRED',
    provenance: ['required:deployment'],
  },
  {
    id: 'health:evidence:baa-inventory',
    source: 'executed BAA and vendor inventory',
    status: 'OPERATIONAL_EVIDENCE_REQUIRED',
    provenance: ['required:deployment'],
  },
  {
    id: 'health:evidence:access-review',
    source: 'production access-control and audit-log review',
    status: 'OPERATIONAL_EVIDENCE_REQUIRED',
    provenance: ['required:deployment'],
  },
  {
    id: 'health:evidence:part2-scope',
    source: '42 CFR Part 2 applicability and consent workflow determination',
    status: 'OPERATIONAL_EVIDENCE_REQUIRED',
    provenance: ['required:deployment-when-applicable'],
  },
  {
    id: 'health:evidence:independent-assessment',
    source: 'independent assessor or legal/compliance review output',
    status: 'INDEPENDENT_EVIDENCE_REQUIRED',
    provenance: ['required:external-attestation'],
  },
] as const;

const CODE_EVIDENCE = ['health:evidence:source', 'health:evidence:tests', 'health:evidence:contract', 'health:evidence:implementation-guide'] as const;

export const HEALTH_CERTIFICATION_CONTROLS: readonly HealthCertificationControl[] = [
  {
    id: 'health.baseline.payload-isolation',
    framework: 'XUNIA_HEALTH_CONTROL_BASELINE',
    title: 'Protected clinical payload is isolated from ordinary CRM metadata',
    status: 'IMPLEMENTED',
    evidenceIds: CODE_EVIDENCE,
  },
  {
    id: 'health.baseline.provenance',
    framework: 'XUNIA_HEALTH_CONTROL_BASELINE',
    title: 'Clinical documents, signatures, authorizations and disclosures require provenance',
    status: 'IMPLEMENTED',
    evidenceIds: CODE_EVIDENCE,
  },
  {
    id: 'health.baseline.access-decision',
    framework: 'XUNIA_HEALTH_CONTROL_BASELINE',
    title: 'Clinical access resolves through ALLOW, REVIEW or BLOCK policy decisions',
    status: 'IMPLEMENTED',
    evidenceIds: CODE_EVIDENCE,
  },
  {
    id: 'health.security.minimum-necessary',
    framework: 'HIPAA_SECURITY_READINESS',
    title: 'Protected data access requires minimum-necessary evaluation except modeled client-access workflows',
    status: 'IMPLEMENTED',
    evidenceIds: ['health:evidence:source', 'health:evidence:production-risk-analysis', 'health:evidence:access-review'],
  },
  {
    id: 'health.security.audit',
    framework: 'HIPAA_SECURITY_READINESS',
    title: 'Ordered provenance-bearing audit events are required',
    status: 'IMPLEMENTED',
    evidenceIds: ['health:evidence:source', 'health:evidence:access-review'],
  },
  {
    id: 'health.security.vendor-governance',
    framework: 'HIPAA_SECURITY_READINESS',
    title: 'Production vendor and BAA governance is required when applicable',
    status: 'PENDING',
    evidenceIds: ['health:evidence:baa-inventory'],
  },
  {
    id: 'health.privacy.disclosure-review',
    framework: 'HIPAA_PRIVACY_READINESS',
    title: 'External release of protected clinical records requires human review',
    status: 'IMPLEMENTED',
    evidenceIds: ['health:evidence:source', 'health:evidence:access-review'],
  },
  {
    id: 'health.privacy.client-access',
    framework: 'HIPAA_PRIVACY_READINESS',
    title: 'Client access is routed through a controlled records-request workflow',
    status: 'IMPLEMENTED',
    evidenceIds: CODE_EVIDENCE,
  },
  {
    id: 'health.psychotherapy.separation',
    framework: 'PSYCHOTHERAPY_NOTE_READINESS',
    title: 'Psychotherapy notes have a separate data class and access path',
    status: 'IMPLEMENTED',
    evidenceIds: CODE_EVIDENCE,
  },
  {
    id: 'health.part2.classification',
    framework: 'PART2_READINESS',
    title: 'Part 2 and SUD counseling-note classifications are modeled separately',
    status: 'IMPLEMENTED',
    evidenceIds: ['health:evidence:source', 'health:evidence:part2-scope'],
  },
  {
    id: 'health.part2.release',
    framework: 'PART2_READINESS',
    title: 'Modeled Part 2 external release requires consent state and human review',
    status: 'IMPLEMENTED',
    evidenceIds: ['health:evidence:source', 'health:evidence:part2-scope'],
  },
  {
    id: 'health.signature.binding',
    framework: 'E_SIGNATURE_READINESS',
    title: 'Electronic signature binds signer, intent, document version, hash and authentication method',
    status: 'IMPLEMENTED',
    evidenceIds: CODE_EVIDENCE,
  },
] as const;

export const assessHealthCertification = (
  controls: readonly HealthCertificationControl[],
  evidence: readonly HealthCertificationEvidence[],
): HealthCertificationAssessment => {
  const codeVerified = new Set(evidence.filter((item) => item.status === 'VERIFIED_CODE').map((item) => item.id));
  const operational = new Set(evidence.filter((item) => item.status !== 'VERIFIED_CODE').map((item) => item.id));
  const implemented: string[] = [];
  const pending: string[] = [];
  const blocked: string[] = [];
  const operationalEvidenceOutstanding = new Set<string>();

  controls.forEach((control) => {
    if (control.status === 'BLOCKED') {
      blocked.push(control.id);
      return;
    }
    control.evidenceIds.filter((id) => operational.has(id)).forEach((id) => operationalEvidenceOutstanding.add(id));
    const codeRequirements = control.evidenceIds.filter((id) => !operational.has(id));
    const codeSatisfied = codeRequirements.every((id) => codeVerified.has(id));
    if (control.status === 'IMPLEMENTED' && codeSatisfied) implemented.push(control.id);
    else if (control.status !== 'NOT_APPLICABLE') pending.push(control.id);
  });

  return {
    implemented,
    pending,
    blocked,
    operationalEvidenceOutstanding: Array.from(operationalEvidenceOutstanding),
  };
};

export const GLASS_ONION_HEALTH_CERTIFICATION = {
  id: 'GLASS-ONION-HEALTH-CERTIFICATION',
  version: '0.1.0',
  command: '/glass certify health',
  architecture: 'GLASS_ONION_CONTROL_EVIDENCE_ONTOLOGY',
  internalAttestation: {
    id: 'XUNIA-HEALTH-ICA-1',
    status: 'CODE_CONTROL_BASELINE_ATTESTED',
    scope: 'Repository implementation only',
  },
  assessment: assessHealthCertification(HEALTH_CERTIFICATION_CONTROLS, HEALTH_CERTIFICATION_EVIDENCE),
  deploymentStatus: 'OPERATIONAL_EVIDENCE_REQUIRED',
  externalCertificationStatus: 'NOT_ISSUED',
  hipaaCertificationClaimed: false,
  independentAssessmentRequiredForExternalAttestation: true,
} as const;
