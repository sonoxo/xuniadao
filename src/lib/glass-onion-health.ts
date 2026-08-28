export type HealthObjectType =
  | 'CLIENT'
  | 'PROVIDER'
  | 'PROGRAM'
  | 'ENCOUNTER'
  | 'CLINICAL_DOCUMENT'
  | 'CONSENT'
  | 'AUTHORIZATION'
  | 'SIGNATURE'
  | 'DISCLOSURE'
  | 'RETENTION_POLICY'
  | 'AUDIT_EVENT'
  | 'PAYER';

export type ClinicalDocumentType =
  | 'INTAKE'
  | 'ASSESSMENT'
  | 'CASE_NOTE'
  | 'TREATMENT_PLAN'
  | 'DISCHARGE'
  | 'PSYCHOTHERAPY_NOTE'
  | 'SUD_COUNSELING_NOTE'
  | 'RELEASE_OF_INFORMATION'
  | 'BILLING_SUPPORT'
  | 'OTHER';

export type HealthDataClass =
  | 'NON_PHI'
  | 'PHI'
  | 'EPHI'
  | 'PSYCHOTHERAPY_NOTES'
  | 'PART2_RECORD'
  | 'PART2_SUD_COUNSELING_NOTE';

export type HealthRole =
  | 'ADMIN'
  | 'CLINICIAN'
  | 'SUPERVISOR'
  | 'SUPPORT'
  | 'BILLING'
  | 'PRIVACY_OFFICER'
  | 'SECURITY_OFFICER'
  | 'AUDITOR'
  | 'CLIENT';

export type HealthPurpose =
  | 'TREATMENT'
  | 'PAYMENT'
  | 'OPERATIONS'
  | 'CLIENT_ACCESS'
  | 'DISCLOSURE'
  | 'AUDIT'
  | 'EMERGENCY'
  | 'LEGAL';

export type HealthAction =
  | 'READ'
  | 'CREATE'
  | 'UPDATE'
  | 'SIGN'
  | 'AMEND'
  | 'EXPORT'
  | 'DISCLOSE'
  | 'DELETE'
  | 'BULK_EXPORT';

export type HealthDecision = 'ALLOW' | 'REVIEW' | 'BLOCK';

export interface ClinicalDocument {
  readonly id: string;
  readonly clientId: string;
  readonly encounterId?: string;
  readonly type: ClinicalDocumentType;
  readonly dataClass: HealthDataClass;
  readonly title: string;
  readonly authorId: string;
  readonly createdAt: string;
  readonly version: string;
  readonly status: 'DRAFT' | 'SIGNED' | 'AMENDED' | 'ARCHIVED';
  readonly protectedPayloadRef?: string;
  readonly contentHash?: string;
  readonly retentionPolicyId: string;
  readonly provenance: readonly string[];
}

export interface HealthAuthorization {
  readonly id: string;
  readonly clientId: string;
  readonly kind: 'TREATMENT' | 'DISCLOSURE' | 'PSYCHOTHERAPY_NOTES' | 'PART2' | 'PART2_SUD_COUNSELING_NOTES';
  readonly recipient?: string;
  readonly purpose: string;
  readonly effectiveAt: string;
  readonly expiresAt?: string;
  readonly revokedAt?: string;
  readonly signedDocumentId?: string;
  readonly provenance: readonly string[];
}

export interface HealthSignature {
  readonly id: string;
  readonly signerId: string;
  readonly signerRole: HealthRole;
  readonly documentId: string;
  readonly documentVersion: string;
  readonly documentHash: string;
  readonly signedAt: string;
  readonly authenticationMethod: 'MFA' | 'SSO' | 'PASSWORD_PLUS_OTP' | 'IN_PERSON_VERIFIED' | 'OTHER_VERIFIED';
  readonly intent: 'APPROVE' | 'ACKNOWLEDGE' | 'CONSENT' | 'AUTHORIZE' | 'ATTEST';
  readonly provenance: readonly string[];
}

export interface HealthAccessRequest {
  readonly actorId: string;
  readonly role: HealthRole;
  readonly action: HealthAction;
  readonly purpose: HealthPurpose;
  readonly document: ClinicalDocument;
  readonly assignedToClient?: boolean;
  readonly isDocumentAuthor?: boolean;
  readonly minimumNecessarySatisfied?: boolean;
  readonly explicitAuthorization?: boolean;
  readonly part2ConsentSatisfied?: boolean;
  readonly emergencyOverride?: boolean;
  readonly externalRecipient?: boolean;
  readonly bulk?: boolean;
}

export interface HealthAccessDecision {
  readonly decision: HealthDecision;
  readonly humanApprovalRequired: boolean;
  readonly reasons: readonly string[];
}

export interface HealthDisclosure {
  readonly id: string;
  readonly clientId: string;
  readonly documentIds: readonly string[];
  readonly recipient: string;
  readonly purpose: string;
  readonly authorizationId?: string;
  readonly requestedBy: string;
  readonly requestedAt: string;
  readonly status: 'REQUESTED' | 'APPROVED' | 'DENIED' | 'RELEASED' | 'REVOKED';
  readonly provenance: readonly string[];
}

export interface HealthAuditEvent {
  readonly id: string;
  readonly actorId: string;
  readonly action: HealthAction | 'AUTHENTICATE' | 'AUTHORIZE' | 'REVOKE_AUTHORIZATION';
  readonly targetId: string;
  readonly occurredAt: string;
  readonly purpose: string;
  readonly decision: HealthDecision;
  readonly previousEventId?: string;
  readonly provenance: readonly string[];
}

const CLINICAL_ROLES: readonly HealthRole[] = ['CLINICIAN', 'SUPERVISOR', 'PRIVACY_OFFICER'];

const isProtected = (dataClass: HealthDataClass): boolean => dataClass !== 'NON_PHI';
const isPart2 = (dataClass: HealthDataClass): boolean => dataClass === 'PART2_RECORD' || dataClass === 'PART2_SUD_COUNSELING_NOTE';
const isPsychotherapy = (dataClass: HealthDataClass): boolean => dataClass === 'PSYCHOTHERAPY_NOTES';

export const validateClinicalDocument = (document: ClinicalDocument): ClinicalDocument => {
  if (!document.id.trim() || !document.clientId.trim()) throw new Error('HEALTH_DOCUMENT_IDENTITY_REQUIRED');
  if (!document.title.trim() || !document.authorId.trim()) throw new Error('HEALTH_DOCUMENT_AUTHOR_REQUIRED');
  if (!document.createdAt.trim() || !document.version.trim()) throw new Error('HEALTH_DOCUMENT_VERSION_REQUIRED');
  if (!document.retentionPolicyId.trim()) throw new Error('HEALTH_RETENTION_POLICY_REQUIRED');
  if (document.provenance.length === 0) throw new Error('HEALTH_PROVENANCE_REQUIRED');
  if (isProtected(document.dataClass) && !document.protectedPayloadRef?.trim()) throw new Error('HEALTH_PROTECTED_PAYLOAD_REF_REQUIRED');
  if (document.status === 'SIGNED' && !document.contentHash?.trim()) throw new Error('HEALTH_SIGNED_DOCUMENT_HASH_REQUIRED');
  if (document.type === 'PSYCHOTHERAPY_NOTE' && document.dataClass !== 'PSYCHOTHERAPY_NOTES') throw new Error('HEALTH_PSYCHOTHERAPY_CLASSIFICATION_REQUIRED');
  if (document.type === 'SUD_COUNSELING_NOTE' && document.dataClass !== 'PART2_SUD_COUNSELING_NOTE') throw new Error('HEALTH_PART2_COUNSELING_CLASSIFICATION_REQUIRED');
  return document;
};

export const validateHealthAuthorization = (authorization: HealthAuthorization): HealthAuthorization => {
  if (!authorization.id.trim() || !authorization.clientId.trim()) throw new Error('HEALTH_AUTHORIZATION_IDENTITY_REQUIRED');
  if (!authorization.purpose.trim() || !authorization.effectiveAt.trim()) throw new Error('HEALTH_AUTHORIZATION_SCOPE_REQUIRED');
  if (authorization.provenance.length === 0) throw new Error('HEALTH_AUTHORIZATION_PROVENANCE_REQUIRED');
  return authorization;
};

export const authorizationIsActive = (authorization: HealthAuthorization, at: string): boolean => {
  validateHealthAuthorization(authorization);
  const time = Date.parse(at);
  if (Number.isNaN(time)) return false;
  if (Date.parse(authorization.effectiveAt) > time) return false;
  if (authorization.expiresAt && Date.parse(authorization.expiresAt) <= time) return false;
  if (authorization.revokedAt && Date.parse(authorization.revokedAt) <= time) return false;
  return true;
};

export const validateHealthSignature = (signature: HealthSignature): HealthSignature => {
  if (!signature.id.trim() || !signature.signerId.trim() || !signature.documentId.trim()) throw new Error('HEALTH_SIGNATURE_IDENTITY_REQUIRED');
  if (!signature.documentVersion.trim() || !signature.documentHash.trim()) throw new Error('HEALTH_SIGNATURE_DOCUMENT_BINDING_REQUIRED');
  if (!signature.signedAt.trim()) throw new Error('HEALTH_SIGNATURE_TIME_REQUIRED');
  if (signature.provenance.length === 0) throw new Error('HEALTH_SIGNATURE_PROVENANCE_REQUIRED');
  return signature;
};

export const evaluateHealthAccess = (request: HealthAccessRequest): HealthAccessDecision => {
  validateClinicalDocument(request.document);
  const reasons: string[] = [];

  if (!request.actorId.trim()) return { decision: 'BLOCK', humanApprovalRequired: true, reasons: ['HEALTH_ACTOR_REQUIRED'] };
  if (request.action === 'DELETE') return { decision: 'BLOCK', humanApprovalRequired: true, reasons: ['HEALTH_RECORD_DELETION_BLOCKED'] };
  if (request.action === 'BULK_EXPORT' || request.bulk) return { decision: 'REVIEW', humanApprovalRequired: true, reasons: ['HEALTH_BULK_EXPORT_REQUIRES_REVIEW'] };

  if (request.emergencyOverride) {
    return { decision: 'REVIEW', humanApprovalRequired: true, reasons: ['HEALTH_BREAK_GLASS_REQUIRES_REVIEW_AND_AUDIT'] };
  }

  if (isProtected(request.document.dataClass) && request.minimumNecessarySatisfied !== true && request.purpose !== 'CLIENT_ACCESS') {
    return { decision: 'BLOCK', humanApprovalRequired: true, reasons: ['HEALTH_MINIMUM_NECESSARY_REQUIRED'] };
  }

  if (isPsychotherapy(request.document.dataClass)) {
    const originatorTreatmentUse = request.role === 'CLINICIAN' && request.isDocumentAuthor === true && request.purpose === 'TREATMENT' && request.action === 'READ';
    if (originatorTreatmentUse) return { decision: 'ALLOW', humanApprovalRequired: false, reasons: [] };
    if (!request.explicitAuthorization) return { decision: 'BLOCK', humanApprovalRequired: true, reasons: ['HEALTH_PSYCHOTHERAPY_AUTHORIZATION_REQUIRED'] };
    if (request.action === 'DISCLOSE' || request.action === 'EXPORT') reasons.push('HEALTH_PSYCHOTHERAPY_RELEASE_REQUIRES_REVIEW');
  }

  if (isPart2(request.document.dataClass) && (request.action === 'DISCLOSE' || request.action === 'EXPORT')) {
    if (!request.part2ConsentSatisfied) return { decision: 'BLOCK', humanApprovalRequired: true, reasons: ['HEALTH_PART2_CONSENT_REQUIRED'] };
    reasons.push('HEALTH_PART2_RELEASE_REQUIRES_REVIEW');
  }

  if (request.externalRecipient || request.action === 'DISCLOSE' || request.action === 'EXPORT') {
    reasons.push('HEALTH_EXTERNAL_RELEASE_REQUIRES_REVIEW');
  }

  if (request.role === 'CLIENT') {
    if (request.purpose !== 'CLIENT_ACCESS') return { decision: 'BLOCK', humanApprovalRequired: true, reasons: ['HEALTH_CLIENT_ACCESS_PURPOSE_REQUIRED'] };
    if (isPsychotherapy(request.document.dataClass)) return { decision: 'BLOCK', humanApprovalRequired: true, reasons: ['HEALTH_PSYCHOTHERAPY_NOT_IN_STANDARD_CLIENT_ACCESS'] };
    reasons.push('HEALTH_CLIENT_RECORD_REQUEST_WORKFLOW_REQUIRED');
  } else if (request.role === 'AUDITOR') {
    if (request.purpose !== 'AUDIT') return { decision: 'BLOCK', humanApprovalRequired: true, reasons: ['HEALTH_AUDITOR_PURPOSE_REQUIRED'] };
    reasons.push('HEALTH_AUDITOR_ACCESS_REQUIRES_REVIEW');
  } else if (request.role === 'BILLING') {
    if (request.purpose !== 'PAYMENT') return { decision: 'BLOCK', humanApprovalRequired: true, reasons: ['HEALTH_BILLING_PURPOSE_REQUIRED'] };
    if (isPsychotherapy(request.document.dataClass) || isPart2(request.document.dataClass)) return { decision: 'BLOCK', humanApprovalRequired: true, reasons: ['HEALTH_RESTRICTED_CLINICAL_CLASS_BLOCKED_FOR_BILLING'] };
  } else if (request.role === 'SUPPORT') {
    return { decision: 'BLOCK', humanApprovalRequired: true, reasons: ['HEALTH_SUPPORT_ROLE_NO_CLINICAL_CONTENT_ACCESS'] };
  } else if (CLINICAL_ROLES.includes(request.role)) {
    if (request.role === 'CLINICIAN' && request.purpose === 'TREATMENT' && request.assignedToClient !== true && request.isDocumentAuthor !== true) {
      return { decision: 'BLOCK', humanApprovalRequired: true, reasons: ['HEALTH_CLINICIAN_ASSIGNMENT_REQUIRED'] };
    }
  } else if (request.role === 'ADMIN' || request.role === 'SECURITY_OFFICER') {
    if (request.action === 'READ' && isProtected(request.document.dataClass)) reasons.push('HEALTH_PRIVILEGED_TECHNICAL_ACCESS_REQUIRES_REVIEW');
  }

  if (request.action === 'SIGN' || request.action === 'AMEND') reasons.push('HEALTH_CLINICAL_FINALIZATION_REQUIRES_REVIEW');
  if (request.action === 'UPDATE' && request.document.status !== 'DRAFT') reasons.push('HEALTH_FINALIZED_RECORD_MUTATION_REQUIRES_REVIEW');

  return {
    decision: reasons.length > 0 ? 'REVIEW' : 'ALLOW',
    humanApprovalRequired: reasons.length > 0,
    reasons,
  };
};

export const validateHealthDisclosure = (disclosure: HealthDisclosure): HealthDisclosure => {
  if (!disclosure.id.trim() || !disclosure.clientId.trim() || !disclosure.recipient.trim()) throw new Error('HEALTH_DISCLOSURE_IDENTITY_REQUIRED');
  if (disclosure.documentIds.length === 0) throw new Error('HEALTH_DISCLOSURE_DOCUMENT_REQUIRED');
  if (!disclosure.purpose.trim() || !disclosure.requestedBy.trim() || !disclosure.requestedAt.trim()) throw new Error('HEALTH_DISCLOSURE_SCOPE_REQUIRED');
  if (disclosure.provenance.length === 0) throw new Error('HEALTH_DISCLOSURE_PROVENANCE_REQUIRED');
  return disclosure;
};

export const validateHealthAuditChain = (events: readonly HealthAuditEvent[]): boolean => {
  const ids = new Set<string>();
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    if (!event.id.trim() || !event.actorId.trim() || !event.targetId.trim() || !event.purpose.trim() || event.provenance.length === 0 || ids.has(event.id)) return false;
    if (i === 0 && event.previousEventId) return false;
    if (i > 0 && event.previousEventId !== events[i - 1].id) return false;
    ids.add(event.id);
  }
  return true;
};

export const GLASS_ONION_HEALTH = {
  id: 'GLASS-ONION-HEALTH',
  version: '0.1.0',
  command: '/glass health',
  certificationCommand: '/glass certify health',
  umbrella: 'XUNIA',
  layer: 'GLASS ONION',
  status: 'READINESS_BASELINE_IMPLEMENTED',
  objectTypes: ['CLIENT', 'PROVIDER', 'PROGRAM', 'ENCOUNTER', 'CLINICAL_DOCUMENT', 'CONSENT', 'AUTHORIZATION', 'SIGNATURE', 'DISCLOSURE', 'RETENTION_POLICY', 'AUDIT_EVENT', 'PAYER'] as readonly HealthObjectType[],
  documentTypes: ['INTAKE', 'ASSESSMENT', 'CASE_NOTE', 'TREATMENT_PLAN', 'DISCHARGE', 'PSYCHOTHERAPY_NOTE', 'SUD_COUNSELING_NOTE', 'RELEASE_OF_INFORMATION', 'BILLING_SUPPORT', 'OTHER'] as readonly ClinicalDocumentType[],
  dataClasses: ['NON_PHI', 'PHI', 'EPHI', 'PSYCHOTHERAPY_NOTES', 'PART2_RECORD', 'PART2_SUD_COUNSELING_NOTE'] as readonly HealthDataClass[],
  pipeline: ['HEALTH_INGEST', 'PHI_CLASSIFY', 'POLICY_RESOLVE', 'ACCESS_DECIDE', 'HUMAN_REVIEW', 'DOCUMENT_ACTION', 'AUDIT_APPEND', 'EVIDENCE_LINK'],
  controls: {
    protectedPayloadIsolationRequired: true,
    provenanceRequired: true,
    minimumNecessaryGateRequired: true,
    psychotherapyNotesSeparated: true,
    part2ClassificationSupported: true,
    humanReviewForExternalRelease: true,
    humanReviewForFinalizationAndAmendment: true,
    immutableAuditChainRequired: true,
    destructiveClinicalDeletionBlocked: true,
  },
  complianceBoundary: {
    codeReadinessOnly: true,
    legalDeterminationProvided: false,
    hipaaCertificationClaimed: false,
    thirdPartyAttestationStatus: 'NOT_ISSUED',
    deploymentRiskAnalysisRequired: true,
    operationalEvidenceRequired: true,
  },
} as const;
