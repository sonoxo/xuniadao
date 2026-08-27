# AIT Ontology

AIT is implemented as a first-class ontology contract inside the GLASS ONION layer.

## Command

`/glass ait`

## Binding state

`BOUND`

AIT is pinned to the controlled XUNIA / GLASS ONION source contract:

- source ID: `xunia:glass-onion:ait`
- repository: `sonoxo/xuniadao`
- baseline commit: `041dcc38b4a2f751b0b9e2c8d2488931ddeb6f5e`
- contract: `ecosystem/ait-ontology.json`
- implementation: `src/lib/ait-ontology.ts`
- verifier: `.github/workflows/ait-ontology.yml`

This binding gives every seeded AIT object and relation a concrete provenance anchor. The bound state does not claim sponsorship, partnership, endorsement, or affiliation with an unrelated AMOS project or external organization.

## Purpose

The ontology turns AIT intelligence into typed objects, typed relationships, governed workflows, and reviewable actions. It does not treat unverified source claims as facts and it does not execute consequential actions automatically.

## Object model

- `AIT_AGENT` — bounded software agent or planner
- `AIT_SYSTEM` — platform or runtime
- `AIT_CAPABILITY` — declared capability
- `AIT_INTEL_SOURCE` — provenance-bearing intelligence source
- `AIT_EVIDENCE` — source-grounded evidence item
- `AIT_OBSERVATION` — direct observation derived from evidence
- `AIT_HYPOTHESIS` — analytic hypothesis requiring evidence and review
- `AIT_DECISION` — reviewable decision record
- `AIT_WORKFLOW` — governed process
- `AIT_ACTION` — proposed action
- `AIT_CONTROL` — policy or guardrail

## Relationships

`OPERATES`, `PRODUCES`, `SUPPORTED_BY`, `DERIVED_FROM`, `CORROBORATES`, `CONTRADICTS`, `ROUTES_TO`, `REQUIRES`, `GOVERNS`, `EXECUTES`, and `APPLIES_TO`.

## Intelligence pipeline

```text
AIT_INGEST
  → AIT_PROVENANCE_CHECK
  → AIT_NORMALIZE
  → AIT_CORRELATE
  → AIT_ANALYZE
  → VA3LM_COMMAND_REVIEW
  → ZYRA_ACTION_GATE
```

Read-only analysis can use the fast path. Intelligence promotion, high-impact decisions, repository mutation, transaction signing, and production deployment require review. Automatic fund movement, automatic governance voting, and arbitrary remote shell remain blocked.

## Binding verification

The AIT CI gate rejects changes if the binding loses its `BOUND` state, the pinned source identity changes unexpectedly, required source paths disappear, provenance is removed, or the machine contract no longer matches the TypeScript implementation.
