import test from 'ava';

import {
  buildMissionTelemetryGraph,
  evaluateMissionTelemetryAction,
  MISSION_TELEMETRY_ONTOLOGY,
} from './mission-telemetry';

test('mission telemetry allows read and simulation actions', (t) => {
  t.is(evaluateMissionTelemetryAction('READ_PUBLIC_MISSION_DATA').decision, 'ALLOW');
  t.is(evaluateMissionTelemetryAction('SIMULATE_TELEMETRY').decision, 'ALLOW');
});

test('mission telemetry blocks flight control and actuation', (t) => {
  t.is(evaluateMissionTelemetryAction('FLIGHT_COMMAND').decision, 'BLOCK');
  t.is(evaluateMissionTelemetryAction('TELECOMMAND').reason, 'REAL_WORLD_FLIGHT_CONTROL_DISABLED');
  t.is(evaluateMissionTelemetryAction('ACTUATE').decision, 'BLOCK');
});

test('mission telemetry builds a Palantir-style object/link graph', (t) => {
  const graph = buildMissionTelemetryGraph([
    { id: 'launch-1', type: 'LAUNCH', properties: { name: 'Demo' }, provenance: ['source:public-api'] },
    { id: 'vehicle-1', type: 'VEHICLE', properties: { name: 'Example' }, provenance: ['source:public-api'] },
  ], [{ from: 'launch-1', relation: 'USES_VEHICLE', to: 'vehicle-1' }]);
  t.is(graph.objects.length, 2);
  t.is(graph.links[0].relation, 'USES_VEHICLE');
  t.false(MISSION_TELEMETRY_ONTOLOGY.controls.realWorldFlightControl);
});
