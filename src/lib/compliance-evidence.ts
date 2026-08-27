export type ComplianceFramework = 'GDPR' | 'HIPAA';
export type EvidenceStatus = 'PRESENT' | 'MISSING' | 'EXPIRED' | 'NOT_APPLICABLE';

export interface ComplianceEvidenceRequirement {
  readonly id: string;
  readonly framework: ComplianceFramework;
  readonly title: string;
  readonly description: string;
  readonly requiredWhen: string;
  readonly renewableDays?: number;
}

export interface ComplianceEvidenceArtifact {
  readonly requirementId: string;
  readonly status: EvidenceStatus;
  readonly source: string;
  readonly observedAt: string;
  readonly expiresAt?: string;
  readonly provenance: readonly string[];
  readonly note?: string;
}

export interface ComplianceEvidenceAssessment {
  readonly status: 'COMPLETE' | 'PARTIAL' | 'MISSING';
  readonly applicable: number;
  readonly present: number;
  readonly missing: readonly string[];
  readonly expired: readonly string[];
}

export const COMPLIANCE_EVIDENCE_REQUIREMENTS: readonly ComplianceEvidenceRequirement[] = [
  { id: 'GDPR-ROPA', framework: 'GDPR', title: 'Record of processing activities', description: 'Approved production RoPA reflecting actual systems, purposes, categories, recipients, transfers, retention and safeguards.', requiredWhen: 'GDPR applies' },
  { id: 'GDPR-LAWFUL-BASIS', framework: 'GDPR', title: 'Lawful-basis determinations', description: 'Documented Article 6 basis and Article 9 condition where special-category data is processed.', requiredWhen: 'GDPR applies' },
  { id: 'GDPR-NOTICES', framework: 'GDPR', title: 'Deployed privacy notices', description: 'Current notices and data-subject contact channels deployed to affected users.', requiredWhen: 'GDPR applies', renewableDays: 365 },
  { id: 'GDPR-DPIA', framework: 'GDPR', title: 'DPIA evidence', description: 'Completed DPIA and remediation record for high-risk processing.', requiredWhen: 'High-risk processing exists' },
  { id: 'GDPR-TRANSFERS', framework: 'GDPR', title: 'International transfer evidence', description: 'Applicable transfer mechanism and transfer impact assessment records.', requiredWhen: 'Personal data is transferred outside the applicable EEA adequacy context' },
  { id: 'GDPR-PROCESSORS', framework: 'GDPR', title: 'Processor contracts', description: 'Executed processor agreements and current subprocessor inventory.', requiredWhen: 'Processors are used', renewableDays: 365 },
  { id: 'GDPR-DSR', framework: 'GDPR', title: 'Data-subject request evidence', description: 'Execution logs showing access, correction, deletion, restriction, objection and portability workflows operate in production.', requiredWhen: 'GDPR applies' },
  { id: 'GDPR-BREACH', framework: 'GDPR', title: 'Breach response exercise', description: 'Incident exercise or incident record validating assessment and 72-hour supervisory-authority workflow.', requiredWhen: 'GDPR applies', renewableDays: 365 },
  { id: 'HIPAA-SCOPE', framework: 'HIPAA', title: 'HIPAA scope determination', description: 'Documented determination of covered-entity or business-associate status and systems in scope.', requiredWhen: 'HIPAA may apply', renewableDays: 365 },
  { id: 'HIPAA-EPHI-INVENTORY', framework: 'HIPAA', title: 'ePHI inventory', description: 'Current inventory of production systems, stores, flows and vendors that create, receive, maintain or transmit ePHI.', requiredWhen: 'HIPAA applies', renewableDays: 365 },
  { id: 'HIPAA-RISK-ANALYSIS', framework: 'HIPAA', title: 'Security risk analysis', description: 'Documented production ePHI risk analysis with identified threats, vulnerabilities and risk levels.', requiredWhen: 'HIPAA applies', renewableDays: 365 },
  { id: 'HIPAA-RISK-MANAGEMENT', framework: 'HIPAA', title: 'Risk management register', description: 'Tracked remediation plan and accepted residual-risk decisions.', requiredWhen: 'HIPAA applies', renewableDays: 365 },
  { id: 'HIPAA-ACCESS', framework: 'HIPAA', title: 'Access control evidence', description: 'MFA/authentication, authorization, least-privilege and periodic access-review evidence.', requiredWhen: 'HIPAA applies', renewableDays: 90 },
  { id: 'HIPAA-AUDIT', framework: 'HIPAA', title: 'Audit control evidence', description: 'Production audit-log samples, retention configuration and review evidence for ePHI systems.', requiredWhen: 'HIPAA applies', renewableDays: 90 },
  { id: 'HIPAA-INTEGRITY-TRANSMISSION', framework: 'HIPAA', title: 'Integrity and transmission safeguards', description: 'Encryption, integrity controls and secure transport evidence for ePHI.', requiredWhen: 'HIPAA applies', renewableDays: 365 },
  { id: 'HIPAA-PHYSICAL', framework: 'HIPAA', title: 'Physical/device safeguards', description: 'Facility, workstation, device and media policies with operational evidence.', requiredWhen: 'HIPAA applies', renewableDays: 365 },
  { id: 'HIPAA-CONTINGENCY', framework: 'HIPAA', title: 'Contingency and disaster recovery', description: 'Backup, restoration, disaster recovery and emergency-mode test evidence.', requiredWhen: 'HIPAA applies', renewableDays: 365 },
  { id: 'HIPAA-TRAINING', framework: 'HIPAA', title: 'Workforce security training', description: 'Security-awareness and role-authorization training records for workforce members with access.', requiredWhen: 'HIPAA applies', renewableDays: 365 },
  { id: 'HIPAA-BAA', framework: 'HIPAA', title: 'BAA and subcontractor flow-down', description: 'Executed BAAs and downstream contractual safeguards for applicable vendors and subcontractors.', requiredWhen: 'Business associates or subcontractors process PHI', renewableDays: 365 },
  { id: 'HIPAA-BREACH', framework: 'HIPAA', title: 'Breach notification evidence', description: 'Incident or tabletop evidence validating breach risk assessment and notification workflow.', requiredWhen: 'HIPAA applies', renewableDays: 365 },
  { id: 'HIPAA-EVALUATION', framework: 'HIPAA', title: 'Periodic evaluation', description: 'Technical and non-technical evaluation of safeguards against current operations and environmental changes.', requiredWhen: 'HIPAA applies', renewableDays: 365 },
] as const;

const evidenceByRequirement = (artifacts: readonly ComplianceEvidenceArtifact[]): Map<string, ComplianceEvidenceArtifact> =>
  new Map(artifacts.map((artifact) => [artifact.requirementId, artifact]));

export const validateComplianceEvidenceArtifact = (artifact: ComplianceEvidenceArtifact): ComplianceEvidenceArtifact => {
  if (!artifact.requirementId.trim()) throw new Error('EVIDENCE_REQUIREMENT_REQUIRED');
  if (!artifact.source.trim()) throw new Error('EVIDENCE_SOURCE_REQUIRED');
  if (artifact.provenance.length === 0) throw new Error('EVIDENCE_PROVENANCE_REQUIRED');
  if (Number.isNaN(Date.parse(artifact.observedAt))) throw new Error('EVIDENCE_OBSERVED_AT_INVALID');
  if (artifact.expiresAt && Number.isNaN(Date.parse(artifact.expiresAt))) throw new Error('EVIDENCE_EXPIRES_AT_INVALID');
  if (!COMPLIANCE_EVIDENCE_REQUIREMENTS.some((requirement) => requirement.id === artifact.requirementId)) {
    throw new Error('EVIDENCE_REQUIREMENT_UNKNOWN');
  }
  return artifact;
};

export const assessComplianceEvidence = (
  framework: ComplianceFramework,
  artifacts: readonly ComplianceEvidenceArtifact[],
  applicableRequirementIds?: readonly string[],
): ComplianceEvidenceAssessment => {
  artifacts.forEach(validateComplianceEvidenceArtifact);
  const requirements = COMPLIANCE_EVIDENCE_REQUIREMENTS.filter((requirement) =>
    requirement.framework === framework && (!applicableRequirementIds || applicableRequirementIds.includes(requirement.id))
  );
  const byId = evidenceByRequirement(artifacts);
  const missing: string[] = [];
  const expired: string[] = [];
  let present = 0;
  for (const requirement of requirements) {
    const artifact = byId.get(requirement.id);
    if (!artifact || artifact.status === 'MISSING') {
      missing.push(requirement.id);
    } else if (artifact.status === 'EXPIRED') {
      expired.push(requirement.id);
    } else if (artifact.status === 'PRESENT' || artifact.status === 'NOT_APPLICABLE') {
      present += 1;
    }
  }
  const blockers = missing.length + expired.length;
  return {
    status: blockers === 0 ? 'COMPLETE' : present === 0 ? 'MISSING' : 'PARTIAL',
    applicable: requirements.length,
    present,
    missing,
    expired,
  };
};

export const COMPLIANCE_EVIDENCE = {
  id: 'GLASS-COMPLIANCE-EVIDENCE',
  version: '1.0.0',
  command: '/glass evidence',
  status: 'COLLECTION_FRAMEWORK_ACTIVE',
  frameworks: ['GDPR', 'HIPAA'] as readonly ComplianceFramework[],
  controls: {
    provenanceRequired: true,
    sourceRequired: true,
    expirationSupported: true,
    productionEvidenceCannotBeInferredFromCode: true,
    externalContractsMustBeExecutedEvidence: true,
  },
} as const;
