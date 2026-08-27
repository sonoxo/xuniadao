export type CertificationObjectType =
  | 'SYSTEM'
  | 'CONTROL'
  | 'EVIDENCE'
  | 'ASSESSMENT'
  | 'RISK'
  | 'ATTESTATION';

export type CertificationRelationType =
  | 'GOVERNS'
  | 'SUPPORTED_BY'
  | 'SATISFIES'
  | 'BLOCKED_BY'
  | 'APPLIES_TO'
  | 'DERIVED_FROM';

export type ControlStatus = 'PASS' | 'FAIL' | 'PENDING' | 'NOT_APPLICABLE';
export type AssessmentResult = 'PASS' | 'CONDITIONAL' | 'FAIL';
export type AttestationStatus = 'INTERNAL_ATTESTED' | 'READINESS_ONLY' | 'BLOCKED';

export type ComplianceFramework =
  | 'XUNIA_CRM_CONTROL_BASELINE'
  | 'GDPR_READINESS'
  | 'CCPA_READINESS'
  | 'SOC2_READINESS'
  | 'HIPAA_CONDITIONAL'
  | 'CAN_SPAM_READINESS'
  | 'TCPA_READINESS';

export interface CertificationObject {
  readonly id: string;
  readonly type: CertificationObjectType;
  readonly name: string;
  readonly properties: Readonly<Record<string, string | number | boolean | readonly string[]>>;
  readonly provenance: readonly string[];
}

export interface CertificationRelation {
  readonly from: string;
  readonly to: string;
  readonly type: CertificationRelationType;
  readonly provenance: readonly string[];
}

export interface CertificationControl {
  readonly id: string;
  readonly framework: ComplianceFramework;
  readonly title: string;
  readonly required: boolean;
  readonly status: ControlStatus;
  readonly evidenceIds: readonly string[];
}

export interface CertificationEvidence {
  readonly id: string;
  readonly source: string;
  readonly status: 'VERIFIED' | 'UNVERIFIED';
  readonly provenance: readonly string[];
}

export interface CertificationAssessment {
  readonly result: AssessmentResult;
  readonly passed: readonly string[];
  readonly pending: readonly string[];
  readonly failed: readonly string[];
}

export interface InternalAttestation {
  readonly id: string;
  readonly status: AttestationStatus;
  readonly scope: string;
  readonly issuer: 'XUNIA / GLASS ONION INTERNAL CONTROL PROGRAM';
  readonly humanApproved: boolean;
  readonly externalCertificationStatus: 'NOT_ISSUED';
  readonly assessment: CertificationAssessment;
}

export const assessCertificationControls = (
  controls: readonly CertificationControl[],
  evidence: readonly CertificationEvidence[],
): CertificationAssessment => {
  const verified = new Set(evidence.filter((item) => item.status === 'VERIFIED').map((item) => item.id));
  const passed: string[] = [];
  const pending: string[] = [];
  const failed: string[] = [];

  for (const control of controls) {
    if (control.status === 'FAIL') {
      failed.push(control.id);
      continue;
    }
    if (control.status === 'NOT_APPLICABLE') continue;

    const evidenceSatisfied = control.evidenceIds.length > 0 && control.evidenceIds.every((id) => verified.has(id));
    if (control.status === 'PASS' && evidenceSatisfied) passed.push(control.id);
    else if (control.required) pending.push(control.id);
  }

  return {
    result: failed.length > 0 ? 'FAIL' : pending.length > 0 ? 'CONDITIONAL' : 'PASS',
    passed,
    pending,
    failed,
  };
};

export const issueInternalCRMAttestation = (
  controls: readonly CertificationControl[],
  evidence: readonly CertificationEvidence[],
  humanApproved: boolean,
): InternalAttestation => {
  const baseline = controls.filter((control) => control.framework === 'XUNIA_CRM_CONTROL_BASELINE');
  const assessment = assessCertificationControls(baseline, evidence);

  return {
    id: 'XUNIA-CRM-ICA-1',
    status:
      assessment.result === 'FAIL'
        ? 'BLOCKED'
        : assessment.result === 'PASS' && humanApproved
          ? 'INTERNAL_ATTESTED'
          : 'READINESS_ONLY',
    scope: 'Code-level GLASS ONION CRM control baseline',
    issuer: 'XUNIA / GLASS ONION INTERNAL CONTROL PROGRAM',
    humanApproved,
    externalCertificationStatus: 'NOT_ISSUED',
    assessment,
  };
};

export const CRM_CERTIFICATION_EVIDENCE: readonly CertificationEvidence[] = [
  {
    id: 'evidence:crm-source',
    source: 'src/lib/crm.ts',
    status: 'VERIFIED',
    provenance: ['repo:sonoxo/xuniadao', 'path:src/lib/crm.ts'],
  },
  {
    id: 'evidence:crm-contract',
    source: 'ecosystem/crm.json',
    status: 'VERIFIED',
    provenance: ['repo:sonoxo/xuniadao', 'path:ecosystem/crm.json'],
  },
  {
    id: 'evidence:crm-ci',
    source: '.github/workflows/crm.yml',
    status: 'VERIFIED',
    provenance: ['repo:sonoxo/xuniadao', 'path:.github/workflows/crm.yml'],
  },
] as const;

export const CRM_CERTIFICATION_CONTROLS: readonly CertificationControl[] = [
  {
    id: 'crm.baseline.provenance',
    framework: 'XUNIA_CRM_CONTROL_BASELINE',
    title: 'CRM records require provenance',
    required: true,
    status: 'PASS',
    evidenceIds: ['evidence:crm-source', 'evidence:crm-contract'],
  },
  {
    id: 'crm.baseline.mutation-review',
    framework: 'XUNIA_CRM_CONTROL_BASELINE',
    title: 'CRM mutation requires human review',
    required: true,
    status: 'PASS',
    evidenceIds: ['evidence:crm-source', 'evidence:crm-contract'],
  },
  {
    id: 'crm.baseline.external-communication-review',
    framework: 'XUNIA_CRM_CONTROL_BASELINE',
    title: 'External CRM communication requires human review',
    required: true,
    status: 'PASS',
    evidenceIds: ['evidence:crm-source', 'evidence:crm-contract'],
  },
  {
    id: 'crm.baseline.bulk-outreach-review',
    framework: 'XUNIA_CRM_CONTROL_BASELINE',
    title: 'Bulk outreach requires human review',
    required: true,
    status: 'PASS',
    evidenceIds: ['evidence:crm-source', 'evidence:crm-contract'],
  },
  {
    id: 'crm.baseline.ci-lock',
    framework: 'XUNIA_CRM_CONTROL_BASELINE',
    title: 'CRM contract is CI locked',
    required: true,
    status: 'PASS',
    evidenceIds: ['evidence:crm-ci'],
  },
  {
    id: 'crm.privacy.consent-ledger',
    framework: 'GDPR_READINESS',
    title: 'Consent and lawful-basis ledger',
    required: true,
    status: 'PENDING',
    evidenceIds: [],
  },
  {
    id: 'crm.privacy.deletion-workflow',
    framework: 'CCPA_READINESS',
    title: 'Deletion and data-subject request workflow',
    required: true,
    status: 'PENDING',
    evidenceIds: [],
  },
  {
    id: 'crm.security.rbac',
    framework: 'SOC2_READINESS',
    title: 'Role-based access control evidence',
    required: true,
    status: 'PENDING',
    evidenceIds: [],
  },
  {
    id: 'crm.security.audit-log',
    framework: 'SOC2_READINESS',
    title: 'Immutable CRM audit log evidence',
    required: true,
    status: 'PENDING',
    evidenceIds: [],
  },
  {
    id: 'crm.health.phi-scope',
    framework: 'HIPAA_CONDITIONAL',
    title: 'PHI scope and safeguards if healthcare data is processed',
    required: false,
    status: 'PENDING',
    evidenceIds: [],
  },
  {
    id: 'crm.messaging.unsubscribe',
    framework: 'CAN_SPAM_READINESS',
    title: 'Commercial email consent and unsubscribe controls',
    required: true,
    status: 'PENDING',
    evidenceIds: [],
  },
  {
    id: 'crm.messaging.telephone-consent',
    framework: 'TCPA_READINESS',
    title: 'Telephone/text consent evidence',
    required: true,
    status: 'PENDING',
    evidenceIds: [],
  },
] as const;

export const CRM_INTERNAL_ATTESTATION = issueInternalCRMAttestation(
  CRM_CERTIFICATION_CONTROLS,
  CRM_CERTIFICATION_EVIDENCE,
  true,
);

export const CRM_CERTIFICATION_ONTOLOGY = {
  id: 'GLASS-CRM-CERTIFICATION',
  version: '1.0.0',
  command: '/glass certify crm',
  architecture: 'PALANTIR_ONTOLOGY_ALIGNED',
  objectTypes: ['SYSTEM', 'CONTROL', 'EVIDENCE', 'ASSESSMENT', 'RISK', 'ATTESTATION'] as const,
  relationTypes: ['GOVERNS', 'SUPPORTED_BY', 'SATISFIES', 'BLOCKED_BY', 'APPLIES_TO', 'DERIVED_FROM'] as const,
  actionModel: ['ATTACH_EVIDENCE', 'RUN_CONTROL_CHECK', 'REQUEST_REVIEW', 'ISSUE_INTERNAL_ATTESTATION', 'REVOKE_ATTESTATION'] as const,
  externalAffiliationClaim: false,
  externalCertificationStatus: 'NOT_ISSUED' as const,
} as const;
