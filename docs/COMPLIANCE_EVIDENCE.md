# GDPR + HIPAA Production Evidence

Command: `/glass evidence`

The repository-level GDPR/HIPAA control model is complete at the software/policy layer. This evidence layer closes the next gap: tracking the **real production artifacts** that demonstrate those controls operate in practice.

## Evidence model

Each artifact records:

- requirement ID
- present/missing/expired/not-applicable status
- source location
- observation date
- optional expiration date
- provenance/approval chain

The TypeScript implementation is `src/lib/compliance-evidence.ts`. The machine contract is `ecosystem/compliance-evidence.json`.

## GDPR evidence slots

`GDPR-ROPA · GDPR-LAWFUL-BASIS · GDPR-NOTICES · GDPR-DPIA · GDPR-TRANSFERS · GDPR-PROCESSORS · GDPR-DSR · GDPR-BREACH`

## HIPAA evidence slots

`HIPAA-SCOPE · HIPAA-EPHI-INVENTORY · HIPAA-RISK-ANALYSIS · HIPAA-RISK-MANAGEMENT · HIPAA-ACCESS · HIPAA-AUDIT · HIPAA-INTEGRITY-TRANSMISSION · HIPAA-PHYSICAL · HIPAA-CONTINGENCY · HIPAA-TRAINING · HIPAA-BAA · HIPAA-BREACH · HIPAA-EVALUATION`

## Assessment states

- `COMPLETE`: every applicable evidence slot is present or has a documented not-applicable determination.
- `PARTIAL`: some applicable evidence exists, but one or more required slots are missing or expired.
- `MISSING`: no applicable evidence is present.

## Boundary

Source code, unit tests, CI passes, and internal attestations are not automatically treated as proof that production systems comply with GDPR or HIPAA. Executed contracts, actual risk analyses, production configurations/logs, training records, exercises, and operational records must be supplied as evidence where applicable.
