import test from 'node:test';
import assert from 'node:assert/strict';
import {BattlefieldSimulationSystems,GpsDeniedZone,MagneticAnomalySensor,MassSensor,SensorFusion,SecureCommsMesh,QuantumCloudMock} from '../src/quantum-systems.js';

test('GPS denied zones create inertial drift and recover with GPS',()=>{
  const systems=new BattlefieldSimulationSystems({zones:[new GpsDeniedZone({x:5,y:5,radius:3})]});
  const denied=systems.tick(10,{x:5,y:5});
  assert.equal(denied.gpsAvailable,false);
  assert.ok(denied.navError>0);
  const recovered=systems.tick(1,{x:20,y:20});
  assert.equal(recovered.gpsAvailable,true);
  assert.ok(recovered.navError<denied.navError);
});

test('sensor fusion returns confidence weighted estimate',()=>{
  const fused=new SensorFusion().fuse([{value:10,confidence:.8},{value:20,confidence:.2}]);
  assert.equal(fused.value,12);
  assert.ok(fused.confidence>0);
});

test('magnetic and mass sensors decay with distance',()=>{
  const magnetic=new MagneticAnomalySensor(),mass=new MassSensor();
  assert.ok(magnetic.detect({distance:1,signature:2})>magnetic.detect({distance:4,signature:2}));
  assert.ok(mass.detect({distance:1,mass:5})>mass.detect({distance:4,mass:5}));
});

test('secure comms mesh supports multi-hop connectivity',()=>{
  const mesh=new SecureCommsMesh();
  mesh.addNode('A',{x:0,y:0,range:5});mesh.addNode('B',{x:4,y:0,range:5});mesh.addNode('C',{x:8,y:0,range:5});
  assert.equal(mesh.connected('A','C'),true);
});

test('quantum cloud is a deterministic simulation-only service',()=>{
  const cloud=new QuantumCloudMock();const job=cloud.submit('secure-share',{key:'demo'});
  assert.equal(job.status,'COMPLETED');assert.equal(job.result.simulated,true);
});
