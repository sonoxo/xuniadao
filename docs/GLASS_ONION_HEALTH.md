# Glass Onion Health

Command: `/glass health`

Certification command: `/glass certify health`

Glass Onion Health is the healthcare and mental-health e-file/document governance layer inside the XUNIA / GLASS ONION scope. It extends the existing CRM and compliance architecture without placing clinical payloads directly into ordinary CRM records.

## Purpose

Glass Onion Health is designed to support governed workflows for:

- client and provider identity references
- encounters and programs
- clinical e-file metadata
- intake, assessment, case-note, treatment-plan and discharge documents
- psychotherapy-note separation
- conditional 42 CFR Part 2 record classification
- consent and authorization tracking
- release-of-information workflows
- electronic signature binding
- retention-policy references
- disclosure review
- ordered audit evidence
- compliance-control evidence handoff

## Core architecture

```text
CRM / referral layer
        |
        v
CLIENT + PROGRAM + PROVIDER
        |
        v
ENCOUNTER
        |
        v
CLINICAL_DOCUMENT metadata
        |
        +---- protectedPayloadRef ----> protected clinical storage
        |
        v
PHI_CLASSIFY
        |
        v
POLICY_RESOLVE
        |
        v
ALLOW / REVIEW / BLOCK
        |
        v
DOCUMENT_ACTION
        |
        v
AUDIT_APPEND
        |
        v
CONTROL -> EVIDENCE -> ASSESSMENT -> RISK -> ATTESTATION
```

## Protected-payload boundary

Clinical document objects store governance metadata and a `protectedPayloadRef`. They do not require the clinical narrative itself to be embedded in the CRM object.

Protected data classes currently modeled:

- `PHI`
- `EPHI`
- `PSYCHOTHERAPY_NOTES`
- `PART2_RECORD`
- `PART2_SUD_COUNSELING_NOTE`

This separation is intended to make it possible to apply different access, disclosure, audit and storage controls to different classes of health information.

## Clinical document lifecycle

```text
DRAFT
  -> SIGN
  -> SIGNED
  -> AMEND (reviewed action)
  -> AMENDED
  -> ARCHIVED
```

Signed documents require a content hash. Electronic signatures bind:

- signer identity
- signer role
- document ID
- document version
- document hash
- signing time
- authentication method
- signing intent
- provenance

Direct destructive deletion of clinical records is blocked by the code baseline. Retention and disposition must be implemented through governed retention policies rather than ad-hoc deletion.

## Access-control model

Every protected-data decision can evaluate:

- actor identity
- role
- requested action
- purpose
- document classification
- clinician/client assignment
- authorship
- minimum-necessary state
- explicit authorization state
- Part 2 consent state when applicable
- external-recipient state
- bulk-export state
- emergency/break-glass state

The result is one of:

`ALLOW | REVIEW | BLOCK`

External releases, restricted-note releases, bulk exports, finalization/amendment actions and break-glass access are designed to produce human-review gates.

## Psychotherapy notes

`PSYCHOTHERAPY_NOTE` must use the `PSYCHOTHERAPY_NOTES` data class. The baseline creates a separate policy path for those records and does not treat them as ordinary case notes.

The model permits a narrowly modeled originator treatment read and otherwise requires an explicit authorization state before additional access can proceed. External release remains review-gated.

Production organizations must configure this behavior against their actual legal, clinical and operational requirements before deployment.

## 42 CFR Part 2

Glass Onion Health includes separate `PART2_RECORD` and `PART2_SUD_COUNSELING_NOTE` classifications. Modeled external release requires a satisfied Part 2 consent state plus human review.

Part 2 applicability depends on the organization, program, data and disclosure context. The repository does not make that legal determination automatically. Deployment must attach an applicability determination and operational consent evidence.

## Existing XUNIA controls reused

Glass Onion Health is intended to reuse the repository's existing healthcare/compliance primitives for:

- HIPAA scope assessment
- security risk analysis
- administrative, physical and technical safeguard tracking
- business-associate agreement tracking
- contingency planning
- breach-risk assessment
- privacy-process controls
- CRM provenance and human-review patterns

## Certification ontology

```text
SYSTEM
  -> CONTROL
  -> EVIDENCE
  -> ASSESSMENT
  -> RISK
  -> ATTESTATION
```

The internal identifier is `XUNIA-HEALTH-ICA-1` and applies only to the repository code/control baseline.

`/glass certify health` must preserve these boundaries:

- code/control baseline may be internally attested
- production operational evidence is still required
- deployment risk analysis is still required
- vendor/BAA evidence is still required when applicable
- production access-log review is still required
- Part 2 applicability evidence is still required when applicable
- independent external assessment remains separate
- external certification status remains `NOT_ISSUED`
- no claim of a government-issued or universal "HIPAA certification" is made

## Implementation phases

### Phase 1 — established in repository

- healthcare object and document taxonomy
- protected-payload reference boundary
- PHI/restricted-record classification
- role/purpose/action access evaluator
- psychotherapy-note separation
- Part 2 classification gates
- electronic-signature contract
- authorization lifecycle
- disclosure contract
- ordered audit-chain validator
- machine-readable ecosystem contract
- internal certification/evidence contract
- CI contract lock

### Phase 2 — application services

Build persistent services for:

- encrypted clinical object storage
- metadata database
- identity and MFA
- role/assignment service
- document versioning and hashing
- signature service
- consent/authorization ledger
- disclosure/release-of-information queue
- retention/legal-hold engine
- immutable or tamper-evident audit storage

### Phase 3 — mental-health application workflows

Implement user-facing workflows for:

- intake packet
- assessment
- individual/group case notes
- treatment plans and reviews
- discharge summaries
- client document signing
- clinician co-signature/supervisor review
- records requests
- release of information
- restricted psychotherapy-note workspace
- Part 2-aware SUD workflows when applicable

### Phase 4 — operational compliance evidence

Before representing a production deployment as compliant, collect and review the operational evidence required for the actual organization and environment, including risk analysis, policies, workforce controls, infrastructure configuration, access reviews, vendor agreements, incident procedures, backup/contingency evidence and applicable state/federal requirements.

## Repository files

```text
src/lib/glass-onion-health.ts
src/lib/glass-onion-health.spec.ts
src/lib/glass-onion-health-certification.ts
ecosystem/glass-onion-health.json
docs/GLASS_ONION_HEALTH.md
.github/workflows/glass-onion-health.yml
```
