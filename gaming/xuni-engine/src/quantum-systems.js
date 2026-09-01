export class GpsDeniedZone {
  constructor({x=0,y=0,radius=5,intensity=1}={}){this.x=x;this.y=y;this.radius=radius;this.intensity=intensity}
  contains(x,y){return Math.hypot(x-this.x,y-this.y)<=this.radius}
}

export class InertialNavigator {
  constructor({driftPerSecond=0.015}={}){this.driftPerSecond=driftPerSecond;this.error=0}
  step(dt,{gpsAvailable=true}={}){if(gpsAvailable)this.error*=Math.max(0,1-dt*3);else this.error+=this.driftPerSecond*dt;return this.error}
}

export class SensorFusion {
  fuse(readings=[]){
    const valid=readings.filter(r=>Number.isFinite(r.value)&&Number.isFinite(r.confidence)&&r.confidence>0)
    if(!valid.length)return {value:null,confidence:0}
    const weight=valid.reduce((s,r)=>s+r.confidence,0)
    return {value:valid.reduce((s,r)=>s+r.value*r.confidence,0)/weight,confidence:Math.min(1,weight/valid.length)}
  }
}

export class MagneticAnomalySensor {
  detect({distance,signature=1,noise=0.05}={}){if(!Number.isFinite(distance)||distance<=0)return 0;return Math.max(0,signature/(distance*distance)-noise)}
}

export class MassSensor {
  detect({distance,mass=1,attenuation=1}={}){if(!Number.isFinite(distance)||distance<=0)return 0;return Math.max(0,(mass*attenuation)/(1+distance*distance))}
}

export class SecureCommsMesh {
  constructor(){this.nodes=new Map()}
  addNode(id,{x=0,y=0,range=10}={}){this.nodes.set(id,{id,x,y,range})}
  links(){const out=[];const nodes=[...this.nodes.values()];for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<=Math.min(a.range,b.range))out.push([a.id,b.id])}return out}
  connected(a,b){if(a===b)return true;const graph=new Map;for(const [u,v] of this.links()){if(!graph.has(u))graph.set(u,[]);if(!graph.has(v))graph.set(v,[]);graph.get(u).push(v);graph.get(v).push(u)}const q=[a],seen=new Set(q);while(q.length){const n=q.shift();for(const m of graph.get(n)||[]){if(m===b)return true;if(!seen.has(m)){seen.add(m);q.push(m)}}}return false}
}

export class QuantumCloudMock {
  constructor(){this.sessionId='xuni-quantum-sim';this.jobs=[]}
  submit(type,payload={}){const job={id:`q${this.jobs.length+1}`,type,payload,status:'COMPLETED',result:{simulated:true}};this.jobs.push(job);return job}
}

export class BattlefieldSimulationSystems {
  constructor({zones=[]}={}){this.zones=zones;this.nav=new InertialNavigator();this.fusion=new SensorFusion();this.comms=new SecureCommsMesh();this.quantum=new QuantumCloudMock()}
  gpsAvailable(x,y){return !this.zones.some(z=>z.contains(x,y))}
  tick(dt,entity){return {gpsAvailable:this.gpsAvailable(entity.x,entity.y),navError:this.nav.step(dt,{gpsAvailable:this.gpsAvailable(entity.x,entity.y)})}}
}
