import {BattlefieldSimulationSystems,GpsDeniedZone,MagneticAnomalySensor,MassSensor} from '../src/quantum-systems.js';

const systems=new BattlefieldSimulationSystems({zones:[new GpsDeniedZone({x:8,y:5,radius:3})]});
systems.comms.addNode('PLAYER',{x:2,y:2,range:7});
systems.comms.addNode('RELAY',{x:7,y:5,range:7});
systems.comms.addNode('HQ',{x:12,y:8,range:7});

const magnetic=new MagneticAnomalySensor();
const mass=new MassSensor();
const route=[{x:2,y:2},{x:6,y:4},{x:8,y:5},{x:10,y:6},{x:12,y:8}];
for(const point of route){
  const nav=systems.tick(1,point);
  console.log({point,...nav,magnetic:magnetic.detect({distance:3,signature:1.5}),mass:mass.detect({distance:5,mass:8}),meshToHq:systems.comms.connected('PLAYER','HQ')});
}
console.log(systems.quantum.submit('mission-sync',{classification:'SIMULATION_ONLY'}));
