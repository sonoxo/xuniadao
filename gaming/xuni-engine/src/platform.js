export const XBOX_GDK_CONTRACT=Object.freeze({
  platform:'xbox',
  renderer:'D3D12',
  runtime:'XGameRuntime',
  identity:'XUser',
  services:'XSAPI-C',
  commerce:'XStore',
  package:'MSIXVC',
  async:'XTaskQueue',
  capabilities:['user-sign-in','achievements','commerce','entitlements','network-services','suspend-resume','controller-input']
});

export function applyDeadzone(v,d=.18){return Math.abs(v)<d?0:(v-Math.sign(v)*d)/(1-d)}

export function readXboxGamepad(gamepad){
  if(!gamepad)return{connected:false,moveX:0,moveY:0,lookX:0,lookY:0,fire:false,reload:false,pause:false,confirm:false};
  const a=gamepad.axes||[],b=gamepad.buttons||[],pressed=i=>Boolean(b[i]?.pressed||((b[i]?.value||0)>.5));
  return{
    connected:true,
    moveX:applyDeadzone(a[0]||0),moveY:-applyDeadzone(a[1]||0),
    lookX:applyDeadzone(a[2]||0),lookY:-applyDeadzone(a[3]||0),
    confirm:pressed(0),reload:pressed(2),pause:pressed(9),
    fire:pressed(7)||pressed(5)
  };
}

export class MockXboxPlatform{
  constructor(){this.started=false;this.user=null;this.achievements=new Set;this.entitlements=new Set;this.suspended=false;}
  async initialize(){this.started=true;return XBOX_GDK_CONTRACT;}
  async signIn(gamertag='XUNI-DEV'){if(!this.started)throw new Error('XUNI_PLATFORM_NOT_INITIALIZED');this.user={id:'mock-xuid',gamertag};return this.user;}
  async unlockAchievement(id){if(!this.user)throw new Error('XUNI_USER_REQUIRED');this.achievements.add(String(id));return true;}
  async grantEntitlement(storeId){this.entitlements.add(String(storeId));return true;}
  hasEntitlement(storeId){return this.entitlements.has(String(storeId));}
  suspend(){this.suspended=true;}
  resume(){this.suspended=false;}
  snapshot(){return{started:this.started,user:this.user,achievements:[...this.achievements],entitlements:[...this.entitlements],suspended:this.suspended};}
}
