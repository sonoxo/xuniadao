import test from 'ava';

import {
  buildUnsignedHiveRewardPayments,
  createUniversalHiveRewardEvent,
  evaluateHiveMonetaryAction,
  UNIVERSAL_HIVE_XRPL_MONETARY,
} from './universal-hive-xrpl';

const treasury = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
const builder = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
const provenance = ['contract:ecosystem/universal-hive-xrpl.json'];

test('Universal Hive monetary layer is XRPL-first and externally signed', (t) => {
  t.is(UNIVERSAL_HIVE_XRPL_MONETARY.network, 'XRP_LEDGER');
  t.true(UNIVERSAL_HIVE_XRPL_MONETARY.controls.externalSignerRequired);
  t.false(UNIVERSAL_HIVE_XRPL_MONETARY.controls.privateKeyStorage);
  t.false(UNIVERSAL_HIVE_XRPL_MONETARY.controls.automaticFundMovement);
});

test('reward event creates a deterministic provenance commitment', (t) => {
  const input = {
    rewardEventId: 'reward-001',
    hiveId: 'hive-001',
    swarmId: 'swarm-001',
    treasuryAccount: treasury,
    asset: { kind: 'XRP' as const, code: 'XRP' as const },
    allocations: [{ builderId: 'builder-1', destination: builder, amount: '1000000' }],
    provenance,
  };

  const first = createUniversalHiveRewardEvent(input);
  const second = createUniversalHiveRewardEvent(input);

  t.is(first.event, 'BUILDER_REWARD_EVENT');
  t.is(first.commitment, second.commitment);
  t.is(first.status, 'PROPOSED');
});

test('XRP reward compiles to unsigned Payment transaction', (t) => {
  const event = createUniversalHiveRewardEvent({
    rewardEventId: 'reward-002',
    hiveId: 'hive-001',
    swarmId: 'swarm-002',
    treasuryAccount: treasury,
    asset: { kind: 'XRP', code: 'XRP' },
    allocations: [{ builderId: 'builder-1', destination: builder, amount: '2500000' }],
    provenance,
  });

  const [payment] = buildUnsignedHiveRewardPayments(event);
  t.is(payment.TransactionType, 'Payment');
  t.is(payment.Account, treasury);
  t.is(payment.Destination, builder);
  t.is(payment.Amount, '2500000');
  t.truthy(payment.Memos[0].Memo.MemoData);
  t.false(Object.prototype.hasOwnProperty.call(payment, 'TxnSignature'));
});

test('issued-currency reward compiles without signing material', (t) => {
  const event = createUniversalHiveRewardEvent({
    rewardEventId: 'reward-003',
    hiveId: 'hive-001',
    swarmId: 'swarm-003',
    treasuryAccount: treasury,
    asset: { kind: 'ISSUED', code: 'XUN', issuer: treasury },
    allocations: [{ builderId: 'builder-1', destination: builder, amount: '25.5' }],
    provenance,
  });

  const [payment] = buildUnsignedHiveRewardPayments(event);
  t.deepEqual(payment.Amount, { currency: 'XUN', issuer: treasury, value: '25.5' });
});

test('secrets and automatic submission are blocked', (t) => {
  t.is(evaluateHiveMonetaryAction({
    action: 'BUILD_UNSIGNED_PAYMENT',
    network: 'TESTNET',
    provenance,
    containsSecret: true,
  }), 'BLOCK');

  t.is(evaluateHiveMonetaryAction({
    action: 'SUBMIT_TO_XRPL',
    network: 'MAINNET',
    provenance,
    humanApproved: true,
    externalSigner: true,
    automaticSubmission: true,
  }), 'BLOCK');
});

test('external signing and submission require human approval', (t) => {
  t.is(evaluateHiveMonetaryAction({
    action: 'SIGN_WITH_EXTERNAL_WALLET',
    network: 'TESTNET',
    provenance,
  }), 'BLOCK');

  t.is(evaluateHiveMonetaryAction({
    action: 'SIGN_WITH_EXTERNAL_WALLET',
    network: 'TESTNET',
    provenance,
    humanApproved: true,
    externalSigner: true,
  }), 'REVIEW');
});
