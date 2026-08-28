import test from 'ava';

import { GuardedActionRunner } from './guarded-action-runner';
import { ControlPlaneAdapter, ControlRequest } from './control-plane-runtime';

const adapter: ControlPlaneAdapter<{ ok: boolean }> = {
  name: 'demo-adapter',
  allowedActions: ['READ_STATUS', 'UPDATE_RECORD'],
  execute: async () => ({ ok: true }),
};

const request = (
  requestId: string,
  risk: ControlRequest['risk'] = 'READ',
): ControlRequest => ({
  requestId,
  actorId: 'agent-1',
  adapterName: 'demo-adapter',
  action: risk === 'READ' ? 'READ_STATUS' : 'UPDATE_RECORD',
  resource: 'system/demo',
  risk,
  evidence: risk === 'READ' ? undefined : ['ticket:42'],
  approvedBy: risk === 'CONSEQUENTIAL' ? 'human:operator-1' : undefined,
});

test('automatically records every successful action', async (t) => {
  const runner = new GuardedActionRunner();

  await runner.execute(request('req-1'), adapter);
  await runner.execute(request('req-2'), adapter);

  t.is(runner.history().length, 2);
  t.true(runner.verifyHistory());
});

test('read-only mode allows reads and blocks writes', async (t) => {
  const runner = new GuardedActionRunner();
  runner.setMode('READ_ONLY');

  await runner.execute(request('req-3'), adapter);

  const error = await t.throwsAsync(() =>
    runner.execute(request('req-4', 'WRITE'), adapter),
  );

  t.is(error && error.message, 'WRITE_ACTIONS_STOPPED');
  t.is(runner.history().length, 1);
});

test('stopped mode blocks every action', async (t) => {
  const runner = new GuardedActionRunner();
  runner.setMode('STOPPED');

  const error = await t.throwsAsync(() => runner.execute(request('req-5'), adapter));
  t.is(error && error.message, 'ALL_ACTIONS_STOPPED');
  t.is(runner.history().length, 0);
});
