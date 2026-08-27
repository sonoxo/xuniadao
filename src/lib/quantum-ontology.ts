export type QuantumPrimitive = 'SamplerV2' | 'EstimatorV2';

export interface QuantumWorkloadIntent {
  readonly id: string;
  readonly primitive: QuantumPrimitive;
  readonly objective: string;
  readonly circuitRefs: readonly string[];
  readonly observableRefs?: readonly string[];
  readonly parameters?: Readonly<Record<string, number>>;
}

export interface OntologyObject {
  readonly objectType: string;
  readonly primaryKey: string;
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface OntologyLink {
  readonly linkType: string;
  readonly from: string;
  readonly to: string;
}

export interface SpeedRunPackage {
  readonly objects: readonly OntologyObject[];
  readonly links: readonly OntologyLink[];
  readonly functionPlan: readonly string[];
  readonly actionState: 'REVIEW_REQUIRED';
}

export const buildQuantumOntologySpeedRun = (
  intent: QuantumWorkloadIntent
): SpeedRunPackage => {
  const workloadId = `quantum-workload:${intent.id}`;
  const primitiveId = `quantum-primitive:${intent.primitive}`;

  const objects: OntologyObject[] = [
    {
      objectType: 'QuantumWorkload',
      primaryKey: workloadId,
      properties: {
        objective: intent.objective,
        primitive: intent.primitive,
        circuitRefs: [...intent.circuitRefs],
        observableRefs: [...(intent.observableRefs || [])],
        parameters: { ...(intent.parameters || {}) },
        executionState: 'BLUEPRINT',
      },
    },
    {
      objectType: 'QuantumPrimitive',
      primaryKey: primitiveId,
      properties: {
        provider: 'IBM Quantum',
        primitive: intent.primitive,
        interfaceVersion: 'V2',
      },
    },
  ];

  return {
    objects,
    links: [
      {
        linkType: 'USES_PRIMITIVE',
        from: workloadId,
        to: primitiveId,
      },
    ],
    functionPlan: [
      'validateQuantumIntent',
      'preparePrimitiveInputs',
      'estimateExecutionRequirements',
      'returnReviewableQuantumPlan',
    ],
    actionState: 'REVIEW_REQUIRED',
  };
};
