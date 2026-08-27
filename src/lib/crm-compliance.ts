export type PrivacyJurisdiction = 'GDPR' | 'CCPA' | 'US_MARKETING' | 'HIPAA_CONDITIONAL';
export type CRMRole = 'ADMIN' | 'SALES' | 'SUPPORT' | 'MARKETING' | 'AUDITOR';
export type PrivacyRequestType = 'ACCESS' | 'KNOW' | 'DELETE' | 'CORRECT' | 'OPT_OUT' | 'LIMIT' | 'PORTABILITY';
export type ConsentChannel = 'EMAIL' | 'SMS' | 'VOICE';
export type ConsentState = 'GRANTED' | 'REVOKED' | 'NOT_REQUIRED' | 'UNKNOWN';

export interface ConsentRecord {
  readonly subjectId: string;
  readonly channel: ConsentChannel;
  readonly state: ConsentState;
  readonly lawfulBasis?: string;
  readonly source: string;
  readonly capturedAt: string;
  readonly revokedAt?: string;
  readonly provenance: readonly string[];
}

export interface PrivacyRequest {
  readonly id: string;
  readonly subjectId: string;
  readonly type: PrivacyRequestType;
  readonly jurisdiction: 'GDPR' | 'CCPA';
  readonly receivedAt: string;
  readonly verified: boolean;
  readonly status: 'OPEN' | 'IN_PROGRESS' | 'FULFILLED' | 'DENIED_WITH_BASIS';
  readonly provenance: readonly string[];
}

export interface RetentionRule {
  readonly dataClass: string;
  readonly maxDays: number;
  readonly legalHoldAllowed: boolean;
}

export interface AuditEvent {
  readonly id: string;
  readonly actor: string;
  readonly action: string;
  readonly targetId: string;
  readonly occurredAt: string;
  readonly previousEventId?: string;
  readonly provenance: readonly string[];
}

export interface VendorRecord {
  readonly id: string;
  readonly name: string;
  readonly processesPersonalData: boolean;
  readonly processesPHI: boolean;
  readonly contractRequired: boolean;
  readonly agreementStatus: 'NOT_REQUIRED' | 'REQUIRED' | 'EXECUTED';
  readonly provenance: readonly string[];
}

export interface SecurityIncident {
  readonly id: string;
  readonly detectedAt: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly personalDataInvolved: boolean;
  readonly phiInvolved: boolean;
  readonly status: 'TRIAGE' | 'CONTAINED' | 'INVESTIGATING' | 'NOTIFICATION_REVIEW' | 'CLOSED';
  readonly owner: string;
  readonly provenance: readonly string[];
}

export const CRM_ROLE_PERMISSIONS: Readonly<Record<CRMRole, readonly string[]>> = {
  ADMIN: ['CRM_READ', 'CRM_WRITE', 'CRM_ASSIGN', 'CRM_EXPORT', 'CRM_PRIVACY_REQUEST', 'CRM_AUDIT_READ'],
  SALES: ['CRM_READ', 'CRM_WRITE', 'CRM_ASSIGN'],
  SUPPORT: ['CRM_READ', 'CRM_WRITE', 'CRM_PRIVACY_REQUEST'],
  MARKETING: ['CRM_READ', 'CRM_CAMPAIGN_PREPARE'],
  AUDITOR: ['CRM_READ', 'CRM_AUDIT_READ'],
};

export const hasCRMPermission = (role: CRMRole, permission: string): boolean =>
  CRM_ROLE_PERMISSIONS[role].includes(permission);

export const validateConsent = (record: ConsentRecord): ConsentRecord => {
  if (!record.subjectId.trim()) throw new Error('CONSENT_SUBJECT_REQUIRED');
  if (!record.source.trim()) throw new Error('CONSENT_SOURCE_REQUIRED');
  if (record.provenance.length === 0) throw new Error('CONSENT_PROVENANCE_REQUIRED');
  if (record.state === 'REVOKED' && !record.revokedAt) throw new Error('CONSENT_REVOCATION_TIME_REQUIRED');
  return record;
};

export const maySendMarketing = (record: ConsentRecord): boolean => {
  validateConsent(record);
  return record.state === 'GRANTED' || record.state === 'NOT_REQUIRED';
};

export const privacyRequestDueDays = (jurisdiction: 'GDPR' | 'CCPA'): number =>
  jurisdiction === 'GDPR' ? 30 : 45;

export const validatePrivacyRequest = (request: PrivacyRequest): PrivacyRequest => {
  if (!request.id.trim() || !request.subjectId.trim()) throw new Error('PRIVACY_REQUEST_IDENTITY_REQUIRED');
  if (request.provenance.length === 0) throw new Error('PRIVACY_REQUEST_PROVENANCE_REQUIRED');
  if ((request.type === 'ACCESS' || request.type === 'KNOW' || request.type === 'DELETE' || request.type === 'CORRECT') && !request.verified) {
    throw new Error('PRIVACY_REQUEST_VERIFICATION_REQUIRED');
  }
  return request;
};

export const shouldDeleteForRetention = (
  createdAt: string,
  now: string,
  rule: RetentionRule,
  legalHold = false,
): boolean => {
  if (legalHold && rule.legalHoldAllowed) return false;
  const elapsedDays = (Date.parse(now) - Date.parse(createdAt)) / 86_400_000;
  return elapsedDays >= rule.maxDays;
};

export const validateAuditChain = (events: readonly AuditEvent[]): boolean => {
  const ids = new Set<string>();
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    if (!event.id.trim() || !event.actor.trim() || event.provenance.length === 0 || ids.has(event.id)) return false;
    if (i === 0 && event.previousEventId) return false;
    if (i > 0 && event.previousEventId !== events[i - 1].id) return false;
    ids.add(event.id);
  }
  return true;
};

export const validateVendor = (vendor: VendorRecord): VendorRecord => {
  if (vendor.provenance.length === 0) throw new Error('VENDOR_PROVENANCE_REQUIRED');
  if (vendor.contractRequired && vendor.agreementStatus !== 'EXECUTED') throw new Error('VENDOR_AGREEMENT_REQUIRED');
  if (vendor.processesPHI && vendor.agreementStatus !== 'EXECUTED') throw new Error('PHI_VENDOR_AGREEMENT_REQUIRED');
  return vendor;
};

export const validateIncident = (incident: SecurityIncident): SecurityIncident => {
  if (!incident.owner.trim()) throw new Error('INCIDENT_OWNER_REQUIRED');
  if (incident.provenance.length === 0) throw new Error('INCIDENT_PROVENANCE_REQUIRED');
  if ((incident.severity === 'HIGH' || incident.severity === 'CRITICAL') && incident.status === 'CLOSED') {
    throw new Error('HIGH_RISK_INCIDENT_REVIEW_REQUIRED');
  }
  return incident;
};

export const CRM_COMPLIANCE_REQUIREMENTS = {
  version: '1.0.0',
  privacy: {
    purposeLimitation: true,
    dataMinimization: true,
    retentionEnforced: true,
    consentLedger: true,
    privacyRequestWorkflow: true,
    correctionWorkflow: true,
    deletionWorkflow: true,
    optOutWorkflow: true,
    sensitiveDataLimitWorkflow: true,
  },
  security: {
    rbac: true,
    auditChain: true,
    encryptionInTransitRequired: true,
    encryptionAtRestRequired: true,
    incidentWorkflow: true,
    vendorRiskTracking: true,
    securityOwnerRequired: true,
    periodicRiskAssessmentRequired: true,
    workforceTrainingRequired: true,
  },
  marketing: {
    truthfulHeadersRequired: true,
    truthfulSubjectsRequired: true,
    physicalAddressRequired: true,
    unsubscribeRequired: true,
    suppressionListRequired: true,
    smsVoiceConsentLedger: true,
    revocationHonored: true,
  },
  hipaaConditional: {
    enabledOnlyWhenPHIProcessed: true,
    minimumNecessaryAccess: true,
    auditControls: true,
    authenticationRequired: true,
    transmissionSecurityRequired: true,
    deviceMediaPolicyRequired: true,
    businessAssociateAgreementTracking: true,
    sixYearDocumentationRetentionRequired: true,
  },
} as const;
