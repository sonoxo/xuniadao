import test from 'ava';

import {
  ONC_READINESS_CRITERIA,
  assessONCReadiness,
  buildONCAuditReport,
  buildPopulationEHIExport,
  buildSinglePatientEHIExport,
  evaluateEmergencyAccessReadiness,
  sessionTimedOut,
  validateAccessibilityEvidence,
  validateQMSRecord,
} from './onc-readiness';
import type { ManagedClinicalDocument } from './documents';
import type { RuntimeAuditEvent } from './audit';

const document: ManagedClinicalDocument = {
  id: 'doc:onc:1',
  clientId: 'client:onc:1',
  type: 'CASE_NOTE',
  dataClass: 'EPHI',
  title: 'ONC test note',
  authorId: 'provider:onc:1',
  createdAt: '2026-08-28T14:00:00Z',
  version: '1.0',
  status: 'SIGNED',
  protectedPayloadRef: 'protected://health-document:doc:onc:1:v:1.0',
  contentHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  retentionPolicyId: 'retention:clinical',
  provenance: ['source:onc-test'],
};

const audit: RuntimeAuditEvent = {
  id: 'audit:onc:1',
  actorId: 'provider:onc:1',
  action: 'READ',
  targetId: document.id,
  occurredAt: '2026-08-28T14:10:00Z',
  purpose: 'TREATMENT',
  decision: 'ALLOW',
  provenance: ['source:onc-test'],
  sequence: 1,
  previousHash: 'GENESIS',
  eventHash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
};

test('single-patient EHI export is deterministic and scoped', (t) => {
  const first = buildSinglePatientEHIExport({
    clientId: document.clientId,
    generatedAt: '2026-08-28T15:00:00Z',
    documents: [document],
    auditEvents: [audit],
  });
  const second = buildSinglePatientEHIExport({
    clientId: document.clientId,
    generatedAt: '2026-08-28T15:00:00Z',
    documents: [document],
    auditEvents: [audit],
  });
  t.is(first.scope, 'SINGLE_PATIENT');
  t.deepEqual(first.clientIds, ['client:onc:1']);
  t.is(first.records.length, 1);
  t.is(first.manifestSha256, second.manifestSha256);
});

test('population EHI export enumerates client population', (t) => {
  const other = { ...document, id: 'doc:onc:2', clientId: 'client:onc:2' };
  const bundle = buildPopulationEHIExport({
    generatedAt: '2026-08-28T15:00:00Z',
    documents: [document, other],
  });
  t.is(bundle.scope, 'PATIENT_POPULATION');
  t.deepEqual(bundle.clientIds, ['client:onc:1', 'client:onc:2']);
  t.is(bundle.records.length, 2);
});

test('audit reports support actor, target, and time filters', (t) => {
  t.is(buildONCAuditReport([audit], { actorId: 'provider:onc:1' }).length, 1);
  t.is(buildONCAuditReport([audit], { actorId: 'provider:other' }).length, 0);
  t.is(buildONCAuditReport([audit], { from: '2026-08-28T14:11:00Z' }).length, 0);
});

test('automatic access timeout is deterministic', (t) => {
  t.false(sessionTimedOut('2026-08-28T14:00:00Z', '2026-08-28T14:14:59Z', 15));
  t.true(sessionTimedOut('2026-08-28T14:00:00Z', '2026-08-28T14:15:00Z', 15));
});

test('emergency access requires reason, unavailable normal access, audit, and review', (t) => {
  t.is(evaluateEmergencyAccessReadiness({
    actorId: 'provider:1',
    reason: 'Emergency continuity of care',
    at: '2026-08-28T14:00:00Z',
    normalAccessUnavailable: true,
    auditEnabled: true,
    reviewRequired: true,
  }), 'PASS');
  t.is(evaluateEmergencyAccessReadiness({
    actorId: 'provider:1',
    reason: '',
    at: '2026-08-28T14:00:00Z',
    normalAccessUnavailable: true,
    auditEnabled: true,
    reviewRequired: true,
  }), 'BLOCK');
});

test('QMS and accessibility evidence require traceable artifacts', (t) => {
  t.true(validateQMSRecord({
    id: 'qms:1',
    process: 'Software development lifecycle',
    owner: 'engineering',
    version: '1.0',
    approvedAt: '2026-08-28T00:00:00Z',
    evidenceRefs: ['docs/GLASS_ONION_HEALTH_ONC_READINESS.md'],
  }));
  t.true(validateAccessibilityEvidence({
    productArea: 'Health portal',
    standardOrMethod: 'accessibility-centered design review',
    testedAt: '2026-08-28T00:00:00Z',
    issuesTracked: true,
    remediationProcess: true,
    evidenceRefs: ['docs/GLASS_ONION_HEALTH_ONC_READINESS.md'],
  }));
});

test('ONC readiness matrix remains explicit about partial criteria and external validation', (t) => {
  const assessment = assessONCReadiness();
  t.true(ONC_READINESS_CRITERIA.length >= 10);
  t.is(assessment.status, 'CONDITIONAL_READINESS');
  t.true(assessment.implemented.includes('170.315(b)(10)'));
  t.true(assessment.partial.includes('170.315(d)(9)'));
  t.true(assessment.officialExternalValidationRequired);
  t.is(assessment.externalCertificationStatus, 'NOT_ISSUED');
});
