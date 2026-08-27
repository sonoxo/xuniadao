import test from 'ava';

import {
  assessCertificationControls,
  CRM_CERTIFICATION_CONTROLS,
  CRM_CERTIFICATION_EVIDENCE,
  CRM_CERTIFICATION_ONTOLOGY,
  CRM_EXTERNAL_READINESS,
  CRM_INTERNAL_ATTESTATION,
  issueInternalCRMAttestation,
} from './crm-certification';

test('CRM certification uses Palantir-aligned ontology primitives', (t) => {
  t.is(CRM_CERTIFICATION_ONTOLOGY.command, '/glass certify crm');
  t.is(CRM_CERTIFICATION_ONTOLOGY.architecture, 'PALANTIR_ONTOLOGY_ALIGNED');
  t.true(CRM_CERTIFICATION_ONTOLOGY.objectTypes.includes('CONTROL'));
  t.true(CRM_CERTIFICATION_ONTOLOGY.objectTypes.includes('EVIDENCE'));
  t.true(CRM_CERTIFICATION_ONTOLOGY.relationTypes.includes('SUPPORTED_BY'));
  t.true(CRM_CERTIFICATION_ONTOLOGY.actionModel.includes('ISSUE_INTERNAL_ATTESTATION'));
});

test('internal CRM baseline passes with verified evidence', (t) => {
  const baseline = CRM_CERTIFICATION_CONTROLS.filter((control) => control.framework === 'XUNIA_CRM_CONTROL_BASELINE');
  const assessment = assessCertificationControls(baseline, CRM_CERTIFICATION_EVIDENCE);
  t.is(assessment.result, 'PASS');
  t.is(assessment.failed.length, 0);
  t.is(assessment.pending.length, 0);
});

test('internal attestation is active but external certification is not issued', (t) => {
  t.is(CRM_INTERNAL_ATTESTATION.status, 'INTERNAL_ATTESTED');
  t.true(CRM_INTERNAL_ATTESTATION.humanApproved);
  t.is(CRM_INTERNAL_ATTESTATION.externalCertificationStatus, 'NOT_ISSUED');
  t.is(CRM_CERTIFICATION_ONTOLOGY.externalCertificationStatus, 'NOT_ISSUED');
  t.false(CRM_CERTIFICATION_ONTOLOGY.externalAffiliationClaim);
});

test('human approval is required to issue internal attestation', (t) => {
  const attestation = issueInternalCRMAttestation(CRM_CERTIFICATION_CONTROLS, CRM_CERTIFICATION_EVIDENCE, false);
  t.is(attestation.status, 'READINESS_ONLY');
});

test('software and policy controls are ready for external assessment', (t) => {
  t.is(CRM_EXTERNAL_READINESS.status, 'READY_FOR_EXTERNAL_ASSESSMENT');
  t.is(CRM_EXTERNAL_READINESS.assessment.result, 'PASS');
  t.is(CRM_EXTERNAL_READINESS.assessment.pending.length, 0);
  t.is(CRM_EXTERNAL_READINESS.assessment.failed.length, 0);
  t.true(CRM_EXTERNAL_READINESS.operationalEvidenceRequired);
  t.true(CRM_EXTERNAL_READINESS.independentAssessorRequiredForThirdPartyAttestation);
  t.is(CRM_EXTERNAL_READINESS.externalCertificationStatus, 'NOT_ISSUED');
});

test('all readiness frameworks have evidence-backed controls', (t) => {
  const external = CRM_CERTIFICATION_CONTROLS.filter((control) => control.framework !== 'XUNIA_CRM_CONTROL_BASELINE');
  t.false(external.some((control) => control.status === 'PENDING'));
  t.true(external.some((control) => control.framework === 'SOC2_READINESS'));
  t.true(external.some((control) => control.framework === 'GDPR_READINESS'));
  t.true(external.some((control) => control.framework === 'CCPA_READINESS'));
  t.true(external.some((control) => control.framework === 'CAN_SPAM_READINESS'));
  t.true(external.some((control) => control.framework === 'TCPA_READINESS'));
});
