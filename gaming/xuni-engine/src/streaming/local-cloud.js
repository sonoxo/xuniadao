import http from 'node:http';
import { URL } from 'node:url';
import { SessionBroker } from './session-broker.js';
import { HostPool } from './host-pool.js';
import { SaveStore } from './save-store.js';
import { RemoteGameHost } from './remote-game-host.js';
import { selectStreamProfile, summarizeTelemetry } from './qos.js';

const json = (res, status, body) => {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data), 'access-control-allow-origin': '*' });
  res.end(data);
};

const readJson = req => new Promise((resolve, reject) => {
  let body = '';
  req.on('data', chunk => { body += chunk; if (body.length > 1_000_000) reject(new Error('BODY_TOO_LARGE')); });
  req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('INVALID_JSON')); } });
  req.on('error', reject);
});

export class XuniLocalCloud {
  constructor({ regions = ['local'], hostsPerRegion = 2 } = {}) {
    this.broker = new SessionBroker({ regions });
    this.hosts = new HostPool({ regions, hostsPerRegion });
    this.saves = new SaveStore();
    this.runtimes = new Map();
    this.listeners = new Map();
  }

  emit(sessionId, event) {
    for (const res of this.listeners.get(sessionId) ?? []) res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  async allocate(sessionId, network = {}) {
    const current = this.broker.get(sessionId);
    if (!current) throw new Error('SESSION_NOT_FOUND');
    if (current.state === 'QUEUED' || current.state === 'SUSPENDED') this.broker.transition(sessionId, 'ALLOCATING');
    const host = this.hosts.allocate(current.region, sessionId);
    this.broker.transition(sessionId, 'BOOTING', { hostId: host.id });
    const save = this.saves.get(current.playerId, current.titleId);
    const runtime = new RemoteGameHost({
      sessionId,
      initialState: save?.state ?? null,
      onFrame: frame => {
        this.broker.recordFrame(sessionId, { rttMs: network.rttMs ?? 20, packetLoss: network.packetLoss ?? 0, encodeMs: 4 });
        this.emit(sessionId, frame);
      }
    });
    this.runtimes.set(sessionId, runtime);
    const profile = selectStreamProfile(network);
    this.broker.transition(sessionId, 'READY', { stream: { transport: 'xuni-state-stream', profile } });
    runtime.start();
    this.broker.transition(sessionId, 'STREAMING');
    this.emit(sessionId, { type: 'session', session: this.broker.get(sessionId) });
    return this.broker.get(sessionId);
  }

  suspend(sessionId) {
    const session = this.broker.get(sessionId);
    if (!session) throw new Error('SESSION_NOT_FOUND');
    const runtime = this.runtimes.get(sessionId);
    this.broker.transition(sessionId, 'SUSPENDING');
    if (runtime) {
      this.saves.put(session.playerId, session.titleId, runtime.snapshot());
      runtime.stop();
      this.runtimes.delete(sessionId);
    }
    if (session.hostId) this.hosts.release(session.hostId);
    const resumeToken = `${session.playerId}:${session.titleId}:${Date.now()}`;
    this.broker.transition(sessionId, 'SUSPENDED', { hostId: null, stream: null, resumeToken });
    this.emit(sessionId, { type: 'session', session: this.broker.get(sessionId) });
    return this.broker.get(sessionId);
  }

  terminate(sessionId) {
    const session = this.broker.get(sessionId);
    if (!session) throw new Error('SESSION_NOT_FOUND');
    const runtime = this.runtimes.get(sessionId);
    if (runtime) { runtime.stop(); this.runtimes.delete(sessionId); }
    if (session.hostId) this.hosts.release(session.hostId);
    return this.broker.transition(sessionId, 'TERMINATED', { hostId: null, stream: null });
  }

  handler() {
    return async (req, res) => {
      if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' }); return res.end(); }
      const url = new URL(req.url, 'http://localhost');
      const parts = url.pathname.split('/').filter(Boolean);
      try {
        if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true, hosts: this.hosts.snapshot() });
        if (req.method === 'POST' && url.pathname === '/api/sessions') {
          const body = await readJson(req);
          return json(res, 201, this.broker.create(body));
        }
        if (parts[0] === 'api' && parts[1] === 'sessions' && parts[2]) {
          const id = parts[2];
          if (req.method === 'GET' && parts.length === 3) return json(res, 200, { ...this.broker.get(id), qos: summarizeTelemetry(this.broker.get(id) ?? {}) });
          if (req.method === 'GET' && parts[3] === 'events') {
            res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive', 'access-control-allow-origin': '*' });
            if (!this.listeners.has(id)) this.listeners.set(id, new Set());
            this.listeners.get(id).add(res);
            req.on('close', () => this.listeners.get(id)?.delete(res));
            return;
          }
          if (req.method === 'POST' && parts[3] === 'allocate') return json(res, 200, await this.allocate(id, await readJson(req)));
          if (req.method === 'POST' && parts[3] === 'input') {
            const body = await readJson(req);
            const runtime = this.runtimes.get(id);
            if (!runtime) throw new Error('RUNTIME_NOT_READY');
            runtime.applyInput(body);
            this.broker.recordInput(id, Date.now() - Number(body.sentAt ?? Date.now()));
            return json(res, 202, { accepted: true });
          }
          if (req.method === 'POST' && parts[3] === 'suspend') return json(res, 200, this.suspend(id));
          if (req.method === 'POST' && parts[3] === 'resume') return json(res, 200, await this.allocate(id, await readJson(req)));
          if (req.method === 'POST' && parts[3] === 'terminate') return json(res, 200, this.terminate(id));
        }
        return json(res, 404, { error: 'NOT_FOUND' });
      } catch (error) {
        return json(res, 400, { error: error.message });
      }
    };
  }
}

export function startLocalCloud({ port = Number(process.env.XUNI_STREAM_PORT ?? 8787) } = {}) {
  const cloud = new XuniLocalCloud();
  const server = http.createServer(cloud.handler());
  server.listen(port, '127.0.0.1', () => console.log(`XUNI Streaming Core listening on http://127.0.0.1:${port}`));
  return { cloud, server };
}

if (import.meta.url === `file://${process.argv[1]}`) startLocalCloud();
