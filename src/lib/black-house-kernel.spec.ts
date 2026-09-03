import test from 'ava';

import {
  BLACK_HOUSE_KERNEL,
  BLACK_HOUSE_OBJECT_TYPES,
  BLACK_HOUSE_RELATIONSHIP_TYPES,
  requireBlackHouseRelationship,
  toBlackHouseObjectType,
} from './black-house-kernel';

test('XUNIA is bound to Black House kernel v3', (t) => {
  t.is(BLACK_HOUSE_KERNEL.kernelVersion, '3.0.0');
  t.is(BLACK_HOUSE_KERNEL.controlPlane, 'THE_BLACK_HOUSE_V1');
  t.false(BLACK_HOUSE_KERNEL.controlPlaneRoot);
  t.is(BLACK_HOUSE_KERNEL.domainRoot, 'XUNIAverse');
  t.true(BLACK_HOUSE_OBJECT_TYPES.includes('Mission'));
  t.true(BLACK_HOUSE_RELATIONSHIP_TYPES.includes('GOVERNS'));
});

test('XUNIA domain object types translate to canonical kernel types', (t) => {
  t.is(toBlackHouseObjectType('REPOSITORY'), 'Repository');
  t.is(toBlackHouseObjectType('AGENT_IDENTITY'), 'Agent');
  t.is(toBlackHouseObjectType('COMPLIANCE_REQUIREMENT'), 'Policy');
  t.throws(() => toBlackHouseObjectType('UNKNOWN_TYPE'), {
    message: 'BLACK_HOUSE_UNREGISTERED_XUNIA_OBJECT:UNKNOWN_TYPE',
  });
});

test('unknown canonical relationships fail closed', (t) => {
  t.is(requireBlackHouseRelationship('AUDITS'), 'AUDITS');
  t.throws(() => requireBlackHouseRelationship('ROOTS'), {
    message: 'BLACK_HOUSE_UNREGISTERED_RELATIONSHIP:ROOTS',
  });
});
