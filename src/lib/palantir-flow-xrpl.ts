export type PalantirFlowObjectType =
  | 'FLOW_REPOSITORY'
  | 'ONTOLOGY_REFERENCE'
  | 'UNIVERSAL_HIVE'
  | 'SWARM'
  | 'BUILDER'
  | 'REWARD_EVENT'
  | 'XRPL_ACCOUNT'
  | 'PAYMENT_INTENT'
  | 'LEDGER_RECEIPT'
  | 'EVIDENCE';

export type PalantirFlowRelation =
  | 'DERIVED_FROM'
  | 'MODELS_AFTER'
  | 'CONTAINS'
  | 'CREATED_BY'
  | 'GENERATES'
  | 'PAYS'
  | 'SUBMITS_TO'
  | 'VERIFIED_BY'
  | 'SUPPORTED_BY';

export interface PalantirFlowObject {
  readonly id: string;
  readonly type: PalantirFlowObjectType;
  readonly name: string;
  readonly provenance: readonly string[];
}

export interface PalantirFlowLink {
  readonly from: string;
  readonly to: string;
  readonly relation: PalantirFlowRelation;
  readonly provenance: readonly string[];
}

export interface PalantirFlowRoute {
  readonly objective: string;
  readonly pipeline: readonly string[];
  readonly humanApprovalRequired: boolean;
  readonly externalSignerRequired: boolean;
}

export const createPalantirFlowSeed = (): {
  readonly objects: readonly PalantirFlowObject[];
  readonly links: readonly PalantirFlowLink[];
} => {
  const objects: readonly PalantirFlowObject[] = [
    {
      id: 'repo:xuniadao',
      type: 'FLOW_REPOSITORY',
      name: 'sonoxo/xuniadao',
      provenance: ['repo:sonoxo/xuniadao'],
    },
    {
      id: 'repo:flow-token-list',
      type: 'FLOW_REPOSITORY',
      name: 'FlowFans/flow-token-list',
      provenance: ['repo:FlowFans/flow-token-list'],
    },
    {
      id: 'reference:palantir-ontology',
      type: 'ONTOLOGY_REFERENCE',
      name: 'Palantir Ontology public documentation',
      provenance: ['https://www.palantir.com/docs/foundry/ontology/overview'],
    },
    {
      id: 'hive:universal',
      type: 'UNIVERSAL_HIVE',
      name: 'XUNIA Universal Hive',
      provenance: ['contract:ecosystem/universal-hive-xrpl.json'],
    },
    {
      id: 'network:xrpl',
      type: 'XRPL_ACCOUNT',
      name: 'XRP Ledger settlement boundary',
      provenance: ['https://xrpl.org'],
    },
  ];

  const links: readonly PalantirFlowLink[] = [
    {
      from: 'repo:xuniadao',
      to: 'repo:flow-token-list',
      relation: 'DERIVED_FROM',
      provenance: ['package.json:x-upstream'],
    },
    {
      from: 'repo:xuniadao',
      to: 'reference:palantir-ontology',
      relation: 'MODELS_AFTER',
      provenance: ['docs:TECH_PEERS.md'],
    },
    {
      from: 'repo:xuniadao',
      to: 'hive:universal',
      relation: 'CONTAINS',
      provenance: ['contract:ecosystem/universal-hive-xrpl.json'],
    },
    {
      from: 'hive:universal',
      to: 'network:xrpl',
      relation: 'SUBMITS_TO',
      provenance: ['contract:ecosystem/xrpl-token-wallet.json'],
    },
  ];

  return { objects, links };
};

export const routePalantirFlowXrpl = (
  objective: string,
  provenance: readonly string[],
): PalantirFlowRoute => {
  if (!objective.trim()) throw new Error('OBJECTIVE_REQUIRED');
  if (provenance.length === 0) throw new Error('PROVENANCE_REQUIRED');

  return {
    objective,
    pipeline: [
      'FLOW_SOURCE_INGEST',
      'PROVENANCE_VERIFY',
      'PALANTIR_STYLE_OBJECT_LINK_NORMALIZE',
      'UNIVERSAL_HIVE_EVENT_GRAPH',
      'BUILDER_ATTRIBUTION',
      'XRPL_UNSIGNED_PAYMENT_INTENT',
      'HUMAN_APPROVAL',
      'EXTERNAL_WALLET_SIGNER',
      'VALIDATED_LEDGER_RECEIPT',
      'EVIDENCE_RETURN',
    ],
    humanApprovalRequired: true,
    externalSignerRequired: true,
  };
};

export const PALANTIR_FLOW_XRPL = {
  id: 'XUNIA-PALANTIR-FLOW-XRPL',
  version: '1.0.0',
  command: '/glass palantir flow',
  implementation: 'ORIGINAL_XUNIA_INTEGRATION',
  sourceBoundaries: {
    flowUpstream: 'FlowFans/flow-token-list',
    palantirReference: 'https://www.palantir.com/docs/foundry/ontology/overview',
    palantirCodeCopied: false,
    palantirAffiliationClaim: false,
    flowHistoryAndLicensePreserved: true,
  },
  graphModel: 'OBJECT_PROPERTY_LINK_ACTION_EVIDENCE_DECISION',
  settlementNetwork: 'XRP_LEDGER',
} as const;
