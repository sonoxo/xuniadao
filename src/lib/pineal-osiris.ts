/**
 * XUNIA / Glass Onion contract for the already-merged GPT-Doug PINEAL-OSIRIS.
 *
 * This is an in-memory, read-only and deterministic adapter for sanitized
 * /api/status metadata. It NEVER fetches remote targets or ingests raw feeds.
 */
export const PINEAL_OSIRIS_ROUTES = [
  'health', 'earthquakes', 'fires', 'weather', 'air-quality',
  'space-weather', 'news', 'live-news', 'gdelt', 'markets',
] as const;

export type PinealOsirisRoute = typeof PINEAL_OSIRIS_ROUTES[number];
export type PinealOsirisStatus =
  'ONLINE' | 'DEGRADED' | 'STALE' | 'CLOCK_SKEW' | 'UNAVAILABLE';
export type PinealOsirisAction =
  'READ_PUBLIC_FEED_HEALTH'
  | 'OPEN_LOCAL_VISUAL'
  | 'PROPOSE_XUNIA_ONTOLOGY_RECORD'
  | 'IMPORT_RAW_CAMERA_OR_TRACK_DATA'
  | 'INVOKE_OSIRIS_RECON'
  | 'REMOTE_ACTUATION';

export interface PinealOsirisEvidence {
  readonly id: string;
  readonly type: 'PUBLIC_FEED_HEALTH';
  readonly route: PinealOsirisRoute;
  readonly status: PinealOsirisStatus;
  readonly observedAt: string | null;
  readonly source: 'gpt-doug.osiris-safe-mirror.v1';
  readonly latencyMs: number | null;
  readonly ageSeconds: number | null;
}

export interface PinealOsirisDecision {
  readonly decision: 'ALLOW' | 'REVIEW' | 'BLOCK';
  readonly reason: string;
  readonly humanApprovalRequired: boolean;
}

export const PINEAL_OSIRIS_XUNIA_CONTRACT = {
  id: 'XUNIA-PINEAL-OSIRIS-HEALTH-V1',
  version: '1.0.0',
  domain: 'XUNIA',
  command: '/glass osiris',
  controlPlane: 'sonoxo/gpt-doug-llm',
  sourcePath: 'integrations/pineal_osiris',
  sourcePullRequest: 341,
  upstreamOsiris: 'simplifaisoul/osiris',
  osirisLicense: 'MIT',
  scope: 'PUBLIC_FEED_HEALTH_METADATA_ONLY',
  transport: 'USER_AUTHORIZED_LOCAL_LOOPBACK',
  freshWithinSeconds: 600,
  rules: {
    noRawGeolocation: true,
    noCameraFrames: true,
    noFlightOrVesselTracks: true,
    noThirdPartyAssetControl: true,
    noProductionWrites: true,
    sourceAttributionRequired: true,
    explicitReviewForOntologyPromotion: true,
    noVendorAffiliationClaim: true,
  },
} as const;

const EXPECTED_PROVENANCE = 'gpt-doug.osiris-safe-mirror.v1';
const VALID_STATUS: readonly string[] = ['ONLINE', 'DEGRADED', 'STALE', 'CLOCK_SKEW', 'UNAVAILABLE'];

function objectOrNull(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Strictly copies known health fields; coordinates, subjects, arbitrary text and
 * embedded feed JSON cannot survive this normalizer. Never upgrades stale data. */
export function normalizePinealOsirisStatus(
  payload: unknown,
  nowMs: number = Date.now(),
  maxAgeSeconds: number = PINEAL_OSIRIS_XUNIA_CONTRACT.freshWithinSeconds
): PinealOsirisEvidence[] {
  if (!Number.isFinite(nowMs) || !Number.isInteger(maxAgeSeconds) ||
      maxAgeSeconds < 60 || maxAgeSeconds > 86400) return [];
  const root = objectOrNull(payload);
  const routes = objectOrNull(root && root.safe_routes);
  if (!routes) return [];
  const result: PinealOsirisEvidence[] = [];
  for (const route of PINEAL_OSIRIS_ROUTES) {
    const record = objectOrNull(routes[route]);
    if (!record || record.provenance !== EXPECTED_PROVENANCE ||
        typeof record.status !== 'string' || !VALID_STATUS.includes(record.status)) continue;
    const stamp = typeof record.last_check_utc === 'string' ? record.last_check_utc : '';
    const timeMs = stamp ? Date.parse(stamp) : NaN;
    const validTime = Number.isFinite(timeMs) && timeMs > 0;
    const ageSeconds = validTime ? Math.floor((nowMs - timeMs) / 1000) : null;
    let status = record.status as PinealOsirisStatus;
    if (!validTime) status = 'UNAVAILABLE';
    else if ((ageSeconds as number) < -300) status = 'CLOCK_SKEW';
    else if ((ageSeconds as number) > maxAgeSeconds) status = 'STALE';
    // Never turn an upstream DEGRADED/STALE into ONLINE based on a timestamp.
    const latency = record.latency_ms;
    const latencyMs = typeof latency === 'number' && Number.isInteger(latency) &&
                      latency >= 0 && latency <= 60000 ? latency : null;
    result.push({
      id: 'xunia:osiris:' + route,
      type: 'PUBLIC_FEED_HEALTH',
      route,
      status,
      observedAt: validTime ? new Date(timeMs).toISOString() : null,
      source: EXPECTED_PROVENANCE,
      latencyMs,
      ageSeconds,
    });
  }
  return result;
}

export function decidePinealOsirisAction(action: PinealOsirisAction): PinealOsirisDecision {
  switch (action) {
    case 'READ_PUBLIC_FEED_HEALTH':
    case 'OPEN_LOCAL_VISUAL':
      return { decision: 'ALLOW', reason: 'READ_ONLY_OPERATOR_VIEW', humanApprovalRequired: false };
    case 'PROPOSE_XUNIA_ONTOLOGY_RECORD':
      return { decision: 'REVIEW', reason: 'PROVENANCE_AND_HUMAN_REVIEW_REQUIRED', humanApprovalRequired: true };
    default:
      return { decision: 'BLOCK', reason: 'OUTSIDE_APPROVED_FEED_HEALTH_SCOPE', humanApprovalRequired: true };
  }
}
