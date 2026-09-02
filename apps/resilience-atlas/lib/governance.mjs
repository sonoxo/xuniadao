const prohibitedKeys = [
  'target','targeting','weapon','warhead','yield','burstHeight','burst_height','penetration',
  'strikeSequence','strike_sequence','casualtyMaximization','casualty_maximization'
];

export function assertSafeScenario(input = {}) {
  const text = JSON.stringify(input).toLowerCase();
  for (const key of prohibitedKeys) {
    if (text.includes(key.toLowerCase())) {
      const err = new Error(`Scenario rejected by XUNIA governance: prohibited field or intent '${key}'.`);
      err.statusCode = 400;
      throw err;
    }
  }
  const severity = Number(input.severity ?? 3);
  if (!Number.isInteger(severity) || severity < 1 || severity > 5) {
    const err = new Error('severity must be an integer from 1 through 5');
    err.statusCode = 400;
    throw err;
  }
  return {
    ...input,
    severity,
    governance: {
      mode: 'safe-exercise',
      humanApprovalRequired: true,
      autonomousPublicAlerting: false,
      autonomousResponderDispatch: false
    }
  };
}

export function approvalRequired(action) {
  return {
    id: `APR-${crypto.randomUUID()}`,
    action,
    state: 'PENDING_HUMAN_REVIEW',
    createdAt: new Date().toISOString()
  };
}
