export type CRMEntityType =
  | 'ACCOUNT'
  | 'CONTACT'
  | 'LEAD'
  | 'OPPORTUNITY'
  | 'ACTIVITY'
  | 'TASK'
  | 'DEAL'
  | 'CUSTOMER';

export type CRMStage =
  | 'NEW'
  | 'QUALIFIED'
  | 'DISCOVERY'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export interface CRMRecord {
  readonly id: string;
  readonly type: CRMEntityType;
  readonly name: string;
  readonly accountId?: string;
  readonly contactId?: string;
  readonly stage?: CRMStage;
  readonly value?: number;
  readonly owner?: string;
  readonly dueAt?: string;
  readonly tags?: readonly string[];
  readonly provenance: readonly string[];
  readonly properties?: Readonly<Record<string, string | number | boolean>>;
}

export interface CRMActionRequest {
  readonly action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'ADVANCE_STAGE' | 'SEND_MESSAGE' | 'BULK_OUTREACH';
  readonly recordIds: readonly string[];
  readonly mutatesData?: boolean;
  readonly destructive?: boolean;
  readonly externalCommunication?: boolean;
  readonly bulk?: boolean;
}

export interface CRMActionDecision {
  readonly decision: 'ALLOW' | 'REVIEW' | 'BLOCK';
  readonly humanApprovalRequired: boolean;
  readonly reasons: readonly string[];
}

export const validateCRMRecord = (record: CRMRecord): CRMRecord => {
  if (!record.id.trim()) throw new Error('CRM_ID_REQUIRED');
  if (!record.name.trim()) throw new Error('CRM_NAME_REQUIRED');
  if (record.provenance.length === 0) throw new Error('CRM_PROVENANCE_REQUIRED');
  if (record.value !== undefined && record.value < 0) throw new Error('CRM_VALUE_INVALID');
  return record;
};

export const evaluateCRMAction = (request: CRMActionRequest): CRMActionDecision => {
  if (request.recordIds.length === 0) {
    return { decision: 'BLOCK', humanApprovalRequired: true, reasons: ['CRM_RECORD_REQUIRED'] };
  }

  const reasons: string[] = [];
  if (request.destructive || request.action === 'DELETE') reasons.push('CRM_DESTRUCTIVE_ACTION_REQUIRES_REVIEW');
  if (request.externalCommunication || request.action === 'SEND_MESSAGE') reasons.push('CRM_EXTERNAL_COMMUNICATION_REQUIRES_REVIEW');
  if (request.bulk || request.action === 'BULK_OUTREACH') reasons.push('CRM_BULK_OUTREACH_REQUIRES_REVIEW');
  if (request.mutatesData && reasons.length === 0) reasons.push('CRM_MUTATION_REQUIRES_REVIEW');

  return {
    decision: reasons.length > 0 ? 'REVIEW' : 'ALLOW',
    humanApprovalRequired: reasons.length > 0,
    reasons,
  };
};

export const buildCRMPipeline = (records: readonly CRMRecord[]) => {
  const valid = records.map(validateCRMRecord);
  const opportunities = valid.filter((record) => record.type === 'OPPORTUNITY' || record.type === 'DEAL');
  const openPipeline = opportunities.filter((record) => record.stage !== 'WON' && record.stage !== 'LOST');
  const wonValue = opportunities
    .filter((record) => record.stage === 'WON')
    .reduce((sum, record) => sum + (record.value ?? 0), 0);
  const openValue = openPipeline.reduce((sum, record) => sum + (record.value ?? 0), 0);

  return {
    records: valid,
    openPipeline,
    metrics: {
      totalRecords: valid.length,
      openOpportunities: openPipeline.length,
      openValue,
      wonValue,
    },
  } as const;
};

export const CRM = {
  id: 'GLASS-CRM',
  version: '1.0.0',
  command: '/glass crm',
  umbrella: 'XUNIA',
  layer: 'GLASS ONION',
  entityTypes: ['ACCOUNT', 'CONTACT', 'LEAD', 'OPPORTUNITY', 'ACTIVITY', 'TASK', 'DEAL', 'CUSTOMER'] as readonly CRMEntityType[],
  stages: ['NEW', 'QUALIFIED', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] as readonly CRMStage[],
  pipeline: ['CRM_INGEST', 'AIT_NORMALIZE', 'CRM_RELATIONSHIP_GRAPH', 'VA3LM_ANALYZE', 'ZYRA_WORKFLOW', 'UAP_AGENT_TASKS'],
  controls: {
    provenanceRequired: true,
    humanReviewForMutation: true,
    humanReviewForExternalCommunication: true,
    humanReviewForBulkOutreach: true,
  },
} as const;
