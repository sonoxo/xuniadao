import { CRMEntityType, CRMRecord } from './crm';
import { ConsentRecord } from './crm-compliance';
import {
  applyCRMUpsert,
  exportCRMRecords,
  mapCRMPortRow,
  planCRMImport,
  CRMPortAuditEvent,
  CRMPortPlan,
  CRMPortRequest,
  CRMPortSourceRow,
  CRMPortUpsertResult,
} from './crm-port';

export interface CRMImportExecution {
  readonly plan: CRMPortPlan;
  readonly applied: boolean;
  readonly batches: readonly (readonly CRMRecord[])[];
  readonly result?: CRMPortUpsertResult;
  readonly audit: readonly CRMPortAuditEvent[];
}

export interface CRMExportExecution {
  readonly applied: true;
  readonly records: readonly Readonly<Record<string, unknown>>[];
  readonly batches: readonly (readonly Readonly<Record<string, unknown>>[])[];
  readonly audit: readonly CRMPortAuditEvent[];
}

const partition = <T>(items: readonly T[], batchSize: number): readonly (readonly T[])[] => {
  if (batchSize < 1) throw new Error('CRM_PORT_BATCH_SIZE_INVALID');
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) batches.push(items.slice(i, i + batchSize));
  return batches;
};

const acceptedRowsFromPlan = (
  request: CRMPortRequest,
  rows: readonly CRMPortSourceRow[],
  fallbackType: CRMEntityType,
  plan: CRMPortPlan,
): readonly CRMRecord[] => {
  const rejected = new Set(plan.issues.map((issue) => issue.row));
  return rows
    .map((row, index) => ({ row, rowNumber: index + 1 }))
    .filter(({ rowNumber }) => !rejected.has(rowNumber))
    .map(({ row, rowNumber }) => mapCRMPortRow(row, request.fieldMap, fallbackType, [...request.provenance, `row:${rowNumber}`]));
};

export const executeCRMImport = (
  request: CRMPortRequest,
  rows: readonly CRMPortSourceRow[],
  fallbackType: CRMEntityType,
  existing: readonly CRMRecord[],
  consent: readonly ConsentRecord[] = [],
): CRMImportExecution => {
  const plan = planCRMImport(request, rows, fallbackType, consent);
  if (plan.decision !== 'ALLOW' || request.policy.dryRun) {
    return { plan, applied: false, batches: [], audit: plan.audit };
  }

  const accepted = acceptedRowsFromPlan(request, rows, fallbackType, plan);
  const batches = partition(accepted, request.policy.batchSize);
  let current = [...existing];
  const inserted: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];
  const rollbackManifest: string[] = [];

  for (const batch of batches) {
    const result = applyCRMUpsert(current, batch, request.policy.writeStrategy);
    current = [...result.records];
    inserted.push(...result.inserted);
    updated.push(...result.updated);
    skipped.push(...result.skipped);
    rollbackManifest.push(...result.rollbackManifest);
  }

  const result: CRMPortUpsertResult = {
    records: current,
    inserted,
    updated,
    skipped,
    rollbackManifest,
  };
  const audit = [
    ...plan.audit,
    ...batches.map<CRMPortAuditEvent>((batch, index) => ({
      id: `${request.id}:batch:${index + 1}`,
      requestId: request.id,
      action: 'BATCH_WRITE_APPLIED',
      provenance: [...request.provenance, `batch-size:${batch.length}`],
    })),
  ];
  return { plan, applied: true, batches, result, audit };
};

export const executeCRMExport = (
  request: CRMPortRequest,
  records: readonly CRMRecord[],
  filter?: (record: CRMRecord) => boolean,
): CRMExportExecution => {
  const exported = exportCRMRecords(request, records, filter);
  const batches = partition(exported, request.policy.batchSize);
  const audit = batches.map<CRMPortAuditEvent>((batch, index) => ({
    id: `${request.id}:export:${index + 1}`,
    requestId: request.id,
    action: 'BATCH_EXPORT_PACKAGED',
    provenance: [...request.provenance, `batch-size:${batch.length}`],
  }));
  return { applied: true, records: exported, batches, audit };
};
