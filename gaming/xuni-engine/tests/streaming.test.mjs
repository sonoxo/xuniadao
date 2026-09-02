import test from 'node:test';import assert from 'node:assert/strict';import {SessionBroker} from '../src/streaming/session-broker.js';import {HostPool} from '../src/streaming/host-pool.js';import {SaveStore} from '../src/streaming/save-store.js';import {RemoteGameHost} from '../src/streaming/remote-game-host.js';import {selectStreamProfile} from '../src/streaming/qos.js';import {RegionRouter} from '../src/streaming/region-router.js';import {StreamTransportRegistry} from '../src/streaming/transport.js';

test('session lifecycle enforces entitlement and transitions',()=>{const b=new SessionBroker();assert.throws(()=>b.create({playerId:'p',titleId:'t',entitlement:false}),/ENTITLEMENT_REQUIRED/);const s=b.create({playerId:'p',titleId:'t'});assert.equal(s.state,'QUEUED');b.transition(s.id,'ALLOCATING');b.transition(s.id,'BOOTING',{hostId:'h'});b.transition(s.id,'READY',{stream:{}});b.transition(s.id,'STREAMING');b.transition(s.id,'SUSPENDING');b.transition(s.id,'SUSPENDED');assert.equal(b.get(s.id).state,'SUSPENDED')});

test('host pool allocates and releases finite capacity',()=>{const p=new HostPool({hostsPerRegion:1});const h=p.allocate('local','s1');assert.equal(h.state,'BUSY');assert.throws(()=>p.allocate('local','s2'),/NO_CAPACITY/);assert.equal(p.release(h.id),true);assert.equal(p.allocate('local','s2').state,'BUSY')});

test('save store persists state with stable integrity tag',()=>{const s=new SaveStore();const a=s.put('p','t',{x:4});assert.equal(s.get('p','t').state.x,4);assert.equal(a.etag.length,64)});

test('remote host rejects stale input sequence',()=>{const h=new RemoteGameHost({sessionId:'s'});assert.equal(h.applyInput({seq:2,moveY:1}),true);const x=h.state.x;assert.equal(h.applyInput({seq:1,moveY:1}),false);assert.equal(h.state.x,x)});

test('qos degrades under poor network',()=>{assert.equal(selectStreamProfile({rttMs:20,packetLoss:0,bandwidthMbps:40}).tier,'quality');assert.equal(selectStreamProfile({rttMs:220,packetLoss:.1,bandwidthMbps:2}).tier,'survival')});

test('region router selects available low latency capacity',()=>{const r=new RegionRouter([{id:'east',capacity:4},{id:'west',capacity:2}]);assert.equal(r.select({latencyByRegion:{east:60,west:25}}).id,'west');assert.equal(r.select({latencyByRegion:{east:35,west:40},preferredRegion:'west'}).id,'west')});

test('transport registry exposes free and licensed boundaries',()=>{const r=new StreamTransportRegistry();assert.equal(r.require('xuni-state-stream').status,'READY');assert.throws(()=>r.require('webrtc'),/CONFIG_REQUIRED/);assert.throws(()=>r.require('xbox-game-streaming'),/LICENSED_RUNTIME_REQUIRED/)});
