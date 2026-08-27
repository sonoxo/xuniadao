export type AITObjectType =
  | 'AIT_AGENT'
  | 'AIT_SYSTEM'
  | 'AIT_CAPABILITY'
  | 'AIT_INTEL_SOURCE'
  | 'AIT_EVIDENCE'
  | 'AIT_OBSERVATION'
  | 'AIT_HYPOTHESIS'
  | 'AIT_DECISION'
  | 'AIT_WORKFLOW'
  | 'AIT_ACTION'
  | 'AIT_CONTROL';

export type AITRelationType =
  | 'OPERATES'
  | 'PRODUCES'
  | 'SUPPORTED_BY'
  | 'DERIVED_FROM'
  | 'CORROBORATES'
  | 'CONTRADICTS'
  | 'ROUTES_TO'
  | 'REQUIRES'
  | 'GOVERNS'
  | 'EXECUTES'
  | 'APPLIES_TO';

export type AITDecision = 'ALLOW' | 'REVIEW' | 'BLOCK';

export interface AITSourceBinding {
  readonly status: 'BOUND';
  readonly sourceId: string;
  readonly bindingType: 'CONTROLLED_REPOSITORY_CONTRACT';
  readonly repository: string;
  readonly ref: string;
  readonly baselineCommit: string;
  readonly contractPath: string;
  readonly implementationPath: string;
  readonly verificationWorkflow: string;
  readonly provenance: readonly string[];
}

export interface AITObject {
  readonly id: string;
  readonly type: AITObjectType;
  readonly name: string;
  readonly properties: Readonly<Record<string, string | number | boolean | readonly string[]>>;
  readonly provenance: readonly string[];
}

export interface AITRelation {
  readonly from: string;
  readonly to: string;
  readonly type: AITRelationType;
  readonly provenance: readonly string[];
}

export interface AITActionRequest {
  readonly action: string;
  readonly objectIds: readonly string[];
  readonly provenance?: readonly string[];
  readonly promotesIntelligence?: boolean;
  readonly highImpact?: boolean;
  readonly mutatesRepository?: boolean;
  readonly signsTransaction?: boolean;
  readonly deploysProduction?: boolean;
  readonly movesFunds?: boolean;
  readonly castsGovernanceVote?: boolean;
  readonly arbitraryRemoteShell?: boolean;
}

export interface AITActionDecision {
  readonly decision: AITDecision;
  readonly humanApprovalRequired: boolean;
  readonly reasons: readonly string[];
}

const requiredText = (value: string, label: string): void => {
  if (!value.trim()) throw new Error(`${label}_REQUIRED`);
};

export const AIT_SOURCE_BINDING: AITSourceBinding = {
  status: 'BOUND',
  sourceId: 'xunia:glass-onion:ait',
  bindingType: 'CONTROLLED_REPOSITORY_CONTRACT',
  repository: 'sonoxo/xuniadao',
  ref: 'main',
  baselineCommit: '041dcc38b4a2f751b0b9e2c8d2488931ddeb6f5e',
  contractPath: 'ecosystem/ait-ontology.json',
  implementationPath: 'src/lib/ait-ontology.ts',
  verificationWorkflow: '.github/workflows/ait-ontology.yml',
  provenance: [
    'repo:sonoxo/xuniadao',
    'commit:041dcc38b4a2f751b0b9e2c8d2488931ddeb6f5e',
    'contract:ecosystem/ait-ontology.json',
  ],
};

export const validateAITSourceBinding = (
  binding: AITSourceBinding,
): AITSourceBinding => {
  requiredText(binding.sourceId, 'AIT_SOURCE_ID');
  requiredText(binding.repository, 'AIT_SOURCE_REPOSITORY');
  requiredText(binding.ref, 'AIT_SOURCE_REF');
  requiredText(binding.baselineCommit, 'AIT_SOURCE_BASELINE_COMMIT');
  requiredText(binding.contractPath, 'AIT_SOURCE_CONTRACT_PATH');
  requiredText(binding.implementationPath, 'AIT_SOURCE_IMPLEMENTATION_PATH');
  requiredText(binding.verificationWorkflow, 'AIT_SOURCE_VERIFICATION_WORKFLOW');
  if (!/^[0-9a-f]{40}$/.test(binding.baselineCommit)) {
    throw new Error('AIT_SOURCE_BASELINE_COMMIT_INVALID');
  }
  if (binding.provenance.length === 0) {
    throw new Error('AIT_SOURCE_PROVENANCE_REQUIRED');
  }
  return binding;
};

export const validateAITObject = (object: AITObject): AITObject => {
  requiredText(object.id, 'AIT_ID');
  requiredText(object.name, 'AIT_NAME');

  if (
    (object.type === 'AIT_INTEL_SOURCE' || object.type === 'AIT_EVIDENCE') &&
    object.provenance.length === 0
  ) {
    throw new Error('AIT_PROVENANCE_REQUIRED');
  }

  return object;
};

export const linkAITObjects = (
  relation: AITRelation,
  objects: readonly AITObject[],
): AITRelation => {
  const ids = new Set(objects.map((object) => object.id));
  if (!ids.has(relation.from) || !ids.has(relation.to)) {
    throw new Error('AIT_RELATION_ENDPOINT_REQUIRED');
  }
  if (relation.provenance.length === 0) {
    throw new Error('AIT_RELATION_PROVENANCE_REQUIRED');
  }
  return relation;
};

export const evaluateAITAction = (request: AITActionRequest): AITActionDecision => {
  const reasons: string[] = [];

  if (!request.action.trim()) {
    return {
      decision: 'BLOCK',
      humanApprovalRequired: true,
      reasons: ['AIT_ACTION_REQUIRED'],
    };
  }

  if (request.objectIds.length === 0) {
    return {
      decision: 'BLOCK',
      humanApprovalRequired: true,
      reasons: ['AIT_OBJECT_REQUIRED'],
    };
  }

  if (request.movesFunds) reasons.push('AUTOMATIC_FUND_MOVEMENT_BLOCKED');
  if (request.castsGovernanceVote) reasons.push('AUTOMATIC_GOVERNANCE_VOTING_BLOCKED');
  if (request.arbitraryRemoteShell) reasons.push('ARBITRARY_REMOTE_SHELL_BLOCKED');

  if (reasons.length > 0) {
    return { decision: 'BLOCK', humanApprovalRequired: true, reasons };
  }

  if (
    request.promotesIntelligence &&
    (!request.provenance || request.provenance.length === 0)
  ) {
    reasons.push('AIT_PROVENANCE_REQUIRED_FOR_PROMOTION');
  }
  if (request.promotesIntelligence) reasons.push('AIT_PROMOTION_REQUIRES_REVIEW');
  if (request.highImpact) reasons.push('AIT_HIGH_IMPACT_REQUIRES_REVIEW');
  if (request.mutatesRepository) reasons.push('REPOSITORY_MUTATION_REQUIRES_REVIEW');
  if (request.signsTransaction) reasons.push('TRANSACTION_SIGNING_REQUIRES_REVIEW');
  if (request.deploysProduction) reasons.push('PRODUCTION_DEPLOY_REQUIRES_REVIEW');

  return {
    decision: reasons.length > 0 ? 'REVIEW' : 'ALLOW',
    humanApprovalRequired: reasons.length > 0,
    reasons,
  };
};

export const createAITSeed = (): {
  readonly objects: readonly AITObject[];
  readonly relations: readonly AITRelation[];
} => {
  const binding = validateAITSourceBinding(AIT_SOURCE_BINDING);
  const sourceProvenance = [...binding.provenance];
  const rawObjects: AITObject[] = [
    {
      id: 'ait:system:glass-onion',
      type: 'AIT_SYSTEM',
      name: 'GLASS ONION',
      properties: { command: '/glass ait', umbrella: 'XUNIA', version: '1.1.0' },
      provenance: sourceProvenance,
    },
    {
      id: 'ait:source:xunia-binding',
      type: 'AIT_INTEL_SOURCE',
      name: 'XUNIA AIT Source Binding',
      properties: {
        sourceId: binding.sourceId,
        repository: binding.repository,
        ref: binding.ref,
        baselineCommit: binding.baselineCommit,
        status: binding.status,
      },
      provenance: sourceProvenance,
    },
    {
      id: 'ait:agent:va3lm',
      type: 'AIT_AGENT',
      name: 'VA3LM-SAGI',
      properties: { role: 'guardrailed intelligence and engineering planner' },
      provenance: sourceProvenance,
    },
    {
      id: 'ait:workflow:intelligence-cycle',
      type: 'AIT_WORKFLOW',
      name: 'AIT Intelligence Cycle',
      properties: {
        stages: [
          'INGEST',
          'PROVENANCE_CHECK',
          'NORMALIZE',
          'CORRELATE',
          'ANALYZE',
          'COMMAND_REVIEW',
          'ACTION_GATE',
        ],
      },
      provenance: sourceProvenance,
    },
    {
      id: 'ait:control:human-review',
      type: 'AIT_CONTROL',
      name: 'Human Command Review',
      properties: { requiredForHighImpact: true, automaticFundMovement: false },
      provenance: sourceProvenance,
    },
  ];
  const objects = rawObjects.map(validateAITObject);

  const rawRelations: AITRelation[] = [
    {
      from: 'ait:source:xunia-binding',
      to: 'ait:system:glass-onion',
      type: 'SUPPORTED_BY',
      provenance: sourceProvenance,
    },
    {
      from: 'ait:agent:va3lm',
      to: 'ait:workflow:intelligence-cycle',
      type: 'OPERATES',
      provenance: sourceProvenance,
    },
    {
      from: 'ait:control:human-review',
      to: 'ait:workflow:intelligence-cycle',
      type: 'GOVERNS',
      provenance: sourceProvenance,
    },
    {
      from: 'ait:workflow:intelligence-cycle',
      to: 'ait:system:glass-onion',
      type: 'ROUTES_TO',
      provenance: sourceProvenance,
    },
  ];
  const relations = rawRelations.map((relation) => linkAITObjects(relation, objects));

  return { objects, relations };
};

export const AIT_ONTOLOGY = {
  id: 'AIT-ONTOLOGY',
  version: '1.1.0',
  command: '/glass ait',
  sourceBinding: AIT_SOURCE_BINDING,
  objectTypes: [
    'AIT_AGENT',
    'AIT_SYSTEM',
    'AIT_CAPABILITY',
    'AIT_INTEL_SOURCE',
    'AIT_EVIDENCE',
    'AIT_OBSERVATION',
    'AIT_HYPOTHESIS',
    'AIT_DECISION',
    'AIT_WORKFLOW',
    'AIT_ACTION',
    'AIT_CONTROL',
  ] as readonly AITObjectType[],
  relationTypes: [
    'OPERATES',
    'PRODUCES',
    'SUPPORTED_BY',
    'DERIVED_FROM',
    'CORROBORATES',
    'CONTRADICTS',
    'ROUTES_TO',
    'REQUIRES',
    'GOVERNS',
    'EXECUTES',
    'APPLIES_TO',
  ] as readonly AITRelationType[],
  invariants: {
    provenanceRequired: true,
    sourceBindingRequired: true,
    humanReviewForPromotion: true,
    humanReviewForHighImpact: true,
    automaticFundMovement: false,
    automaticGovernanceVoting: false,
    arbitraryRemoteShell: false,
  },
} as const;
