import { strict as assert } from 'assert';
import {
  buildMissionTelemetryGraph,
  evaluateMissionTelemetryAction,
  MISSION_TELEMETRY_ONTOLOGY,
} from './mission-telemetry';

describe('mission telemetry ontology', () => {
  it('allows read and simulation actions', () => {
    assert.equal(evaluateMissionTelemetryAction('READ_PUBLIC_MISSION_DATA').decision, 'ALLOW');
    assert.equal(evaluateMissionTelemetryAction('SIMULATE_TELEMETRY').decision, 'ALLOW');
  });

  it('blocks flight control and actuation', () => {
    assert.equal(evaluateMissionTelemetryAction('FLIGHT_COMMAND').decision, 'BLOCK');
    assert.equal(evaluateMissionTelemetryAction('TELECOMMAND').reason, 'REAL_WORLD_FLIGHT_CONTROL_DISABLED');
    assert.equal(evaluateMissionTelemetryAction('ACTUATE').decision, 'BLOCK');
  });

  it('builds a Palantir-style object/link graph', () => {
    const graph = buildMissionTelemetryGraph([
      { id: 'launch-1', type: 'LAUNCH', properties: { name: 'Demo' }, provenance: ['source:public-api'] },
      { id: 'vehicle-1', type: 'VEHICLE', properties: { name: 'Example' }, provenance: ['source:public-api'] },
    ], [{ from: 'launch-1', relation: 'USES_VEHICLE', to: 'vehicle-1' }]);
    assert.equal(graph.objects.length, 2);
    assert.equal(graph.links[0].relation, 'USES_VEHICLE');
    assert.equal(MISSION_TELEMETRY_ONTOLOGY.controls.realWorldFlightControl, false);
  });
});
