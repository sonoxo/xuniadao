import test from 'ava';

import { executeCRMExport, executeCRMImport } from './crm-port-runtime';

const fieldMap = [
  { source: 'id', target: 'id' },
  { source: 'name', target: 'name' },
] as const;

const basePolicy = {
  batchSize: 1,
  dryRun: false,
  writeStrategy: 'UPSERT' as const,
  dedupeKeys: ['id'],
  requireConsentForMarketing: false,
  redactFieldsOnExport: ['owner'],
  maxRecords: 100,
};

test('approved import executes in bounded batches', (t) => {
  const execution = executeCRMImport({
    id: 'runtime:1',
    mode: 'IMPORT',
    format: 'JSON',
    actorRole: 'ADMIN',
    provenance: ['source:test'],
    fieldMap,
    policy: basePolicy,
    humanApproved: true,
  }, [
    { id: '1', name: 'Ada' },
    { id: '2', name: 'Lin' },
  ], 'CONTACT', []);
  t.true(execution.applied);
  t.is(execution.batches.length, 2);
  t.is(execution.result?.inserted.length, 2);
  t.is(execution.result?.rollbackManifest.length, 2);
});

test('unapproved bulk write stays in review and does not apply', (t) => {
  const execution = executeCRMImport({
    id: 'runtime:2',
    mode: 'IMPORT',
    format: 'JSON',
    actorRole: 'ADMIN',
    provenance: ['source:test'],
    fieldMap,
    policy: basePolicy,
    humanApproved: false,
  }, [{ id: '1', name: 'Ada' }], 'CONTACT', []);
  t.false(execution.applied);
  t.is(execution.plan.decision, 'REVIEW');
});

test('export runtime batches and redacts', (t) => {
  const execution = executeCRMExport({
    id: 'runtime:3',
    mode: 'EXPORT',
    format: 'JSON',
    actorRole: 'ADMIN',
    provenance: ['source:test'],
    fieldMap: [],
    policy: basePolicy,
    humanApproved: true,
  }, [
    { id: '1', type: 'CONTACT', name: 'Ada', owner: 'private', provenance: ['source:test'] },
    { id: '2', type: 'CONTACT', name: 'Lin', owner: 'private', provenance: ['source:test'] },
  ]);
  t.is(execution.batches.length, 2);
  t.is(execution.records[0].owner, '[REDACTED]');
  t.is(execution.audit.length, 2);
});
