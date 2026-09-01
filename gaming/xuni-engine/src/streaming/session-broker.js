import { randomUUID } from 'node:crypto';

export const SESSION_STATES = Object.freeze([
  'QUEUED', 'ALLOCATING', 'BOOTING', 'READY', 'STREAMING',
  'SUSPENDING', 'SUSPENDED', 'TERMINATED', 'FAILED'
]);

const ALLOWED = new Map([
  ['QUEUED', new Set(['ALLOCATING', 'FAILED', 'TERMINATED'])],
  ['ALLOCATING', new Set(['BOOTING', 'FAILED', 'TERMINATED'])],
  ['BOOTING', new Set(['READY', 'FAILED', 'TERMINATED'])],
  ['READY', new Set(['STREAMING', 'SUSPENDING', 'TERMINATED', 'FAILED'])],
  ['STREAMING', new Set(['SUSPENDING', 'TERMINATED', 'FAILED'])],
  ['SUSPENDING', new Set(['SUSPENDED', 'TERMINATED', 'FAILED'])],
  ['SUSPENDED', new Set(['ALLOCATING', 'TERMINATED', 'FAILED'])],
  ['TERMINATED', new Set()],
  ['FAILED', new Set(['TERMINATED'])]
]);

export class SessionBroker {
  constructor({ regions = ['local'], now = () => Date.now() } = {}) {
    this.regions = regions;
    this.now = now;
    this.sessions = new Map();
  }

  create({ playerId, titleId, entitlement = true, preferredRegion = 'local', resumeToken = null }) {
    if (!playerId || !titleId) throw new Error('INVALID_SESSION_REQUEST');
    if (!entitlement) throw new Error('ENTITLEMENT_REQUIRED');
    const id = randomUUID();
    const session = {
      id,
      playerId,
      titleId,
      region: this.regions.includes(preferredRegion) ? preferredRegion : this.regions[0],
      state: 'QUEUED',
      hostId: null,
      stream: null,
      resumeToken,
      createdAt: this.now(),
      updatedAt: this.now(),
      telemetry: { startupMs: null, inputSamples: [], frameSamples: [] }
    };
    this.sessions.set(id, session);
    return structuredClone(session);
  }

  get(id) {
    const session = this.sessions.get(id);
    return session ? structuredClone(session) : null;
  }

  list() { return [...this.sessions.values()].map(s => structuredClone(s)); }

  transition(id, next, patch = {}) {
    if (!SESSION_STATES.includes(next)) throw new Error('INVALID_SESSION_STATE');
    const session = this.sessions.get(id);
    if (!session) throw new Error('SESSION_NOT_FOUND');
    if (!ALLOWED.get(session.state)?.has(next)) throw new Error(`INVALID_TRANSITION:${session.state}->${next}`);
    session.state = next;
    Object.assign(session, patch);
    session.updatedAt = this.now();
    if (next === 'READY' && session.telemetry.startupMs == null) {
      session.telemetry.startupMs = session.updatedAt - session.createdAt;
    }
    return structuredClone(session);
  }

  recordInput(id, latencyMs) {
    const session = this.sessions.get(id);
    if (!session) throw new Error('SESSION_NOT_FOUND');
    session.telemetry.inputSamples.push(Math.max(0, Number(latencyMs) || 0));
    session.telemetry.inputSamples = session.telemetry.inputSamples.slice(-120);
  }

  recordFrame(id, sample) {
    const session = this.sessions.get(id);
    if (!session) throw new Error('SESSION_NOT_FOUND');
    session.telemetry.frameSamples.push(sample);
    session.telemetry.frameSamples = session.telemetry.frameSamples.slice(-120);
  }
}
