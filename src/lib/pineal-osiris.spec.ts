import test from 'ava';
import {
  decidePinealOsirisAction,
  normalizePinealOsirisStatus,
  PINEAL_OSIRIS_ROUTES,
  PINEAL_OSIRIS_XUNIA_CONTRACT,
} from './pineal-osiris';

const NOW = Date.parse('2026-10-12T20:00:00.000Z');
const evidence = (observed = '2026-10-12T19:59:20.000Z') => ({
  safe_routes: {
    earthquakes: {
      status: 'ONLINE',
      last_check_utc: observed,
      latency_ms: 120,
      provenance: 'gpt-doug.osiris-safe-mirror.v1',
      hidden_track: { lat: 34.02, lon: -117.89, asset: 'restricted' },
    },
    cctv: {
      status: 'ONLINE',
      last_check_utc: observed,
      provenance: 'gpt-doug.osiris-safe-mirror.v1',
      image: 'raw-camera-frame',
    },
  },
  other_data: {
    flights: [{ coordinates: [0, 1] }],
  },
});

test('normalizes only public allowed source health, without leaking raw data', (t) => {
  const records = normalizePinealOsirisStatus(evidence(), NOW);
  t.is(records.length, 1);
  t.is(records[0].id, 'xunia:osiris:earthquakes');
  t.is(records[0].status, 'ONLINE');
  t.is(records[0].latencyMs, 120);
  t.false(JSON.stringify(records).includes('restricted'));
  t.false(JSON.stringify(records).includes('coordinates'));
  t.false(JSON.stringify(records).includes('raw-camera-frame'));
});

test('recomputes stale status even when upstream says ONLINE', (t) => {
  const records = normalizePinealOsirisStatus(evidence('2026-10-12T19:00:00.000Z'), NOW);
  t.is(records[0].status, 'STALE');
});

test('clock skew fails closed instead of reporting live', (t) => {
  const records = normalizePinealOsirisStatus(evidence('2026-10-12T20:30:00.000Z'), NOW);
  t.is(records[0].status, 'CLOCK_SKEW');
});

test('untrusted, missing and invalid records never promote to verified health', (t) => {
  t.deepEqual(normalizePinealOsirisStatus(null, NOW), []);
  t.deepEqual(normalizePinealOsirisStatus({ safe_routes: { earthquakes: {
    status: 'ONLINE', last_check_utc: 'today', provenance: 'untrusted',
  } } }, NOW), []);
  const records = normalizePinealOsirisStatus(evidence('nonsense'), NOW);
  t.is(records[0].status, 'UNAVAILABLE');
});

test('control plane allows observation, but reviews writes and blocks recon', (t) => {
  t.is(decidePinealOsirisAction('READ_PUBLIC_FEED_HEALTH').decision, 'ALLOW');
  t.is(decidePinealOsirisAction('OPEN_LOCAL_VISUAL').decision, 'ALLOW');
  t.is(decidePinealOsirisAction('PROPOSE_XUNIA_ONTOLOGY_RECORD').decision, 'REVIEW');
  t.is(decidePinealOsirisAction('IMPORT_RAW_CAMERA_OR_TRACK_DATA').decision, 'BLOCK');
  t.is(decidePinealOsirisAction('INVOKE_OSIRIS_RECON').decision, 'BLOCK');
  t.is(decidePinealOsirisAction('REMOTE_ACTUATION').decision, 'BLOCK');
});

test('source is attributed without an affiliation claim', (t) => {
  t.true(PINEAL_OSIRIS_ROUTES.includes('earthquakes'));
  t.false(PINEAL_OSIRIS_XUNIA_CONTRACT.rules.noVendorAffiliationClaim === false);
  t.is(PINEAL_OSIRIS_XUNIA_CONTRACT.sourcePullRequest, 341);
});
