import { SUPER_AGENT, SuperAgentCapability } from './super-agent';

export type SAGIDecision = 'ALLOW' | 'REVIEW' | 'BLOCK';

export interface SAGIRequest {
  readonly capability: SuperAgentCapability;
  readonly mutatesRepository?: boolean;
  readonly signsFlowTransaction?: boolean;
  readonly movesFunds?: boolean;
  readonly castsGovernanceVote?: boolean;
  readonly deploysProduction?: boolean;
  readonly requiresSecretAccess?: boolean;
}

export interface SAGIResult {
  readonly decision: SAGIDecision;
  readonly command: '/VA3LM-SAGI';
  readonly reason: string;
  readonly humanApprovalRequired: boolean;
}

export const SAGI = {
  name: 'VA3LM-SAGI',
  expandedName: 'SUPER ARTIFICIAL GUARDRAIL INTELLIGENCE',
  command: '/VA3LM-SAGI',
  parent: 'VA3LM',
  codename: 'GLASS ONION',
  state: 'ACTIVE',
  mission:
    'Accelerate agentic engineering while keeping repository, deployment, governance, signing, fund movement and secret boundaries explicitly controlled.',
  fastPath: [
    'REPO_ANALYSIS',
    'CODE_GENERATION',
    'TEST_GENERATION',
    'CADENCE_FLOW',
    'ONTOLOGY_BUILD',
    'WORKFLOW_PLANNING',
    'PALANTIR_ACTION_MODEL',
    'IBM_QUANTUM_BLUEPRINT',
    'VA3LM_8088',
    'CI_VALIDATION',
  ] as readonly SuperAgentCapability[],
  reviewBoundaries: [
    'REPOSITORY_MUTATION',
    'FLOW_TRANSACTION_SIGNING',
    'GOVERNANCE_VOTING',
    'PRODUCTION_DEPLOYMENT',
    'SECRET_ACCESS',
  ] as const,
  blockedBoundaries: ['AUTOMATIC_FUND_MOVEMENT', 'ARBITRARY_REMOTE_SHELL'] as const,
} as const;

export const evaluateSAGI = (request: SAGIRequest): SAGIResult => {
  if (!SUPER_AGENT.capabilities.includes(request.capability)) {
    return {
      decision: 'BLOCK',
      command: '/VA3LM-SAGI',
      reason: `Capability ${request.capability} is not registered in the Glass Onion Super Agent.`,
      humanApprovalRequired: false,
    };
  }

  if (request.movesFunds) {
    return {
      decision: 'BLOCK',
      command: '/VA3LM-SAGI',
      reason: 'Automatic fund movement is disabled.',
      humanApprovalRequired: true,
    };
  }

  if (
    request.mutatesRepository ||
    request.signsFlowTransaction ||
    request.castsGovernanceVote ||
    request.deploysProduction ||
    request.requiresSecretAccess
  ) {
    return {
      decision: 'REVIEW',
      command: '/VA3LM-SAGI',
      reason: 'Consequential action requires explicit command approval.',
      humanApprovalRequired: true,
    };
  }

  return {
    decision: 'ALLOW',
    command: '/VA3LM-SAGI',
    reason: 'Capability is registered and remains inside the non-mutating fast path.',
    humanApprovalRequired: false,
  };
};
