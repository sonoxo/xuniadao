import http from 'node:http';
import crypto from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ccxt from 'ccxt';
import pg from 'pg';
import { runUniversalHive, verifyUniversalHiveRun, hiveStatus } from './swarm.mjs';

const { Pool } = pg;
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const VERSION = 'XUNIADAO-LIVE-1.1.0-HIVE';
const DATA_DIR = process.env.XUNIA_DATA_DIR || '/tmp/xuniadao';
const CHAIN_FILE = path.join(DATA_DIR, 'receipts.json');
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false }
}) : null;
const intents = new Map();
const audit = [];
const hiveRuns = new Map();

const now = () => new Date().toISOString();
function stable(v) {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
const sha256 = v => crypto.createHash('sha256').update(typeof v === 'string' ? v : stable(v)).digest('hex');
const receiptSignature = v => crypto.createHmac('sha256', process.env.XUNIA_RECEIPT_HMAC_KEY || 'demo-ephemeral-key').update(v).digest('hex');
function merkleRoot(leaves) {
  let layer = (leaves.length ? leaves : ['']).map(sha256);
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) next.push(sha256(layer[i] + (layer[i + 1] || layer[i])));
    layer = next;
  }
  return layer[0];
}
function scrub(v) {
  const secret = /(secret|password|private|seed|mnemonic|api[_-]?key|authorization|token)/i;
  if (Array.isArray(v)) return v.map(scrub);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k,x]) => [k, secret.test(k) ? '[REDACTED]' : scrub(x)]));
  return v;
}
function log(event, details = {}) {
  audit.unshift({ at: now(), event, details: scrub(details) });
  if (audit.length > 200) audit.length = 200;
}
async function initDb() {
  if (!pool) return mkdir(DATA_DIR, { recursive: true });
  await pool.query(`CREATE TABLE IF NOT EXISTS xunia_receipts (
    block_no BIGINT PRIMARY KEY,
    block_hash TEXT UNIQUE NOT NULL,
    prev_hash TEXT NOT NULL,
    receipt JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}
async function fileChain() {
  try { return JSON.parse(await readFile(CHAIN_FILE, 'utf8')); } catch { return []; }
}
async function latestReceipt() {
  if (pool) {
    const r = await pool.query('SELECT receipt FROM xunia_receipts ORDER BY block_no DESC LIMIT 1');
    return r.rows[0]?.receipt || null;
  }
  return (await fileChain()).at(-1) || null;
}
async function appendReceipt(receipt) {
  if (pool) {
    await pool.query('INSERT INTO xunia_receipts(block_no,block_hash,prev_hash,receipt) VALUES($1,$2,$3,$4)', [receipt.blockNo, receipt.blockHash, receipt.prevHash, receipt]);
    return;
  }
  const c = await fileChain();
  c.push(receipt);
  await writeFile(CHAIN_FILE, JSON.stringify(c, null, 2));
}
async function recentReceipts(limit = 20) {
  if (pool) {
    const r = await pool.query('SELECT receipt FROM xunia_receipts ORDER BY block_no DESC LIMIT $1', [limit]);
    return r.rows.map(x => x.receipt);
  }
  return (await fileChain()).slice(-limit).reverse();
}

function exPrefix(id) { return 'EXCHANGE_' + id.toUpperCase().replace(/[^A-Z0-9]/g, '_'); }
function exConfig(id) {
  const p = exPrefix(id);
  return {
    apiKey: process.env[p + '_API_KEY'] || '',
    secret: process.env[p + '_SECRET'] || '',
    password: process.env[p + '_PASSWORD'] || '',
    uid: process.env[p + '_UID'] || ''
  };
}
function privateConfigured(id) {
  const c = exConfig(id);
  return Boolean(c.apiKey && c.secret);
}
async function exchange(id, requirePrivate = false) {
  if (!ccxt.exchanges.includes(id) || typeof ccxt[id] !== 'function') throw new Error('Unsupported exchange adapter');
  const cfg = exConfig(id);
  if (requirePrivate && !(cfg.apiKey && cfg.secret)) throw new Error('Missing ' + exPrefix(id) + '_API_KEY / _SECRET');
  const Ex = ccxt[id];
  const ex = new Ex({ enableRateLimit: true, ...cfg });
  if ((process.env.XUNIA_SANDBOX || 'true').toLowerCase() === 'true' && typeof ex.setSandboxMode === 'function') {
    try { ex.setSandboxMode(true); } catch {}
  }
  return ex;
}
async function moneroRpc(method, params = {}) {
  const url = process.env.MONERO_WALLET_RPC_URL;
  if (!url) throw new Error('MONERO_WALLET_RPC_URL is not configured');
  const headers = { 'content-type': 'application/json' };
  if (process.env.MONERO_RPC_AUTH_HEADER) headers.authorization = process.env.MONERO_RPC_AUTH_HEADER;
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id: 'xunia', method, params }) });
  if (!r.ok) throw new Error('Monero wallet-rpc HTTP ' + r.status);
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || 'Monero RPC error');
  return d.result;
}
function json(res, status, value) {
  res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(JSON.stringify(value));
}
async function body(req) {
  let raw = '';
  for await (const c of req) {
    raw += c;
    if (raw.length > 1000000) throw new Error('Request too large');
  }
  return raw ? JSON.parse(raw) : {};
}
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX = await readFile(path.join(__dirname, 'public', 'index.html'), 'utf8');

async function handler(req, res) {
  const u = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  try {
    if (req.method === 'GET' && u.pathname === '/') {
      res.writeHead(200, {
        'content-type':'text/html; charset=utf-8',
        'cache-control':'no-store',
        'x-frame-options':'DENY',
        'content-security-policy':"default-src 'self'; connect-src 'self' https://mempool.space; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'"
      });
      return res.end(INDEX);
    }
    if (req.method === 'GET' && u.pathname === '/api/health') {
      const latest = await latestReceipt();
      return json(res, 200, { ok:true, version:VERSION, time:now(), database:pool?'postgres':'ephemeral-file', chainHeight:latest?.blockNo || 0 });
    }
    if (req.method === 'GET' && u.pathname === '/api/status') {
      const latest = await latestReceipt();
      return json(res, 200, {
        version: VERSION,
        doctrine: 'MONERO SECURES VALUE. THE HIVE SECURES KNOWLEDGE. XUNIADAO PROVES THE PROCESS.',
        readOnly: (process.env.XUNIA_READ_ONLY || 'true').toLowerCase() !== 'false',
        executionEnabled: (process.env.XUNIA_EXECUTION_ENABLED || 'false').toLowerCase() === 'true',
        sandbox: (process.env.XUNIA_SANDBOX || 'true').toLowerCase() === 'true',
        receiptSigning: process.env.XUNIA_RECEIPT_HMAC_KEY ? 'configured' : 'demo-ephemeral',
        database: pool ? 'postgres' : 'ephemeral-file',
        chainHeight: latest?.blockNo || 0,
        moneroWalletRpc: Boolean(process.env.MONERO_WALLET_RPC_URL),
        ccxtAdapters: ccxt.exchanges.length,
        withdrawals: 'disabled',
        universalHive: hiveStatus()
      });
    }
    if (req.method === 'GET' && u.pathname === '/api/hive/status') {
      return json(res,200,hiveStatus());
    }
    if (req.method === 'POST' && u.pathname === '/api/hive/summon') {
      const b = await body(req);
      const prompt = String(b.prompt || '').trim();
      if (!prompt) return json(res,400,{error:'prompt required'});
      const run = runUniversalHive({
        prompt,
        ontology:b.ontology || 'XUNIADAO_CANONICAL_V2',
        builders:b.builders || ['operator'],
        requestedWorkers:b.requestedWorkers || 14,
        requestId:b.requestId || null
      });
      const verification = verifyUniversalHiveRun(run);
      if (!verification.valid) return json(res,500,{error:'Hive verification failed',verification});
      hiveRuns.set(run.job.jobId,run);
      if (hiveRuns.size > 200) hiveRuns.delete(hiveRuns.keys().next().value);
      log('UNIVERSAL_HIVE_SWARM_CREATED',{
        jobId:run.job.jobId,
        hiveId:run.hive.hiveId,
        swarmId:run.swarm.swarmId,
        activeWorkers:run.swarm.activeWorkers,
        logicalHiveCapacity:run.hive.logicalCapacity,
        logicalSwarmCapacity:run.swarm.logicalCapacity,
        rewardEventId:run.builderRewardEvent.rewardEventId
      });
      return json(res,201,{run,verification});
    }
    if (req.method === 'GET' && u.pathname === '/api/hive/run') {
      const id = u.searchParams.get('jobId') || '';
      const run = hiveRuns.get(id);
      return run ? json(res,200,{run,verification:verifyUniversalHiveRun(run)}) : json(res,404,{error:'Hive run not found in active memory'});
    }
    if (req.method === 'GET' && u.pathname === '/api/exchanges') {
      const q = (u.searchParams.get('q') || '').toLowerCase();
      return json(res, 200, ccxt.exchanges.filter(id => !q || id.includes(q)).slice(0,300).map(id => ({ id, privateConfigured:privateConfigured(id), envPrefix:exPrefix(id) })));
    }
    if (req.method === 'GET' && u.pathname === '/api/exchange/capabilities') {
      const id = u.searchParams.get('id') || '';
      const ex = await exchange(id);
      await ex.loadMarkets();
      return json(res, 200, { id, name:ex.name, privateConfigured:privateConfigured(id), has:ex.has, symbols:(ex.symbols || []).slice(0,150) });
    }
    if (req.method === 'GET' && u.pathname === '/api/exchange/ticker') {
      const id = u.searchParams.get('id') || '';
      const symbol = u.searchParams.get('symbol') || 'BTC/USDT';
      const ex = await exchange(id);
      const t = await ex.fetchTicker(symbol);
      log('EXCHANGE_TICKER', {id,symbol});
      return json(res, 200, {exchange:id,symbol:t.symbol,last:t.last,bid:t.bid,ask:t.ask,high:t.high,low:t.low,baseVolume:t.baseVolume,quoteVolume:t.quoteVolume,timestamp:t.timestamp});
    }
    if (req.method === 'GET' && u.pathname === '/api/exchange/account') {
      const id = u.searchParams.get('id') || '';
      const ex = await exchange(id, true);
      const b = await ex.fetchBalance();
      let orders = [];
      if (ex.has?.fetchOpenOrders) { try { orders = await ex.fetchOpenOrders(); } catch {} }
      const balances = {};
      for (const [asset,amount] of Object.entries(b.total || {})) if (Number(amount)) balances[asset] = amount;
      log('EXCHANGE_ACCOUNT_READ', {id});
      return json(res, 200, {exchange:id,balances,openOrders:orders.slice(0,100).map(o=>({id:o.id,symbol:o.symbol,type:o.type,side:o.side,price:o.price,amount:o.amount,filled:o.filled,remaining:o.remaining,status:o.status}))});
    }
    if (req.method === 'POST' && u.pathname === '/api/exchange/order-intent') {
      const b = await body(req);
      const { exchange:exid, symbol, type='limit', side, amount, price } = b;
      if (!exid || !symbol || !['buy','sell'].includes(side) || !Number(amount) || Number(amount) <= 0) return json(res,400,{error:'exchange, symbol, side and positive amount required'});
      await exchange(exid, true);
      const intentId = crypto.randomUUID();
      const intent = {
        intentId, exchange:exid, symbol, type, side,
        amount:Number(amount),
        price:price === '' || price == null ? undefined : Number(price),
        createdAt:now(), expiresAt:Date.now()+600000
      };
      intent.fingerprint = sha256(intent);
      intents.set(intentId,intent);
      log('ORDER_INTENT_CREATED',intent);
      return json(res,200,{intent:scrub(intent),confirmPhrase:'CONFIRM '+intentId.slice(0,8),executionEnabled:(process.env.XUNIA_EXECUTION_ENABLED||'false').toLowerCase()==='true',readOnly:(process.env.XUNIA_READ_ONLY||'true').toLowerCase()!=='false'});
    }
    if (req.method === 'POST' && u.pathname === '/api/exchange/order-confirm') {
      const b = await body(req);
      const intent = intents.get(b.intentId);
      if (!intent || intent.expiresAt < Date.now()) return json(res,400,{error:'Intent missing or expired'});
      if (b.confirmPhrase !== 'CONFIRM '+intent.intentId.slice(0,8)) return json(res,400,{error:'Confirmation phrase mismatch'});
      if ((process.env.XUNIA_READ_ONLY||'true').toLowerCase() !== 'false') return json(res,403,{error:'XUNIA_READ_ONLY is active'});
      if ((process.env.XUNIA_EXECUTION_ENABLED||'false').toLowerCase() !== 'true') return json(res,403,{error:'Global execution kill switch is OFF'});
      const ex = await exchange(intent.exchange,true);
      if (!ex.has?.createOrder) return json(res,400,{error:'Exchange adapter does not support createOrder'});
      const order = await ex.createOrder(intent.symbol,intent.type,intent.side,intent.amount,intent.price);
      intents.delete(intent.intentId);
      log('ORDER_EXECUTED',{intent,order:{id:order.id,status:order.status}});
      return json(res,200,{ok:true,order:{id:order.id,symbol:order.symbol,side:order.side,type:order.type,price:order.price,amount:order.amount,status:order.status}});
    }
    if (req.method === 'GET' && u.pathname === '/api/wallet/monero/status') {
      if (!process.env.MONERO_WALLET_RPC_URL) return json(res,200,{configured:false,mode:'external-rpc-required'});
      return json(res,200,{configured:true,version:await moneroRpc('get_version',{}),spendEndpoints:'disabled-by-xuniadao'});
    }
    if (req.method === 'GET' && u.pathname === '/api/wallet/monero/balance') {
      const r = await moneroRpc('get_balance',{account_index:0,all_accounts:true});
      log('MONERO_BALANCE_READ');
      return json(res,200,{balance:r.balance,unlocked_balance:r.unlocked_balance,blocks_to_unlock:r.blocks_to_unlock});
    }
    const btc = u.pathname.match(/^\/api\/wallet\/bitcoin\/address\/([^/]+)$/);
    if (req.method === 'GET' && btc) {
      const address = decodeURIComponent(btc[1]);
      if (!/^[A-Za-z0-9]{14,90}$/.test(address)) return json(res,400,{error:'Invalid address format'});
      const api = (process.env.XUNIA_BITCOIN_TESTNET||'false').toLowerCase()==='true' ? 'https://mempool.space/testnet/api' : 'https://mempool.space/api';
      const r = await fetch(api+'/address/'+encodeURIComponent(address),{headers:{'user-agent':'xuniadao-live/1.0'}});
      if (!r.ok) throw new Error('Bitcoin watch API HTTP '+r.status);
      const d = await r.json();
      const confirmed = d.chain_stats.funded_txo_sum-d.chain_stats.spent_txo_sum;
      const mempool = d.mempool_stats.funded_txo_sum-d.mempool_stats.spent_txo_sum;
      log('BITCOIN_WATCH_READ',{address:address.slice(0,6)+'...'+address.slice(-6)});
      return json(res,200,{address,confirmedSats:confirmed,mempoolDeltaSats:mempool,totalSats:confirmed+mempool,txCount:d.chain_stats.tx_count+d.mempool_stats.tx_count,mode:'watch-only'});
    }
    if (req.method === 'POST' && u.pathname === '/api/jobs') {
      const b = await body(req);
      const prompt = String(b.prompt || '').trim();
      if (!prompt) return json(res,400,{error:'prompt required'});
      const hiveRun = runUniversalHive({
        prompt,
        ontology:b.ontology || 'XUNIADAO_CANONICAL_V2',
        builders:b.builders || ['operator'],
        requestedWorkers:b.requestedWorkers || 14,
        requestId:b.requestId || null
      });
      const hiveVerification = verifyUniversalHiveRun(hiveRun);
      if (!hiveVerification.valid) return json(res,500,{error:'Hive verification failed',hiveVerification});
      const latest = await latestReceipt();
      const blockNo = Number(latest?.blockNo || 0)+1;
      const prevHash = latest?.blockHash || 'GENESIS';
      const core = {
        protocol:'XUNIADAO',
        version:2,
        blockNo,
        prevHash,
        job:hiveRun.job,
        hive:hiveRun.hive,
        swarm:hiveRun.swarm,
        workers:hiveRun.workers,
        chaos:hiveRun.chaos,
        reconciliation:hiveRun.reconciliation,
        builderRewardEvent:hiveRun.builderRewardEvent,
        verification:{...hiveRun.verification,hiveMerkleVerified:hiveVerification.valid},
        merkleRoot:hiveRun.merkleRoot,
        consensus:hiveRun.consensus,
        settlement:hiveRun.settlement,
        apmLoop:hiveRun.apmLoop
      };
      const blockHash = sha256(core);
      const receipt = {...core,blockHash,receiptSignature:receiptSignature(blockHash)};
      await appendReceipt(receipt);
      hiveRuns.set(hiveRun.job.jobId,hiveRun);
      if (hiveRuns.size > 200) hiveRuns.delete(hiveRuns.keys().next().value);
      log('NEURAL_HIVE_RECEIPT_APPENDED',{
        blockNo,blockHash,jobId:hiveRun.job.jobId,
        hiveId:hiveRun.hive.hiveId,
        swarmId:hiveRun.swarm.swarmId,
        activeWorkers:hiveRun.swarm.activeWorkers,
        rewardEventId:hiveRun.builderRewardEvent.rewardEventId
      });
      return json(res,201,receipt);
    }
    if (req.method === 'GET' && u.pathname === '/api/receipts') return json(res,200,await recentReceipts(Number(u.searchParams.get('limit')||20)));
    if (req.method === 'GET' && u.pathname === '/api/audit') return json(res,200,audit.slice(0,100));
    if (req.method === 'GET' && u.pathname === '/api/secrets/status') {
      const id = u.searchParams.get('exchange') || '';
      const p = id ? exPrefix(id) : '';
      return json(res,200,{
        exchange:id?{id,prefix:p,apiKey:Boolean(process.env[p+'_API_KEY']),secret:Boolean(process.env[p+'_SECRET']),password:Boolean(process.env[p+'_PASSWORD']),uid:Boolean(process.env[p+'_UID'])}:null,
        monero:{url:Boolean(process.env.MONERO_WALLET_RPC_URL),authHeader:Boolean(process.env.MONERO_RPC_AUTH_HEADER)},
        receiptSigning:Boolean(process.env.XUNIA_RECEIPT_HMAC_KEY),
        note:'Secret values are never returned.'
      });
    }
    return json(res,404,{error:'Not found'});
  } catch (e) {
    log('ERROR',{path:u.pathname,message:e?.message || String(e)});
    return json(res,500,{error:e?.message || 'Internal error'});
  }
}

await initDb();
http.createServer(handler).listen(PORT,HOST,()=>{
  console.log('[XUNIADAO] '+VERSION+' listening on '+HOST+':'+PORT);
  console.log('[XUNIADAO] readOnly='+(process.env.XUNIA_READ_ONLY||'true')+' execution='+(process.env.XUNIA_EXECUTION_ENABLED||'false')+' sandbox='+(process.env.XUNIA_SANDBOX||'true'));
});
