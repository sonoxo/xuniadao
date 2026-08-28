import test from 'ava';

import {
  COLLECTIVE_CONTROL_FAMILIES,
  COLLECTIVE_CYBER_DEFENSE_ONTOLOGY,
  createCollectiveGapReport,
  evaluateCollectiveAlignment,
} from './collective-cyber-defense';

const base = {
  organization: 'sonoxo/xuniadao',
  control: 'LEAST_PRIVILEGE' as const,
  evidence: ['test:least-privilege'],
  authorized: true,
};

test('collective ontology uses official OpenAI evidence sources and roster count', (t) => {
  t.is(COLLECTIVE_CYBER_DEFENSE_ONTOLOGY.source.publisher, 'OpenAI');
  t.is(COLLECTIVE_CYBER_DEFENSE_ONTOLOGY.source.rosterCount, 128);
  t.is(COLLECTIVE_CYBER_DEFENSE_ONTOLOGY.source.xPost, 'https://x.com/OpenAI/status/2093074192636018977');
  t.true(COLLECTIVE_CYBER_DEFENSE_ONTOLOGY.claims.officialXuniaUpgrade);
  t.false(COLLECTIVE_CYBER_DEFENSE_ONTOLOGY.claims.partnershipClaim);
});

test('target alignment is allowed but evidence promotions require review', (t) => {
  t.is(evaluateCollectiveAlignment({ ...base, requestedState: 'TARGET', evidence: [] }), 'ALLOW');
  t.is(evaluateCollectiveAlignment({ ...base, requestedState: 'IMPLEMENTED' }), 'REVIEW');
  t.is(evaluateCollectiveAlignment({ ...base, requestedState: 'EVIDENCED' }), 'REVIEW');
  t.is(evaluateCollectiveAlignment({
    ...base,
    requestedState: 'EXTERNALLY_ATTESTED',
    attestationReference: 'assessor:report-1',
  }), 'REVIEW');
});

test('unsupported claims and promotions without evidence are blocked', (t) => {
  t.is(evaluateCollectiveAlignment({ ...base, requestedState: 'IMPLEMENTED', evidence: [] }), 'BLOCK');
  t.is(evaluateCollectiveAlignment({ ...base, requestedState: 'EXTERNALLY_ATTESTED' }), 'BLOCK');
  t.is(evaluateCollectiveAlignment({ ...base, requestedState: 'TARGET', partnershipClaim: true }), 'BLOCK');
  t.is(evaluateCollectiveAlignment({ ...base, requestedState: 'TARGET', certificationClaim: true }), 'BLOCK');
  t.is(evaluateCollectiveAlignment({ ...base, requestedState: 'TARGET', authorized: false }), 'BLOCK');
  t.is(evaluateCollectiveAlignment({ ...base, requestedState: 'TARGET', offensiveAction: true }), 'BLOCK');
});

test('gap report targets evidenced control coverage', (t) => {
  const gaps = createCollectiveGapReport({
    LEAST_PRIVILEGE: 'EVIDENCED',
    OBSERVABILITY: 'IMPLEMENTED',
    INCIDENT_RESPONSE: 'EXTERNALLY_ATTESTED',
  });
  t.is(COLLECTIVE_CONTROL_FAMILIES.length, 15);
  t.false(gaps.some((gap) => gap.control === 'LEAST_PRIVILEGE'));
  t.false(gaps.some((gap) => gap.control === 'INCIDENT_RESPONSE'));
  t.true(gaps.some((gap) => gap.control === 'OBSERVABILITY' && gap.currentState === 'IMPLEMENTED'));
  t.true(gaps.every((gap) => gap.targetState === 'EVIDENCED'));
});
