# XUNIA / Glass Onion — PINEAL × OSIRIS integration

**Command:** \`/glass osiris\`  
**Source:** [sonoxo/gpt-doug-llm PR #341](https://github.com/sonoxo/gpt-doug-llm/pull/341) (**already merged**)  
**Upstream visualization:** [simplifaisoul/osiris](https://github.com/simplifaisoul/osiris) (MIT licensed)  
**Canonical XUNIA contract:** [ecosystem/pineal-osiris.json](../ecosystem/pineal-osiris.json)

## Architecture

\`\`\`text
   Official OSIRIS visualization (operator-owned local Mac)
       |
       +--> HTTP 127.0.0.1:3000     [publicly sourced map visual; no data replication]
       |
       +--> GPT-Doug safe-mirror: authorized public routes only
                |
                v
             PINEAL SQLite audited feed-health/provenance data
                |
                v
   HTTP 127.0.0.1:8766/api/status  [loopback, sanitised read-only]
                |
     EXPLICIT OPT-IN: same-host XUNIA Hub development service only
                |
                v
   XUNIA / Glass Onion normalization [route allowlist + recheck provenance/freshness]
                |
          XUNIA read-only UI
                |
   Any ontology promotion: HUMAN REVIEW + ZYRA permission gate
\`\`\`

## Source and status truth

- OSIRIS is independent open-source software. This integration is **not** endorsed by OSIRIS and copies no upstream source code.
- GPT-Doug's PINEAL OSIRIS integration is already merged in \`sonoxo/gpt-doug-llm\`. That alone does **not** establish that the OSIRIS server or feeds are currently running on anyone's computer.
- The hosted XUNIA website **cannot access a visitor's 127.0.0.1**. The local bridge must be started on the **same host** as the XUNIA development server with operator opt-in. Production deployments do not automatically proxy localhost.
- No raw satellite, maritime, aviation, camera, geolocation or intelligence payloads are imported into XuniaDAO. The normalized schema contains route, status, timestamp, latency, age and source only. Public map browsing remains in the official OSIRIS viewer.
- An old successful response is \`STALE\`, never silently promoted to \`ONLINE\`. Missing provenance is rejected.
- A proposed ontology write is \`REVIEW\`; raw feeds, scanner/recon requests, and any real-world actuation are \`BLOCK\`.
- PINEAL's local SQLite audit fields are observations; the number of entries does not attest to audit-chain integrity unless the chain has been verified separately.

## Run and verify

On the operator Mac, first restore sufficient disk space for OSIRIS \`npm ci\`. See [GPT-Doug's ENOSPC recovery](https://github.com/sonoxo/gpt-doug-llm/tree/main/integrations/pineal_osiris).

\`\`\`sh
sh "$HOME/.local/share/gpt-doug/gpt-doug-llm-osiris/integrations/pineal_osiris/run.sh" stack
\`\`\`

Local control deck: \`http://127.0.0.1:8766/\`  
Local safe status: \`http://127.0.0.1:8766/api/status\`  
XUNIA Hub route (once deployed): \`/xuniaverse/pineal-osiris\`

XUNIA Hub can use the same-host opt-in \`XUNIA_PINEAL_OSIRIS_LOCAL_BRIDGE=1\` during local development. Do not set it on hosted/public production unless an approved and reviewed networking boundary is explicitly designed.

## Code/contract

- \`src/lib/pineal-osiris.ts\`: deterministic route allowlist, provenance checks, timestamps/staleness, field projection and action gate
- \`src/lib/pineal-osiris.spec.ts\`: AVA regression checks for stale timestamps, camera/track redaction and no autonomous action
- \`src/lib/glass-onion-layer.ts\`: XUNIA \`PINEAL_OSIRIS_FEED_HEALTH\` capability with provenance and review
- \`ecosystem/pineal-osiris.json\`: machine-readable discovery and deployment-truth contract

**No automatic cloud deployment, vendor affiliation, live data feed claim, or remote host access is created by registering this contract.**
