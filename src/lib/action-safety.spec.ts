import test from 'ava';

import { ActionSafetyGate } from './action-safety';
import { ControlPlaneAdapter, ControlRequest } from './control-plane-runtime';

const request = (requestId: string): ControlRequest => ({
  requestId,
  actorId: 'agent-1',
  adapterName: 'demo-adapter',
  action: 'READ_STATUS',
  resource: 'system/demo',
  risk: 'READ',
});

const adapter: ControlPlaneAdapter<{ ok: boolean }> = {
  name: 'demo-adapter',
  allowedActions: ['READ_STATUS'],
  execute: async () => ({ ok: true }),
};

test('blocks a request from running twice after completion', async (t) => {
  const gate = new ActionSafetyGate();
  await gate.execute(request('req-1'), adapter);

  const error = await t.throwsAsync(() => gate.execute(request('req-1'), adapter));
  t.is(error && error.message, 'DUPLICATE_REQUEST_ALREADY_COMPLETED');
});

test('stops an action that runs too long', async (t) => {
  const gate = new ActionSafetyGate({ timeoutMs: 5 });
  const slowAdapter: ControlPlaneAdapter<{ ok: boolean }> = {
    name: 'demo-adapter',
    allowedActions: ['READ_STATUS'],
    execute: async () =>
      new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 50)),
  };

  const error = await t.throwsAsync(() => gate.execute(request('req-2'), slowAdapter));
  t.is(error && error.message, 'ACTION_TIMEOUT');
  t.is(gate.activeCount(), 0);
});

test('limits how many actions can run at once', async (t) => {
  const gate = new ActionSafetyGate({ maxConcurrent: 1, timeoutMs: 100 });
  let release: (() => void) | undefined;
  const heldAdapter: ControlPlaneAdapter<{ ok: boolean }> = {
    name: 'demo-adapter',
    allowedActions: ['READ_STATUS'],
    execute: async () => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return { ok: true };
    },
  };

  const first = gate.execute(request('req-3'), heldAdapter);
  const error = await t.throwsAsync(() => gate.execute(request('req-4'), heldAdapter));
  t.is(error && error.message, 'ACTION_CAPACITY_REACHED');

  if (release) release();
  await first;
});
