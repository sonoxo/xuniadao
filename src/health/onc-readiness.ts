import { createHash } from 'crypto';

import type { HealthAuthorization, HealthDataClass, HealthSignature } from '../lib/glass-onion-health';
import type { RuntimeAuditEvent } from './audit';
import type { ManagedClinicalDocument } from './documents';

export type ONCCriterionId =
  | '170.315(a)(15)'
  | '170.315(b)(10)'
  | '170.315(d)(1)'
  | '170.315(d)(2)'
  | '170.315(d)(3)'
  | '170.315(d)(4)'
  | '170.315(d)(5)'
  | '170.315(d)(6)'
  | '170.315(d)(7)'
  | '170.315(d)(8)'
  | '170.315(d)(9)'
  | '170.315(d)(12)'
  | '170.315(d)(13)'
  | '170.315(e)(1)'
  | '170.315(g)(4)'
  | '170.315(g)(5)';

export type ONCReadinessStatus = 'IMPLEMENTED' | 'PARTIAL' | 'NOT_IMPLEMENTED' | 'NOT_APPLICABLE';

export interface ONCCriterion {
  readonly id: ONCCriterionId;
  readonly title: string;
  readonly status: ONCReadinessStatus;
  readonly evidence: readonly string[];
  readonly officialExternalValidationRequired: boolean;
}

export interface EHIExportRecord {
  readonly documentId: string;
  readonly clientId: string;
  readonly documentType: string;
  readonly dataClass: HealthDataClass;
  readonly version: string;
  readonly status: string;
  readonly contentHash?: string;
  readonly protectedPayloadRef?: string;
  readonly createdAt: string;
  readonly provenance: readonly string[];
}

export interface EHIExportBundle {
  readonly schema: 'GLASS_ONION_HEALTH_EHI_EXPORT_V1';
  readonly scope: 'SINGLE_PATIENT' | 'PATIENT_POPULATION';
  readonly generatedAt: string;
  readonly clientIds: readonly string[];
  readonly records: readonly EHIExportRecord[];
  readonly authorizations: readonly HealthAuthorization[];
  readonly signatures: readonly HealthSignature[];
  readonly auditEvents: readonly RuntimeAuditEvent[];
  readonly manifestSha256: string;
}

const stableJson = (value: unknown): string => JSON.stringify(value);

const sha256 = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');

const exportRecord = (document: ManagedClinicalDocument): EHIExportRecord => ({
  documentId: document.id,
  clientId: document.clientId,
  documentType: document.type,
  dataClass: document.dataClass,
  version: document.version,
  status: document.status,
  contentHash: document.contentHash,
  protectedPayloadRef: document.protectedPayloadRef,
  createdAt: document.createdAt,
  provenance: document.provenance,
});

const finalizeBundle = (
  scope: EHIExportBundle['scope'],
  generatedAt: string,
  clientIds: readonly string[],
  records: readonly EHIExportRecord[],
  authorizations: readonly HealthAuthorization[],
  signatures: readonly HealthSignature[],
  auditEvents: readonly RuntimeAuditEvent[],
): EHIExportBundle => {
  if (!generatedAt.trim()) throw new Error('ONC_EXPORT_GENERATED_AT_REQUIRED');
  const manifestInput = {
    schema: 'GLASS_ONION_HEALTH_EHI_EXPORT_V1',
    scope,
    generatedAt,
    clientIds,
    records,
    authorizations,
    signatures,
    auditEvents,
  };
  return {
    ...manifestInput,
    schema: 'GLASS_ONION_HEALTH_EHI_EXPORT_V1',
    manifestSha256: sha256(stableJson(manifestInput)),
  };
};

export const buildSinglePatientEHIExport = (input: {
  readonly clientId: string;
  readonly generatedAt: string;
  readonly documents: readonly ManagedClinicalDocument[];
  readonly authorizations?: readonly HealthAuthorization[];
  readonly signatures?: readonly HealthSignature[];
  readonly auditEvents?: readonly RuntimeAuditEvent[];
}): EHIExportBundle => {
  if (!input.clientId.trim()) throw new Error('ONC_EXPORT_CLIENT_REQUIRED');
  const documents = input.documents.filter((document) => document.clientId === input.clientId);
  const authorizations = (input.authorizations || []).filter((authorization) => authorization.clientId === input.clientId);
  const documentIds = new Set(documents.map((document) => document.id));
  const signatures = (input.signatures || []).filter((signature) => documentIds.has(signature.documentId));
  const auditEvents = (input.auditEvents || []).filter((event) => documentIds.has(event.targetId) || event.targetId === input.clientId);
  return finalizeBundle(
    'SINGLE_PATIENT',
    input.generatedAt,
    [input.clientId],
    documents.map(exportRecord),
    authorizations,
    signatures,
    auditEvents,
  );
};

export const buildPopulationEHIExport = (input: {
  readonly generatedAt: string;
  readonly documents: readonly ManagedClinicalDocument[];
  readonly authorizations?: readonly HealthAuthorization[];
  readonly signatures?: readonly HealthSignature[];
  readonly auditEvents?: readonly RuntimeAuditEvent[];
}): EHIExportBundle => {
  const clientIds = Array.from(new Set(input.documents.map((document) => document.clientId))).sort();
  return finalizeBundle(
    'PATIENT_POPULATION',
    input.generatedAt,
    clientIds,
    input.documents.map(exportRecord),
    input.authorizations || [],
    input.signatures || [],
    input.auditEvents || [],
  );
};

export interface ONCAuditReportFilter {
  readonly actorId?: string;
  readonly targetId?: string;
  readonly from?: string;
  readonly to?: string;
}

export const buildONCAuditReport = (
  events: readonly RuntimeAuditEvent[],
  filter: ONCAuditReportFilter = {},
): readonly RuntimeAuditEvent[] => events.filter((event) => {
  if (filter.actorId && event.actorId !== filter.actorId) return false;
  if (filter.targetId && event.targetId !== filter.targetId) return false;
  const time = Date.parse(event.occurredAt);
  if (filter.from && time < Date.parse(filter.from)) return false;
  if (filter.to && time > Date.parse(filter.to)) return false;
  return true;
});

export const sessionTimedOut = (
  lastActivityAt: string,
  now: string,
  timeoutMinutes: number,
): boolean => {
  if (!Number.isFinite(timeoutMinutes) || timeoutMinutes <= 0) throw new Error('ONC_TIMEOUT_MINUTES_INVALID');
  const last = Date.parse(lastActivityAt);
  const current = Date.parse(now);
  if (Number.isNaN(last) || Number.isNaN(current) || current < last) throw new Error('ONC_TIMEOUT_TIME_INVALID');
  return current - last >= timeoutMinutes * 60_000;
};

export interface EmergencyAccessRequest {
  readonly actorId: string;
  readonly reason: string;
  readonly at: string;
  readonly normalAccessUnavailable: boolean;
  readonly auditEnabled: boolean;
  readonly reviewRequired: boolean;
}

export const evaluateEmergencyAccessReadiness = (request: EmergencyAccessRequest): 'PASS' | 'BLOCK' => {
  if (!request.actorId.trim() || !request.reason.trim() || !request.at.trim()) return 'BLOCK';
  if (!request.normalAccessUnavailable) return 'BLOCK';
  if (!request.auditEnabled || !request.reviewRequired) return 'BLOCK';
  return 'PASS';
};

export interface QMSRecord {
  readonly id: string;
  readonly process: string;
  readonly owner: string;
  readonly version: string;
  readonly approvedAt: string;
  readonly evidenceRefs: readonly string[];
}

export const validateQMSRecord = (record: QMSRecord): boolean =>
  Boolean(record.id.trim() && record.process.trim() && record.owner.trim() && record.version.trim() && record.approvedAt.trim() && record.evidenceRefs.length > 0);

export interface AccessibilityEvidence {
  readonly productArea: string;
  readonly standardOrMethod: string;
  readonly testedAt: string;
  readonly issuesTracked: boolean;
  readonly remediationProcess: boolean;
  readonly evidenceRefs: readonly string[];
}

export const validateAccessibilityEvidence = (evidence: AccessibilityEvidence): boolean =>
  Boolean(
    evidence.productArea.trim() &&
    evidence.standardOrMethod.trim() &&
    evidence.testedAt.trim() &&
    evidence.issuesTracked &&
    evidence.remediationProcess &&
    evidence.evidenceRefs.length > 0,
  );

export const ONC_READINESS_CRITERIA: readonly ONCCriterion[] = [
  { id: '170.315(a)(15)', title: 'Social, psychological, and behavioral data', status: 'PARTIAL', evidence: ['src/lib/glass-onion-health.ts', 'src/health/documents.ts'], officialExternalValidationRequired: true },
  { id: '170.315(b)(10)', title: 'Electronic health information export', status: 'IMPLEMENTED', evidence: ['src/health/onc-readiness.ts'], officialExternalValidationRequired: true },
  { id: '170.315(d)(1)', title: 'Authentication, access control, authorization', status: 'IMPLEMENTED', evidence: ['src/health/identity.ts', 'src/health/runtime.ts'], officialExternalValidationRequired: true },
  { id: '170.315(d)(2)', title: 'Auditable events and tamper-resistance', status: 'IMPLEMENTED', evidence: ['src/health/audit.ts'], officialExternalValidationRequired: true },
  { id: '170.315(d)(3)', title: 'Audit report(s)', status: 'IMPLEMENTED', evidence: ['src/health/onc-readiness.ts'], officialExternalValidationRequired: true },
  { id: '170.315(d)(4)', title: 'Amendments', status: 'IMPLEMENTED', evidence: ['src/health/documents.ts'], officialExternalValidationRequired: true },
  { id: '170.315(d)(5)', title: 'Automatic access time-out', status: 'IMPLEMENTED', evidence: ['src/health/onc-readiness.ts', 'src/health/identity.ts'], officialExternalValidationRequired: true },
  { id: '170.315(d)(6)', title: 'Emergency access', status: 'IMPLEMENTED', evidence: ['src/health/onc-readiness.ts', 'src/lib/glass-onion-health.ts'], officialExternalValidationRequired: true },
  { id: '170.315(d)(7)', title: 'End-user device encryption', status: 'PARTIAL', evidence: ['src/health/storage.ts'], officialExternalValidationRequired: true },
  { id: '170.315(d)(8)', title: 'Integrity', status: 'IMPLEMENTED', evidence: ['src/health/storage.ts', 'src/health/documents.ts'], officialExternalValidationRequired: true },
  { id: '170.315(d)(9)', title: 'Trusted connection', status: 'PARTIAL', evidence: ['docs/GLASS_ONION_HEALTH_RUNTIME.md'], officialExternalValidationRequired: true },
  { id: '170.315(d)(12)', title: 'Encrypt authentication credentials', status: 'PARTIAL', evidence: ['src/health/identity.ts'], officialExternalValidationRequired: true },
  { id: '170.315(d)(13)', title: 'Multi-factor authentication', status: 'IMPLEMENTED', evidence: ['src/health/identity.ts'], officialExternalValidationRequired: true },
  { id: '170.315(e)(1)', title: 'View, download, and transmit to third party', status: 'PARTIAL', evidence: ['src/health/portals.ts', 'src/health/onc-readiness.ts'], officialExternalValidationRequired: true },
  { id: '170.315(g)(4)', title: 'Quality management system', status: 'IMPLEMENTED', evidence: ['src/health/onc-readiness.ts', 'docs/GLASS_ONION_HEALTH_ONC_READINESS.md'], officialExternalValidationRequired: true },
  { id: '170.315(g)(5)', title: 'Accessibility-centered design', status: 'IMPLEMENTED', evidence: ['src/health/onc-readiness.ts', 'docs/GLASS_ONION_HEALTH_ONC_READINESS.md'], officialExternalValidationRequired: true },
] as const;

export const assessONCReadiness = (criteria: readonly ONCCriterion[] = ONC_READINESS_CRITERIA) => {
  const implemented = criteria.filter((criterion) => criterion.status === 'IMPLEMENTED').map((criterion) => criterion.id);
  const partial = criteria.filter((criterion) => criterion.status === 'PARTIAL').map((criterion) => criterion.id);
  const missing = criteria.filter((criterion) => criterion.status === 'NOT_IMPLEMENTED').map((criterion) => criterion.id);
  return {
    status: missing.length > 0 ? 'NOT_READY' : partial.length > 0 ? 'CONDITIONAL_READINESS' : 'CODE_READINESS_COMPLETE',
    implemented,
    partial,
    missing,
    officialExternalValidationRequired: criteria.some((criterion) => criterion.officialExternalValidationRequired),
    externalCertificationStatus: 'NOT_ISSUED' as const,
  } as const;
};

export const GLASS_ONION_HEALTH_ONC_READINESS = {
  id: 'GLASS-ONION-HEALTH-ONC-READINESS',
  version: '0.3.0',
  command: '/glass certify health onc-ready',
  standardFamily: '45_CFR_PART_170_ONC_HEALTH_IT_CERTIFICATION_PROGRAM',
  freeLocalConformanceHarness: true,
  ehiExport: true,
  auditReports: true,
  automaticTimeoutCheck: true,
  emergencyAccessReadinessCheck: true,
  qmsEvidence: true,
  accessibilityEvidence: true,
  assessment: assessONCReadiness(),
  officialCertificationIssued: false,
  officialTestingBodyRequired: true,
  officialCertificationBodyRequired: true,
} as const;
