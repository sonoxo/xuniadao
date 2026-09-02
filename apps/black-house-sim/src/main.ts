/// <reference types="vite/client" />

declare global { interface Window { google: any } }

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
const zoneInnerEl = $('zoneInner');
const zoneMiddleEl = $('zoneMiddle');
const zoneOuterEl = $('zoneOuter');
const fx = $('fx') as HTMLCanvasElement;
const ctx = fx.getContext('2d')!;

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
let fxRun = 0;

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
  if (!key) { setup.classList.add('show'); return; }
  try {
    await loadGoogleMaps(key);
    maps3d = await window.google.maps.importLibrary('maps3d');
    const geocoding = await window.google.maps.importLibrary('geocoding');
    geocoder = new geocoding.Geocoder();
    map = new maps3d.Map3DElement({
      center: { lat: current.lat, lng: current.lng, altitude: 0 },
      range: 6200,
      tilt: 68,
      heading: -12,
      mode: 'HYBRID',
      gestureHandling: 'GREEDY',
    });
    viewport.replaceChildren(map);
    resizeFx();
    runExercise();
    generateBrief();
  } catch (error) {
    console.error(error);
    setup.classList.add('show');
    const card = setup.querySelector('.setup-card');
    if (card) card.insertAdjacentHTML('beforeend', '<p class="small danger">Google Maps could not initialize. Verify API enablement, billing, browser-key restrictions, and 3D Maps availability.</p>');
  }
}

function clearOverlays() { overlays.forEach((el) => el.remove()); overlays = []; }

function circlePath(lat: number, lng: number, radiusMeters: number, points = 128) {
  const earth = 6_378_137;
  const latRad = lat * Math.PI / 180;
  return Array.from({ length: points }, (_, i) => {
    const a = (i / points) * Math.PI * 2;
    const dLat = (radiusMeters * Math.cos(a)) / earth;
    const dLng = (radiusMeters * Math.sin(a)) / (earth * Math.cos(latRad));
    return { lat: lat + dLat * 180 / Math.PI, lng: lng + dLng * 180 / Math.PI, altitude: 10 };
  });
}

function addZone(radiusMeters: number, fillColor: string, strokeColor: string) {
  const polygon = new maps3d.Polygon3DElement({
    path: circlePath(current.lat, current.lng, radiusMeters),
    altitudeMode: 'RELATIVE_TO_GROUND', fillColor, strokeColor, strokeWidth: 3, drawsOccludedSegments: true,
  });
  map.append(polygon); overlays.push(polygon);
}

function addOriginMarker() {
  const marker = new maps3d.Marker3DElement({
    position: { lat: current.lat, lng: current.lng, altitude: 75 }, altitudeMode: 'RELATIVE_TO_GROUND', extruded: true,
    label: 'EXERCISE ORIGIN', drawsWhenOccluded: true,
  });
  map.append(marker); overlays.push(marker);
}

function formatKm(meters: number) { return `${(meters / 1000).toFixed(meters < 1000 ? 2 : 1)} km`; }

function runExercise() {
  if (!map || !maps3d) return;
  clearOverlays();
  const s = Number(severity.value);
  const inner = 420 * s;
  const middle = 780 * s;
  const outer = 1280 * s;
  addZone(outer, '#38cfff20', '#68ddffdd');
  addZone(middle, '#ffc24728', '#ffc85ae8');
  addZone(inner, '#ff5e5e34', '#ff7468f5');
  addOriginMarker();

  map.center = { lat: current.lat, lng: current.lng, altitude: 0 };
  map.range = Math.max(4200, outer * 2.85);
  map.tilt = 68;

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
  zoneInnerEl.textContent = formatKm(inner);
  zoneMiddleEl.textContent = formatKm(middle);
  zoneOuterEl.textContent = formatKm(outer);
  animateCinematicFx(s);
}

function resizeFx() {
  const rect = fx.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  fx.width = Math.max(1, Math.round(rect.width * dpr));
  fx.height = Math.max(1, Math.round(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function animateCinematicFx(severityValue: number) {
  const runId = ++fxRun;
  const start = performance.now();
  const duration = 6200;
  const rect = fx.getBoundingClientRect();
  const cx = rect.width * 0.5;
  const cy = rect.height * 0.49;
  const maxR = Math.min(rect.width, rect.height) * (0.23 + severityValue * 0.035);
  const particles = Array.from({ length: 58 }, (_, i) => ({
    a: (i / 58) * Math.PI * 2 + Math.random() * .35,
    r: 10 + Math.random() * 36,
    y: Math.random() * 44,
    size: 8 + Math.random() * 24,
    drift: (Math.random() - .5) * 18,
  }));

  function frame(now: number) {
    if (runId !== fxRun) return;
    const t = Math.min(1, (now - start) / duration);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const flashT = Math.max(0, 1 - t / .075);
    if (flashT > 0) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rect.width, rect.height) * .7);
      g.addColorStop(0, `rgba(255,247,220,${.95 * flashT})`); g.addColorStop(.22, `rgba(255,197,110,${.52 * flashT})`); g.addColorStop(1, 'rgba(255,140,70,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, rect.width, rect.height);
    }

    const waveT = Math.min(1, t / .42);
    const waveR = 14 + maxR * waveT;
    ctx.beginPath(); ctx.arc(cx, cy, waveR, 0, Math.PI * 2); ctx.strokeStyle = `rgba(255,245,220,${.72 * (1-waveT)})`; ctx.lineWidth = 8 * (1-waveT) + 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, waveR * 1.18, 0, Math.PI * 2); ctx.strokeStyle = `rgba(105,220,255,${.35 * (1-waveT)})`; ctx.lineWidth = 3; ctx.stroke();

    const plumeT = Math.min(1, Math.max(0, (t - .035) / .56));
    particles.forEach((p, i) => {
      const rise = plumeT * (38 + p.y + severityValue * 12);
      const spread = p.r * (.55 + plumeT * 1.2);
      const x = cx + Math.cos(p.a) * spread + p.drift * plumeT;
      const y = cy - rise + Math.sin(p.a) * spread * .18;
      const alpha = Math.max(0, .32 * (1 - Math.max(0, t - .68) / .32));
      const warm = i < 12 && t < .22;
      ctx.beginPath(); ctx.arc(x, y, p.size * (.45 + plumeT * .9), 0, Math.PI * 2);
      ctx.fillStyle = warm ? `rgba(255,190,115,${alpha})` : `rgba(170,178,190,${alpha * .7})`; ctx.fill();
    });

    if (t < 1) requestAnimationFrame(frame); else ctx.clearRect(0, 0, rect.width, rect.height);
  }
  requestAnimationFrame(frame);
}

function generateBrief() {
  const s = Number(severity.value);
  briefingEl.textContent = [
    'GPT-DOUG-LLM / VIRGINIA-LLM', `Location: ${current.label}`, `Exercise severity: ${s}/5`,
    'Modeled view: severe pressure, thermal exposure, shockwave watch, population band, hospital surge, and infrastructure risk.',
    'Priority: shelter readiness, hospital surge, backup power, communications, transport continuity, and mutual aid.',
    'AIP/Ontology: stage CivilDefenseScenario and ResponseProposal for human review.',
    'Glass Onion: training-only governance active; no autonomous operational action.'
  ].join('\n');
}

async function moveToAddress(address: string) {
  if (!geocoder || !address.trim()) return;
  const response = await geocoder.geocode({ address: address.trim() });
  const first = response.results?.[0]; if (!first) throw new Error('Place not found');
  current = { label: first.formatted_address ?? address.trim(), lat: first.geometry.location.lat(), lng: first.geometry.location.lng() };
  place.value = current.label; runExercise(); generateBrief();
}

form.addEventListener('submit', async (event) => { event.preventDefault(); try { await moveToAddress(place.value); } catch (error) { console.error(error); } });
preset.addEventListener('change', () => { current = { ...PRESETS[preset.value] }; place.value = current.label; runExercise(); generateBrief(); });
runBtn.addEventListener('click', runExercise); briefBtn.addEventListener('click', generateBrief); severity.addEventListener('change', runExercise);
window.addEventListener('resize', resizeFx);
window.addEventListener('keydown', (event) => { if (event.key.toLowerCase() === 'r') runExercise(); });

void boot();
export {};
