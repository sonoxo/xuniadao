import {
  evaluateHealthAccess,
  validateHealthAuthorization,
} from '../lib/glass-onion-health';
import type {
  HealthAccessDecision,
  HealthAuthorization,
  HealthPurpose,
  HealthSignature,
} from '../lib/glass-onion-health';
import { InMemoryHealthAuditLedger } from './audit';
import { HealthEFileService } from './documents';
import { buildRuntimeEvidenceSnapshot } from './evidence';
import { isAssignedToClient, roleAllowsHealthAction, validateHealthSession } from './identity';
import type { HealthRuntimeIncident } from './incidents';
import type { ProtectedObjectStore } from './storage';
import type {
  HealthAssignment,
  HealthPolicyContext,
  RuntimeDecisionRecord,
} from './types';

export interface GovernedHealthRequest {
  readonly requestId: string;
  readonly at: string;
  readonly session: HealthPolicyContext['session'];
  readonly action: HealthPolicyContext['action'];
  readonly purpose: HealthPurpose;
  readonly documentId: string;
  readonly minimumNecessarySatisfied: boolean;
  readonly explicitAuthorization?: boolean;
  readonly part2ConsentSatisfied?: boolean;
  readonly externalRecipient?: boolean;
  readonly emergencyOverride?: boolean;
  readonly bulk?: boolean;
  readonly provenance: readonly string[];
}

export class GlassOnionHealthRuntime {
  readonly efile: HealthEFileService;
  readonly audit = new InMemoryHealthAuditLedger();

  private readonly assignments: HealthAssignment[] = [];
  private readonly authorizations: HealthAuthorization[] = [];
  private readonly decisions: RuntimeDecisionRecord[] = [];
  private readonly incidents: HealthRuntimeIncident[] = [];

  constructor(store: ProtectedObjectStore) {
    this.efile = new HealthEFileService(store);
  }

  addAssignment(assignment: HealthAssignment): void {
    if (!assignment.clientId.trim() || !assignment.providerId.trim() || assignment.provenance.length === 0) {
      throw new Error('HEALTH_ASSIGNMENT_INVALID');
    }
    this.assignments.push(assignment);
  }

  addAuthorization(authorization: HealthAuthorization): void {
    validateHealthAuthorization(authorization);
    this.authorizations.push(authorization);
  }

  addIncident(incident: HealthRuntimeIncident): void {
    this.incidents.push(incident);
  }

  authorize(request: GovernedHealthRequest): HealthAccessDecision {
    validateHealthSession(request.session, request.at);
    if (request.provenance.length === 0) throw new Error('HEALTH_RUNTIME_REQUEST_PROVENANCE_REQUIRED');
    const document = this.efile.getDocument(request.documentId);
    const roleAllowed = roleAllowsHealthAction(request.session.role, request.action);
    const assignedToClient = isAssignedToClient(
      request.session.actorId,
      document.clientId,
      this.assignments,
      request.at,
    );

    const decision = roleAllowed
      ? evaluateHealthAccess({
          actorId: request.session.actorId,
          role: request.session.role,
          action: request.action,
          purpose: request.purpose,
          document,
          assignedToClient,
          isDocumentAuthor: document.authorId === request.session.actorId,
          minimumNecessarySatisfied: request.minimumNecessarySatisfied,
          explicitAuthorization: request.explicitAuthorization,
          part2ConsentSatisfied: request.part2ConsentSatisfied,
          externalRecipient: request.externalRecipient,
          emergencyOverride: request.emergencyOverride,
          bulk: request.bulk,
        })
      : { decision: 'BLOCK' as const, humanApprovalRequired: true, reasons: ['HEALTH_ROLE_ACTION_NOT_PERMITTED'] };

    const decisionRecord: RuntimeDecisionRecord = {
      requestId: request.requestId,
      actorId: request.session.actorId,
      targetId: document.id,
      action: request.action,
      purpose: request.purpose,
      decision: decision.decision,
      reasons: decision.reasons,
      decidedAt: request.at,
      provenance: request.provenance,
    };
    this.decisions.push(decisionRecord);
    this.audit.append({
      id: `audit:${request.requestId}`,
      actorId: request.session.actorId,
      action: request.action,
      targetId: document.id,
      occurredAt: request.at,
      purpose: request.purpose,
      decision: decision.decision,
      provenance: request.provenance,
    });
    return decision;
  }

  listDecisions(): readonly RuntimeDecisionRecord[] {
    return this.decisions.slice();
  }

  listAuthorizations(): readonly HealthAuthorization[] {
    return this.authorizations.slice();
  }

  evidenceSnapshot(collectedAt: string): ReturnType<typeof buildRuntimeEvidenceSnapshot> {
    const allDocuments = new Set<string>();
    this.decisions.forEach((decision) => allDocuments.add(decision.targetId));
    const signatures: HealthSignature[] = [];
    allDocuments.forEach((documentId) => signatures.push(...this.efile.listSignatures(documentId)));
    return buildRuntimeEvidenceSnapshot({
      collectedAt,
      auditEvents: this.audit.list(),
      auditChainValid: this.audit.validate(),
      decisions: this.decisions,
      signatures,
      authorizations: this.authorizations,
      incidents: this.incidents,
    });
  }
}

export const GLASS_ONION_HEALTH_RUNTIME = {
  id: 'GLASS-ONION-HEALTH-RUNTIME',
  version: '0.2.0',
  command: '/glass health runtime',
  pipeline: [
    'AUTHENTICATE',
    'RESOLVE_ASSIGNMENT',
    'LOAD_PROTECTED_METADATA',
    'POLICY_DECIDE',
    'ALLOW_REVIEW_BLOCK',
    'AUDIT_APPEND',
    'EVIDENCE_COLLECT',
  ] as const,
  externalCertificationStatus: 'NOT_ISSUED',
} as const;
