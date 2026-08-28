export type HealthIncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type HealthIncidentStatus = 'TRIAGE' | 'CONTAINED' | 'INVESTIGATING' | 'RISK_ASSESSMENT' | 'NOTIFICATION_REVIEW' | 'CLOSED';

export interface HealthRuntimeIncident {
  readonly id: string;
  readonly detectedAt: string;
  readonly severity: HealthIncidentSeverity;
  readonly status: HealthIncidentStatus;
  readonly owner: string;
  readonly phiInvolved: boolean;
  readonly part2Involved: boolean;
  readonly affectedClientIds: readonly string[];
  readonly containmentActions: readonly string[];
  readonly riskAssessmentCompleted: boolean;
  readonly notificationDecisionDocumented: boolean;
  readonly closedAt?: string;
  readonly provenance: readonly string[];
}

export type IncidentDecision = 'ALLOW_TRANSITION' | 'REVIEW' | 'BLOCK';

export const validateHealthRuntimeIncident = (incident: HealthRuntimeIncident): HealthRuntimeIncident => {
  if (!incident.id.trim() || !incident.detectedAt.trim() || !incident.owner.trim()) throw new Error('HEALTH_INCIDENT_IDENTITY_REQUIRED');
  if (incident.provenance.length === 0) throw new Error('HEALTH_INCIDENT_PROVENANCE_REQUIRED');
  if ((incident.severity === 'HIGH' || incident.severity === 'CRITICAL') && incident.containmentActions.length === 0) {
    throw new Error('HEALTH_INCIDENT_CONTAINMENT_REQUIRED');
  }
  if (incident.status === 'CLOSED') {
    if (!incident.riskAssessmentCompleted || !incident.notificationDecisionDocumented || !incident.closedAt) {
      throw new Error('HEALTH_INCIDENT_CLOSURE_EVIDENCE_REQUIRED');
    }
  }
  return incident;
};

export const evaluateIncidentTransition = (
  incident: HealthRuntimeIncident,
  nextStatus: HealthIncidentStatus,
): IncidentDecision => {
  validateHealthRuntimeIncident(incident);
  if (incident.status === 'CLOSED') return 'BLOCK';
  if (nextStatus === 'CLOSED' && (!incident.riskAssessmentCompleted || !incident.notificationDecisionDocumented)) return 'BLOCK';
  if ((incident.severity === 'HIGH' || incident.severity === 'CRITICAL') && nextStatus === 'CLOSED') return 'REVIEW';
  if (incident.phiInvolved || incident.part2Involved) {
    if (nextStatus === 'NOTIFICATION_REVIEW' || nextStatus === 'CLOSED') return 'REVIEW';
  }
  return 'ALLOW_TRANSITION';
};

export const updateIncidentStatus = (
  incident: HealthRuntimeIncident,
  nextStatus: HealthIncidentStatus,
  closedAt?: string,
): HealthRuntimeIncident => {
  const decision = evaluateIncidentTransition(incident, nextStatus);
  if (decision === 'BLOCK') throw new Error('HEALTH_INCIDENT_TRANSITION_BLOCKED');
  if (nextStatus === 'CLOSED' && !closedAt) throw new Error('HEALTH_INCIDENT_CLOSED_TIME_REQUIRED');
  return validateHealthRuntimeIncident({ ...incident, status: nextStatus, closedAt: nextStatus === 'CLOSED' ? closedAt : incident.closedAt });
};

export const HEALTH_INCIDENT_RUNTIME = {
  version: '0.2.0',
  phiAware: true,
  part2Aware: true,
  closureEvidenceRequired: true,
  highRiskClosureReviewRequired: true,
} as const;
