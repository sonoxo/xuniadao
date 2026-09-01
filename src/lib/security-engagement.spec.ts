import test from 'ava';
import {
  authorizeSecurityAction,
  SecurityEngagement,
} from './security-engagement';

const engagement: SecurityEngagement = {
  schemaVersion: 'xunia.security.engagement/v1',
  engagementId: 'eng-demo-001',
  owner: 'security-owner',
  mode: 'PENTEST',
  startsAt: '2026-09-01T00:00:00.000Z',
  endsAt: '2026-09-02T00:00:00.000Z',
  targets: [{ type: 'url', value: 'https://lab.example.test' }],
  exclusions: [{ type: 'url', value: 'https://lab.example.test/billing' }],
  allowedChecks: ['web.baseline', 'service.discovery', 'web.safe-active'],
  maxRequestsPerSecond: 10,
  maxConcurrency: 4,
  destructiveAllowed: false,
  authorizationReference: 'AUTH-DEMO-001',
};

const now = new Date('2026-09-01T12:00:00.000Z');

test('authorizes a safe active check inside explicit scope', (t) => {
  const decision = authorizeSecurityAction(
    engagement,
    {
      target: { type: 'url', value: 'https://lab.example.test/api' },
      check: 'web.safe-active',
      risk: 'SAFE_ACTIVE',
    },
    now,
  );
  t.true(decision.allowed);
  t.is(decision.code, 'AUTHORIZED');
});

test('denies out of scope targets', (t) => {
  const decision = authorizeSecurityAction(
    engagement,
    {
      target: { type: 'url', value: 'https://unrelated.example.test' },
      check: 'web.baseline',
      risk: 'PASSIVE',
    },
    now,
  );
  t.false(decision.allowed);
  t.is(decision.code, 'TARGET_OUT_OF_SCOPE');
});

test('exclusions override broader scope', (t) => {
  const decision = authorizeSecurityAction(
    engagement,
    {
      target: { type: 'url', value: 'https://lab.example.test/billing' },
      check: 'web.baseline',
      risk: 'PASSIVE',
    },
    now,
  );
  t.false(decision.allowed);
  t.is(decision.code, 'TARGET_EXCLUDED');
});

test('assessment mode rejects safe-active checks', (t) => {
  const decision = authorizeSecurityAction(
    { ...engagement, mode: 'ASSESS' },
    {
      target: { type: 'url', value: 'https://lab.example.test' },
      check: 'web.safe-active',
      risk: 'SAFE_ACTIVE',
    },
    now,
  );
  t.false(decision.allowed);
  t.is(decision.code, 'RISK_NOT_ALLOWED_FOR_MODE');
});

test('pentest mode rejects lab-active checks', (t) => {
  const decision = authorizeSecurityAction(
    { ...engagement, allowedChecks: ['lab.active'] },
    {
      target: { type: 'url', value: 'https://lab.example.test' },
      check: 'lab.active',
      risk: 'LAB_ACTIVE',
    },
    now,
  );
  t.false(decision.allowed);
  t.is(decision.code, 'RISK_NOT_ALLOWED_FOR_MODE');
});
