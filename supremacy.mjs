const stage = document.querySelector('.stage');

if (stage && !document.getElementById('supremacy-fx')) {
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = './supremacy.css';
  document.head.append(styleLink);

  const canvas = document.createElement('canvas');
  canvas.id = 'supremacy-fx';
  canvas.setAttribute('aria-hidden', 'true');
  stage.append(canvas);

  const hud = document.createElement('div');
  hud.className = 'supremacy-hud';
  hud.setAttribute('aria-hidden', 'true');
  hud.innerHTML = `
    <div class="supremacy-crown"><span class="supremacy-kicker">XUNIA / CONSTELLATION ENGINE</span><b>PLANETARY COMMAND SURFACE</b><i></i></div>
    <div class="supremacy-matrix">
      <span class="matrix-title">SYSTEM MATRIX</span>
      <div><small>WORLD</small><b>X-01</b></div>
      <div><small>NODES</small><b id="supremacy-nodes">--</b></div>
      <div><small>RENDER</small><b>VECTOR / 3D</b></div>
      <div><small>STATE</small><b class="nominal">NOMINAL</b></div>
      <div><small>FOCUS</small><b id="supremacy-focus">XUNIADAO</b></div>
      <div><small>PULSE</small><b id="supremacy-pulse">00.00</b></div>
    </div>
    <div class="supremacy-legend"><span><i></i> CONSTELLATION ONLINE</span><span>FICTIONAL WORLD / LOCAL SIMULATION</span></div>
    <div class="supremacy-reticle"><i></i><i></i><i></i><i></i></div>
  `;
  stage.append(hud);

  const ctx = canvas.getContext('2d', { alpha: true });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  const stars = Array.from({ length: 92 }, (_, i) => ({
    x: ((i * 73) % 997) / 997,
    y: ((i * 191 + 41) % 991) / 991,
    r: .35 + ((i * 17) % 9) / 12,
    a: .08 + ((i * 29) % 13) / 42,
  }));

  let dpr = 1;
  let width = 1;
  let height = 1;
  let lastFrame = 0;
  let visible = true;

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(devicePixelRatio || 1, mobile.matches ? 1.25 : 1.75);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function ring(cx, cy, rx, ry, rotation, alpha, dash = []) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.setLineDash(dash);
    ctx.strokeStyle = `rgba(121,232,242,${alpha})`;
    ctx.lineWidth = .8;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function tickMarks(cx, cy, radius, time) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(reduced.matches ? 0 : time * .000035);
    for (let i = 0; i < 72; i++) {
      const angle = i / 72 * Math.PI * 2;
      const major = i % 6 === 0;
      const inner = radius + (major ? 13 : 17);
      const outer = radius + 22;
      ctx.strokeStyle = major ? 'rgba(183,239,122,.32)' : 'rgba(121,232,242,.10)';
      ctx.lineWidth = major ? 1 : .6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw(time) {
    requestAnimationFrame(draw);
    if (!visible) return;
    const frameLimit = mobile.matches ? 1000 / 24 : 1000 / 40;
    if (time - lastFrame < frameLimit) return;
    lastFrame = time;

    ctx.clearRect(0, 0, width, height);
    const cx = width * .52;
    const cy = height * .51;
    const r = Math.min(width, height) * .31;

    for (const star of stars) {
      const shimmer = reduced.matches ? 0 : Math.sin(time * .0011 + star.x * 18) * .08;
      ctx.fillStyle = `rgba(195,238,246,${Math.max(.03, star.a + shimmer)})`;
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const drift = reduced.matches ? 0 : time * .000045;
    ring(cx, cy, r * 1.17, r * .34, -.28 + drift, .12, [4, 10]);
    ring(cx, cy, r * 1.23, r * .48, .62 - drift * .8, .09, [1, 13]);
    ring(cx, cy, r * 1.08, r * .22, 1.16 + drift * .55, .10, [8, 12]);
    tickMarks(cx, cy, r, time);

    const scan = reduced.matches ? -.55 : time * .00022;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(scan);
    const beam = ctx.createLinearGradient(r * .2, 0, r * 1.15, 0);
    beam.addColorStop(0, 'rgba(121,232,242,0)');
    beam.addColorStop(.75, 'rgba(121,232,242,.05)');
    beam.addColorStop(1, 'rgba(183,239,122,.28)');
    ctx.strokeStyle = beam;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(r * .18, 0);
    ctx.lineTo(r * 1.15, 0);
    ctx.stroke();
    ctx.restore();

    const pulse = 6 + Math.sin(time * .0022) * 2.4;
    ctx.strokeStyle = 'rgba(183,239,122,.24)';
    ctx.lineWidth = .8;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 28 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    const pulseReadout = document.getElementById('supremacy-pulse');
    if (pulseReadout) pulseReadout.textContent = `${(99.4 + (Math.sin(time * .0017) + 1) * .28).toFixed(2)}`;
  }

  function refreshData() {
    const count = document.getElementById('total-count')?.textContent?.trim();
    const active = document.querySelector('.project-row.active b')?.textContent?.trim() || document.getElementById('project-title')?.textContent?.trim();
    const nodes = document.getElementById('supremacy-nodes');
    const focus = document.getElementById('supremacy-focus');
    if (nodes && count) nodes.textContent = count.padStart(2, '0');
    if (focus && active) focus.textContent = active.slice(0, 18).toUpperCase();
  }

  function refreshMode() {
    visible = document.getElementById('world-tab')?.getAttribute('aria-pressed') !== 'false';
    canvas.hidden = !visible;
    hud.hidden = !visible;
  }

  const observer = new MutationObserver(() => {
    refreshData();
    refreshMode();
  });
  observer.observe(stage, { subtree: true, attributes: true, childList: true, characterData: true, attributeFilter: ['class', 'aria-pressed'] });
  addEventListener('resize', resize, { passive: true });
  resize();
  refreshData();
  refreshMode();
  requestAnimationFrame(draw);
}
