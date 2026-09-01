import test from 'ava';

import {
  canTransitionRuntimeFinding,
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

test('finding lifecycle supports fix retest and verification', (t) => {
  t.true(canTransitionRuntimeFinding('OPEN', 'RESOLVED_PENDING_RETEST'));
  t.true(canTransitionRuntimeFinding('RESOLVED_PENDING_RETEST', 'RETESTING'));
  t.true(canTransitionRuntimeFinding('RETESTING', 'VERIFIED'));
  t.false(canTransitionRuntimeFinding('VERIFIED', 'OPEN'));
});

test('enforces a one-minute minimum schedule interval', (t) => {
  const error = t.throws(() => validateRuntimeSchedule(59));
  t.is(error?.message, 'RUNTIME_SCHEDULE_INTERVAL_OUT_OF_RANGE');
  t.notThrows(() => validateRuntimeSchedule(60));
});

test('accepts a valid live runtime event', (t) => {
  t.notThrows(() => validateRuntimeEvent({
    type: 'finding.detected',
    jobId: 'job-001',
    payload: { tool: 'nmap', status: 'OPEN' },
    createdAt: new Date().toISOString(),
  }));
});
