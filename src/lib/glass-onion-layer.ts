import { getXuniaLayer, XuniaLayerId } from './ecosystem';

export type GlassOnionCapability =
  | 'INTELLIGENCE_QUERY'
  | 'CODE_PLAN'
  | 'ONTOLOGY_WORKFLOW'
  | 'MEDIA_WORKFLOW'
  | 'QUANTUM_BLUEPRINT'
  | 'CADENCE_FLOW'
  | 'CI_VALIDATION';

export type GlassOnionDecision = 'ALLOW' | 'REVIEW' | 'BLOCK';

export interface GlassOnionRequest {
  readonly objective: string;
  readonly capability: GlassOnionCapability;
  readonly targets: readonly XuniaLayerId[];
  readonly provenance?: readonly string[];
  readonly mutatesRepository?: boolean;
  readonly signsTransaction?: boolean;
  readonly deploysProduction?: boolean;
  readonly movesFunds?: boolean;
  readonly castsGovernanceVote?: boolean;
  readonly arbitraryRemoteShell?: boolean;
}

export interface GlassOnionRoute {
  readonly codename: 'GLASS ONION';
  readonly decision: GlassOnionDecision;
  readonly humanApprovalRequired: boolean;
  readonly targets: readonly XuniaLayerId[];
  readonly pipeline: readonly string[];
  readonly reasons: readonly string[];
}

const PIPELINES: Readonly<Record<GlassOnionCapability, readonly string[]>> = {
  INTELLIGENCE_QUERY: [
    'XUNIA_INGEST',
    'PROVENANCE_CHECK',
    'SONOXO_ONTOLOGY',
    'VA3LM_REASON',
    'ZYRA_VERIFY',
  ],
  CODE_PLAN: [
    'XUNIA_SCOPE',
    'VA3LM_PLAN',
    'SONOXO_CODE_INTELLIGENCE',
    'ZYRA_VALIDATE',
  ],
  ONTOLOGY_WORKFLOW: [
    'XUNIA_OBJECTS',
    'SONOXO_ONTOLOGY',
    'VA3LM_FUNCTION_PLAN',
    'ZYRA_ACTION_GATE',
  ],
  MEDIA_WORKFLOW: [
    'ALMIGHTY_SONOXO_MEDIA',
    'XUNIA_PROVENANCE',
    'SONOXO_INDEX',
    'ZYRA_WORKFLOW',
  ],
  QUANTUM_BLUEPRINT: [
    'XUNIA_SCOPE',
    'VA3LM_QUANTUM_PLAN',
    'SONOXO_ONTOLOGY',
    'ZYRA_VERIFY',
  ],
  CADENCE_FLOW: [
    'XUNIA_CADENCE_INTENT',
    'VA3LM_PLAN',
    'ZYRA_TRANSACTION_GATE',
    'XUNIA_VERIFY',
  ],
  CI_VALIDATION: [
    'XUNIA_SCOPE',
    'ZYRA_CI',
    'SONOXO_EVIDENCE',
    'XUNIA_VERIFY',
  ],
};

const uniqueTargets = (targets: readonly XuniaLayerId[]): XuniaLayerId[] =>
  targets.filter((target, index) => targets.indexOf(target) === index);

export const routeGlassOnion = (request: GlassOnionRequest): GlassOnionRoute => {
  const reasons: string[] = [];
  const targets = uniqueTargets(request.targets);

  if (!request.objective.trim()) {
    return {
      codename: 'GLASS ONION',
      decision: 'BLOCK',
      humanApprovalRequired: true,
      targets,
      pipeline: PIPELINES[request.capability],
      reasons: ['OBJECTIVE_REQUIRED'],
    };
  }

  const invalidTarget = targets.find((target) => !getXuniaLayer(target));
  if (invalidTarget || targets.length === 0) {
    return {
      codename: 'GLASS ONION',
      decision: 'BLOCK',
      humanApprovalRequired: true,
      targets,
      pipeline: PIPELINES[request.capability],
      reasons: ['VALID_TARGET_REQUIRED'],
    };
  }

  if (request.movesFunds) reasons.push('AUTOMATIC_FUND_MOVEMENT_BLOCKED');
  if (request.castsGovernanceVote)
    reasons.push('AUTOMATIC_GOVERNANCE_VOTING_BLOCKED');
  if (request.arbitraryRemoteShell)
    reasons.push('ARBITRARY_REMOTE_SHELL_BLOCKED');

  if (reasons.length > 0) {
    return {
      codename: 'GLASS ONION',
      decision: 'BLOCK',
      humanApprovalRequired: true,
      targets,
      pipeline: PIPELINES[request.capability],
      reasons,
    };
  }

  if (
    request.capability === 'INTELLIGENCE_QUERY' &&
    (!request.provenance || request.provenance.length === 0)
  ) {
    reasons.push('PROVENANCE_REQUIRED_FOR_INTELLIGENCE_PROMOTION');
  }

  if (request.mutatesRepository) reasons.push('REPOSITORY_MUTATION_REQUIRES_REVIEW');
  if (request.signsTransaction) reasons.push('TRANSACTION_SIGNING_REQUIRES_REVIEW');
  if (request.deploysProduction) reasons.push('PRODUCTION_DEPLOY_REQUIRES_REVIEW');

  const humanApprovalRequired = reasons.length > 0;
  return {
    codename: 'GLASS ONION',
    decision: humanApprovalRequired ? 'REVIEW' : 'ALLOW',
    humanApprovalRequired,
    targets,
    pipeline: PIPELINES[request.capability],
    reasons,
  };
};

export const GLASS_ONION_LAYER = {
  codename: 'GLASS ONION',
  version: '2.0.0',
  command: '/glass',
  umbrella: 'XUNIA',
  layers: ['xunia', 'zyra', 'sonoxo', 'almighty-sonoxo', 'va3lm'] as readonly XuniaLayerId[],
  capabilities: Object.keys(PIPELINES) as readonly GlassOnionCapability[],
  invariants: {
    provenanceRequired: true,
    humanApprovalForMutation: true,
    automaticFundMovement: false,
    automaticGovernanceVoting: false,
    arbitraryRemoteShell: false,
  },
} as const;
