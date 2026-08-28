# GLASS ONION HEALTH — EFILE RUNTIME v0.2

Commands:

- `/glass health`
- `/glass health runtime`
- `/glass certify health`

GLASS ONION HEALTH Runtime v0.2 turns the repository's healthcare control model into an executable, transport-agnostic e-file runtime. It is designed for mental-health and behavioral-health document workflows while preserving explicit compliance boundaries.

## Runtime pipeline

```text
AUTHENTICATE
  -> RESOLVE_ASSIGNMENT
  -> LOAD_PROTECTED_METADATA
  -> POLICY_DECIDE
  -> ALLOW / REVIEW / BLOCK
  -> DOCUMENT ACTION
  -> AUDIT APPEND
  -> EVIDENCE COLLECT
```

## Implemented modules

- `src/health/identity.ts` — unique identity, MFA-aware sessions, role/action boundaries, provider assignments.
- `src/health/storage.ts` — protected-object-store interface plus AES-256-GCM in-memory reference adapter with SHA-256 plaintext integrity hashes.
- `src/health/documents.ts` — encrypted draft creation, signed-document hash binding, append-only amendments, archival, no direct deletion.
- `src/health/consent.ts` — disclosure authorization resolution with separate psychotherapy, Part 2, and SUD-counseling-note authorization classes.
- `src/health/audit.ts` — append-only SHA-256 chained runtime audit ledger.
- `src/health/retention.ts` — class-specific retention decisions, legal hold, disposition review instead of automatic hard delete.
- `src/health/incidents.ts` — PHI/Part-2-aware incident lifecycle with closure evidence gates.
- `src/health/evidence.ts` — runtime evidence snapshots for access decisions, signatures, authorizations, audit integrity, and incidents.
- `src/health/runtime.ts` — governed orchestration service joining identity, assignment, document policy, audit, and evidence.
- `src/health/api.ts` — transport-agnostic API route contracts for charts, documents, signatures, access decisions, disclosures, audit, evidence, and incidents.
- `src/health/portals.ts` — clinician, administrator, and client portal capability contracts.

## Protected document lifecycle

```text
CREATE DRAFT
  -> protected object written
  -> document references protected:// object
  -> policy-controlled editing
  -> SIGN
  -> hash bound to signature + document version
  -> SIGNED
  -> later correction creates a new AMENDMENT object
  -> original remains preserved
```

Clinical payloads are intentionally separated from ordinary CRM metadata. Production systems should replace the in-memory storage/key adapters with durable object storage and a managed KMS/HSM while preserving the interfaces and policy decisions.

## Restricted data classes

The runtime preserves distinct access/release paths for:

- `PHI`
- `EPHI`
- `PSYCHOTHERAPY_NOTES`
- `PART2_RECORD`
- `PART2_SUD_COUNSELING_NOTE`

Psychotherapy-note and Part 2 release decisions do not fall through to ordinary disclosure authorization.

## Runtime evidence

A governed request creates a decision record and a cryptographically chained audit event. Evidence snapshots can associate those runtime artifacts with GLASS ONION HEALTH controls.

```text
SYSTEM -> CONTROL -> EVIDENCE -> ASSESSMENT -> RISK -> ATTESTATION
```

This begins converting repository controls into operating evidence, but production evidence remains required.

## Production adapters still required

Repository implementation is not a production deployment. A production installation must provide, configure, validate, and operate at least:

- persistent clinical metadata database;
- persistent protected object storage;
- managed KMS/HSM and key rotation;
- production identity provider and MFA;
- backups, disaster recovery, restoration testing, and availability controls;
- secure network and transport configuration;
- monitoring, alerting, incident operations, and access review;
- system/vendor inventory and applicable executed BAAs;
- workforce access provisioning/deprovisioning, policies, training, sanctions, and periodic evaluation;
- documented HIPAA risk analysis and risk management;
- applicable 42 CFR Part 2 scope and workflow determination;
- legal/compliance review for jurisdiction-specific retention and signature requirements.

No repository file self-issues an external HIPAA certification or legal determination. External certification remains `NOT_ISSUED`.

## ALMIGHTY-AGI convergence primitive

`src/lib/almighty-agi-math.ts` incorporates the Gregory/Maclaurin alternating series for arctangent as a mathematical learning/control reference:

```text
arctan(x) = x - x^3/3 + x^5/5 - x^7/7 + ...
```

The runtime uses the useful engineering principles, not the formula as an AGI claim:

- bounded iteration;
- alternating correction;
- explicit convergence tolerance;
- traceable error/correction signals;
- deterministic stopping conditions;
- no unbounded self-modification.

The module exposes an arctangent convergence trace and a generic bounded alternating-refinement primitive suitable for experiments where every refinement step must remain observable and limited.

## Current milestone

Repository milestone: `GLASS ONION HEALTH — EFILE RUNTIME v0.2`

Acceptance transaction:

```text
MFA-authenticated clinician
 -> assigned client
 -> encrypted case-note draft
 -> signed/version-bound final record
 -> policy-authorized read
 -> access decision
 -> cryptographic audit event
 -> runtime evidence snapshot
```
