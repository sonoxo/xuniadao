import http from 'node:http';
import { readFile, mkdir, appendFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSafeScenario, approvalRequired } from './lib/governance.mjs';
import { runScenario, toOntologyEnvelope } from './lib/engine.mjs';
import { PalantirAdapter } from './lib/aip-adapter.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const dataDir = join(root, '.data');
await mkdir(dataDir, { recursive: true });
const auditFile = join(dataDir, 'audit.ndjson');
const adapter = new PalantirAdapter();
const port = Number(process.env.PORT || 8787);

const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml' };

async function audit(event, details = {}) {
  await appendFile(auditFile, JSON.stringify({ at: new Date().toISOString(), event, ...details }) + '\n');
}

async function body(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw Object.assign(new Error('request too large'), { statusCode: 413 });
  }
  return raw ? JSON.parse(raw) : {};
}

function json(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(payload));
}

async function api(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') {
    return json(res, 200, { ok: true, service: 'xunia-resilience-atlas', version: '0.2.0', palantirConfigured: adapter.configured });
  }
  if (req.method === 'POST' && url.pathname === '/api/scenarios/run') {
    const admitted = assertSafeScenario(await body(req));
    const scenario = runScenario(admitted);
    const ontology = toOntologyEnvelope(scenario);
    await audit('SCENARIO_EXECUTED', { scenarioId: scenario.id, type: scenario.type, severity: scenario.severity });
    return json(res, 201, { scenario, ontology, governance: admitted.governance });
  }
  if (req.method === 'POST' && url.pathname === '/api/ontology/publish') {
    const input = await body(req);
    assertSafeScenario(input?.properties ?? input);
    const result = await adapter.publishOntologyObject(input);
    await audit('ONTOLOGY_PUBLISH_ATTEMPT', { objectId: input.objectId, published: result.published, mode: result.mode });
    return json(res, result.published ? 200 : 202, result);
  }
  if (req.method === 'POST' && url.pathname === '/api/actions/propose') {
    const input = await body(req);
    assertSafeScenario(input);
    const proposal = approvalRequired(input.action ?? input);
    await audit('ACTION_PROPOSED', { approvalId: proposal.id });
    return json(res, 202, proposal);
  }
  if (req.method === 'GET' && url.pathname === '/api/audit') {
    let lines = [];
    try { lines = (await readFile(auditFile, 'utf8')).trim().split('\n').filter(Boolean).slice(-100).map(JSON.parse); } catch {}
    return json(res, 200, { events: lines });
  }
  return false;
}

async function serveStatic(req, res, url) {
  const requested = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '');
  const safe = normalize(requested).replace(/^(\.\.(\/|\\|$))+/, '');
  const file = join(root, safe);
  if (!file.startsWith(root)) return json(res, 403, { error: 'forbidden' });
  try {
    const bytes = await readFile(file);
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' });
    res.end(bytes);
  } catch {
    json(res, 404, { error: 'not found' });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      const handled = await api(req, res, url);
      if (handled !== false) return;
      return json(res, 404, { error: 'api route not found' });
    }
    await serveStatic(req, res, url);
  } catch (err) {
    const status = Number(err.statusCode || 500);
    await audit('ERROR', { status, message: err.message }).catch(() => {});
    json(res, status, { error: err.message });
  }
});

server.listen(port, () => console.log(`XUNIA Resilience Atlas listening on http://0.0.0.0:${port}`));
