import { describe, expect, it } from 'vitest';

import {
  canTransitionRuntimeJob,
  validateRuntimeEvent,
  validateRuntimeSchedule,
} from './security-runtime';

describe('XUNIA realtime runtime contract', () => {
  it('allows queued to running and running to completed', () => {
    expect(canTransitionRuntimeJob('QUEUED', 'RUNNING')).toBe(true);
    expect(canTransitionRuntimeJob('RUNNING', 'COMPLETED')).toBe(true);
  });

  it('does not allow terminal jobs to restart', () => {
    expect(canTransitionRuntimeJob('COMPLETED', 'RUNNING')).toBe(false);
    expect(canTransitionRuntimeJob('FAILED', 'RUNNING')).toBe(false);
    expect(canTransitionRuntimeJob('CANCELLED', 'RUNNING')).toBe(false);
  });

  it('enforces a one-minute minimum schedule interval', () => {
    expect(() => validateRuntimeSchedule(59)).toThrow('RUNTIME_SCHEDULE_INTERVAL_OUT_OF_RANGE');
    expect(() => validateRuntimeSchedule(60)).not.toThrow();
  });

  it('accepts a valid live runtime event', () => {
    expect(() => validateRuntimeEvent({
      type: 'step.finished',
      jobId: 'job-001',
      payload: { tool: 'nmap', status: 'COMPLETED' },
      createdAt: new Date().toISOString(),
    })).not.toThrow();
  });
});
