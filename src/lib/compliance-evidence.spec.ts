import test from 'ava';

import { assessComplianceEvidence, COMPLIANCE_EVIDENCE, validateComplianceEvidenceArtifact } from './compliance-evidence';

test('evidence artifacts require known requirements and provenance', (t) => {
  t.truthy(validateComplianceEvidenceArtifact({
    requirementId: 'GDPR-ROPA', status: 'PRESENT', source: 'evidence/ropa.pdf', observedAt: '2026-08-27T00:00:00Z', provenance: ['approved:privacy-owner'],
  }));
  t.throws(() => validateComplianceEvidenceArtifact({
    requirementId: 'UNKNOWN', status: 'PRESENT', source: 'x', observedAt: '2026-08-27T00:00:00Z', provenance: ['x'],
  }), { message: 'EVIDENCE_REQUIREMENT_UNKNOWN' });
});

test('assessment reports missing operational evidence instead of inferring compliance', (t) => {
  const assessment = assessComplianceEvidence('GDPR', [{
    requirementId: 'GDPR-ROPA', status: 'PRESENT', source: 'evidence/ropa.pdf', observedAt: '2026-08-27T00:00:00Z', provenance: ['approved:privacy-owner'],
  }], ['GDPR-ROPA', 'GDPR-NOTICES']);
  t.is(assessment.status, 'PARTIAL');
  t.deepEqual(assessment.missing, ['GDPR-NOTICES']);
});

test('complete status requires all applicable evidence slots to be resolved', (t) => {
  const assessment = assessComplianceEvidence('HIPAA', [
    { requirementId: 'HIPAA-SCOPE', status: 'PRESENT', source: 'scope.md', observedAt: '2026-08-27T00:00:00Z', provenance: ['owner:security'] },
    { requirementId: 'HIPAA-BAA', status: 'NOT_APPLICABLE', source: 'vendor-inventory.md', observedAt: '2026-08-27T00:00:00Z', provenance: ['owner:privacy'] },
  ], ['HIPAA-SCOPE', 'HIPAA-BAA']);
  t.is(assessment.status, 'COMPLETE');
});

test('evidence framework explicitly separates code from production proof', (t) => {
  t.is(COMPLIANCE_EVIDENCE.command, '/glass evidence');
  t.true(COMPLIANCE_EVIDENCE.controls.productionEvidenceCannotBeInferredFromCode);
});
