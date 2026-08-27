export type XrplNetwork = 'MAINNET' | 'TESTNET' | 'DEVNET' | 'CUSTOM';
export type XrplOntologyObjectType =
  | 'STANDARD'
  | 'CLIENT_LIBRARY'
  | 'LEDGER_NODE'
  | 'NETWORK'
  | 'ACCOUNT'
  | 'WALLET'
  | 'TOKEN'
  | 'TRUST_LINE'
  | 'TRANSACTION'
  | 'SIGNATURE'
  | 'HUMAN_APPROVAL'
  | 'AUDIT_EVIDENCE';

export type XrplPathwayAction =
  | 'DISCOVER_STANDARD'
  | 'CONNECT_NODE'
  | 'READ_LEDGER'
  | 'READ_ACCOUNT'
  | 'READ_TOKEN'
  | 'READ_TRUST_LINES'
  | 'BUILD_UNSIGNED_TRANSACTION'
  | 'VALIDATE_TRANSACTION'
  | 'REQUEST_HUMAN_APPROVAL'
  | 'SIGN_WITH_EXTERNAL_WALLET'
  | 'SUBMIT_TRANSACTION'
  | 'VERIFY_VALIDATED_LEDGER'
  | 'WRITE_AUDIT_EVIDENCE';

export type XrplPipelineDecision = 'ALLOW' | 'REVIEW' | 'BLOCK';

export interface XrplOntologyObject {
  readonly id: string;
  readonly type: XrplOntologyObjectType;
  readonly name: string;
  readonly provenance: readonly string[];
}

export interface XrplOntologyLink {
  readonly from: string;
  readonly to: string;
  readonly relation:
    | 'DEFINED_BY'
    | 'IMPLEMENTED_BY'
    | 'CONNECTS_TO'
    | 'OWNS_ADDRESS'
    | 'ISSUED_BY'
    | 'TRUSTS'
    | 'BUILDS'
    | 'APPROVES'
    | 'SIGNS'
    | 'SUBMITS_TO'
    | 'VERIFIED_BY'
    | 'RECORDED_AS';
}

export interface XrplActionRequest {
  readonly action: XrplPathwayAction;
  readonly network: XrplNetwork;
  readonly provenance: readonly string[];
  readonly humanApproved?: boolean;
  readonly externalSigner?: boolean;
  readonly containsSecret?: boolean;
  readonly storesSeed?: boolean;
  readonly writesSecretToAudit?: boolean;
}

export interface XrplPipelineStage {
  readonly order: number;
  readonly action: XrplPathwayAction;
  readonly component: 'XRPL_STANDARDS' | 'XRPL_JS' | 'RIPPLED' | 'XUNIA_POLICY' | 'EXTERNAL_WALLET' | 'AUDIT';
}

const signingActions: readonly XrplPathwayAction[] = ['SIGN_WITH_EXTERNAL_WALLET', 'SUBMIT_TRANSACTION'];

export const evaluateXrplAction = (request: XrplActionRequest): XrplPipelineDecision => {
  if (request.provenance.length === 0) return 'BLOCK';
  if (request.containsSecret || request.storesSeed || request.writesSecretToAudit) return 'BLOCK';

  if (signingActions.includes(request.action)) {
    if (!request.humanApproved || !request.externalSigner) return 'BLOCK';
    return 'REVIEW';
  }

  if (request.action === 'REQUEST_HUMAN_APPROVAL') return 'REVIEW';
  if (request.action === 'BUILD_UNSIGNED_TRANSACTION' || request.action === 'VALIDATE_TRANSACTION') return 'REVIEW';
  return 'ALLOW';
};

export const XRPL_READ_PIPELINE: readonly XrplPipelineStage[] = [
  { order: 1, action: 'DISCOVER_STANDARD', component: 'XRPL_STANDARDS' },
  { order: 2, action: 'CONNECT_NODE', component: 'XRPL_JS' },
  { order: 3, action: 'READ_LEDGER', component: 'RIPPLED' },
  { order: 4, action: 'READ_ACCOUNT', component: 'XRPL_JS' },
  { order: 5, action: 'READ_TOKEN', component: 'XRPL_JS' },
  { order: 6, action: 'READ_TRUST_LINES', component: 'XRPL_JS' },
  { order: 7, action: 'WRITE_AUDIT_EVIDENCE', component: 'AUDIT' },
] as const;

export const XRPL_TRANSACTION_PIPELINE: readonly XrplPipelineStage[] = [
  { order: 1, action: 'DISCOVER_STANDARD', component: 'XRPL_STANDARDS' },
  { order: 2, action: 'BUILD_UNSIGNED_TRANSACTION', component: 'XRPL_JS' },
  { order: 3, action: 'VALIDATE_TRANSACTION', component: 'XUNIA_POLICY' },
  { order: 4, action: 'REQUEST_HUMAN_APPROVAL', component: 'XUNIA_POLICY' },
  { order: 5, action: 'SIGN_WITH_EXTERNAL_WALLET', component: 'EXTERNAL_WALLET' },
  { order: 6, action: 'SUBMIT_TRANSACTION', component: 'RIPPLED' },
  { order: 7, action: 'VERIFY_VALIDATED_LEDGER', component: 'RIPPLED' },
  { order: 8, action: 'WRITE_AUDIT_EVIDENCE', component: 'AUDIT' },
] as const;

export const createXrplOntologySeed = (): {
  readonly objects: readonly XrplOntologyObject[];
  readonly links: readonly XrplOntologyLink[];
} => {
  const objects: readonly XrplOntologyObject[] = [
    { id: 'standard:xrpl', type: 'STANDARD', name: 'XRP Ledger Standards', provenance: ['repo:XRPLF/XRPL-Standards'] },
    { id: 'client:xrpl-js', type: 'CLIENT_LIBRARY', name: 'xrpl.js', provenance: ['repo:XRPLF/xrpl.js'] },
    { id: 'node:rippled', type: 'LEDGER_NODE', name: 'xrpld', provenance: ['repo:XRPLF/rippled'] },
    { id: 'network:xrpl', type: 'NETWORK', name: 'XRP Ledger', provenance: ['https://xrpl.org'] },
    { id: 'wallet:external', type: 'WALLET', name: 'External Wallet Signer', provenance: ['contract:ecosystem/xrpl-token-wallet.json'] },
    { id: 'approval:human', type: 'HUMAN_APPROVAL', name: 'Human Transaction Approval', provenance: ['contract:ecosystem/xrpl-token-wallet.json'] },
    { id: 'evidence:audit', type: 'AUDIT_EVIDENCE', name: 'Secret-Free XRPL Audit Evidence', provenance: ['contract:ecosystem/xrpl-token-wallet.json'] },
  ];

  const links: readonly XrplOntologyLink[] = [
    { from: 'network:xrpl', to: 'standard:xrpl', relation: 'DEFINED_BY' },
    { from: 'standard:xrpl', to: 'client:xrpl-js', relation: 'IMPLEMENTED_BY' },
    { from: 'client:xrpl-js', to: 'node:rippled', relation: 'CONNECTS_TO' },
    { from: 'approval:human', to: 'wallet:external', relation: 'APPROVES' },
    { from: 'wallet:external', to: 'node:rippled', relation: 'SUBMITS_TO' },
    { from: 'node:rippled', to: 'evidence:audit', relation: 'RECORDED_AS' },
  ];

  return { objects, links };
};

export const XRPL_TOKEN_WALLET_ONTOLOGY = {
  id: 'XUNIA-XRPL-TOKEN-WALLET-ONTOLOGY',
  version: '1.0.0',
  command: '/glass xrpl pathways',
  repositories: {
    standards: 'sonoxo/XRPL-StandardsXUNIA-',
    client: 'sonoxo/xrpl.jsXUNIA',
    node: 'sonoxo/rippledXUNIA',
  },
  authoritativeUpstreams: {
    standards: 'XRPLF/XRPL-Standards',
    client: 'XRPLF/xrpl.js',
    node: 'XRPLF/rippled',
  },
  controls: {
    readOnlyLedgerAccessAllowed: true,
    unsignedTransactionBuildAllowed: true,
    humanApprovalRequiredForSigning: true,
    externalSignerRequired: true,
    seedStorageAllowed: false,
    privateKeyStorageAllowed: false,
    secretsInAuditAllowed: false,
    automaticFundMovementAllowed: false,
    upstreamAffiliationClaim: false,
  },
} as const;
