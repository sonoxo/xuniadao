export class StreamTransportRegistry {
  constructor() {
    this.transports = new Map([
      ['xuni-state-stream', { id: 'xuni-state-stream', status: 'READY', media: ['state'], input: ['gamepad','keyboard','mouse'] }],
      ['webrtc', { id: 'webrtc', status: 'CONFIG_REQUIRED', media: ['video','audio','data'], input: ['gamepad','keyboard','mouse','touch'] }],
      ['xbox-game-streaming', { id: 'xbox-game-streaming', status: 'LICENSED_RUNTIME_REQUIRED', media: ['video','audio','data'], input: ['gamepad','touch'] }]
    ]);
  }

  get(id) { return this.transports.get(id) ? structuredClone(this.transports.get(id)) : null; }
  list() { return [...this.transports.values()].map(structuredClone); }
  require(id) {
    const item = this.transports.get(id);
    if (!item) throw new Error('UNKNOWN_STREAM_TRANSPORT');
    if (item.status !== 'READY') throw new Error(item.status);
    return structuredClone(item);
  }
}
