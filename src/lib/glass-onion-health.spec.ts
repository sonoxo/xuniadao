import test from 'ava';

import {
  GLASS_ONION_HEALTH,
  authorizationIsActive,
  evaluateHealthAccess,
  validateClinicalDocument,
  validateHealthAuditChain,
  validateHealthSignature,
} from './glass-onion-health';

const caseNote = {
  id: 'doc:case:1',
  clientId: 'client:1',
  encounterId: 'enc:1',
  type: 'CASE_NOTE',
  dataClass: 'EPHI',
  title: 'Case note',
  authorId: 'provider:1',
  createdAt: '2026-08-28T12:00:00Z',
  version: '1.0',
  status: 'DRAFT',
  protectedPayloadRef: 'vault://clinical/doc:case:1',
  retentionPolicyId: 'retention:clinical',
  provenance: ['system:glass-health'],
} as const;

const psychotherapyNote = {
  ...caseNote,
  id: 'doc:psych:1',
  type: 'PSYCHOTHERAPY_NOTE',
  dataClass: 'PSYCHOTHERAPY_NOTES',
  title: 'Psychotherapy note',
} as const;

const part2Note = {
  ...caseNote,
  id: 'doc:part2:1',
  type: 'SUD_COUNSELING_NOTE',
  dataClass: 'PART2_SUD_COUNSELING_NOTE',
  title: 'SUD counseling note',
} as const;

test('protected clinical documents require isolated payload references', (t) => {
  t.truthy(validateClinicalDocument(caseNote));
  t.throws(() => validateClinicalDocument({ ...caseNote, protectedPayloadRef: undefined }), {
    message: 'HEALTH_PROTECTED_PAYLOAD_REF_REQUIRED',
  });
});

test('psychotherapy notes are separately classified and originator treatment read is allowed', (t) => {
  const decision = evaluateHealthAccess({
    actorId: 'provider:1',
    role: 'CLINICIAN',
    action: 'READ',
    purpose: 'TREATMENT',
    document: psychotherapyNote,
    isDocumentAuthor: true,
    assignedToClient: true,
    minimumNecessarySatisfied: true,
  });
  t.is(decision.decision, 'ALLOW');
});

test('psychotherapy notes block unauthorized access', (t) => {
  const decision = evaluateHealthAccess({
    actorId: 'billing:1',
    role: 'BILLING',
    action: 'READ',
    purpose: 'PAYMENT',
    document: psychotherapyNote,
    minimumNecessarySatisfied: true,
  });
  t.is(decision.decision, 'BLOCK');
  t.true(decision.reasons.includes('HEALTH_PSYCHOTHERAPY_AUTHORIZATION_REQUIRED'));
});

test('Part 2 external release is blocked without consent and reviewed with consent', (t) => {
  const blocked = evaluateHealthAccess({
    actorId: 'privacy:1',
    role: 'PRIVACY_OFFICER',
    action: 'DISCLOSE',
    purpose: 'DISCLOSURE',
    document: part2Note,
    minimumNecessarySatisfied: true,
    externalRecipient: true,
  });
  t.is(blocked.decision, 'BLOCK');

  const reviewed = evaluateHealthAccess({
    actorId: 'privacy:1',
    role: 'PRIVACY_OFFICER',
    action: 'DISCLOSE',
    purpose: 'DISCLOSURE',
    document: part2Note,
    minimumNecessarySatisfied: true,
    part2ConsentSatisfied: true,
    externalRecipient: true,
  });
  t.is(reviewed.decision, 'REVIEW');
  t.true(reviewed.humanApprovalRequired);
});

test('clinical deletion is blocked and external export requires review', (t) => {
  t.is(evaluateHealthAccess({
    actorId: 'provider:1', role: 'CLINICIAN', action: 'DELETE', purpose: 'TREATMENT', document: caseNote, assignedToClient: true, minimumNecessarySatisfied: true,
  }).decision, 'BLOCK');

  t.is(evaluateHealthAccess({
    actorId: 'privacy:1', role: 'PRIVACY_OFFICER', action: 'EXPORT', purpose: 'DISCLOSURE', document: caseNote, minimumNecessarySatisfied: true, externalRecipient: true,
  }).decision, 'REVIEW');
});

test('electronic signatures bind signer to document version and hash', (t) => {
  t.truthy(validateHealthSignature({
    id: 'sig:1',
    signerId: 'provider:1',
    signerRole: 'CLINICIAN',
    documentId: 'doc:case:1',
    documentVersion: '1.0',
    documentHash: 'sha256:abc123',
    signedAt: '2026-08-28T12:10:00Z',
    authenticationMethod: 'MFA',
    intent: 'ATTEST',
    provenance: ['system:glass-health'],
  }));
});

test('authorization lifecycle and ordered audit chain are enforced', (t) => {
  t.true(authorizationIsActive({
    id: 'auth:1', clientId: 'client:1', kind: 'DISCLOSURE', purpose: 'release to provider', effectiveAt: '2026-08-28T00:00:00Z', provenance: ['form:roi:1'],
  }, '2026-08-28T12:00:00Z'));

  t.true(validateHealthAuditChain([
    { id: 'audit:1', actorId: 'provider:1', action: 'READ', targetId: 'doc:case:1', occurredAt: '2026-08-28T12:00:00Z', purpose: 'TREATMENT', decision: 'ALLOW', provenance: ['system:glass-health'] },
    { id: 'audit:2', actorId: 'provider:1', action: 'SIGN', targetId: 'doc:case:1', occurredAt: '2026-08-28T12:10:00Z', purpose: 'TREATMENT', decision: 'REVIEW', previousEventId: 'audit:1', provenance: ['system:glass-health'] },
  ]));
});

test('Glass Onion Health machine identity stays inside the Glass Onion scope', (t) => {
  t.is(GLASS_ONION_HEALTH.command, '/glass health');
  t.is(GLASS_ONION_HEALTH.certificationCommand, '/glass certify health');
  t.is(GLASS_ONION_HEALTH.layer, 'GLASS ONION');
  t.true(GLASS_ONION_HEALTH.controls.psychotherapyNotesSeparated);
  t.false(GLASS_ONION_HEALTH.complianceBoundary.hipaaCertificationClaimed);
});
