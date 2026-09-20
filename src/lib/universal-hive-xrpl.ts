import { createHash } from 'crypto';

export type HiveMonetaryNetwork = 'MAINNET' | 'TESTNET' | 'DEVNET';
export type HiveMonetaryDecision = 'ALLOW' | 'REVIEW' | 'BLOCK';
export type HiveMonetaryAction =
  | 'REGISTER_REWARD_EVENT'
  | 'BUILD_UNSIGNED_PAYMENT'
  | 'AUTHORIZE_SETTLEMENT'
  | 'SIGN_WITH_EXTERNAL_WALLET'
  | 'SUBMIT_TO_XRPL'
  | 'VERIFY_VALIDATED_LEDGER';

export type HiveAsset =
  | { readonly kind: 'XRP'; readonly code: 'XRP' }
  | { readonly kind: 'ISSUED'; readonly code: string; readonly issuer: string };

export interface HiveBuilderAllocation {
  readonly builderId: string;
  readonly destination: string;
  readonly amount: string;
}

export interface UniversalHiveRewardInput {
  readonly rewardEventId: string;
  readonly hiveId: string;
  readonly swarmId: string;
  readonly treasuryAccount: string;
  readonly asset: HiveAsset;
  readonly allocations: readonly HiveBuilderAllocation[];
  readonly provenance: readonly string[];
  readonly projectBasis?: string;
}

export interface UniversalHiveRewardEvent extends UniversalHiveRewardInput {
  readonly event: 'BUILDER_REWARD_EVENT';
  readonly status: 'PROPOSED';
  readonly commitment: string;
  readonly externalLegalStatus: 'SOURCE_STATUS_TRACKED_SEPARATELY';
}

export interface HiveMonetaryRequest {
  readonly action: HiveMonetaryAction;
  readonly network: HiveMonetaryNetwork;
  readonly provenance: readonly string[];
  readonly humanApproved?: boolean;
  readonly externalSigner?: boolean;
  readonly containsSecret?: boolean;
  readonly automaticSubmission?: boolean;
}

export interface UnsignedXrplPayment {
  readonly TransactionType: 'Payment';
  readonly Account: string;
  readonly Destination: string;
  readonly Amount: string | {
    readonly currency: string;
    readonly issuer: string;
    readonly value: string;
  };
  readonly Memos: readonly [{
    readonly Memo: {
      readonly MemoType: string;
      readonly MemoData: string;
    };
  }];
}

const CLASSIC_ADDRESS = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
const XRP_DROPS = /^[0-9]+$/;
const ISSUED_VALUE = /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/;
const CURRENCY_CODE = /^(?:[A-Z0-9]{3}|[A-F0-9]{40})$/;

const assertText = (name: string, value: string): void => {
  if (!value.trim()) throw new Error(`${name}_REQUIRED`);
};

const assertAddress = (name: string, value: string): void => {
  if (!CLASSIC_ADDRESS.test(value)) throw new Error(`${name}_INVALID_XRPL_CLASSIC_ADDRESS`);
};

const toHex = (value: string): string => Buffer.from(value, 'utf8').toString('hex').toUpperCase();

const stableCommitment = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

export const evaluateHiveMonetaryAction = (
  request: HiveMonetaryRequest,
): HiveMonetaryDecision => {
  if (request.provenance.length === 0) return 'BLOCK';
  if (request.containsSecret || request.automaticSubmission) return 'BLOCK';

  if (request.action === 'REGISTER_REWARD_EVENT') return 'ALLOW';
  if (request.action === 'BUILD_UNSIGNED_PAYMENT') return 'REVIEW';
  if (request.action === 'AUTHORIZE_SETTLEMENT') {
    return request.humanApproved ? 'REVIEW' : 'BLOCK';
  }

  if (
    request.action === 'SIGN_WITH_EXTERNAL_WALLET'
    || request.action === 'SUBMIT_TO_XRPL'
  ) {
    return request.humanApproved && request.externalSigner ? 'REVIEW' : 'BLOCK';
  }

  return 'ALLOW';
};

export const createUniversalHiveRewardEvent = (
  input: UniversalHiveRewardInput,
): UniversalHiveRewardEvent => {
  assertText('REWARD_EVENT_ID', input.rewardEventId);
  assertText('HIVE_ID', input.hiveId);
  assertText('SWARM_ID', input.swarmId);
  assertAddress('TREASURY_ACCOUNT', input.treasuryAccount);

  if (input.provenance.length === 0) throw new Error('PROVENANCE_REQUIRED');
  if (input.allocations.length === 0) throw new Error('BUILDER_ALLOCATION_REQUIRED');

  if (input.asset.kind === 'ISSUED') {
    assertAddress('ISSUER', input.asset.issuer);
    if (!CURRENCY_CODE.test(input.asset.code)) throw new Error('CURRENCY_CODE_INVALID');
  }

  const builderIds = new Set<string>();
  for (const allocation of input.allocations) {
    assertText('BUILDER_ID', allocation.builderId);
    assertAddress('BUILDER_DESTINATION', allocation.destination);
    if (builderIds.has(allocation.builderId)) throw new Error('DUPLICATE_BUILDER_ALLOCATION');
    builderIds.add(allocation.builderId);

    if (input.asset.kind === 'XRP') {
      if (!XRP_DROPS.test(allocation.amount) || allocation.amount === '0') {
        throw new Error('XRP_REWARD_MUST_BE_POSITIVE_DROPS');
      }
    } else if (!ISSUED_VALUE.test(allocation.amount) || Number(allocation.amount) <= 0) {
      throw new Error('ISSUED_REWARD_MUST_BE_POSITIVE_DECIMAL');
    }
  }

  const commitment = stableCommitment({
    rewardEventId: input.rewardEventId,
    hiveId: input.hiveId,
    swarmId: input.swarmId,
    treasuryAccount: input.treasuryAccount,
    asset: input.asset,
    allocations: input.allocations,
    provenance: input.provenance,
    projectBasis: input.projectBasis || null,
  });

  return {
    ...input,
    event: 'BUILDER_REWARD_EVENT',
    status: 'PROPOSED',
    commitment,
    externalLegalStatus: 'SOURCE_STATUS_TRACKED_SEPARATELY',
  };
};

export const buildUnsignedHiveRewardPayments = (
  event: UniversalHiveRewardEvent,
): readonly UnsignedXrplPayment[] => {
  const decision = evaluateHiveMonetaryAction({
    action: 'BUILD_UNSIGNED_PAYMENT',
    network: 'TESTNET',
    provenance: event.provenance,
  });
  if (decision === 'BLOCK') throw new Error('UNSIGNED_PAYMENT_BUILD_BLOCKED');

  return event.allocations.map((allocation) => {
    const Amount = event.asset.kind === 'XRP'
      ? allocation.amount
      : {
        currency: event.asset.code,
        issuer: event.asset.issuer,
        value: allocation.amount,
      };

    const memo = {
      rewardEventId: event.rewardEventId,
      hiveId: event.hiveId,
      swarmId: event.swarmId,
      builderId: allocation.builderId,
      commitment: event.commitment,
    };

    return {
      TransactionType: 'Payment',
      Account: event.treasuryAccount,
      Destination: allocation.destination,
      Amount,
      Memos: [{
        Memo: {
          MemoType: toHex('XUNIA_UNIVERSAL_HIVE_REWARD'),
          MemoData: toHex(JSON.stringify(memo)),
        },
      }],
    } as const;
  });
};

export const UNIVERSAL_HIVE_XRPL_MONETARY = {
  id: 'XUNIA-UNIVERSAL-HIVE-XRPL-MONETARY',
  version: '1.0.0',
  command: '/glass hive xrpl',
  network: 'XRP_LEDGER',
  defaultEnvironment: 'TESTNET',
  settlementModel: 'REWARD_EVENT_TO_UNSIGNED_PAYMENT_TO_EXTERNAL_SIGNER',
  supportedAssets: ['XRP', 'XRPL_ISSUED_CURRENCY'] as const,
  pipeline: [
    'SWARM_CREATED',
    'BUILDER_REWARD_EVENT',
    'PROVENANCE_COMMITMENT',
    'BUILD_UNSIGNED_XRPL_PAYMENT',
    'HUMAN_APPROVAL',
    'EXTERNAL_WALLET_SIGNER',
    'XRPL_SUBMISSION',
    'VALIDATED_LEDGER_VERIFY',
    'AUDIT_EVIDENCE',
  ] as const,
  controls: {
    privateKeyStorage: false,
    seedStorage: false,
    automaticSigning: false,
    automaticSubmission: false,
    automaticFundMovement: false,
    humanApprovalForSettlement: true,
    externalSignerRequired: true,
    idempotentRewardEventIdsRequired: true,
  },
} as const;
