import test from 'node:test';
import assert from 'node:assert/strict';
import { runUniversalHive, verifyUniversalHiveRun, hiveStatus, LOGICAL_HIVE_CAPACITY, LOGICAL_SWARM_CAPACITY } from '../swarm.mjs';

test('9999999 logical namespace is active with bounded workers', () => {
  const s = hiveStatus();
  assert.equal(LOGICAL_HIVE_CAPACITY, 9999999);
  assert.equal(LOGICAL_SWARM_CAPACITY, 9999999);
  assert.equal(s.logicalHiveCapacity, 9999999);
  assert.equal(s.logicalSwarmCapacity, 9999999);
  assert.ok(s.maxSimultaneousWorkers <= 32);
});

test('summon produces provenance, chaos critique, consensus, merkle proof and reward event', () => {
  const run = runUniversalHive({ prompt:'test mission', builders:['builder-a','builder-b'], requestedWorkers:14, requestId:'test-1' });
  assert.equal(run.consensus.accepted, true);
  assert.equal(run.builderRewardEvent.event, 'BUILDER_REWARD_EVENT');
  assert.equal(run.builderRewardEvent.automaticExternalFundsTransfer, false);
  assert.equal(run.settlement.externalSignerRequired, true);
  assert.ok(run.workers.length > 0);
  assert.ok(run.chaos.challenges.length > 0);
  assert.equal(verifyUniversalHiveRun(run).valid, true);
});

test('logical slot allocation stays in namespace', () => {
  for (let i=0;i<100;i++) {
    const run = runUniversalHive({ prompt:'mission '+i, requestId:'r-'+i });
    assert.ok(run.hive.hiveSlot >= 1 && run.hive.hiveSlot <= 9999999);
    assert.ok(run.swarm.swarmSlot >= 1 && run.swarm.swarmSlot <= 9999999);
  }
});
