import test from 'ava';

import type { HealthAuthorization, HealthSignature } from '../lib/glass-onion-health';
import { buildClientChartSummary, decideHealthApiAccess } from './api';
import { buildHealthDisclosure, resolveDisclosureAuthorization } from './consent';
import { createHealthSession } from './identity';
import { validateHealthRuntimeIncident } from './incidents';
import { evaluateRetention } from './retention';
import { GlassOnionHealthRuntime } from './runtime';
import { MemoryProtectedObjectStore, StaticEnvelopeKeyProvider } from './storage';

const buildRuntime = (): GlassOnionHealthRuntime => {
  const keys = new StaticEnvelopeKeyProvider({ 'key:health': Buffer.alloc(32, 7) });
  return new GlassOnionHealthRuntime(new MemoryProtectedObjectStore(keys));
};

const clinicianSession = () => createHealthSession({
  id: 'provider:1',
  role: 'CLINICIAN',
  active: true,
  workforceMember: true,
  mfaRequired: true,
  organizationId: 'org:1',
  provenance: ['directory:org1'],
}, {
  sessionId: 'session:1',
  authenticatedAt: '2026-08-28T12:00:00Z',
  expiresAt: '2026-08-28T20:00:00Z',
  mfaVerified: true,
  authenticationMethods: ['SSO', 'TOTP'],
  provenance: ['idp:org1'],
});

test('clinical draft is encrypted, signed and charted', (t) => {
  const runtime = buildRuntime();
  const draft = runtime.efile.createDraft({
    id: 'doc:1', clientId: 'client:1', encounterId: 'enc:1', type: 'CASE_NOTE', dataClass: 'EPHI',
    title: 'Case note', authorId: 'provider:1', createdAt: '2026-08-28T12:10:00Z', version: '1.0',
    retentionPolicyId: 'retention:clinical', content: 'protected clinical text', contentType: 'text/plain', keyId: 'key:health',
    provenance: ['runtime:test'],
  });
  t.is(draft.status, 'DRAFT');
  t.is(runtime.efile.readContent('doc:1').toString('utf8'), 'protected clinical text');

  const signatureBase: Omit<HealthSignature, 'documentHash' | 'documentVersion'> = {
    id: 'sig:1', signerId: 'provider:1', signerRole: 'CLINICIAN', documentId: 'doc:1', signedAt: '2026-08-28T12:20:00Z',
    authenticationMethod: 'MFA', intent: 'ATTEST', provenance: ['runtime:test'],
  };
  const signed = runtime.efile.signDocument('doc:1', signatureBase);
  t.is(signed.document.status, 'SIGNED');
  t.truthy(signed.document.contentHash);
  t.is(signed.signature.documentHash, signed.document.contentHash);

  const chart = buildClientChartSummary(runtime, 'client:1');
  t.is(chart.documents.length, 1);
  t.is(chart.documents[0].status, 'SIGNED');
});

test('assigned clinician access is allowed and written to hash-chained audit', (t) => {
  const runtime = buildRuntime();
  runtime.efile.createDraft({
    id: 'doc:2', clientId: 'client:2', type: 'CASE_NOTE', dataClass: 'EPHI', title: 'Treatment note', authorId: 'provider:1',
    createdAt: '2026-08-28T12:10:00Z', version: '1.0', retentionPolicyId: 'retention:clinical', content: 'payload', contentType: 'text/plain',
    keyId: 'key:health', provenance: ['runtime:test'],
  });
  runtime.addAssignment({ clientId: 'client:2', providerId: 'provider:1', relationship: 'PRIMARY', active: true, effectiveAt: '2026-08-01T00:00:00Z', provenance: ['assignment:test'] });
  const response = decideHealthApiAccess(runtime, {
    requestId: 'req:1', at: '2026-08-28T13:00:00Z', session: clinicianSession(), action: 'READ', purpose: 'TREATMENT', documentId: 'doc:2',
    minimumNecessarySatisfied: true, provenance: ['runtime:test'],
  });
  t.is(response.decision.decision, 'ALLOW');
  t.true(runtime.audit.validate());
  t.is(runtime.audit.list().length, 1);
  t.true(runtime.evidenceSnapshot('2026-08-28T13:05:00Z').auditChainValid);
});

test('psychotherapy and Part 2 releases require their scoped authorization', (t) => {
  const runtime = buildRuntime();
  const psychotherapy = runtime.efile.createDraft({
    id: 'doc:psy', clientId: 'client:3', type: 'PSYCHOTHERAPY_NOTE', dataClass: 'PSYCHOTHERAPY_NOTES', title: 'Psychotherapy note',
    authorId: 'provider:1', createdAt: '2026-08-28T12:10:00Z', version: '1.0', retentionPolicyId: 'retention:restricted', content: 'restricted',
    contentType: 'text/plain', keyId: 'key:health', provenance: ['runtime:test'],
  });
  const part2 = runtime.efile.createDraft({
    id: 'doc:p2', clientId: 'client:3', type: 'SUD_COUNSELING_NOTE', dataClass: 'PART2_SUD_COUNSELING_NOTE', title: 'SUD counseling note',
    authorId: 'provider:1', createdAt: '2026-08-28T12:11:00Z', version: '1.0', retentionPolicyId: 'retention:restricted', content: 'part2',
    contentType: 'text/plain', keyId: 'key:health', provenance: ['runtime:test'],
  });
  t.false(resolveDisclosureAuthorization(psychotherapy, 'recipient:1', [], '2026-08-28T13:00:00Z').allowed);
  t.false(resolveDisclosureAuthorization(part2, 'recipient:1', [], '2026-08-28T13:00:00Z').allowed);

  const authorizations: HealthAuthorization[] = [
    { id: 'auth:psy', clientId: 'client:3', kind: 'PSYCHOTHERAPY_NOTES', recipient: 'recipient:1', purpose: 'release', effectiveAt: '2026-08-28T12:00:00Z', provenance: ['consent:test'] },
    { id: 'auth:p2', clientId: 'client:3', kind: 'PART2_SUD_COUNSELING_NOTES', recipient: 'recipient:1', purpose: 'release', effectiveAt: '2026-08-28T12:00:00Z', provenance: ['consent:test'] },
  ];
  const disclosure = buildHealthDisclosure({
    id: 'disc:1', clientId: 'client:3', documents: [psychotherapy, part2], recipient: 'recipient:1', purpose: 'authorized release',
    requestedBy: 'privacy:1', requestedAt: '2026-08-28T13:00:00Z', authorizations, provenance: ['runtime:test'],
  });
  t.is(disclosure.status, 'REQUESTED');
});

test('retention never hard-deletes and legal hold wins', (t) => {
  const rule = { id: 'retention:clinical', dataClasses: ['EPHI'] as const, maxDays: 365, dispositionRequiresReview: true, legalHoldAllowed: true, provenance: ['policy:test'] };
  t.is(evaluateRetention({ createdAt: '2024-01-01T00:00:00Z', at: '2026-08-28T00:00:00Z', clientId: 'client:1', documentId: 'doc:1', dataClass: 'EPHI', rule, holds: [] }), 'REVIEW_FOR_DISPOSITION');
  t.is(evaluateRetention({ createdAt: '2024-01-01T00:00:00Z', at: '2026-08-28T00:00:00Z', clientId: 'client:1', documentId: 'doc:1', dataClass: 'EPHI', rule, holds: [
    { id: 'hold:1', clientId: 'client:1', documentIds: [], reason: 'legal preservation', active: true, effectiveAt: '2026-01-01T00:00:00Z', provenance: ['legal:test'] },
  ] }), 'LEGAL_HOLD');
});

test('high severity incident cannot close without evidence', (t) => {
  t.throws(() => validateHealthRuntimeIncident({
    id: 'incident:1', detectedAt: '2026-08-28T00:00:00Z', severity: 'CRITICAL', status: 'CLOSED', owner: 'security:1', phiInvolved: true,
    part2Involved: false, affectedClientIds: ['client:1'], containmentActions: ['isolated service'], riskAssessmentCompleted: false,
    notificationDecisionDocumented: false, closedAt: '2026-08-28T01:00:00Z', provenance: ['alert:test'],
  }), { message: 'HEALTH_INCIDENT_CLOSURE_EVIDENCE_REQUIRED' });
});
