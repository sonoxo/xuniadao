import test from 'ava';

import { ActionProofLog } from './action-proof';
import { ControlReceipt } from './control-plane-runtime';

const receipt = (requestId: string): ControlReceipt => ({
  requestId,
  actorId: 'agent-1',
  adapterName: 'demo-adapter',
  action: 'READ_STATUS',
  resource: 'system/demo',
  executedAt: '2026-08-28T22:00:00.000Z',
  resultDigest: 'a'.repeat(64),
  evidenceDigest: 'b'.repeat(64),
});

test('builds a verifiable action history', (t) => {
  const log = new ActionProofLog();
  log.append(receipt('req-1'));
  log.append(receipt('req-2'));

  t.true(log.verify());
  t.is(log.list().length, 2);
  t.is(log.list()[1].previousHash, log.list()[0].entryHash);
});

test('detects changed history', (t) => {
  const log = new ActionProofLog();
  log.append(receipt('req-1'));
  log.append(receipt('req-2'));

  const changed = log.list();
  changed[0].receipt.actorId = 'someone-else';

  t.false(ActionProofLog.verifyEntries(changed));
});
