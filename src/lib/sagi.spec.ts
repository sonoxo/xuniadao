import test from 'ava';

import { evaluateSAGI, SAGI } from './sagi';
import { hasSuperAgentCapability, SUPER_AGENT } from './super-agent';

test('VA3LM SAGI identity and super-agent capabilities are locked', (t) => {
  t.is(SAGI.command, '/VA3LM-SAGI');
  t.is(SAGI.expandedName, 'SUPER ARTIFICIAL GUARDRAIL INTELLIGENCE');
  t.is(SUPER_AGENT.runtime, 'http://127.0.0.1:8088');
  t.true(hasSuperAgentCapability('CADENCE_FLOW'));
  t.true(hasSuperAgentCapability('PALANTIR_ACTION_MODEL'));
  t.true(hasSuperAgentCapability('IBM_QUANTUM_BLUEPRINT'));
});

test('SAGI fast path allows non-mutating engineering intelligence', (t) => {
  const result = evaluateSAGI({ capability: 'CADENCE_FLOW' });
  t.is(result.decision, 'ALLOW');
  t.false(result.humanApprovalRequired);
});

test('SAGI routes consequential actions to command review', (t) => {
  const repo = evaluateSAGI({
    capability: 'CODE_GENERATION',
    mutatesRepository: true,
  });
  const signing = evaluateSAGI({
    capability: 'CADENCE_FLOW',
    signsFlowTransaction: true,
  });
  const deploy = evaluateSAGI({
    capability: 'CI_VALIDATION',
    deploysProduction: true,
  });

  t.is(repo.decision, 'REVIEW');
  t.is(signing.decision, 'REVIEW');
  t.is(deploy.decision, 'REVIEW');
});

test('SAGI blocks automatic fund movement', (t) => {
  const result = evaluateSAGI({
    capability: 'CADENCE_FLOW',
    movesFunds: true,
  });
  t.is(result.decision, 'BLOCK');
  t.true(result.humanApprovalRequired);
});
