import type { HealthDataClass } from '../lib/glass-onion-health';

export interface HealthRetentionRule {
  readonly id: string;
  readonly dataClasses: readonly HealthDataClass[];
  readonly maxDays: number;
  readonly dispositionRequiresReview: boolean;
  readonly legalHoldAllowed: boolean;
  readonly provenance: readonly string[];
}

export interface HealthLegalHold {
  readonly id: string;
  readonly clientId?: string;
  readonly documentIds: readonly string[];
  readonly reason: string;
  readonly active: boolean;
  readonly effectiveAt: string;
  readonly releasedAt?: string;
  readonly provenance: readonly string[];
}

export type RetentionDecision = 'KEEP' | 'LEGAL_HOLD' | 'REVIEW_FOR_DISPOSITION';

export const validateRetentionRule = (rule: HealthRetentionRule): HealthRetentionRule => {
  if (!rule.id.trim() || rule.dataClasses.length === 0 || rule.maxDays < 1) throw new Error('HEALTH_RETENTION_RULE_INVALID');
  if (rule.provenance.length === 0) throw new Error('HEALTH_RETENTION_PROVENANCE_REQUIRED');
  return rule;
};

export const validateLegalHold = (hold: HealthLegalHold): HealthLegalHold => {
  if (!hold.id.trim() || !hold.reason.trim() || hold.provenance.length === 0) throw new Error('HEALTH_LEGAL_HOLD_INVALID');
  if (!hold.clientId && hold.documentIds.length === 0) throw new Error('HEALTH_LEGAL_HOLD_SCOPE_REQUIRED');
  if (hold.active && hold.releasedAt) throw new Error('HEALTH_ACTIVE_HOLD_CANNOT_BE_RELEASED');
  return hold;
};

export const legalHoldApplies = (hold: HealthLegalHold, clientId: string, documentId: string, at: string): boolean => {
  validateLegalHold(hold);
  if (!hold.active) return false;
  const time = Date.parse(at);
  if (Number.isNaN(time) || Date.parse(hold.effectiveAt) > time) return false;
  return hold.clientId === clientId || hold.documentIds.includes(documentId);
};

export const evaluateRetention = (input: {
  readonly createdAt: string;
  readonly at: string;
  readonly clientId: string;
  readonly documentId: string;
  readonly dataClass: HealthDataClass;
  readonly rule: HealthRetentionRule;
  readonly holds: readonly HealthLegalHold[];
}): RetentionDecision => {
  validateRetentionRule(input.rule);
  if (!input.rule.dataClasses.includes(input.dataClass)) throw new Error('HEALTH_RETENTION_RULE_CLASS_MISMATCH');
  if (input.holds.some((hold) => legalHoldApplies(hold, input.clientId, input.documentId, input.at))) return 'LEGAL_HOLD';
  const elapsedDays = (Date.parse(input.at) - Date.parse(input.createdAt)) / 86_400_000;
  if (Number.isNaN(elapsedDays) || elapsedDays < 0) throw new Error('HEALTH_RETENTION_TIME_INVALID');
  return elapsedDays >= input.rule.maxDays ? 'REVIEW_FOR_DISPOSITION' : 'KEEP';
};

export const HEALTH_RETENTION_RUNTIME = {
  version: '0.2.0',
  automaticHardDelete: false,
  dispositionReviewRequired: true,
  legalHoldSupported: true,
  classSpecificRules: true,
} as const;
