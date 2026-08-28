import { createHash } from 'crypto';

import type { HealthAction, HealthDecision } from '../lib/glass-onion-health';

export interface RuntimeAuditEventInput {
  readonly id: string;
  readonly actorId: string;
  readonly action: HealthAction | 'AUTHENTICATE' | 'AUTHORIZE' | 'REVOKE_AUTHORIZATION' | 'RETENTION_HOLD' | 'INCIDENT_UPDATE';
  readonly targetId: string;
  readonly occurredAt: string;
  readonly purpose: string;
  readonly decision: HealthDecision;
  readonly provenance: readonly string[];
}

export interface RuntimeAuditEvent extends RuntimeAuditEventInput {
  readonly sequence: number;
  readonly previousHash: string;
  readonly eventHash: string;
}

const canonicalAuditPayload = (event: RuntimeAuditEventInput, sequence: number, previousHash: string): string =>
  JSON.stringify({
    sequence,
    previousHash,
    id: event.id,
    actorId: event.actorId,
    action: event.action,
    targetId: event.targetId,
    occurredAt: event.occurredAt,
    purpose: event.purpose,
    decision: event.decision,
    provenance: event.provenance,
  });

const hashAuditPayload = (payload: string): string => createHash('sha256').update(payload, 'utf8').digest('hex');

export const appendRuntimeAuditEvent = (
  events: readonly RuntimeAuditEvent[],
  input: RuntimeAuditEventInput,
): RuntimeAuditEvent => {
  if (!input.id.trim() || !input.actorId.trim() || !input.targetId.trim() || !input.purpose.trim()) throw new Error('HEALTH_AUDIT_IDENTITY_REQUIRED');
  if (!input.occurredAt.trim() || input.provenance.length === 0) throw new Error('HEALTH_AUDIT_PROVENANCE_REQUIRED');
  if (events.some((event) => event.id === input.id)) throw new Error('HEALTH_AUDIT_DUPLICATE_ID');
  const sequence = events.length + 1;
  const previousHash = events.length === 0 ? 'GENESIS' : events[events.length - 1].eventHash;
  const eventHash = hashAuditPayload(canonicalAuditPayload(input, sequence, previousHash));
  return { ...input, sequence, previousHash, eventHash };
};

export const validateRuntimeAuditChain = (events: readonly RuntimeAuditEvent[]): boolean => {
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    const expectedSequence = i + 1;
    const expectedPreviousHash = i === 0 ? 'GENESIS' : events[i - 1].eventHash;
    if (event.sequence !== expectedSequence || event.previousHash !== expectedPreviousHash || event.provenance.length === 0) return false;
    const input: RuntimeAuditEventInput = {
      id: event.id,
      actorId: event.actorId,
      action: event.action,
      targetId: event.targetId,
      occurredAt: event.occurredAt,
      purpose: event.purpose,
      decision: event.decision,
      provenance: event.provenance,
    };
    if (hashAuditPayload(canonicalAuditPayload(input, event.sequence, event.previousHash)) !== event.eventHash) return false;
  }
  return true;
};

export class InMemoryHealthAuditLedger {
  private readonly entries: RuntimeAuditEvent[] = [];

  append(input: RuntimeAuditEventInput): RuntimeAuditEvent {
    const event = appendRuntimeAuditEvent(this.entries, input);
    this.entries.push(event);
    return event;
  }

  list(): readonly RuntimeAuditEvent[] {
    return this.entries.slice();
  }

  validate(): boolean {
    return validateRuntimeAuditChain(this.entries);
  }
}

export const HEALTH_AUDIT_RUNTIME = {
  version: '0.2.0',
  hashAlgorithm: 'SHA-256',
  appendOnly: true,
  previousHashRequired: true,
  duplicateEventIdsBlocked: true,
} as const;
