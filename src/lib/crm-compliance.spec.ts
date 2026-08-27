import test from 'ava';

import {
  CRM_COMPLIANCE_REQUIREMENTS,
  hasCRMPermission,
  maySendMarketing,
  privacyRequestDueDays,
  shouldDeleteForRetention,
  validateAuditChain,
  validateConsent,
  validateIncident,
  validatePrivacyRequest,
  validateVendor,
} from './crm-compliance';

test('CRM RBAC applies least-privilege role boundaries', (t) => {
  t.true(hasCRMPermission('ADMIN', 'CRM_EXPORT'));
  t.false(hasCRMPermission('MARKETING', 'CRM_EXPORT'));
  t.true(hasCRMPermission('AUDITOR', 'CRM_AUDIT_READ'));
  t.false(hasCRMPermission('AUDITOR', 'CRM_WRITE'));
});

test('marketing consent and revocation are enforced', (t) => {
  const granted = validateConsent({
    subjectId: 'contact:1', channel: 'EMAIL', state: 'GRANTED', source: 'web-form', capturedAt: '2026-08-27T00:00:00Z', provenance: ['source:web-form'],
  });
  t.true(maySendMarketing(granted));
  const revoked = validateConsent({
    subjectId: 'contact:1', channel: 'EMAIL', state: 'REVOKED', source: 'unsubscribe', capturedAt: '2026-08-27T00:00:00Z', revokedAt: '2026-08-27T01:00:00Z', provenance: ['source:unsubscribe'],
  });
  t.false(maySendMarketing(revoked));
});

test('privacy request verification and response windows are modeled', (t) => {
  t.is(privacyRequestDueDays('GDPR'), 30);
  t.is(privacyRequestDueDays('CCPA'), 45);
  t.truthy(validatePrivacyRequest({
    id: 'dsr:1', subjectId: 'contact:1', type: 'DELETE', jurisdiction: 'CCPA', receivedAt: '2026-08-27T00:00:00Z', verified: true, status: 'OPEN', provenance: ['request:verified'],
  }));
  t.throws(() => validatePrivacyRequest({
    id: 'dsr:2', subjectId: 'contact:2', type: 'DELETE', jurisdiction: 'GDPR', receivedAt: '2026-08-27T00:00:00Z', verified: false, status: 'OPEN', provenance: ['request:unverified'],
  }), { message: 'PRIVACY_REQUEST_VERIFICATION_REQUIRED' });
});

test('retention and legal hold are enforced', (t) => {
  const rule = { dataClass: 'CRM_CONTACT', maxDays: 365, legalHoldAllowed: true } as const;
  t.true(shouldDeleteForRetention('2025-01-01T00:00:00Z', '2026-08-27T00:00:00Z', rule));
  t.false(shouldDeleteForRetention('2025-01-01T00:00:00Z', '2026-08-27T00:00:00Z', rule, true));
});

test('audit chain requires ordered provenance-bearing events', (t) => {
  t.true(validateAuditChain([
    { id: 'evt:1', actor: 'user:1', action: 'READ', targetId: 'contact:1', occurredAt: '2026-08-27T00:00:00Z', provenance: ['system:crm'] },
    { id: 'evt:2', actor: 'user:1', action: 'UPDATE', targetId: 'contact:1', occurredAt: '2026-08-27T00:01:00Z', previousEventId: 'evt:1', provenance: ['system:crm'] },
  ]));
});

test('vendor agreements and incident review gates are enforced', (t) => {
  t.truthy(validateVendor({ id: 'vendor:1', name: 'Processor', processesPersonalData: true, processesPHI: false, contractRequired: true, agreementStatus: 'EXECUTED', provenance: ['contract:1'] }));
  t.throws(() => validateVendor({ id: 'vendor:2', name: 'PHI Processor', processesPersonalData: true, processesPHI: true, contractRequired: true, agreementStatus: 'REQUIRED', provenance: ['inventory:1'] }), { message: 'VENDOR_AGREEMENT_REQUIRED' });
  t.throws(() => validateIncident({ id: 'inc:1', detectedAt: '2026-08-27T00:00:00Z', severity: 'CRITICAL', personalDataInvolved: true, phiInvolved: false, status: 'CLOSED', owner: 'security', provenance: ['alert:1'] }), { message: 'HIGH_RISK_INCIDENT_REVIEW_REQUIRED' });
});

test('readiness requirements cover privacy, security, marketing and conditional HIPAA', (t) => {
  t.true(CRM_COMPLIANCE_REQUIREMENTS.privacy.deletionWorkflow);
  t.true(CRM_COMPLIANCE_REQUIREMENTS.security.rbac);
  t.true(CRM_COMPLIANCE_REQUIREMENTS.security.encryptionAtRestRequired);
  t.true(CRM_COMPLIANCE_REQUIREMENTS.marketing.unsubscribeRequired);
  t.true(CRM_COMPLIANCE_REQUIREMENTS.marketing.smsVoiceConsentLedger);
  t.true(CRM_COMPLIANCE_REQUIREMENTS.hipaaConditional.businessAssociateAgreementTracking);
});
