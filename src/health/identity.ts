import type { HealthAction, HealthRole } from '../lib/glass-onion-health';
import type { HealthAssignment, HealthSession, HealthUserIdentity } from './types';

const ROLE_ACTIONS: Readonly<Record<HealthRole, readonly HealthAction[]>> = {
  ADMIN: ['READ', 'CREATE', 'UPDATE', 'SIGN', 'AMEND', 'EXPORT', 'DISCLOSE'],
  CLINICIAN: ['READ', 'CREATE', 'UPDATE', 'SIGN', 'AMEND', 'EXPORT', 'DISCLOSE'],
  SUPERVISOR: ['READ', 'CREATE', 'UPDATE', 'SIGN', 'AMEND', 'EXPORT', 'DISCLOSE'],
  SUPPORT: [],
  BILLING: ['READ', 'CREATE', 'UPDATE', 'EXPORT'],
  PRIVACY_OFFICER: ['READ', 'CREATE', 'UPDATE', 'SIGN', 'AMEND', 'EXPORT', 'DISCLOSE'],
  SECURITY_OFFICER: ['READ', 'EXPORT'],
  AUDITOR: ['READ', 'EXPORT'],
  CLIENT: ['READ', 'EXPORT'],
};

export const validateHealthIdentity = (identity: HealthUserIdentity): HealthUserIdentity => {
  if (!identity.id.trim() || !identity.organizationId.trim()) throw new Error('HEALTH_IDENTITY_REQUIRED');
  if (!identity.active) throw new Error('HEALTH_IDENTITY_INACTIVE');
  if (identity.provenance.length === 0) throw new Error('HEALTH_IDENTITY_PROVENANCE_REQUIRED');
  return identity;
};

export const createHealthSession = (
  identity: HealthUserIdentity,
  input: {
    readonly sessionId: string;
    readonly authenticatedAt: string;
    readonly expiresAt: string;
    readonly mfaVerified: boolean;
    readonly authenticationMethods: readonly string[];
    readonly provenance: readonly string[];
  },
): HealthSession => {
  validateHealthIdentity(identity);
  if (!input.sessionId.trim() || input.provenance.length === 0) throw new Error('HEALTH_SESSION_PROVENANCE_REQUIRED');
  if (Date.parse(input.expiresAt) <= Date.parse(input.authenticatedAt)) throw new Error('HEALTH_SESSION_EXPIRY_INVALID');
  if (identity.mfaRequired && !input.mfaVerified) throw new Error('HEALTH_MFA_REQUIRED');
  if (input.authenticationMethods.length === 0) throw new Error('HEALTH_AUTHENTICATION_METHOD_REQUIRED');
  return {
    id: input.sessionId,
    actorId: identity.id,
    role: identity.role,
    organizationId: identity.organizationId,
    authenticatedAt: input.authenticatedAt,
    expiresAt: input.expiresAt,
    mfaVerified: input.mfaVerified,
    authenticationMethods: input.authenticationMethods,
    provenance: input.provenance,
  };
};

export const validateHealthSession = (session: HealthSession, at: string): HealthSession => {
  if (!session.id.trim() || !session.actorId.trim() || !session.organizationId.trim()) throw new Error('HEALTH_SESSION_IDENTITY_REQUIRED');
  if (session.provenance.length === 0) throw new Error('HEALTH_SESSION_PROVENANCE_REQUIRED');
  const atTime = Date.parse(at);
  if (Number.isNaN(atTime) || atTime < Date.parse(session.authenticatedAt) || atTime >= Date.parse(session.expiresAt)) {
    throw new Error('HEALTH_SESSION_EXPIRED');
  }
  return session;
};

export const roleAllowsHealthAction = (role: HealthRole, action: HealthAction): boolean => ROLE_ACTIONS[role].includes(action);

export const assignmentIsActive = (assignment: HealthAssignment, at: string): boolean => {
  if (!assignment.clientId.trim() || !assignment.providerId.trim() || assignment.provenance.length === 0) return false;
  if (!assignment.active) return false;
  const time = Date.parse(at);
  if (Number.isNaN(time) || Date.parse(assignment.effectiveAt) > time) return false;
  if (assignment.expiresAt && Date.parse(assignment.expiresAt) <= time) return false;
  return true;
};

export const isAssignedToClient = (
  actorId: string,
  clientId: string,
  assignments: readonly HealthAssignment[],
  at: string,
): boolean => assignments.some((assignment) => assignment.providerId === actorId && assignment.clientId === clientId && assignmentIsActive(assignment, at));

export const HEALTH_IDENTITY_RUNTIME = {
  version: '0.2.0',
  uniqueIdentityRequired: true,
  mfaCapable: true,
  sessionExpiryRequired: true,
  roleActionBoundaryRequired: true,
  providerAssignmentSupported: true,
} as const;
