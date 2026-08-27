import { CRMEntityType, CRMRecord, validateCRMRecord } from './crm';
import { ConsentRecord, hasCRMPermission, CRMRole } from './crm-compliance';

export type CRMPortFormat = 'CSV' | 'JSON' | 'NDJSON' | 'ZIP_BUNDLE';
export type CRMPortMode = 'IMPORT' | 'EXPORT';
export type CRMWriteStrategy = 'INSERT_ONLY' | 'UPSERT';
export type CRMPortDecision = 'ALLOW' | 'REVIEW' | 'BLOCK';

export interface CRMFieldMap {
  readonly source: string;
  readonly target: string;
}

export interface CRMPortSourceRow {
  readonly [key: string]: string | number | boolean | null | undefined;
}

export interface CRMPortPolicy {
  readonly batchSize: number;
  readonly dryRun: boolean;
  readonly writeStrategy: CRMWriteStrategy;
  readonly dedupeKeys: readonly string[];
  readonly requireConsentForMarketing: boolean;
  readonly redactFieldsOnExport: readonly string[];
  readonly maxRecords: number;
}

export interface CRMPortRequest {
  readonly id: string;
  readonly mode: CRMPortMode;
  readonly format: CRMPortFormat;
  readonly actorRole: CRMRole;
  readonly provenance: readonly string[];
  readonly fieldMap: readonly CRMFieldMap[];
  readonly policy: CRMPortPolicy;
  readonly humanApproved: boolean;
}

export interface CRMPortIssue {
  readonly row: number;
  readonly code: string;
  readonly detail: string;
}

export interface CRMPortPlan {
  readonly requestId: string;
  readonly decision: CRMPortDecision;
  readonly humanApprovalRequired: boolean;
  readonly totalRows: number;
  readonly acceptedRows: number;
  readonly duplicateRows: number;
  readonly rejectedRows: number;
  readonly batches: number;
  readonly issues: readonly CRMPortIssue[];
  readonly rollbackManifest: readonly string[];
  readonly audit: readonly CRMPortAuditEvent[];
}

export interface CRMPortAuditEvent {
  readonly id: string;
  readonly requestId: string;
  readonly action: string;
  readonly row?: number;
  readonly recordId?: string;
  readonly provenance: readonly string[];
}

export interface CRMPortBundleManifest {
  readonly version: '1';
  readonly format: 'ZIP_BUNDLE';
  readonly entries: readonly {
    readonly name: string;
    readonly format: 'CSV' | 'JSON' | 'NDJSON';
    readonly sha256?: string;
    readonly recordType?: CRMEntityType;
  }[];
  readonly provenance: readonly string[];
}

export interface CRMPortUpsertResult {
  readonly records: readonly CRMRecord[];
  readonly inserted: readonly string[];
  readonly updated: readonly string[];
  readonly skipped: readonly string[];
  readonly rollbackManifest: readonly string[];
}

const normalizeHeader = (value: string): string => value.trim();

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === ',' && !quoted) {
      values.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
};

export const parseCRMPortText = (format: 'CSV' | 'JSON' | 'NDJSON', text: string): readonly CRMPortSourceRow[] => {
  if (format === 'JSON') {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error('CRM_PORT_JSON_ARRAY_REQUIRED');
    return parsed as CRMPortSourceRow[];
  }
  if (format === 'NDJSON') {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as CRMPortSourceRow);
  }
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<CRMPortSourceRow>((row, header, index) => {
      return { ...row, [header]: values[index] ?? '' };
    }, {});
  });
};

export const validateCRMPortBundle = (manifest: CRMPortBundleManifest): CRMPortBundleManifest => {
  if (manifest.provenance.length === 0) throw new Error('CRM_PORT_BUNDLE_PROVENANCE_REQUIRED');
  if (manifest.entries.length === 0) throw new Error('CRM_PORT_BUNDLE_ENTRY_REQUIRED');
  const names = new Set<string>();
  for (const entry of manifest.entries) {
    if (!entry.name.trim() || names.has(entry.name)) throw new Error('CRM_PORT_BUNDLE_ENTRY_INVALID');
    names.add(entry.name);
  }
  return manifest;
};

const coerce = (target: string, value: CRMPortSourceRow[string]): string | number | boolean | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  if (target === 'value') {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error('CRM_PORT_VALUE_INVALID');
    return number;
  }
  return value as string | number | boolean;
};

export const mapCRMPortRow = (
  row: CRMPortSourceRow,
  fieldMap: readonly CRMFieldMap[],
  fallbackType: CRMEntityType,
  provenance: readonly string[],
): CRMRecord => {
  const mapped: Record<string, string | number | boolean | undefined> = {};
  for (const mapping of fieldMap) mapped[mapping.target] = coerce(mapping.target, row[mapping.source]);
  const properties: Record<string, string | number | boolean> = {};
  for (const key of Object.keys(row)) {
    if (!fieldMap.some((mapping) => mapping.source === key)) {
      const value = row[key];
      if (value !== null && value !== undefined) properties[key] = value as string | number | boolean;
    }
  }
  return validateCRMRecord({
    id: String(mapped.id ?? ''),
    type: String(mapped.type ?? fallbackType) as CRMEntityType,
    name: String(mapped.name ?? ''),
    accountId: mapped.accountId === undefined ? undefined : String(mapped.accountId),
    contactId: mapped.contactId === undefined ? undefined : String(mapped.contactId),
    stage: mapped.stage === undefined ? undefined : String(mapped.stage) as CRMRecord['stage'],
    value: mapped.value === undefined ? undefined : Number(mapped.value),
    owner: mapped.owner === undefined ? undefined : String(mapped.owner),
    dueAt: mapped.dueAt === undefined ? undefined : String(mapped.dueAt),
    provenance,
    properties,
  });
};

const dedupeKey = (record: CRMRecord, keys: readonly string[]): string =>
  keys.map((key) => {
    const value = (record as unknown as Record<string, unknown>)[key] ?? record.properties?.[key];
    return String(value ?? '').trim().toLowerCase();
  }).join('|');

export const planCRMImport = (
  request: CRMPortRequest,
  rows: readonly CRMPortSourceRow[],
  fallbackType: CRMEntityType,
  consent: readonly ConsentRecord[] = [],
): CRMPortPlan => {
  if (request.mode !== 'IMPORT') throw new Error('CRM_PORT_IMPORT_MODE_REQUIRED');
  if (!request.id.trim() || request.provenance.length === 0) throw new Error('CRM_PORT_PROVENANCE_REQUIRED');
  if (!hasCRMPermission(request.actorRole, 'CRM_WRITE')) {
    return { requestId: request.id, decision: 'BLOCK', humanApprovalRequired: true, totalRows: rows.length, acceptedRows: 0, duplicateRows: 0, rejectedRows: rows.length, batches: 0, issues: [{ row: 0, code: 'CRM_PORT_WRITE_PERMISSION_REQUIRED', detail: request.actorRole }], rollbackManifest: [], audit: [] };
  }
  if (request.policy.batchSize < 1 || request.policy.maxRecords < 1) throw new Error('CRM_PORT_POLICY_INVALID');
  if (rows.length > request.policy.maxRecords) {
    return { requestId: request.id, decision: 'BLOCK', humanApprovalRequired: true, totalRows: rows.length, acceptedRows: 0, duplicateRows: 0, rejectedRows: rows.length, batches: 0, issues: [{ row: 0, code: 'CRM_PORT_MAX_RECORDS_EXCEEDED', detail: String(request.policy.maxRecords) }], rollbackManifest: [], audit: [] };
  }

  const issues: CRMPortIssue[] = [];
  const accepted: CRMRecord[] = [];
  const keys = new Set<string>();
  let duplicates = 0;
  rows.forEach((row, index) => {
    try {
      const record = mapCRMPortRow(row, request.fieldMap, fallbackType, [...request.provenance, `row:${index + 1}`]);
      const key = dedupeKey(record, request.policy.dedupeKeys.length > 0 ? request.policy.dedupeKeys : ['id']);
      if (keys.has(key)) {
        duplicates += 1;
        issues.push({ row: index + 1, code: 'CRM_PORT_DUPLICATE', detail: key });
        return;
      }
      if (request.policy.requireConsentForMarketing && record.type === 'CONTACT') {
        const emailConsent = consent.find((item) => item.subjectId === record.id && item.channel === 'EMAIL');
        if (!emailConsent || emailConsent.state !== 'GRANTED') {
          issues.push({ row: index + 1, code: 'CRM_PORT_MARKETING_CONSENT_REQUIRED', detail: record.id });
          return;
        }
      }
      keys.add(key);
      accepted.push(record);
    } catch (error) {
      issues.push({ row: index + 1, code: 'CRM_PORT_ROW_REJECTED', detail: error instanceof Error ? error.message : 'UNKNOWN' });
    }
  });

  const rollbackManifest = accepted.map((record) => `DELETE:${record.id}`);
  const audit = accepted.map<CRMPortAuditEvent>((record, index) => ({ id: `${request.id}:row:${index + 1}`, requestId: request.id, action: request.policy.dryRun ? 'DRY_RUN_ACCEPT' : 'IMPORT_ACCEPT', row: index + 1, recordId: record.id, provenance: request.provenance }));
  const humanApprovalRequired = !request.policy.dryRun;
  const decision: CRMPortDecision = humanApprovalRequired && !request.humanApproved ? 'REVIEW' : 'ALLOW';
  return {
    requestId: request.id,
    decision,
    humanApprovalRequired,
    totalRows: rows.length,
    acceptedRows: accepted.length,
    duplicateRows: duplicates,
    rejectedRows: rows.length - accepted.length - duplicates,
    batches: Math.ceil(accepted.length / request.policy.batchSize),
    issues,
    rollbackManifest,
    audit,
  };
};

export const applyCRMUpsert = (
  existing: readonly CRMRecord[],
  incoming: readonly CRMRecord[],
  strategy: CRMWriteStrategy,
): CRMPortUpsertResult => {
  const byId = new Map(existing.map((record) => [record.id, record]));
  const inserted: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];
  const rollbackManifest: string[] = [];

  for (const record of incoming.map(validateCRMRecord)) {
    const prior = byId.get(record.id);
    if (!prior) {
      byId.set(record.id, record);
      inserted.push(record.id);
      rollbackManifest.push(`DELETE:${record.id}`);
    } else if (strategy === 'UPSERT') {
      byId.set(record.id, record);
      updated.push(record.id);
      rollbackManifest.push(`RESTORE:${record.id}:${JSON.stringify(prior)}`);
    } else {
      skipped.push(record.id);
    }
  }

  return { records: [...byId.values()], inserted, updated, skipped, rollbackManifest };
};

export const exportCRMRecords = (
  request: CRMPortRequest,
  records: readonly CRMRecord[],
  filter?: (record: CRMRecord) => boolean,
): readonly Readonly<Record<string, unknown>>[] => {
  if (request.mode !== 'EXPORT') throw new Error('CRM_PORT_EXPORT_MODE_REQUIRED');
  if (!hasCRMPermission(request.actorRole, 'CRM_EXPORT')) throw new Error('CRM_PORT_EXPORT_PERMISSION_REQUIRED');
  if (request.provenance.length === 0) throw new Error('CRM_PORT_PROVENANCE_REQUIRED');
  const selected = filter ? records.filter(filter) : records;
  if (selected.length > request.policy.maxRecords) throw new Error('CRM_PORT_MAX_RECORDS_EXCEEDED');
  const redact = new Set(request.policy.redactFieldsOnExport);
  return selected.map((record) => {
    const output: Record<string, unknown> = { ...record, properties: { ...(record.properties ?? {}) } };
    for (const field of redact) {
      if (field in output) output[field] = '[REDACTED]';
      if (output.properties && typeof output.properties === 'object') {
        const props = output.properties as Record<string, unknown>;
        if (field in props) props[field] = '[REDACTED]';
      }
    }
    return output;
  });
};

export const CRM_PORT = {
  id: 'GLASS-CRM-PORT',
  version: '1.0.0',
  command: '/glass crm port',
  formats: ['CSV', 'JSON', 'NDJSON', 'ZIP_BUNDLE'] as readonly CRMPortFormat[],
  modes: ['IMPORT', 'EXPORT'] as readonly CRMPortMode[],
  pipeline: ['PORT_INGEST', 'FORMAT_PARSE', 'SCHEMA_MAP', 'DEDUPE', 'CONSENT_PROVENANCE_CHECK', 'DRY_RUN', 'HUMAN_REVIEW', 'BATCH_WRITE_OR_EXPORT', 'AUDIT', 'ROLLBACK_MANIFEST'] as const,
  controls: {
    provenanceRequired: true,
    dryRunSupported: true,
    humanApprovalForBulkWrite: true,
    idempotentUpsert: true,
    rollbackManifest: true,
    exportRedaction: true,
    batchLimitRequired: true,
    rbacRequired: true,
  },
} as const;
