#!/usr/bin/env node

import fs from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/validate-civil-defense-scenario.mjs <scenario.json>');
  process.exit(2);
}

const scenario = JSON.parse(fs.readFileSync(file, 'utf8'));

const prohibitedKeys = new Set([
  'targetRanking',
  'optimalYield',
  'optimalBurstHeight',
  'casualtyMaximization',
  'strikeSequence',
  'weaponDesign',
  'targetSelection',
  'penetrationOptimization',
]);

function walk(value, path = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    if (prohibitedKeys.has(key)) {
      throw new Error(`prohibited offensive field at ${path}.${key}`);
    }
    walk(child, `${path}.${key}`);
  }
}

const allowedClasses = new Set([
  'preparedness-training',
  'medical-surge',
  'infrastructure-resilience',
  'shelter-planning',
  'evacuation-exercise',
  'recovery-planning',
]);

try {
  if (scenario.exerciseOnly !== true) {
    throw new Error('exerciseOnly must be true');
  }
  if (!scenario.scenarioId || typeof scenario.scenarioId !== 'string') {
    throw new Error('scenarioId is required');
  }
  if (!scenario.provider?.id || !scenario.provider?.version) {
    throw new Error('provider.id and provider.version are required');
  }
  if (!allowedClasses.has(scenario.scenarioClass)) {
    throw new Error(`unsupported scenarioClass: ${scenario.scenarioClass}`);
  }
  if (!Array.isArray(scenario.hazardZones) || scenario.hazardZones.length === 0) {
    throw new Error('at least one provider-supplied hazard zone is required');
  }
  if (!scenario.provenance?.source || !Array.isArray(scenario.provenance?.assumptions)) {
    throw new Error('provenance.source and provenance.assumptions are required');
  }

  walk(scenario);

  console.log(`SAFE_ADMISSION: ${scenario.scenarioId}`);
} catch (error) {
  console.error(`REJECTED: ${error.message}`);
  process.exit(1);
}
