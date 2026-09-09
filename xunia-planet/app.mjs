import { FACTIONS, createBattleState, reinforce, mobilize, engage, endTurn, resetBattle } from "./battle.mjs";

const SECTORS = [
  ["core", "XUNIA Core", "#b7ef7a"], ["ai", "AI & Compute", "#bc9cff"], ["earth", "Earth & Space", "#79e8f2"],
  ["security", "Security & Systems", "#ff9a72"], ["creative", "Media & Worlds", "#e79bc7"], ["infra", "Infrastructure", "#88b8f0"],
];
const SNAPSHOT = `gpt-doug-llm xuniadao flow-ai-tools AlmightySonoxo hermes-agent ZYRAxAlgorithm fprimeXUNIA- CPXSimpleSat hounddogZyra CyberStrikeZYRA Cap soundcloudopen xrpl.jsXUNIA ZyraWifi cloudcomplyXUNIA zyra NASA-3D-ResourcesXUNIA- aip-community-registry-zyra xrpl4jXUNIA ml-agents MMGISxunia- theredhouse thegreenhouse XRPL-StandardsXUNIA- AIT-CoreXUNIA godotXUNIA gods-eye-viewXUNIA SpaceX-APIxunia eyeris pentestcode VICARxunia pymss-studio langchain GDK satsim earthaccessXUNIA- gopher-scanXUNIA toybox plandevXUNIA- TrackerComponentLibrary osirisanon xrpl-dev-portalXUNIA openai-pythonXUNIA SeaRay openclawXUNIA rippledXUNIA continue gargoyle-mission-control SuperAGI instructionsXUNIA- xuniapentest gargoyle-crm api-docsXUNIA`.split(" ");
const $ = (id) => document.getElementById(id);
const hash = (text) => { let h = 2166136261; for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
function classify(name) {
  if (/earth|nasa|spacex|fprime|mmgis|vicar|sat|searay|plandev/i.test(name)) return "earth";
  if (/gpt|llm|agent|langchain|openai|openclaw|learning|superagi|continue|flow-ai/i.test(name)) return "ai";
  if (/zyra|cyber|pentest|ghidra|secure|proxy|guard|defcon/i.test(name)) return "security";
  if (/sound|youtube|pymss|godot|gargoyle|gdk|cap$|toybox|eyeris/i.test(name)) return "creative";
  if (/xunia|house|almightysonoxo/i.test(name)) return "core";
  return "infra";
}
const sector = (id) => SECTORS.find((s) => s[0] === id) || SECTORS[5];
function normalizeRepo(repo) {
  const name = String(repo.name || "").slice(0, 100);
  if (!/^[A-Za-z0-9_.-]+$/.test(name)) return null;
  return {
    name, full_name: `sonoxo/${name}`, sector: classify(name), description: String(repo.description || "").slice(0, 300),
    language: repo.language || null, fork: repo.fork === true, archived: repo.archived === true,
    html_url: `https://github.com/sonoxo/${name}`, homepage: /^https:\/\//.test(repo.homepage || "") ? repo.homepage : null,
  };
}
let projects = SNAPSHOT.map((name) => normalizeRepo({ name }));
let activeSector = "all", selected = projects.find((p) => p.name === "xuniadao") || projects[0];
let mode = "world";

function esc(text) { return String(text).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
function toast(message) { const el = $("toast"); el.textContent = message; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 2600); }
function filteredProjects() {
  const q = $("search").value.trim().toLowerCase();
  return projects.filter((p) => (activeSector === "all" || p.sector === activeSector) && (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)));
}
function renderRegistry() {
  $("total-count").textContent = projects.length;
  const counts = Object.fromEntries(SECTORS.map(([id]) => [id, projects.filter((p) => p.sector === id).length]));
  $("sectors").innerHTML = `<button class="sector-row ${activeSector === "all" ? "active" : ""}" data-sector="all"><span class="sector-dot" style="background:#91a3ad"></span><span>All sectors</span><b>${projects.length}</b></button>` + SECTORS.map(([id,name,color]) => `<button class="sector-row ${activeSector === id ? "active" : ""}" data-sector="${id}"><span class="sector-dot" style="background:${color}"></span><span>${name}</span><b>${counts[id]}</b></button>`).join("");
  const rows = filteredProjects(); $("visible-count").textContent = rows.length;
  $("project-list").innerHTML = rows.slice(0, 80).map((p) => `<button class="project-row ${selected?.name === p.name ? "active" : ""}" data-project="${esc(p.name)}"><span class="sector-dot" style="background:${sector(p.sector)[2]}"></span><span><b>${esc(p.name)}</b><small>${esc(sector(p.sector)[1])}</small></span></button>`).join("");
  $("directory-grid").innerHTML = rows.map((p) => `<article class="project-card"><span class="sector-dot" style="background:${sector(p.sector)[2]}"></span> <b>${esc(p.name)}</b><p>${esc(p.description || `${sector(p.sector)[1]} repository in the Sonoxo catalog.`)}</p><a href="${p.html_url}" target="_blank" rel="noopener noreferrer">Open repository &#8599;</a></article>`).join("");
  document.querySelectorAll("[data-sector]").forEach((b) => b.onclick = () => { activeSector = b.dataset.sector; renderRegistry(); });
  document.querySelectorAll("[data-project]").forEach((b) => b.onclick = () => selectProject(b.dataset.project));
}
function selectProject(name) {
  const p = projects.find((x) => x.name === name); if (!p) return; selected = p; renderRegistry(); renderInspector();
  if (mode !== "battle") setMode("world");
}
function renderInspector() {
  if (!selected) return; const s = sector(selected.sector);
  $("project-sector").textContent = s[1]; $("project-sector").style.color = s[2]; $("project-sector").style.borderColor = `${s[2]}66`;
  $("project-title").textContent = selected.name; $("project-description").textContent = selected.description || `${s[1]} project indexed from the public Sonoxo GitHub catalog.`;
  $("project-language").textContent = selected.language || "Not loaded"; $("project-visibility").textContent = "Public"; $("project-kind").textContent = selected.fork ? "Fork" : selected.archived ? "Archived" : "Indexed";
  $("repo-link").href = selected.html_url;
  const links = JSON.parse(localStorage.getItem("xunia-project-links") || "{}"); const web = selected.homepage || links[selected.name];
  $("website-link").hidden = !web; if (web) $("website-link").href = web;
  $("world-caption").textContent = `${selected.name} is shown at a stable fictional position.`;
}

async function syncGitHub() {
  $("sync").disabled = true; $("sync").textContent = "Syncing...";
  try {
    const all = [];
    for (let page = 1; page <= 10; page++) {
      const r = await fetch(`https://api.github.com/users/sonoxo/repos?per_page=100&page=${page}&type=owner&sort=full_name`, { headers: { Accept: "application/vnd.github+json" } });
      if (!r.ok) throw new Error(`GitHub HTTP ${r.status}`); const batch = await r.json(); all.push(...batch); if (batch.length < 100) break;
    }
    projects = all.filter((r) => !r.private).map(normalizeRepo).filter(Boolean); selected = projects.find((p) => p.name === selected?.name) || projects[0];
    $("source").textContent = "LIVE PUBLIC GITHUB"; $("source-message").textContent = `${projects.length} public repositories loaded. Runtime connectivity is not implied.`;
    renderRegistry(); renderInspector(); toast("Public GitHub catalog refreshed.");
  } catch (error) { $("source").textContent = "SNAPSHOT / OFFLINE"; $("source-message").textContent = "GitHub sync unavailable; verified snapshot retained."; toast(error.message || "GitHub sync unavailable."); }
  finally { $("sync").disabled = false; $("sync").innerHTML = `Sync GitHub <span aria-hidden="true">&#8599;</span>`; }
}

const canvas = $("overlay"), base = $("planet"), ctx = canvas.getContext("2d"), bctx = base.getContext("2d");
let yaw = .35, pitch = -.18, zoom = 1, orbit = true, dragging = false, pointer = [0,0], layer = 0, projected = [];
function rotate3(p) { const [x0,y0,z0] = p; const x1 = Math.cos(yaw)*x0 + Math.sin(yaw)*z0, z1 = -Math.sin(yaw)*x0 + Math.cos(yaw)*z0; return [x1, Math.cos(pitch)*y0 - Math.sin(pitch)*z1, Math.sin(pitch)*y0 + Math.cos(pitch)*z1]; }
function nodePosition(name) { const a = hash(name), b = hash(`${name}:b`); const lon = (a % 3600)/3600*Math.PI*2, lat = (((b%1000)/1000)-.5)*Math.PI*.9; return [Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon)]; }
function resize() { const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1,2); for (const c of [canvas,base]) { c.width = Math.max(1,Math.floor(r.width*d)); c.height = Math.max(1,Math.floor(r.height*d)); c.getContext("2d").setTransform(d,0,0,d,0,0); } }
function drawWorld() {
  const w=canvas.clientWidth,h=canvas.clientHeight,cx=w*.52,cy=h*.51,r=Math.min(w,h)*.31*zoom;
  bctx.clearRect(0,0,w,h); ctx.clearRect(0,0,w,h);
  const glow=bctx.createRadialGradient(cx-r*.35,cy-r*.4,r*.1,cx,cy,r*1.35); glow.addColorStop(0,layer===1?"#6f3328":layer===2?"#123a50":"#173c3d"); glow.addColorStop(.55,layer===3?"#111d31":"#0c2228"); glow.addColorStop(1,"#05080d00"); bctx.fillStyle=glow;bctx.beginPath();bctx.arc(cx,cy,r*1.45,0,Math.PI*2);bctx.fill();
  const globe=bctx.createRadialGradient(cx-r*.3,cy-r*.36,r*.06,cx,cy,r); globe.addColorStop(0,layer===1?"#6e503f":layer===2?"#20536c":"#3a6956"); globe.addColorStop(.45,layer===1?"#2d382f":layer===2?"#18394c":"#1d443d"); globe.addColorStop(1,"#071218"); bctx.fillStyle=globe;bctx.beginPath();bctx.arc(cx,cy,r,0,Math.PI*2);bctx.fill();
  bctx.save();bctx.beginPath();bctx.arc(cx,cy,r,0,Math.PI*2);bctx.clip();
  if ($("grid").checked) { bctx.strokeStyle="#bdeaf012";bctx.lineWidth=1; for(let i=-4;i<=4;i++){bctx.beginPath();bctx.ellipse(cx,cy+i*r/5,r,Math.sqrt(Math.max(0,r*r-(i*r/5)**2))*.16,0,0,Math.PI*2);bctx.stroke()} for(let i=0;i<9;i++){bctx.beginPath();bctx.ellipse(cx,cy,r*Math.abs(Math.cos(i*Math.PI/9)),r,0,0,Math.PI*2);bctx.stroke()} }
  bctx.restore(); bctx.strokeStyle="#83dfe733";bctx.lineWidth=1;bctx.beginPath();bctx.arc(cx,cy,r,0,Math.PI*2);bctx.stroke();
  projected=[]; const visible=filteredProjects(); for(const p of visible){const q=rotate3(nodePosition(p.name));if(q[2]<-.08)continue;const sx=cx+q[0]*r,sy=cy-q[1]*r;const size=selected?.name===p.name?5:2.8;ctx.beginPath();ctx.arc(sx,sy,size,0,Math.PI*2);ctx.fillStyle=sector(p.sector)[2];ctx.shadowColor=sector(p.sector)[2];ctx.shadowBlur=selected?.name===p.name?15:6;ctx.fill();ctx.shadowBlur=0;projected.push([p,sx,sy]);}
  $("renderer-label").textContent = "CANVAS 3D / FICTIONAL";
}
let last=performance.now(); function frame(now){ if(orbit && !dragging && mode==="world") yaw += (now-last)*.00006; last=now; drawWorld(); updateEcology((now-frame.ecoLast||0)/1000); frame.ecoLast=now; requestAnimationFrame(frame); } resize(); addEventListener("resize",resize); requestAnimationFrame(frame);
canvas.addEventListener("pointerdown",e=>{dragging=true;pointer=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)}); canvas.addEventListener("pointermove",e=>{if(!dragging)return;yaw+=(e.clientX-pointer[0])*.007;pitch=Math.max(-1.2,Math.min(1.2,pitch+(e.clientY-pointer[1])*.005));pointer=[e.clientX,e.clientY]}); canvas.addEventListener("pointerup",e=>{dragging=false;canvas.releasePointerCapture(e.pointerId)}); canvas.addEventListener("wheel",e=>{e.preventDefault();zoom=Math.max(.65,Math.min(1.45,zoom-e.deltaY*.0007))},{passive:false}); canvas.addEventListener("click",e=>{let best=null,d=18;for(const item of projected){const n=Math.hypot(e.offsetX-item[1],e.offsetY-item[2]);if(n<d){d=n;best=item[0]}}if(best)selectProject(best.name)}); canvas.addEventListener("keydown",e=>{if(e.key==="ArrowLeft")yaw-=.12;if(e.key==="ArrowRight")yaw+=.12;if(e.key==="ArrowUp")pitch-=.1;if(e.key==="ArrowDown")pitch+=.1});
$("reset-view").onclick=()=>{yaw=.35;pitch=-.18;zoom=1}; $("zoom-in").onclick=()=>zoom=Math.min(1.45,zoom+.1); $("zoom-out").onclick=()=>zoom=Math.max(.65,zoom-.1); $("orbit").onclick=()=>{orbit=!orbit;$("orbit").setAttribute("aria-pressed",String(orbit));$("orbit").textContent=orbit?"Orbit":"Static"}; document.querySelectorAll(".layer").forEach(b=>b.onclick=()=>{layer=Number(b.dataset.layer);document.querySelectorAll(".layer").forEach(x=>{x.classList.toggle("active",x===b);x.setAttribute("aria-pressed",String(x===b))})});

let eco={vegetation:68,water:72,balance:76,running:false,time:0}; function slider(id){return Number($(id).value)}
function updateEcology(dt){ if(!eco.running||!Number.isFinite(dt)||dt>1)return; const speed=Number($("speed").value), rain=slider("rainfall"),sun=slider("sunlight"),restore=slider("restoration"); const targets={vegetation:Math.max(0,Math.min(100,18+rain*.57+restore*.35-Math.abs(sun-50)*.22)),water:Math.max(0,Math.min(100,42+rain*.6-sun*.32)),balance:Math.max(0,Math.min(100,22+restore*.48+rain*.32-Math.abs(sun-50)*.3))}; const a=1-Math.exp(-dt*speed/8);for(const k of Object.keys(targets))eco[k]+=(targets[k]-eco[k])*a;eco.time+=dt*speed;renderEcology();}
function renderEcology(){for(const k of ["vegetation","water","balance"]){$(k).value=eco[k];$(`${k}-value`).textContent=Math.round(eco[k])}$("sim-time").textContent=String(Math.floor(eco.time)).padStart(4,"0");$("simulation-state").textContent=eco.running?"RUNNING":"PAUSED";$("play").setAttribute("aria-pressed",String(eco.running));$("play").innerHTML=eco.running?"Pause ecosystem &#10074;&#10074;":"Run ecosystem &#9654;";}
for(const id of ["sunlight","rainfall","restoration"]){$(id).oninput=()=>{$(`${id}-value`).textContent=$(id).value;$("preset").value="custom"};} $("preset").insertAdjacentHTML("beforeend",'<option value="custom" disabled>Custom</option>'); $("preset").onchange=()=>{const p={balanced:[50,60,45],dry:[85,20,20],rewild:[50,70,90]}[$("preset").value];if(!p)return;["sunlight","rainfall","restoration"].forEach((id,i)=>{$(id).value=p[i];$(`${id}-value`).textContent=p[i]})}; $("play").onclick=()=>{eco.running=!eco.running;renderEcology()}; $("reset-sim").onclick=()=>{eco={vegetation:68,water:72,balance:76,running:false,time:0};$("preset").value="balanced";$("preset").dispatchEvent(new Event("change"));renderEcology()};

let battle=createBattleState(); const territoryPositions={crown:[50,18],vale:[28,35],rift:[72,34],tidal:[22,69],meridian:[50,72],emberfall:[78,68]};
function renderBattle(){ const factionCards=FACTIONS.map(f=>{const s=battle.factions[f.id],owned=battle.territories.filter(t=>t.owner===f.id).length;return `<div class="faction-card ${f.id===battle.player?"active":""}" style="border-color:${f.color}44"><b style="color:${f.color}">${f.name}</b><div class="stat-line"><span>Fleet</span><strong>${Math.round(s.fleet)}</strong></div><div class="stat-line"><span>Morale</span><strong>${Math.round(s.morale)}</strong></div><div class="stat-line"><span>Supply</span><strong>${Math.round(s.supply)}</strong></div><div class="stat-line"><span>Territories</span><strong>${owned}</strong></div></div>`}).join(""); $("battle-status").innerHTML=factionCards;
  $("battle-turn").textContent=String(battle.turn).padStart(2,"0");$("battle-ap").textContent=battle.actionPoints;$("battle-state").textContent=battle.status;$("battle-state").className=battle.status==="ACTIVE"?"":"victory";
  $("territory-map").innerHTML=battle.territories.map(t=>{const f=FACTIONS.find(x=>x.id===t.owner),pos=territoryPositions[t.id];return `<button class="territory ${battle.selected===t.id?"selected":""}" data-territory="${t.id}" style="left:${pos[0]}%;top:${pos[1]}%;border-color:${f.color}55"><strong>${t.name}</strong><small><span class="owner" style="background:${f.color}"></span>${f.name}</small><small>Defense ${Math.round(t.defense)} / Industry ${t.industry}</small></button>`}).join("");
  document.querySelectorAll("[data-territory]").forEach(b=>b.onclick=()=>{battle.selected=b.dataset.territory;renderBattle()}); const t=battle.territories.find(x=>x.id===battle.selected),f=FACTIONS.find(x=>x.id===t.owner);$("battle-selection").innerHTML=`<strong>${t.name}</strong><p>Controlled by <span style="color:${f.color}">${f.name}</span>. Defense ${Math.round(t.defense)}. Industry ${t.industry}. All values are abstract game statistics.</p>`;
  $("battle-engage").disabled=t.owner===battle.player||battle.actionPoints<1||battle.status!=="ACTIVE";$("battle-reinforce").disabled=t.owner!==battle.player||battle.actionPoints<1||battle.status!=="ACTIVE";$("battle-mobilize").disabled=battle.actionPoints<1||battle.status!=="ACTIVE";$("battle-end").disabled=battle.status!=="ACTIVE";
  $("battle-log").innerHTML=battle.log.slice(0,14).map(line=>`<div>${esc(line)}</div>`).join(""); }
$("battle-reinforce").onclick=()=>{battle=reinforce(battle,battle.selected);renderBattle()};$("battle-mobilize").onclick=()=>{battle=mobilize(battle);renderBattle()};$("battle-engage").onclick=()=>{battle=engage(battle,battle.selected);renderBattle()};$("battle-end").onclick=()=>{battle=endTurn(battle);renderBattle()};$("battle-reset").onclick=()=>{battle=resetBattle();renderBattle()};

function setMode(next){mode=next;for(const id of ["world","projects","battle"]){const b=$(`${id}-tab`);b.classList.toggle("active",id===next);b.setAttribute("aria-pressed",String(id===next));}$("directory").hidden=next!=="projects";$("battle-panel").hidden=next!=="battle";canvas.style.visibility=next==="world"?"visible":"hidden";base.style.visibility=next==="world"?"visible":"hidden";document.querySelectorAll(".scene-heading,.orbit-tools,.coordinates,.world-caption,.layerbar,.scene-hint").forEach(el=>el.style.visibility=next==="world"?"visible":"hidden");if(next==="battle")renderBattle();}
$("world-tab").onclick=()=>setMode("world");$("projects-tab").onclick=()=>setMode("projects");$("battle-tab").onclick=()=>setMode("battle");$("search").oninput=renderRegistry;$("sync").onclick=syncGitHub;
$("import-button").onclick=()=>$("import-file").click();$("import-file").onchange=async(e)=>{try{const data=JSON.parse(await e.target.files[0].text()),rows=Array.isArray(data)?data:data.projects;if(!Array.isArray(rows)||rows.length>5000)throw new Error("Expected a JSON array of up to 5,000 project objects.");const next=rows.map(normalizeRepo).filter(Boolean);if(!next.length)throw new Error("No valid public-style project entries found.");projects=next;selected=projects[0];$("source").textContent="LOCAL CATALOG";$("source-message").textContent="Loaded only in this browser session.";renderRegistry();renderInspector();toast("Local project catalog imported.");}catch(err){toast(err.message||"Import failed.")}};
$("link-form").onsubmit=(e)=>{e.preventDefault();try{const u=new URL($("app-url").value);if(u.protocol!=="https:")throw new Error("Use an HTTPS URL.");const links=JSON.parse(localStorage.getItem("xunia-project-links")||"{}");links[selected.name]=u.href;localStorage.setItem("xunia-project-links",JSON.stringify(links));renderInspector();toast("Local app bookmark saved.");}catch(err){toast(err.message||"Invalid URL.")}};
$("export").onclick=()=>{const payload={exportedAt:new Date().toISOString(),world:"X-01-fictional",projects,battle,ecology:{...eco,running:false},projectLinks:JSON.parse(localStorage.getItem("xunia-project-links")||"{}")};const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));a.download="xunia-workspace.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};

renderRegistry();renderInspector();renderEcology();renderBattle();setMode("world");
