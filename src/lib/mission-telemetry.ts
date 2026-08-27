export type MissionTelemetryObjectType =
  | 'MISSION'
  | 'LAUNCH'
  | 'VEHICLE'
  | 'LAUNCHPAD'
  | 'PAYLOAD'
  | 'FPRIME_COMPONENT'
  | 'TELEMETRY_FRAME'
  | 'SOURCE_EVIDENCE';

export type MissionTelemetryAction =
  | 'READ_PUBLIC_MISSION_DATA'
  | 'NORMALIZE_ONTOLOGY'
  | 'READ_TELEMETRY'
  | 'SIMULATE_TELEMETRY'
  | 'EXPORT_EVIDENCE'
  | 'FLIGHT_COMMAND'
  | 'VEHICLE_COMMAND'
  | 'TELECOMMAND'
  | 'ACTUATE';

export interface MissionTelemetryObject {
  readonly id: string;
  readonly type: MissionTelemetryObjectType;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly provenance: readonly string[];
}

export interface MissionTelemetryLink {
  readonly from: string;
  readonly relation:
    | 'USES_VEHICLE'
    | 'LAUNCHES_FROM'
    | 'CARRIES_PAYLOAD'
    | 'EMITS_TELEMETRY'
    | 'SUPPORTED_BY_EVIDENCE';
  readonly to: string;
}

export interface MissionTelemetryDecision {
  readonly decision: 'ALLOW' | 'REVIEW' | 'BLOCK';
  readonly reason: string;
}

const READ_ONLY_ACTIONS: readonly MissionTelemetryAction[] = [
  'READ_PUBLIC_MISSION_DATA',
  'NORMALIZE_ONTOLOGY',
  'READ_TELEMETRY',
  'SIMULATE_TELEMETRY',
  'EXPORT_EVIDENCE',
];

const FLIGHT_CONTROL_ACTIONS: readonly MissionTelemetryAction[] = [
  'FLIGHT_COMMAND',
  'VEHICLE_COMMAND',
  'TELECOMMAND',
  'ACTUATE',
];

export const evaluateMissionTelemetryAction = (action: MissionTelemetryAction): MissionTelemetryDecision => {
  if (READ_ONLY_ACTIONS.includes(action)) {
    return { decision: 'ALLOW', reason: 'READ_OR_SIMULATION_ONLY' };
  }
  if (FLIGHT_CONTROL_ACTIONS.includes(action)) {
    return { decision: 'BLOCK', reason: 'REAL_WORLD_FLIGHT_CONTROL_DISABLED' };
  }
  return { decision: 'REVIEW', reason: 'UNCLASSIFIED_ACTION_REQUIRES_REVIEW' };
};

export const buildMissionTelemetryGraph = (
  objects: readonly MissionTelemetryObject[],
  links: readonly MissionTelemetryLink[] = [],
) => ({ objects: [...objects], links: [...links] });

export const MISSION_TELEMETRY_ONTOLOGY = {
  id: 'xunia-mission-telemetry-twin',
  name: 'XUNIA Mission Telemetry Twin',
  version: '1.0.0',
  command: '/glass mission',
  virginiaCommands: [
    'MISSION TWIN STATUS',
    'SPACEX LATEST',
    'SPACEX LAUNCHES',
    'FPRIME TELEMETRY <source>',
    'BRAIN UPDATE <url>',
    '<url> /// <url>',
  ],
  sources: [
    'sonoxo/SpaceX-APIxunia',
    'sonoxo/fprimeXUNIA-',
  ],
  objectTypes: [
    'MISSION',
    'LAUNCH',
    'VEHICLE',
    'LAUNCHPAD',
    'PAYLOAD',
    'FPRIME_COMPONENT',
    'TELEMETRY_FRAME',
    'SOURCE_EVIDENCE',
  ] as readonly MissionTelemetryObjectType[],
  pipeline: [
    'PUBLIC_MISSION_DATA',
    'FPRIME_SIM_TELEMETRY',
    'PROVENANCE_NORMALIZE',
    'XUNIA_ONTOLOGY',
    'VIRGINIA_QUERY',
    'VA3LM_REASON',
    'ZYRA_VERIFY',
    'HUMAN_REVIEW',
  ],
  controls: {
    publicOrAuthorizedDataOnly: true,
    simulationTelemetryOnly: true,
    provenanceRequired: true,
    humanReviewForConsequentialOutput: true,
    realWorldFlightControl: false,
    telecommandTransmission: false,
    vehicleActuation: false,
    vendorAffiliationClaim: false,
  },
} as const;
