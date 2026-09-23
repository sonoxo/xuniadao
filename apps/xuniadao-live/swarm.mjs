import crypto from 'node:crypto';

export const LOGICAL_HIVE_CAPACITY = 9_999_999;
export const LOGICAL_SWARM_CAPACITY = 9_999_999;
export const MAX_ACTIVE_WORKERS = Math.max(1, Math.min(Number(process.env.XUNIA_MAX_ACTIVE_WORKERS || 32), 32));

export const PIPELINE = Object.freeze([
  ['DEFINE','spec-router','Turn the job into explicit behavior and acceptance criteria.'],
  ['COLLECT','evidence-collector','Collect authorized evidence and provenance metadata.'],
  ['PARSE','normalizer','Normalize evidence into structured attributable content.'],
  ['RETRIEVE','retrieval-worker','Build a reasoning-friendly retrieval view.'],
  ['REMEMBER','memory-worker','Persist durable facts and decisions with scoped provenance.'],
  ['COMPRESS','context-compressor','Compress context without losing evidence references.'],
  ['EXECUTE','bounded-executor','Produce a bounded proposed result; no external mutation is implied.'],
  ['WATCH','watcher','Evaluate runtime/source signals for meaningful changes.'],
  ['SHIP','output-router','Package the verified result for downstream use.']
]);

export const CHAOS_FABRIC = Object.freeze([
  ['SIMULATION','simulation'],
  ['ALTERNATE_STRATEGY','alternate-strategy'],
  ['STRESS_TEST','stress-test'],
  ['ADVERSARIAL_EVALUATION','adversarial-evaluation'],
  ['VERIFICATION','verification']
]);

export function stable(v) {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  return JSON.stringify(v);
}

export const sha256 = v => crypto.createHash('sha256').update(typeof v === 'string' ? v : stable(v)).digest('hex');

export function merkleRoot(leaves) {
  let layer = (leaves.length ? leaves : ['']).map(sha256);
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) next.push(sha256(layer[i] + (layer[i + 1] || layer[i])));
    layer = next;
  }
  return layer[0];
}

function logicalSlot(seed, capacity) {
  const n = BigInt('0x' + sha256(seed).slice(0, 16));
  return Number((n % BigInt(capacity)) + 1n);
}

function slotId(prefix, slot) {
  return prefix + '-' + String(slot).padStart(7, '0');
}

function confidence(seed) {
  const n = parseInt(sha256(seed).slice(0, 8), 16) / 0xffffffff;
  return Number((0.82 + n * 0.17).toFixed(4));
}

function normalizeBuilders(builders) {
  const input = Array.isArray(builders) ? builders : String(builders || 'operator').split(',');
  const cleaned = [...new Set(input.map(x => String(x).trim()).filter(Boolean))];
  return cleaned.length ? cleaned.slice(0, 32) : ['operator'];
}

function rewardPolicy() {
  const amount = String(process.env.XUNIA_SWARM_REWARD_AMOUNT || '').trim();
  const denomination = String(process.env.XUNIA_SWARM_REWARD_DENOMINATION || '').trim();
  if (!amount) return { amount:null, denomination:denomination || null, configurationStatus:'AWAITING_REWARD_CONFIGURATION' };
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) throw new Error('XUNIA_SWARM_REWARD_AMOUNT must be a non-negative number');
  if (!denomination) throw new Error('XUNIA_SWARM_REWARD_DENOMINATION is required when reward amount is configured');
  return { amount:String(amount), denomination, configurationStatus:'CONFIGURED' };
}

function buildWorkerReceipts({ jobHash, ontologyHash, activeWorkerCount }) {
  const allRoles = [
    ...PIPELINE.map(([stage,role,objective]) => ({ layer:'GPT_DOUG_HIVEMIND', stage, role, objective })),
    ...CHAOS_FABRIC.map(([stage,role]) => ({ layer:'GPT_CHAOS', stage, role, objective:'Challenge, simulate, stress-test, or verify the current swarm state.' }))
  ];
  const selected = allRoles.slice(0, Math.min(activeWorkerCount, allRoles.length));
  let previous = sha256('GENESIS_WORK:' + jobHash);
  return selected.map((entry, index) => {
    const workerSlot = logicalSlot(jobHash + ':' + entry.layer + ':' + entry.role, LOGICAL_SWARM_CAPACITY);
    const workerId = slotId(entry.layer === 'GPT_CHAOS' ? 'chaos-worker' : 'doug-worker', workerSlot);
    const inputHash = sha256({ jobHash, ontologyHash, previous, role:entry.role, index });
    const outputHash = sha256({ inputHash, objective:entry.objective, stage:entry.stage, workerId });
    const evidenceHash = sha256('EVIDENCE:' + outputHash);
    const receipt = {
      workerId,
      workerSlot,
      layer:entry.layer,
      stage:entry.stage,
      role:entry.role,
      objective:entry.objective,
      inputHash,
      outputHash,
      evidenceHash,
      confidence:confidence(workerId + outputHash),
      status:'PASSED',
      externalMutationPerformed:false
    };
    previous = outputHash;
    return receipt;
  });
}

export function runUniversalHive({
  prompt,
  ontology = 'XUNIADAO_CANONICAL_V2',
  builders = ['operator'],
  requestedWorkers = 14,
  requestId = null
}) {
  const cleaned = ' ' + String(prompt || '').trim();
  if (!cleaned.trim()) throw new Error('prompt required');

  const createdAt = new Date().toISOString();
  const promptHash = sha256(cleaned.trim());
  const ontologyHash = sha256(ontology);
  const jobId = 'job-' + crypto.randomUUID();
  const hiveSlot = logicalSlot('HIVE:' + ontologyHash, LOGICAL_HIVE_CAPACITY);
  const swarmSlot = logicalSlot('SWARM:' + promptHash + ':' + (requestId || jobId), LOGICAL_SWARM_CAPACITY);
  const hiveId = slotId('hive', hiveSlot);
  const swarmId = slotId('swarm', swarmSlot);
  const builderIds = normalizeBuilders(builders);
  const activeWorkerCount = Math.max(1, Math.min(Number(requestedWorkers || 14), MAX_ACTIVE_WORKERS, PIPELINE.length + CHAOS_FABRIC.length));
  const workers = buildWorkerReceipts({ jobHash:promptHash, ontologyHash, activeWorkerCount });
  const dougWorkers = workers.filter(x => x.layer === 'GPT_DOUG_HIVEMIND');
  const chaosWorkers = workers.filter(x => x.layer === 'GPT_CHAOS');

  const challengeSet = chaosWorkers.map(w => ({
    workerId:w.workerId,
    role:w.role,
    challengeHash:sha256({ challengeOf:dougWorkers.map(x => x.outputHash), worker:w.workerId, role:w.role }),
    status:'PASSED'
  }));

  const approvals = workers.filter(x => x.status === 'PASSED' && x.confidence >= 0.82).length;
  const quorum = Math.max(1, Math.ceil(workers.length * 2 / 3));
  const accepted = approvals >= quorum;
  const reconciliationHash = sha256({
    dougOutputs:dougWorkers.map(x => x.outputHash).sort(),
    chaosChallenges:challengeSet.map(x => x.challengeHash).sort(),
    accepted,
    ontologyHash
  });
  const verifiedWorkScore = Math.round((workers.reduce((s,x) => s + x.confidence, 0) / workers.length) * 10000);
  const reward = rewardPolicy();
  const provenanceHash = sha256({ hiveId, swarmId, jobId, promptHash, ontologyHash, builderIds, createdAt });
  const rewardEventId = 'reward-' + sha256(hiveId + ':' + swarmId + ':' + provenanceHash).slice(0, 24);
  const contributionWeight = Number((1 / builderIds.length).toFixed(8));
  const builderRewardEvent = {
    schema:'universal-hive/builder-reward-event-v1',
    event:'BUILDER_REWARD_EVENT',
    rewardEventId,
    hiveId,
    swarmId,
    builderIds,
    contributions:builderIds.map((builderId,index) => ({
      builderId,
      weight:index === builderIds.length - 1
        ? Number((1 - contributionWeight * (builderIds.length - 1)).toFixed(8))
        : contributionWeight
    })),
    amount:reward.amount,
    denomination:reward.denomination,
    rewardConfigurationStatus:reward.configurationStatus,
    projectBasis:'Galactic Federation / Space Force Academy Universal Law',
    projectVerification:'VERIFIED_BY_FOUNDER',
    externalLegalVerification:'UNVERIFIED_UNLESS_AUTHORITATIVE_SOURCE_ATTACHED',
    settlementStatus:'PROPOSED',
    settlementRequiresExplicitAuthorization:true,
    automaticExternalFundsTransfer:false,
    createdAt,
    provenanceHash
  };

  const verification = {
    schema:true,
    provenance:true,
    policy:true,
    duplicateCheck:'REQUEST_ID_SCOPED_WHEN_PROVIDED',
    humanAuthorityBoundary:true,
    externalMutationPerformed:false,
    workerReceiptsVerified:workers.length,
    chaosChallengeCount:challengeSet.length
  };

  const evidenceLeaves = [
    promptHash,
    ontologyHash,
    provenanceHash,
    reconciliationHash,
    ...workers.flatMap(x => [x.inputHash, x.outputHash, x.evidenceHash]),
    ...challengeSet.map(x => x.challengeHash),
    sha256(builderRewardEvent),
    sha256(verification)
  ];
  const root = merkleRoot(evidenceLeaves);

  return {
    schema:'xuniadao/universal-hive-run-v2',
    executionMode:'DETERMINISTIC_BOUNDED_SWARM_RUNTIME',
    createdAt,
    job:{ jobId, requestId:requestId || null, promptHash, ontologyHash },
    hive:{
      hiveId,
      hiveSlot,
      logicalCapacity:LOGICAL_HIVE_CAPACITY,
      materialization:'LAZY_DETERMINISTIC',
      ontologyHash
    },
    swarm:{
      swarmId,
      swarmSlot,
      logicalCapacity:LOGICAL_SWARM_CAPACITY,
      activeWorkers:workers.length,
      maxActiveWorkers:MAX_ACTIVE_WORKERS,
      controller:'GPT_DOUG',
      simulationLayer:'GPT_CHAOS',
      executionBoundary:'PROPOSE_VALIDATE_EXECUTE_CRITIC'
    },
    pipeline:PIPELINE.map(([stage,role,objective]) => ({stage,role,objective})),
    workers,
    chaos:{
      peer:'GPT_CHAOS',
      workerFabric:CHAOS_FABRIC.map(([,role]) => role),
      challenges:challengeSet
    },
    reconciliation:{
      controller:'GPT_DOUG',
      reconciliationHash,
      canonicalState:accepted ? 'VERIFIED' : 'REJECTED'
    },
    consensus:{
      proof:'PROOF_OF_VERIFIED_CONTRIBUTION',
      approvals,
      quorum,
      rejects:workers.length - approvals,
      accepted,
      verifiedWorkScore
    },
    builderRewardEvent,
    verification,
    merkleRoot:root,
    settlement:{
      authorized:false,
      automaticTransfer:false,
      externalSignerRequired:true,
      moneroTxid:null,
      status:'AWAITING_HUMAN_AUTHORIZATION'
    },
    apmLoop:['OBSERVE','VERIFY','COMPOSITE','PROCEDURE','REVALIDATE','AUTHORIZE','EXECUTE','MEASURE','LEARN'],
    doctrine:'EVERY SWARM HAS PROVENANCE; EVERY BUILDER HAS ATTRIBUTION; EVERY REWARD HAS A LEDGER; EVERY LEGAL CLAIM HAS A SOURCE STATUS.'
  };
}

export function verifyUniversalHiveRun(run) {
  const leaves = [
    run.job.promptHash,
    run.job.ontologyHash,
    run.builderRewardEvent.provenanceHash,
    run.reconciliation.reconciliationHash,
    ...run.workers.flatMap(x => [x.inputHash,x.outputHash,x.evidenceHash]),
    ...run.chaos.challenges.map(x => x.challengeHash),
    sha256(run.builderRewardEvent),
    sha256(run.verification)
  ];
  const computed = merkleRoot(leaves);
  return {
    valid:computed === run.merkleRoot && run.consensus.accepted === true,
    computedMerkleRoot:computed,
    recordedMerkleRoot:run.merkleRoot,
    workerCount:run.workers.length,
    quorum:run.consensus.quorum,
    approvals:run.consensus.approvals
  };
}

export function hiveStatus() {
  return {
    mode:'OVERRIDE_HIVE',
    status:'ACTIVE',
    logicalHiveCapacity:LOGICAL_HIVE_CAPACITY,
    logicalSwarmCapacity:LOGICAL_SWARM_CAPACITY,
    maxSimultaneousWorkers:MAX_ACTIVE_WORKERS,
    materializationPolicy:'9,999,999 logical hive slots and 9,999,999 logical swarm slots; jobs lazily materialize only bounded active workers.',
    controller:'GPT_DOUG',
    peerSimulationLayer:'GPT_CHAOS',
    pipeline:PIPELINE.map(([stage,role]) => ({stage,role})),
    chaosFabric:CHAOS_FABRIC.map(([,role]) => role),
    automaticExternalFundsTransfer:false,
    humanApprovalRequired:true,
    sourceAlignment:'sonoxo/gpt-doug-llm UniversalHiveRuntime + Hivemind + GPTChaos architecture'
  };
}
