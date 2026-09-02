/// <reference types="vite/client" />

declare global {
  interface Window { google: any }
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const viewport = $('viewport');
const setup = $('setup');
const form = $('place-search') as HTMLFormElement;
const place = $('place') as HTMLInputElement;
const preset = $('preset') as HTMLSelectElement;
const severity = $('severity') as HTMLSelectElement;
const runBtn = $('run') as HTMLButtonElement;
const briefBtn = $('brief') as HTMLButtonElement;
const locationEl = $('location');
const popEl = $('pop');
const hospEl = $('hosp');
const infraEl = $('infra');
const postureEl = $('posture');
const briefingEl = $('briefing');

const PRESETS: Record<string, { label: string; lat: number; lng: number }> = {
  richmond: { label: 'Richmond, VA', lat: 37.5407, lng: -77.4360 },
  dc: { label: 'Washington, DC', lat: 38.9072, lng: -77.0369 },
  norfolk: { label: 'Norfolk, VA', lat: 36.8508, lng: -76.2859 },
  nyc: { label: 'New York, NY', lat: 40.7128, lng: -74.0060 },
};

let map: any;
let geocoder: any;
let maps3d: any;
let current = { ...PRESETS.richmond };
let overlays: HTMLElement[] = [];

async function loadGoogleMaps(key: string) {
  if (window.google?.maps) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&v=weekly`;
    script.async = true;
    script.onerror = () => reject(new Error('Google Maps JavaScript API failed to load'));
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

async function boot() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    setup.classList.add('show');
    return;
  }

  try {
    await loadGoogleMaps(key);
    maps3d = await window.google.maps.importLibrary('maps3d');
    const geocoding = await window.google.maps.importLibrary('geocoding');
    geocoder = new geocoding.Geocoder();

    map = new maps3d.Map3DElement({
      center: { lat: current.lat, lng: current.lng, altitude: 0 },
      range: 6200,
      tilt: 67.5,
      heading: 0,
      mode: 'HYBRID',
      gestureHandling: 'GREEDY',
    });
    viewport.replaceChildren(map);
    runExercise();
    generateBrief();
  } catch (error) {
    console.error(error);
    setup.classList.add('show');
    const card = setup.querySelector('.setup-card');
    if (card) card.insertAdjacentHTML('beforeend', '<p class="small danger">Google Maps could not initialize. Verify API enablement, billing, key restrictions, and 3D Maps availability.</p>');
  }
}

function clearOverlays() {
  overlays.forEach((el) => el.remove());
  overlays = [];
}

function circlePath(lat: number, lng: number, radiusMeters: number, points = 96) {
  const earth = 6_378_137;
  const latRad = lat * Math.PI / 180;
  return Array.from({ length: points }, (_, i) => {
    const a = (i / points) * Math.PI * 2;
    const dLat = (radiusMeters * Math.cos(a)) / earth;
    const dLng = (radiusMeters * Math.sin(a)) / (earth * Math.cos(latRad));
    return {
      lat: lat + dLat * 180 / Math.PI,
      lng: lng + dLng * 180 / Math.PI,
      altitude: 8,
    };
  });
}

function addZone(radiusMeters: number, fillColor: string, strokeColor: string) {
  const polygon = new maps3d.Polygon3DElement({
    path: circlePath(current.lat, current.lng, radiusMeters),
    altitudeMode: 'RELATIVE_TO_GROUND',
    fillColor,
    strokeColor,
    strokeWidth: 3,
    drawsOccludedSegments: true,
  });
  map.append(polygon);
  overlays.push(polygon);
}

function addOriginMarker() {
  const marker = new maps3d.Marker3DElement({
    position: { lat: current.lat, lng: current.lng, altitude: 60 },
    altitudeMode: 'RELATIVE_TO_GROUND',
    extruded: true,
    label: 'EXERCISE ORIGIN',
    drawsWhenOccluded: true,
  });
  map.append(marker);
  overlays.push(marker);
}

function runExercise() {
  if (!map || !maps3d) return;
  clearOverlays();
  const s = Number(severity.value);

  const inner = 450 * s;
  const middle = 820 * s;
  const outer = 1320 * s;
  addZone(outer, '#36c7ff22', '#5ed9ffcc');
  addZone(middle, '#ffc2472b', '#ffc247dd');
  addZone(inner, '#ff5e5e32', '#ff7068ee');
  addOriginMarker();

  map.center = { lat: current.lat, lng: current.lng, altitude: 0 };
  map.range = Math.max(4200, outer * 2.9);
  map.tilt = 67.5;

  const densityFactor = current.label.includes('New York') ? 2.1 : current.label.includes('Washington') ? 1.6 : current.label.includes('Norfolk') ? 1.15 : 1;
  const people = Math.round(7600 * s * s * densityFactor);
  const hospitals = Math.max(1, Math.round(s * 1.6 * Math.min(densityFactor, 1.5)));
  const infra = Math.max(1, Math.round(s * 2.2));

  locationEl.textContent = current.label;
  popEl.textContent = people.toLocaleString();
  hospEl.textContent = String(hospitals);
  infraEl.textContent = String(infra);
  postureEl.textContent = s >= 4 ? 'ELEVATED' : 'READY';
  postureEl.className = s >= 4 ? 'danger' : 'good';
}

function generateBrief() {
  const s = Number(severity.value);
  briefingEl.textContent = [
    'GPT-DOUG-LLM / VIRGINIA-LLM',
    `Location: ${current.label}`,
    `Exercise severity: ${s}/5`,
    `Priority: hospital surge, shelter readiness, backup power, communications, transport continuity, and mutual aid.`,
    `AIP/Ontology: stage CivilDefenseScenario and ResponseProposal for human review.`,
    `Glass Onion: training-only governance active; no autonomous operational action.`
  ].join('\n');
}

async function moveToAddress(address: string) {
  if (!geocoder || !address.trim()) return;
  const response = await geocoder.geocode({ address: address.trim() });
  const first = response.results?.[0];
  if (!first) throw new Error('Place not found');
  const lat = first.geometry.location.lat();
  const lng = first.geometry.location.lng();
  current = { label: first.formatted_address ?? address.trim(), lat, lng };
  place.value = current.label;
  runExercise();
  generateBrief();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  try { await moveToAddress(place.value); }
  catch (error) { console.error(error); }
});

preset.addEventListener('change', () => {
  current = { ...PRESETS[preset.value] };
  place.value = current.label;
  runExercise();
  generateBrief();
});

runBtn.addEventListener('click', runExercise);
briefBtn.addEventListener('click', generateBrief);
severity.addEventListener('change', runExercise);

void boot();

export {};
