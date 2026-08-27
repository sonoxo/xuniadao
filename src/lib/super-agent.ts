export type SuperAgentCapability =
  | 'REPO_ANALYSIS'
  | 'CODE_GENERATION'
  | 'TEST_GENERATION'
  | 'CADENCE_FLOW'
  | 'ONTOLOGY_BUILD'
  | 'WORKFLOW_PLANNING'
  | 'PALANTIR_ACTION_MODEL'
  | 'IBM_QUANTUM_BLUEPRINT'
  | 'VA3LM_8088'
  | 'CI_VALIDATION';

export interface SuperAgentStage {
  readonly id: string;
  readonly engine: string;
  readonly output: string;
  readonly mutation: boolean;
}

export const SUPER_AGENT = {
  codename: 'GLASS ONION SUPER AGENT',
  state: 'UNLOCKED',
  commandLayer: 'XUNIA',
  brain: 'GPT-DOUG-LLM / VA3LM',
  runtime: 'http://127.0.0.1:8088',
  languages: ['TypeScript', 'Python', 'Cadence'] as const,
  capabilities: [
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
  pipeline: [
    { id: 'intent', engine: 'XUNIA', output: 'typed intent object', mutation: false },
    { id: 'cadence', engine: 'Flow / Cadence', output: 'Cadence program or transaction blueprint', mutation: false },
    { id: 'ontology', engine: 'Glass Onion Ontology', output: 'objects, links and provenance', mutation: false },
    { id: 'workflow', engine: 'ZYRA', output: 'bounded workflow plan', mutation: false },
    { id: 'code', engine: 'VA3LM :8088', output: 'code + tests + explanation', mutation: false },
    { id: 'quantum', engine: 'IBM Quantum pattern', output: 'Sampler/Estimator workload blueprint', mutation: false },
    { id: 'action', engine: 'Palantir-style action gate', output: 'reviewable action proposal', mutation: false },
    { id: 'commit', engine: 'Human command gate', output: 'approved repository mutation', mutation: true },
  ] as readonly SuperAgentStage[],
  controls: {
    humanApprovalForMutation: true,
    automaticFundMovement: false,
    automaticGovernanceVoting: false,
    arbitraryRemoteShell: false,
    automaticProductionDeploy: false,
    provenanceRequired: true,
  },
} as const;

export const hasSuperAgentCapability = (capability: SuperAgentCapability): boolean =>
  SUPER_AGENT.capabilities.includes(capability);
