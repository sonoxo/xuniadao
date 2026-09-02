import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const viewport = document.getElementById('viewport')!;
const severity = document.getElementById('severity') as HTMLSelectElement;
const runBtn = document.getElementById('run') as HTMLButtonElement;
const briefBtn = document.getElementById('brief') as HTMLButtonElement;
const preset = document.getElementById('preset') as HTMLSelectElement;
const place = document.getElementById('place') as HTMLInputElement;
const popEl = document.getElementById('pop')!;
const hospEl = document.getElementById('hosp')!;
const infraEl = document.getElementById('infra')!;
const postureEl = document.getElementById('posture')!;
const briefingEl = document.getElementById('briefing')!;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d12);
scene.fog = new THREE.FogExp2(0x0b0d12, 0.0028);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 5000);
camera.position.set(115, 95, 150);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(0, 10, 0);
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 25;
controls.maxDistance = 450;

scene.add(new THREE.HemisphereLight(0x9ec8ff, 0x17130f, 1.7));
const sun = new THREE.DirectionalLight(0xffd7b0, 4.2);
sun.position.set(-140, 210, 100);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(900, 900, 80, 80),
  new THREE.MeshStandardMaterial({ color: 0x151a1d, roughness: 1, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const city = new THREE.Group();
scene.add(city);
const rng = mulberry32(24024);
for (let i = 0; i < 260; i++) {
  const x = (rng() - 0.5) * 420;
  const z = (rng() - 0.5) * 420;
  const dist = Math.hypot(x, z);
  if (dist < 38) continue;
  const h = 6 + rng() * (dist < 120 ? 72 : 28);
  const w = 4 + rng() * 11;
  const d = 4 + rng() * 11;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.56, 0.08, 0.14 + rng() * 0.09),
      roughness: 0.9,
      metalness: 0.1
    })
  );
  mesh.position.set(x, h / 2, z);
  city.add(mesh);
}

const roads = new THREE.GridHelper(900, 60, 0x33414a, 0x20282f);
roads.position.y = 0.03;
scene.add(roads);

const origin = new THREE.Vector3(0, 0.2, 0);
const marker = new THREE.Mesh(
  new THREE.CylinderGeometry(1.8, 1.8, 0.5, 32),
  new THREE.MeshStandardMaterial({ color: 0xff5b5b, emissive: 0x801818, emissiveIntensity: 2 })
);
marker.position.copy(origin);
scene.add(marker);

const rings: THREE.Mesh[] = [];
const plume = new THREE.Group();
scene.add(plume);

function makeRing(radius: number, color: number) {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.96, radius, 128),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.15;
  scene.add(mesh);
  rings.push(mesh);
}

function clearEffects() {
  for (const r of rings) scene.remove(r);
  rings.length = 0;
  plume.clear();
}

function runExercise() {
  clearEffects();
  const s = Number(severity.value);
  makeRing(24 * s, 0xff6d66);
  makeRing(42 * s, 0xffbe55);
  makeRing(68 * s, 0x66d9ff);

  const flash = new THREE.PointLight(0xffe9c9, 0, 550, 2);
  flash.position.set(origin.x, 18, origin.z);
  scene.add(flash);
  const flashStart = performance.now();

  for (let i = 0; i < 70; i++) {
    const radius = 3 + rng() * 18;
    const mat = new THREE.MeshStandardMaterial({
      color: i < 18 ? 0xe9d2b9 : 0x5e6267,
      transparent: true,
      opacity: 0.4 + rng() * 0.35,
      roughness: 1
    });
    const puff = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 10), mat);
    const y = 8 + i * 1.15 + rng() * 16;
    const spread = 8 + Math.min(52, y * 0.28);
    puff.position.set((rng() - 0.5) * spread, y, (rng() - 0.5) * spread);
    plume.add(puff);
  }

  const people = Math.round(9000 * s * s * (preset.value === 'dc' ? 1.8 : preset.value === 'norfolk' ? 1.25 : 1));
  const hospitals = Math.max(1, Math.round(s * 1.7));
  const infra = Math.max(1, Math.round(s * 2.4));
  popEl.textContent = people.toLocaleString();
  hospEl.textContent = String(hospitals);
  infraEl.textContent = String(infra);
  postureEl.textContent = s >= 4 ? 'ELEVATED' : 'READY';
  postureEl.className = s >= 4 ? 'danger' : 'good';

  function pulse(now: number) {
    const t = (now - flashStart) / 1000;
    flash.intensity = t < 0.25 ? 2400 * (1 - t / 0.25) : 0;
    rings.forEach((r, idx) => {
      const phase = Math.min(1, t / (1.2 + idx * 0.35));
      r.scale.setScalar(0.15 + phase * 0.85);
      (r.material as THREE.MeshBasicMaterial).opacity = 0.52 * (1 - Math.max(0, t - 1.8) / 4);
    });
    plume.rotation.y += 0.0025;
    if (t < 6) requestAnimationFrame(pulse); else scene.remove(flash);
  }
  requestAnimationFrame(pulse);
}

function generateBrief() {
  const s = Number(severity.value);
  const location = place.value.trim() || preset.options[preset.selectedIndex].text;
  const posture = s >= 4 ? 'elevated' : 'ready';
  briefingEl.textContent = [
    'GPT-DOUG-LLM / VIRGINIA-LLM',
    `Location: ${location}`,
    `Exercise posture: ${posture}`,
    `Priority: validate hospital surge, shelter availability, backup power, communications, and mutual-aid readiness.`,
    `AIP/Ontology: publish CivilDefenseScenario + ResponseProposal for human review.`,
    `Glass Onion: training-only policy enforced; no autonomous public actions.`
  ].join('\n');
}

preset.addEventListener('change', () => {
  place.value = preset.options[preset.selectedIndex].text;
  runExercise();
});
runBtn.addEventListener('click', runExercise);
briefBtn.addEventListener('click', generateBrief);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'h') {
    camera.position.set(115, 95, 150);
    controls.target.set(0, 10, 0);
  }
});

function resize() {
  const w = viewport.clientWidth;
  const h = viewport.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();
runExercise();
generateBrief();

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
