const typeFactor = { radiological: 1.15, industrial: 0.9, chemical: 1.05, wildfire: 1.2, grid: 0.75 };
const densityFactor = { sparse: 0.55, moderate: 1, dense: 1.8 };
const weatherFactor = { stable: 1, windy: 1.22, rain: 0.88 };

export function runScenario(input) {
  const type = input.type ?? 'radiological';
  const severity = Number(input.severity ?? 3);
  const populationContext = input.populationContext ?? 'moderate';
  const weather = input.weather ?? 'stable';
  const tf = typeFactor[type] ?? 1;
  const df = densityFactor[populationContext] ?? 1;
  const wf = weatherFactor[weather] ?? 1;

  const people = Math.round(11500 * severity * severity * df * wf * tf);
  const hospitals = Math.max(1, Math.round(severity * df * 1.4 * tf));
  const shelters = Math.max(2, Math.round(13 - severity * 1.3 + (2 - df)));
  const infrastructure = Math.max(1, Math.round(severity * 2.2 * wf * tf));

  const zones = [
    { id: 'Z1', category: 'immediate-response', radiusIndex: Number((0.62 * severity * tf).toFixed(2)), severityBand: 'high' },
    { id: 'Z2', category: 'protective-action', radiusIndex: Number((1.25 * severity * tf).toFixed(2)), severityBand: 'medium' },
    { id: 'Z3', category: 'monitoring-support', radiusIndex: Number((1.85 * severity * tf).toFixed(2)), severityBand: 'low' }
  ];

  const actions = [
    'Stage emergency medical and communications resources for review.',
    shelters < 7 ? 'Increase shelter capacity outside the core exercise zone.' : 'Validate shelter staffing and accessibility.',
    hospitals > 4 ? 'Activate hospital surge tabletop plan and mutual-aid review.' : 'Confirm hospital surge thresholds and transfer agreements.',
    infrastructure > 7 ? 'Prioritize backup power and infrastructure dependency checks.' : 'Verify critical-facility backup power readiness.',
    weather === 'windy' ? 'Increase downwind monitoring and public-information exercise injects.' : 'Maintain standard monitoring exercise cadence.'
  ];

  return {
    id: `XRA-${crypto.randomUUID()}`,
    type,
    severity,
    populationContext,
    weather,
    metrics: { peopleInExerciseZones: people, hospitalsUnderSurgePressure: hospitals, sheltersAvailable: shelters, criticalInfrastructureAtRisk: infrastructure },
    zones,
    recommendedActions: actions,
    provenance: {
      provider: 'xunia-resilience-synthetic-model',
      version: '0.2.0',
      purpose: 'training-and-emergency-planning-only',
      uncertainty: 'illustrative',
      generatedAt: new Date().toISOString()
    }
  };
}

export function toOntologyEnvelope(scenario) {
  return {
    schema: 'xunia.resilience-atlas.civil-defense-scenario.v1',
    ontologyObject: 'CivilDefenseScenario',
    objectId: scenario.id,
    properties: scenario,
    links: {
      hazardZones: scenario.zones.map(z => z.id),
      approvalState: 'PENDING_HUMAN_REVIEW'
    }
  };
}
