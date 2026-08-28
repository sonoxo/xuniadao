import test from 'ava';

import {
  ControlPlaneAdapter,
  ControlRequest,
  evaluateControlRequest,
  executeControlRequest,
} from './control-plane-runtime';

const adapter: ControlPlaneAdapter<{ ok: boolean }> = {
  name: 'demo-adapter',
  allowedActions: ['READ_STATUS', 'UPDATE_RECORD'],
  execute: async () => ({ ok: true }),
};

const readRequest: ControlRequest = {
  requestId: 'req-1',
  actorId: 'agent-1',
  adapterName: 'demo-adapter',
  action: 'READ_STATUS',
  resource: 'system/demo',
  risk: 'READ',
};

test('allows a valid read request', (t) => {
  const result = evaluateControlRequest(readRequest, adapter);
  t.is(result.decision, 'ALLOW');
  t.deepEqual(result.reasons, []);
});

test('blocks actions the adapter did not allow', (t) => {
  const result = evaluateControlRequest(
    { ...readRequest, action: 'DELETE_EVERYTHING' },
    adapter,
  );
  t.is(result.decision, 'BLOCK');
  t.true(result.reasons.includes('ACTION_NOT_ALLOWED'));
});

test('requires evidence and human approval for consequential actions', (t) => {
  const result = evaluateControlRequest(
    {
      ...readRequest,
      action: 'UPDATE_RECORD',
      risk: 'CONSEQUENTIAL',
    },
    adapter,
  );
  t.is(result.decision, 'BLOCK');
  t.true(result.reasons.includes('EVIDENCE_REQUIRED'));
  t.true(result.reasons.includes('HUMAN_APPROVAL_REQUIRED'));
});

test('executes an approved action and creates proof of the result', async (t) => {
  const execution = await executeControlRequest(
    {
      ...readRequest,
      requestId: 'req-2',
      action: 'UPDATE_RECORD',
      risk: 'CONSEQUENTIAL',
      evidence: ['ticket:42', 'policy:approved'],
      approvedBy: 'human:operator-1',
    },
    adapter,
    () => new Date('2026-08-28T22:00:00.000Z'),
  );

  t.true(execution.result.ok);
  t.is(execution.receipt.executedAt, '2026-08-28T22:00:00.000Z');
  t.is(execution.receipt.resultDigest.length, 64);
  t.is(execution.receipt.evidenceDigest.length, 64);
});
