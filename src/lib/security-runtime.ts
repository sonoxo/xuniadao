export type RuntimeJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type RuntimeFindingStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED_PENDING_RETEST'
  | 'RETESTING'
  | 'VERIFIED'
  | 'DISMISSED';
export type RuntimeEventType =
  | 'job.queued'
  | 'job.running'
  | 'job.finished'
  | 'job.failed'
  | 'job.cancelled'
  | 'step.running'
  | 'step.finished'
  | 'finding.detected'
  | 'finding.verified'
  | 'notification.created'
  | 'schedule.triggered'
  | 'schedule.failed';

export interface RuntimeEvent<T extends Record<string, unknown> = Record<string, unknown>> {
  id?: number;
  type: RuntimeEventType;
  jobId?: string | null;
  payload: T;
  createdAt: string;
}

export interface RuntimeSchedule {
  id: string;
  name: string;
  intervalSeconds: number;
  enabled: boolean;
  nextRunAt: string;
  lastRunAt?: string | null;
}

export interface RuntimeFinding {
  id: string;
  fingerprint: string;
  jobId: string;
  toolId: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  resource: string;
  description: string;
  remediation: string;
  status: RuntimeFindingStatus;
  firstSeenAt: string;
  lastSeenAt: string;
  verifiedAt?: string | null;
}

const TERMINAL = new Set<RuntimeJobStatus>(['COMPLETED', 'FAILED', 'CANCELLED']);

export function canTransitionRuntimeJob(from: RuntimeJobStatus, to: RuntimeJobStatus): boolean {
  if (from === to) return true;
  if (TERMINAL.has(from)) return false;
  if (from === 'QUEUED') return to === 'RUNNING' || to === 'FAILED' || to === 'CANCELLED';
  if (from === 'RUNNING') return to === 'COMPLETED' || to === 'FAILED' || to === 'CANCELLED';
  return false;
}

export function canTransitionRuntimeFinding(from: RuntimeFindingStatus, to: RuntimeFindingStatus): boolean {
  if (from === to) return true;
  if (from === 'VERIFIED' || from === 'DISMISSED') return false;
  if (from === 'OPEN') return ['IN_PROGRESS', 'RESOLVED_PENDING_RETEST', 'RETESTING', 'DISMISSED'].includes(to);
  if (from === 'IN_PROGRESS') return ['OPEN', 'RESOLVED_PENDING_RETEST', 'RETESTING', 'DISMISSED'].includes(to);
  if (from === 'RESOLVED_PENDING_RETEST') return ['OPEN', 'RETESTING', 'DISMISSED'].includes(to);
  if (from === 'RETESTING') return ['OPEN', 'VERIFIED'].includes(to);
  return false;
}

export function validateRuntimeSchedule(intervalSeconds: number): void {
  if (!Number.isInteger(intervalSeconds) || intervalSeconds < 60 || intervalSeconds > 2_592_000) {
    throw new Error('RUNTIME_SCHEDULE_INTERVAL_OUT_OF_RANGE');
  }
}

export function validateRuntimeEvent(event: RuntimeEvent): void {
  if (!event.type) throw new Error('RUNTIME_EVENT_TYPE_REQUIRED');
  if (!event.createdAt || !Number.isFinite(Date.parse(event.createdAt))) {
    throw new Error('RUNTIME_EVENT_TIMESTAMP_INVALID');
  }
  if (event.jobId !== undefined && event.jobId !== null && !event.jobId.trim()) {
    throw new Error('RUNTIME_EVENT_JOB_ID_INVALID');
  }
  if (!event.payload || typeof event.payload !== 'object' || Array.isArray(event.payload)) {
    throw new Error('RUNTIME_EVENT_PAYLOAD_INVALID');
  }
}
