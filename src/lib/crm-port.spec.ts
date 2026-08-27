import test from 'ava';

import {
  applyCRMUpsert,
  CRM_PORT,
  exportCRMRecords,
  mapCRMPortRow,
  parseCRMPortText,
  planCRMImport,
  validateCRMPortBundle,
} from './crm-port';

const fieldMap = [
  { source: 'id', target: 'id' },
  { source: 'name', target: 'name' },
  { source: 'value', target: 'value' },
] as const;

const policy = {
  batchSize: 2,
  dryRun: true,
  writeStrategy: 'UPSERT' as const,
  dedupeKeys: ['id'],
  requireConsentForMarketing: false,
  redactFieldsOnExport: ['owner'],
  maxRecords: 1000,
};

test('parses CSV, JSON, and NDJSON', (t) => {
  t.is(parseCRMPortText('CSV', 'id,name\n1,Ada')[0].name, 'Ada');
  t.is(parseCRMPortText('JSON', '[{"id":"1","name":"Ada"}]')[0].id, '1');
  t.is(parseCRMPortText('NDJSON', '{"id":"1","name":"Ada"}\n{"id":"2","name":"Lin"}').length, 2);
});

test('validates zip bundle manifests', (t) => {
  const manifest = validateCRMPortBundle({
    version: '1',
    format: 'ZIP_BUNDLE',
    entries: [{ name: 'contacts.csv', format: 'CSV', recordType: 'CONTACT' }],
    provenance: ['source:test'],
  });
  t.is(manifest.entries.length, 1);
});

test('maps source rows into CRM records with provenance', (t) => {
  const record = mapCRMPortRow({ id: 'opp:1', name: 'Deal', value: '25', custom: 'x' }, fieldMap, 'OPPORTUNITY', ['source:test']);
  t.is(record.id, 'opp:1');
  t.is(record.value, 25);
  t.is(record.properties?.custom, 'x');
});

test('dry-run import allows validated rows and reports duplicates', (t) => {
  const plan = planCRMImport({
    id: 'port:1',
    mode: 'IMPORT',
    format: 'CSV',
    actorRole: 'ADMIN',
    provenance: ['source:test'],
    fieldMap,
    policy,
    humanApproved: false,
  }, [
    { id: '1', name: 'Ada' },
    { id: '1', name: 'Ada duplicate' },
    { id: '2', name: 'Lin' },
  ], 'CONTACT');
  t.is(plan.decision, 'ALLOW');
  t.is(plan.acceptedRows, 2);
  t.is(plan.duplicateRows, 1);
  t.is(plan.batches, 1);
});

test('non-dry-run bulk write requires human approval', (t) => {
  const plan = planCRMImport({
    id: 'port:2',
    mode: 'IMPORT',
    format: 'JSON',
    actorRole: 'ADMIN',
    provenance: ['source:test'],
    fieldMap,
    policy: { ...policy, dryRun: false },
    humanApproved: false,
  }, [{ id: '1', name: 'Ada' }], 'CONTACT');
  t.is(plan.decision, 'REVIEW');
  t.true(plan.humanApprovalRequired);
});

test('upsert is idempotent and emits rollback operations', (t) => {
  const prior = mapCRMPortRow({ id: '1', name: 'Old' }, fieldMap, 'CONTACT', ['source:old']);
  const next = mapCRMPortRow({ id: '1', name: 'New' }, fieldMap, 'CONTACT', ['source:new']);
  const result = applyCRMUpsert([prior], [next], 'UPSERT');
  t.deepEqual(result.updated, ['1']);
  t.is(result.records.length, 1);
  t.true(result.rollbackManifest[0].startsWith('RESTORE:1:'));
});

test('exports support filtering and redaction', (t) => {
  const record = {
    id: '1', type: 'CONTACT' as const, name: 'Ada', owner: 'secret-owner', provenance: ['source:test'],
  };
  const output = exportCRMRecords({
    id: 'port:3',
    mode: 'EXPORT',
    format: 'JSON',
    actorRole: 'ADMIN',
    provenance: ['source:test'],
    fieldMap: [],
    policy,
    humanApproved: true,
  }, [record]);
  t.is(output.length, 1);
  t.is(output[0].owner, '[REDACTED]');
});

test('port contract exposes both read and write workflows', (t) => {
  t.is(CRM_PORT.command, '/glass crm port');
  t.true(CRM_PORT.modes.includes('IMPORT'));
  t.true(CRM_PORT.modes.includes('EXPORT'));
  t.true(CRM_PORT.controls.idempotentUpsert);
  t.true(CRM_PORT.controls.rollbackManifest);
});
