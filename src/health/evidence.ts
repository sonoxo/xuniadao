import type { HealthAuthorization, HealthSignature } from '../lib/glass-onion-health';
import type { RuntimeAuditEvent } from './audit';
import type { HealthRuntimeIncident } from './incidents';
import type { RuntimeControlEvidence, RuntimeDecisionRecord } from './types';

export interface RuntimeEvidenceSnapshot {
  readonly collectedAt: string;
  readonly auditChainValid: boolean;
  readonly auditEventCount: number;
  readonly decisionCount: number;
  readonly signatureCount: number;
  readonly authorizationCount: number;
  readonly incidentCount: number;
  readonly evidence: readonly RuntimeControlEvidence[];
}

export const buildRuntimeEvidenceSnapshot = (input: {
  readonly collectedAt: string;
  readonly auditEvents: readonly RuntimeAuditEvent[];
  readonly auditChainValid: boolean;
  readonly decisions: readonly RuntimeDecisionRecord[];
  readonly signatures: readonly HealthSignature[];
  readonly authorizations: readonly HealthAuthorization[];
  readonly incidents: readonly HealthRuntimeIncident[];
}): RuntimeEvidenceSnapshot => {
  const evidence: RuntimeControlEvidence[] = [];
  evidence.push({
    id: `runtime-evidence:audit:${input.collectedAt}`,
    controlId: 'health.security.audit',
    evidenceType: 'AUDIT_CHAIN',
    sourceRef: `runtime:audit-events:${input.auditEvents.length}`,
    collectedAt: input.collectedAt,
    verified: input.auditChainValid,
    provenance: ['runtime:glass-onion-health'],
  });
  input.decisions.forEach((decision) => evidence.push({
    id: `runtime-evidence:decision:${decision.requestId}`,
    controlId: 'health.baseline.access-decision',
    evidenceType: 'ACCESS_DECISION',
    sourceRef: `decision:${decision.requestId}`,
    collectedAt: input.collectedAt,
    verified: true,
    provenance: decision.provenance,
  }));
  input.signatures.forEach((signature) => evidence.push({
    id: `runtime-evidence:signature:${signature.id}`,
    controlId: 'health.signature.binding',
    evidenceType: 'SIGNATURE',
    sourceRef: `signature:${signature.id}`,
    collectedAt: input.collectedAt,
    verified: Boolean(signature.documentHash && signature.documentVersion),
    provenance: signature.provenance,
  }));
  input.authorizations.forEach((authorization) => evidence.push({
    id: `runtime-evidence:authorization:${authorization.id}`,
    controlId: authorization.kind === 'PART2' || authorization.kind === 'PART2_SUD_COUNSELING_NOTES'
      ? 'health.part2.release'
      : 'health.privacy.disclosure-review',
    evidenceType: 'AUTHORIZATION',
    sourceRef: `authorization:${authorization.id}`,
    collectedAt: input.collectedAt,
    verified: true,
    provenance: authorization.provenance,
  }));
  input.incidents.forEach((incident) => evidence.push({
    id: `runtime-evidence:incident:${incident.id}`,
    controlId: 'health.security.incident-governance',
    evidenceType: 'INCIDENT',
    sourceRef: `incident:${incident.id}`,
    collectedAt: input.collectedAt,
    verified: incident.status === 'CLOSED' ? incident.riskAssessmentCompleted && incident.notificationDecisionDocumented : true,
    provenance: incident.provenance,
  }));
  return {
    collectedAt: input.collectedAt,
    auditChainValid: input.auditChainValid,
    auditEventCount: input.auditEvents.length,
    decisionCount: input.decisions.length,
    signatureCount: input.signatures.length,
    authorizationCount: input.authorizations.length,
    incidentCount: input.incidents.length,
    evidence,
  };
};

export const HEALTH_EVIDENCE_RUNTIME = {
  version: '0.2.0',
  runtimeEvidenceSupported: true,
  auditEvidenceSupported: true,
  decisionEvidenceSupported: true,
  signatureEvidenceSupported: true,
  authorizationEvidenceSupported: true,
  incidentEvidenceSupported: true,
} as const;
