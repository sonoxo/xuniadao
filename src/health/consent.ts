import {
  authorizationIsActive,
  validateHealthAuthorization,
  validateHealthDisclosure,
} from '../lib/glass-onion-health';
import type {
  ClinicalDocument,
  HealthAuthorization,
  HealthDisclosure,
} from '../lib/glass-onion-health';

export type AuthorizationRequirement = 'NONE' | 'GENERAL_DISCLOSURE' | 'PSYCHOTHERAPY_NOTES' | 'PART2' | 'PART2_SUD_COUNSELING_NOTES';

export const authorizationRequirementForDocument = (document: ClinicalDocument): AuthorizationRequirement => {
  switch (document.dataClass) {
    case 'PSYCHOTHERAPY_NOTES':
      return 'PSYCHOTHERAPY_NOTES';
    case 'PART2_RECORD':
      return 'PART2';
    case 'PART2_SUD_COUNSELING_NOTE':
      return 'PART2_SUD_COUNSELING_NOTES';
    case 'PHI':
    case 'EPHI':
      return 'GENERAL_DISCLOSURE';
    case 'NON_PHI':
      return 'NONE';
    default:
      return 'GENERAL_DISCLOSURE';
  }
};

const authorizationMatches = (
  authorization: HealthAuthorization,
  requirement: AuthorizationRequirement,
  clientId: string,
  recipient: string,
  at: string,
): boolean => {
  validateHealthAuthorization(authorization);
  if (!authorizationIsActive(authorization, at) || authorization.clientId !== clientId) return false;
  if (authorization.recipient && authorization.recipient !== recipient) return false;
  if (requirement === 'NONE') return true;
  if (requirement === 'GENERAL_DISCLOSURE') return authorization.kind === 'DISCLOSURE';
  if (requirement === 'PSYCHOTHERAPY_NOTES') return authorization.kind === 'PSYCHOTHERAPY_NOTES';
  if (requirement === 'PART2') return authorization.kind === 'PART2';
  return authorization.kind === 'PART2_SUD_COUNSELING_NOTES';
};

export interface DisclosureAuthorizationDecision {
  readonly allowed: boolean;
  readonly authorizationId?: string;
  readonly reasons: readonly string[];
}

export const resolveDisclosureAuthorization = (
  document: ClinicalDocument,
  recipient: string,
  authorizations: readonly HealthAuthorization[],
  at: string,
): DisclosureAuthorizationDecision => {
  if (!recipient.trim()) return { allowed: false, reasons: ['HEALTH_DISCLOSURE_RECIPIENT_REQUIRED'] };
  const requirement = authorizationRequirementForDocument(document);
  if (requirement === 'NONE') return { allowed: true, reasons: [] };
  const matching = authorizations.find((authorization) => authorizationMatches(authorization, requirement, document.clientId, recipient, at));
  if (!matching) return { allowed: false, reasons: [`HEALTH_${requirement}_AUTHORIZATION_REQUIRED`] };
  return { allowed: true, authorizationId: matching.id, reasons: [] };
};

export const buildHealthDisclosure = (input: {
  readonly id: string;
  readonly clientId: string;
  readonly documents: readonly ClinicalDocument[];
  readonly recipient: string;
  readonly purpose: string;
  readonly requestedBy: string;
  readonly requestedAt: string;
  readonly authorizations: readonly HealthAuthorization[];
  readonly provenance: readonly string[];
}): HealthDisclosure => {
  if (input.documents.length === 0) throw new Error('HEALTH_DISCLOSURE_DOCUMENT_REQUIRED');
  if (input.documents.some((document) => document.clientId !== input.clientId)) throw new Error('HEALTH_DISCLOSURE_CLIENT_MISMATCH');
  const decisions = input.documents.map((document) => resolveDisclosureAuthorization(document, input.recipient, input.authorizations, input.requestedAt));
  const denied = decisions.find((decision) => !decision.allowed);
  if (denied) throw new Error(denied.reasons[0] || 'HEALTH_DISCLOSURE_AUTHORIZATION_REQUIRED');
  const authorizationIds = Array.from(new Set(decisions.map((decision) => decision.authorizationId).filter((id): id is string => Boolean(id))));
  const disclosure: HealthDisclosure = {
    id: input.id,
    clientId: input.clientId,
    documentIds: input.documents.map((document) => document.id),
    recipient: input.recipient,
    purpose: input.purpose,
    authorizationId: authorizationIds.length === 1 ? authorizationIds[0] : undefined,
    requestedBy: input.requestedBy,
    requestedAt: input.requestedAt,
    status: 'REQUESTED',
    provenance: input.provenance,
  };
  return validateHealthDisclosure(disclosure);
};

export const revokeHealthAuthorization = (authorization: HealthAuthorization, revokedAt: string): HealthAuthorization => {
  validateHealthAuthorization(authorization);
  if (!revokedAt.trim() || Date.parse(revokedAt) < Date.parse(authorization.effectiveAt)) throw new Error('HEALTH_AUTHORIZATION_REVOCATION_TIME_INVALID');
  return { ...authorization, revokedAt };
};

export const HEALTH_CONSENT_RUNTIME = {
  version: '0.2.0',
  activeAuthorizationRequired: true,
  recipientScopingSupported: true,
  revocationSupported: true,
  psychotherapyAuthorizationSeparated: true,
  part2AuthorizationSeparated: true,
  sudCounselingAuthorizationSeparated: true,
} as const;
