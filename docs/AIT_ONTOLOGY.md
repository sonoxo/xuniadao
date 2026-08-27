# AIT Ontology

AIT is implemented as a first-class ontology contract inside the GLASS ONION layer.

## Command

`/glass ait`

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

## External AIT binding

The current implementation is an internal GLASS ONION contract. No AMOS/AIT repository was discoverable in the connected GitHub space when this layer was created, so the external binding is explicitly `UNBOUND`. A future verified repository or source identifier can be attached without changing the ontology semantics.
