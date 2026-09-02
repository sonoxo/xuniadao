const $ = (id) => document.getElementById(id);
const canvas = $('map');
const ctx = canvas.getContext('2d');
let current = null;

const scenarioNames = { radiological:'Radiological emergency', industrial:'Industrial explosion', chemical:'Hazardous-material release', wildfire:'Wildfire / smoke event', grid:'Grid / infrastructure outage' };
const severityNames = ['','Localized','Significant','Major','Regional','Catastrophic exercise'];

async function api(path, options = {}) {
  const res = await fetch(path, { headers: { 'content-type':'application/json', ...(options.headers||{}) }, ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function drawGrid() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#081012'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#173036'; ctx.lineWidth=1;
  for(let x=0;x<canvas.width;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}
  for(let y=0;y<canvas.height;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}
}
function circle(x,y,r,fill,stroke){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
function node(x,y,type,label){const colors={hospital:'#57ff8f',shelter:'#5ee9ff',infra:'#ffcb57'};ctx.fillStyle=colors[type];ctx.fillRect(x-5,y-5,10,10);ctx.font='12px ui-monospace';ctx.fillStyle='#b9cbc7';ctx.fillText(label,x+10,y+4);}

function renderScenario(s) {
  drawGrid();
  const cx=canvas.width*.5, cy=canvas.height*.47;
  const scale=55+s.severity*30;
  circle(cx,cy,scale*1.85,'rgba(94,233,255,.08)','rgba(94,233,255,.65)');
  circle(cx,cy,scale*1.25,'rgba(255,203,87,.10)','rgba(255,203,87,.72)');
  circle(cx,cy,scale*.62,'rgba(255,101,95,.14)','rgba(255,101,95,.88)');
  ctx.fillStyle='#ecf8f3';ctx.font='bold 13px ui-monospace';ctx.fillText('EXERCISE ORIGIN',cx+12,cy-12);
  const types=['hospital','shelter','infra'];
  for(let i=0;i<16;i++){const angle=(i/16)*Math.PI*2;const radius=110+(i%5)*72;node(cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius*.72,types[i%3],`${types[i%3][0].toUpperCase()}-${i+1}`);}
}

function updateUI(s) {
  const m=s.metrics;
  $('scenarioLabel').textContent=scenarioNames[s.type] || s.type;
  $('scenarioMeta').textContent=` ${severityNames[s.severity]} / ${s.populationContext} population`;
  $('populationImpact').textContent=m.peopleInExerciseZones.toLocaleString();
  $('hospitalImpact').textContent=m.hospitalsUnderSurgePressure;
  $('shelterImpact').textContent=m.sheltersAvailable;
  $('infraImpact').textContent=m.criticalInfrastructureAtRisk;
  $('posture').textContent=s.severity>=4?'ELEVATED':'READY';
  $('actions').innerHTML=s.recommendedActions.map(a=>`<li>${a}</li>`).join('');
  $('scenarioId').textContent=s.id;
}

async function run() {
  $('runBtn').disabled=true; $('runBtn').textContent='RUNNING…';
  try {
    current = await api('/api/scenarios/run', { method:'POST', body:JSON.stringify({ type:$('scenarioType').value, severity:Number($('severity').value), populationContext:$('population').value, weather:$('weather').value }) });
    renderScenario(current.scenario); updateUI(current.scenario); $('platformStatus').textContent='ONLINE / GOVERNED';
  } catch (e) { $('platformStatus').textContent='ERROR'; alert(e.message); }
  finally { $('runBtn').disabled=false; $('runBtn').textContent='RUN EXERCISE'; }
}

async function publish() {
  if(!current) await run();
  try {
    const result=await api('/api/ontology/publish',{method:'POST',body:JSON.stringify(current.ontology)});
    $('palantirStatus').textContent=result.published?'LIVE PUBLISHED':`STAGED / ${result.mode}`;
  } catch(e){ $('palantirStatus').textContent='PUBLISH ERROR'; alert(e.message); }
}

async function refreshAudit(){
  const data=await api('/api/audit');
  $('audit').innerHTML=data.events.slice().reverse().slice(0,8).map(e=>`<li><strong>${e.event}</strong><span>${new Date(e.at).toLocaleTimeString()}</span></li>`).join('') || '<li>No events yet.</li>';
}

$('runBtn').addEventListener('click', async()=>{await run();await refreshAudit();});
$('resetBtn').addEventListener('click',()=>{current=null;drawGrid();['populationImpact','hospitalImpact','shelterImpact','infraImpact'].forEach(id=>$(id).textContent='—');$('actions').innerHTML='';$('scenarioId').textContent='—';});
$('exportBtn').addEventListener('click',()=>{if(!current)return;const blob=new Blob([JSON.stringify(current,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${current.scenario.id}.json`;a.click();URL.revokeObjectURL(a.href);});
$('publishBtn').addEventListener('click',async()=>{await publish();await refreshAudit();});

(async()=>{drawGrid();try{const h=await api('/api/health');$('platformStatus').textContent=h.ok?'ONLINE':'DEGRADED';$('palantirStatus').textContent=h.palantirConfigured?'CONFIGURED':'ADAPTER READY';await run();await refreshAudit();}catch{$('platformStatus').textContent='OFFLINE';}})();
