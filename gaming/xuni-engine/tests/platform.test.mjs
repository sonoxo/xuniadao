import test from 'node:test';
import assert from 'node:assert/strict';
import {XBOX_GDK_CONTRACT,MockXboxPlatform,readXboxGamepad} from '../src/platform.js';

test('Xbox is the primary native target contract',()=>{
  assert.equal(XBOX_GDK_CONTRACT.platform,'xbox');
  assert.equal(XBOX_GDK_CONTRACT.renderer,'D3D12');
  assert.equal(XBOX_GDK_CONTRACT.identity,'XUser');
  assert.equal(XBOX_GDK_CONTRACT.commerce,'XStore');
});

test('mock Xbox lifecycle works end to end',async()=>{
  const p=new MockXboxPlatform();
  await p.initialize();
  const u=await p.signIn('TESTER');
  assert.equal(u.gamertag,'TESTER');
  await p.unlockAchievement('FIRST_FRAG');
  await p.grantEntitlement('XUNI.TEST.DLC');
  p.suspend(); assert.equal(p.snapshot().suspended,true);
  p.resume(); assert.equal(p.snapshot().suspended,false);
  assert.equal(p.hasEntitlement('XUNI.TEST.DLC'),true);
  assert.deepEqual(p.snapshot().achievements,['FIRST_FRAG']);
});

test('standard Xbox controller layout maps to XUNI actions',()=>{
  const buttons=Array.from({length:16},()=>({pressed:false,value:0}));
  buttons[7]={pressed:true,value:1};
  buttons[2]={pressed:true,value:1};
  const state=readXboxGamepad({axes:[.5,-.75,.25,0],buttons});
  assert.equal(state.connected,true);
  assert.equal(state.fire,true);
  assert.equal(state.reload,true);
  assert.ok(state.moveX>0);
  assert.ok(state.moveY>0);
  assert.ok(state.lookX>0);
});
