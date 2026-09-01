# XUNIA AI FDE Migration Fabric

## Purpose

This is the XUNIA/XuniaDAO governance contract for a clean-room, agentic migration workflow inspired by publicly documented AI FDE patterns. It does **not** contain Palantir proprietary source code, model weights, private APIs, or tenant-specific implementation details.

The design is derived from public demonstrations and documentation plus an MIT-licensed community blueprint library. XUNIA implements the concepts with its own control plane, ontology, agents, evidence, and approval gates.

## Public reference set

- Demo video supplied by the project owner: https://www.youtube.com/watch?v=e90qUUh8_us
- Palantir SAP migration whitepaper: https://www.palantir.com/assets/xrfr7uokpv1b/2F8L1TTINRFCg8IGhcJ8vo/1965d99b6512cbae17b845ec8d26ebd2/SAP_Migration_Whitepaper.pdf
- Palantir AI FDE documentation: https://www.palantir.com/docs/foundry/ai-fde/overview/
- AI FDE modes and capabilities: https://www.palantir.com/docs/foundry/ai-fde/modes-capabilities/
- AIP Evals / closed-loop evaluation concepts: https://www.palantir.com/docs/foundry/announcements/2026-04-14-ai-fde-with-aip-evals/
- AIP Evolve fleet optimization concepts: https://www.palantir.com/docs/foundry/announcements/2026-08-18-aip-evolve-beta/
- Community reference implementation (MIT): https://github.com/s-andthat/palantir-ai-fde-library

## XUNIA-native architecture

```text
MISSION / OUTCOME
      |
      v
MINIMUM-VIABLE CONTEXT
source docs • schema • code • standards • constraints
      |
      v
PLAN
      |
      v
CONNECT -> INTERPRET -> ENHANCE -> STANDARDIZE -> VERIFY
   ^                                            |        |
   |                                            |        v
   +--------------- OBSERVE <- REPAIR <- DIAGNOSE      SME GATE
                                                    |
                                                    v
                                                  DEPLOY
                                                    |
                                                    v
                                             EVIDENCE / AUDIT
```

The migration fabric is not an unrestricted autonomous executor. It is an orchestration contract that narrows context, capabilities, tools, write authority, and external effects per mission and per role.

## Canonical stages

1. `PLAN` — define target outcome, source scope, standards, risk, checkpoints, and acceptance criteria.
2. `CONNECT` — establish governed read paths to source systems and documents.
3. `INTERPRET` — profile schemas, inspect metadata, map lineage, and understand source code/business logic.
4. `ENHANCE` — resolve gaps, enrich mappings, create missing domain concepts, and record assumptions.
5. `STANDARDIZE` — map source structures into canonical XUNIA ontology/contracts and generate transforms.
6. `VERIFY` — run quality gates, evaluations, lineage checks, reconciliation, and policy checks.
7. `DEPLOY` — promote only reviewed, reversible, evidence-backed artifacts.

`VERIFY` is a loop, not a single terminal step:

```text
VERIFY -> DIAGNOSE -> REPAIR PROPOSAL -> RE-RUN -> VERIFY
```

A repair loop has a bounded cycle budget. Exhausting it escalates to a human/SME rather than silently widening authority.

## Fleet roles

| Role | Primary mission | Default authority |
|---|---|---|
| `source-scout` | discover inputs, provenance, owners, constraints | read-only |
| `schema-cartographer` | profile schemas, relationships, lineage, nulls, keys | read-only |
| `code-interpreter` | extract business logic and dependency behavior | read-only |
| `mapping-engineer` | map source concepts to canonical ontology/contracts | proposal-only |
| `transform-builder` | generate bounded transforms and migration artifacts | branch/local write |
| `verifier` | run tests, reconciliation, evaluations, policy checks | read/execute tests |
| `diagnostician` | root-cause failed checks and propose repairs | proposal-only |
| `sme-gateway` | collect/record human decisions for ambiguous/high-impact mappings | no autonomous approval |
| `release-controller` | validate rollback, downstream impact, promotion evidence | approval-gated write |
| `auditor` | record lineage, tool use, decisions, evidence, unresolved risk | append evidence |

## Context policy

Agents receive the **minimum viable context** required for their current step. Context is explicit and typed:

- source system connection metadata (never raw long-lived credentials in prompts)
- schema/data dictionary excerpts
- selected code repositories/files
- target standards and ontology contracts
- business rules and compliance constraints
- prior stage artifacts and approved decisions

Broad repository or dataset access is not inferred from a mission name.

## Branch and phase policy

High-scope migration work is decomposed into branches/checkpoints:

```text
phase/01-discovery
phase/02-schema
phase/03-transforms
phase/04-verification
phase/05-release
```

Discovery and audits default to read-only. Schema and transform changes are branch-local. Release is a separate gated operation. Human review occurs at material semantic changes, permission changes, external writes, production promotion, and unresolved verification failures.

## Ontology

```text
MIGRATION_MISSION
  -> SOURCE_ASSET
  -> DISCOVERY_OBSERVATION
  -> SCHEMA_PROFILE
  -> SOURCE_LOGIC
  -> CANONICAL_MAPPING
  -> TRANSFORM_ARTIFACT
  -> EVALUATION
  -> FAILURE_DIAGNOSIS
  -> REPAIR_PROPOSAL
  -> SME_DECISION
  -> RELEASE_CANDIDATE
  -> DEPLOYMENT_EVIDENCE
  -> AUDIT_EVENT
```

Every object retains provenance and links back to the source evidence that justified it.

## Acceptance gates

A mission cannot report `COMPLETE` until applicable gates are evidenced:

- source scope and provenance known
- schema/profile inventory captured
- source logic and assumptions recorded
- canonical mappings reviewed
- transforms reproducible and versioned
- row/count/key/reconciliation expectations pass
- evaluation thresholds pass
- sensitive-data controls/markings checked
- permission and external-effect boundaries checked
- unresolved ambiguity either resolved or explicitly accepted by an authorized human
- rollback procedure exists
- downstream impact reviewed
- deployment evidence and audit trail recorded

## Command surface

Recommended XUNIA command namespace:

```text
/glass fde migration plan
/glass fde migration discover
/glass fde migration map
/glass fde migration build
/glass fde migration verify
/glass fde migration evidence
```

The executable runtime belongs in Zyra and GPT-DOUG-LLM. XuniaDAO owns the root governance contract and source/provenance record.
