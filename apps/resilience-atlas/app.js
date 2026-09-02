const $ = (id) => document.getElementById(id);
const canvas = $('map');
const ctx = canvas.getContext('2d');

const scenarioNames = {
  radiological: 'Radiological emergency',
  industrial: 'Industrial explosion',
  chemical: 'Hazardous-material release',
  wildfire: 'Wildfire / smoke event',
  grid: 'Grid / infrastructure outage'
};

const severityNames = ['','Localized','Significant','Major','Regional','Catastrophic exercise'];
let currentScenario = null;

function seeded(seed) {
  let x = seed % 2147483647;
  return () => ((x = x * 16807 % 2147483647) - 1) / 2147483646;
}

function drawGrid() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#081012'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = '#173036'; ctx.lineWidth = 1;
  for (let x=0;x<canvas.width;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}
  for (let y=0;y<canvas.height;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}
  ctx.strokeStyle='#26454d';
  for(let i=0;i<18;i++){
    ctx.beginPath();
    const y=40+i*42;
    ctx.moveTo(0,y+20*Math.sin(i));
    for(let x=0;x<canvas.width;x+=40) ctx.lineTo(x,y+25*Math.sin(x/150+i));
    ctx.stroke();
  }
}

function circle(x,y,r,fill,stroke){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
function node(x,y,type,label){
  const colors={hospital:'#57ff8f',shelter:'#5ee9ff',infra:'#ffcb57'};
  ctx.fillStyle=colors[type]; ctx.fillRect(x-5,y-5,10,10);
  ctx.font='12px ui-monospace';ctx.fillStyle='#b9cbc7';ctx.fillText(label,x+10,y+4);
}

function renderScenario(s) {
  drawGrid();
  const cx=canvas.width*.5, cy=canvas.height*.47;
  const scale=55 + s.severity*30;
  circle(cx,cy,scale*1.85,'rgba(94,233,255,.08)','rgba(94,233,255,.65)');
  circle(cx,cy,scale*1.25,'rgba(255,203,87,.10)','rgba(255,203,87,.72)');
  circle(cx,cy,scale*.62,'rgba(255,101,95,.14)','rgba(255,101,95,.88)');
  ctx.fillStyle='#ecf8f3';ctx.font='bold 13px ui-monospace';ctx.fillText('EXERCISE ORIGIN',cx+12,cy-12);

  const rng=seeded(s.severity*131 + s.type.length*47);
  const types=['hospital','shelter','infra'];
  for(let i=0;i<16;i++){
    const angle=rng()*Math.PI*2, radius=90+rng()*410;
    const x=cx+Math.cos(angle)*radius, y=cy+Math.sin(angle)*radius*.72;
    const t=types[i%types.length];
    node(x,y,t, t==='hospital'?`H-${i+1}`:t==='shelter'?`S-${i+1}`:`I-${i+1}`);
  }
}

function calculate() {
  const type=$('scenarioType').value;
  const severity=Number($('severity').value);
  const pop=$('population').value;
  const weather=$('weather').value;
  const density={sparse:.55,moderate:1,dense:1.8}[pop];
  const weatherFactor={stable:1,windy:1.22,rain:.88}[weather];
  const people=Math.round(11500*severity*severity*density*weatherFactor);
  const hospitals=Math.max(1,Math.round(severity*density*1.4));
  const shelters=Math.max(2,Math.round(12-severity*1.3+density));
  const infra=Math.max(1,Math.round(severity*2.2*weatherFactor));
  const actions=[
    'Stage emergency medical and communications resources for exercise review.',
    shelters<7?'Increase shelter capacity outside the core exercise zone.':'Validate shelter staffing and accessibility.',
    hospitals>4?'Activate hospital surge tabletop plan and mutual-aid review.':'Confirm hospital surge thresholds and transfer agreements.',
    infra>7?'Prioritize backup power and infrastructure dependency checks.':'Verify critical-facility backup power readiness.',
    weather==='windy'?'Increase downwind monitoring and public-information exercise injects.':'Maintain standard monitoring exercise cadence.'
  ];
  return {id:`XRA-${Date.now()}`,type,severity,populationContext:pop,weather,people,hospitals,shelters,infra,actions,
    provenance:{provider:'xunia-synthetic-consequence-model',version:'0.1',purpose:'training-and-emergency-planning-only',uncertainty:'illustrative'}};
}

function updateUI(s){
  $('scenarioLabel').textContent=scenarioNames[s.type];
  $('scenarioMeta').textContent=` ${severityNames[s.severity]} / ${s.populationContext} population`;
  $('populationImpact').textContent=s.people.toLocaleString();
  $('hospitalImpact').textContent=s.hospitals;
  $('shelterImpact').textContent=s.shelters;
  $('infraImpact').textContent=s.infra;
  $('posture').textContent=s.severity>=4?'ELEVATED':'READY';
  $('actions').innerHTML=s.actions.map(a=>`<li>${a}</li>`).join('');
}

function run(){currentScenario=calculate();renderScenario(currentScenario);updateUI(currentScenario);}
function reset(){currentScenario=null;drawGrid();['populationImpact','hospitalImpact','shelterImpact','infraImpact'].forEach(id=>$(id).textContent='—');$('posture').textContent='READY';$('actions').innerHTML='';}

$('runBtn').addEventListener('click',run);
$('resetBtn').addEventListener('click',reset);
$('exportBtn').addEventListener('click',()=>{
  if(!currentScenario) run();
  const payload={schema:'xunia.resilience-atlas.civil-defense-scenario.v1',ontologyObject:'CivilDefenseScenario',scenario:currentScenario,governance:{humanApprovalRequired:true,liveActionsAllowed:false,prohibited:['target-selection','weapon-design','yield-optimization','burst-optimization','strike-sequencing','casualty-maximization']}};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${currentScenario.id}.json`;a.click();URL.revokeObjectURL(a.href);
});

drawGrid();run();
