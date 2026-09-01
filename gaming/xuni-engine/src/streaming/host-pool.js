import { randomUUID } from 'node:crypto';

export class HostPool {
  constructor({ regions = ['local'], hostsPerRegion = 2 } = {}) {
    this.hosts = [];
    for (const region of regions) {
      for (let i = 0; i < hostsPerRegion; i += 1) {
        this.hosts.push({ id: `${region}-${randomUUID().slice(0, 8)}`, region, state: 'READY', sessionId: null });
      }
    }
  }

  allocate(region, sessionId) {
    const host = this.hosts.find(h => h.region === region && h.state === 'READY');
    if (!host) throw new Error('NO_CAPACITY');
    host.state = 'BUSY';
    host.sessionId = sessionId;
    return structuredClone(host);
  }

  release(hostId) {
    const host = this.hosts.find(h => h.id === hostId);
    if (!host) return false;
    host.state = 'READY';
    host.sessionId = null;
    return true;
  }

  snapshot() { return this.hosts.map(h => structuredClone(h)); }
}
