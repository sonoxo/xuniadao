import test from 'ava';

import { CRM, buildCRMPipeline, evaluateCRMAction, validateCRMRecord } from './crm';

test('CRM identity and ontology are locked', (t) => {
  t.is(CRM.command, '/glass crm');
  t.deepEqual(CRM.entityTypes, ['ACCOUNT', 'CONTACT', 'LEAD', 'OPPORTUNITY', 'ACTIVITY', 'TASK', 'DEAL', 'CUSTOMER']);
  t.true(CRM.stages.includes('WON'));
});

test('CRM records require provenance', (t) => {
  const error = t.throws(() => validateCRMRecord({ id: 'lead:1', type: 'LEAD', name: 'Lead', provenance: [] }));
  t.is(error?.message, 'CRM_PROVENANCE_REQUIRED');
});

test('CRM pipeline computes open and won values', (t) => {
  const result = buildCRMPipeline([
    { id: 'opp:1', type: 'OPPORTUNITY', name: 'Open', stage: 'PROPOSAL', value: 2500, provenance: ['source:test'] },
    { id: 'deal:1', type: 'DEAL', name: 'Won', stage: 'WON', value: 5000, provenance: ['source:test'] },
  ]);
  t.is(result.metrics.openOpportunities, 1);
  t.is(result.metrics.openValue, 2500);
  t.is(result.metrics.wonValue, 5000);
});

test('CRM reads are allowed while writes and outreach require review', (t) => {
  t.is(evaluateCRMAction({ action: 'READ', recordIds: ['lead:1'] }).decision, 'ALLOW');
  t.is(evaluateCRMAction({ action: 'UPDATE', recordIds: ['lead:1'], mutatesData: true }).decision, 'REVIEW');
  t.is(evaluateCRMAction({ action: 'SEND_MESSAGE', recordIds: ['lead:1'] }).decision, 'REVIEW');
  t.is(evaluateCRMAction({ action: 'BULK_OUTREACH', recordIds: ['lead:1'], bulk: true }).decision, 'REVIEW');
});
