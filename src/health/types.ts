import type {
  ClinicalDocument,
  HealthAction,
  HealthDataClass,
  HealthDecision,
  HealthPurpose,
  HealthRole,
} from '../lib/glass-onion-health';

export interface HealthUserIdentity {
  readonly id: string;
  readonly role: HealthRole;
  readonly active: boolean;
  readonly workforceMember: boolean;
  readonly mfaRequired: boolean;
  readonly organizationId: string;
  readonly provenance: readonly string[];
}

export interface HealthSession {
  readonly id: string;
  readonly actorId: string;
  readonly role: HealthRole;
  readonly organizationId: string;
  readonly authenticatedAt: string;
  readonly expiresAt: string;
  readonly mfaVerified: boolean;
  readonly authenticationMethods: readonly string[];
  readonly provenance: readonly string[];
}

export interface HealthAssignment {
  readonly clientId: string;
  readonly providerId: string;
  readonly relationship: 'PRIMARY' | 'SECONDARY' | 'SUPERVISOR' | 'CARE_TEAM';
  readonly active: boolean;
  readonly effectiveAt: string;
  readonly expiresAt?: string;
  readonly provenance: readonly string[];
}

export interface HealthPolicyContext {
  readonly session: HealthSession;
  readonly action: HealthAction;
  readonly purpose: HealthPurpose;
  readonly document: ClinicalDocument;
  readonly assignedToClient: boolean;
  readonly isDocumentAuthor: boolean;
  readonly minimumNecessarySatisfied: boolean;
  readonly explicitAuthorization: boolean;
  readonly part2ConsentSatisfied: boolean;
  readonly externalRecipient: boolean;
  readonly emergencyOverride: boolean;
  readonly bulk: boolean;
}

export interface ProtectedObjectMetadata {
  readonly objectId: string;
  readonly clientId: string;
  readonly dataClass: HealthDataClass;
  readonly contentType: string;
  readonly createdAt: string;
  readonly version: string;
  readonly keyId: string;
  readonly plaintextSha256: string;
  readonly provenance: readonly string[];
}

export interface RuntimeDecisionRecord {
  readonly requestId: string;
  readonly actorId: string;
  readonly targetId: string;
  readonly action: HealthAction;
  readonly purpose: HealthPurpose;
  readonly decision: HealthDecision;
  readonly reasons: readonly string[];
  readonly decidedAt: string;
  readonly provenance: readonly string[];
}

export interface RuntimeControlEvidence {
  readonly id: string;
  readonly controlId: string;
  readonly evidenceType: 'AUDIT_CHAIN' | 'ACCESS_DECISION' | 'DOCUMENT_HASH' | 'SIGNATURE' | 'AUTHORIZATION' | 'RETENTION' | 'INCIDENT' | 'CONFIGURATION';
  readonly sourceRef: string;
  readonly collectedAt: string;
  readonly verified: boolean;
  readonly provenance: readonly string[];
}
