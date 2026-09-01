import test from 'ava';

import {
  canTransitionRuntimeJob,
  validateRuntimeEvent,
  validateRuntimeSchedule,
} from './security-runtime';

test('allows queued to running and running to completed', (t) => {
  t.true(canTransitionRuntimeJob('QUEUED', 'RUNNING'));
  t.true(canTransitionRuntimeJob('RUNNING', 'COMPLETED'));
});

test('does not allow terminal jobs to restart', (t) => {
  t.false(canTransitionRuntimeJob('COMPLETED', 'RUNNING'));
  t.false(canTransitionRuntimeJob('FAILED', 'RUNNING'));
  t.false(canTransitionRuntimeJob('CANCELLED', 'RUNNING'));
});

test('enforces a one-minute minimum schedule interval', (t) => {
  const error = t.throws(() => validateRuntimeSchedule(59));
  t.is(error?.message, 'RUNTIME_SCHEDULE_INTERVAL_OUT_OF_RANGE');
  t.notThrows(() => validateRuntimeSchedule(60));
});

test('accepts a valid live runtime event', (t) => {
  t.notThrows(() => validateRuntimeEvent({
    type: 'step.finished',
    jobId: 'job-001',
    payload: { tool: 'nmap', status: 'COMPLETED' },
    createdAt: new Date().toISOString(),
  }));
});
