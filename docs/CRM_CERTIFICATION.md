# GLASS ONION CRM Certification

Command: `/glass certify crm`

GLASS ONION CRM uses a Palantir-ontology-aligned control model to connect systems, controls, evidence, assessments, risks, and attestations.

## Current status

- Internal attestation: **`XUNIA-CRM-ICA-1` — ACTIVE**
- External assessment readiness: **`READY_FOR_EXTERNAL_ASSESSMENT`**
- Third-party certification/attestation: **`NOT_ISSUED`**

The repository now contains software and policy controls for privacy rights, consent/lawful basis, retention, RBAC, audit evidence, encryption requirements, incidents, vendor risk, commercial email, SMS/voice consent, and conditional HIPAA safeguards. Operational deployment evidence and independent assessment remain outside what a source repository can self-issue.

## Ontology

```text
SYSTEM → CONTROL → EVIDENCE → ASSESSMENT → RISK → ATTESTATION
```

Objects: `SYSTEM · CONTROL · EVIDENCE · ASSESSMENT · RISK · ATTESTATION`

Links: `GOVERNS · SUPPORTED_BY · SATISFIES · BLOCKED_BY · APPLIES_TO · DERIVED_FROM`

Actions: `ATTACH_EVIDENCE · RUN_CONTROL_CHECK · REQUEST_REVIEW · ISSUE_INTERNAL_ATTESTATION · REVOKE_ATTESTATION`

## Readiness controls now implemented

| Framework lane | Software/policy state |
|---|---|
| GDPR | consent/lawful-basis, purpose/minimization, rights, retention controls ready |
| CCPA | know/delete/correct/opt-out/limit request controls ready |
| SOC 2 | RBAC, audit chain, encryption requirements, incident/vendor-risk controls ready |
| HIPAA | conditional safeguard requirements modeled for PHI deployments |
| CAN-SPAM | sender/subject/address/unsubscribe/suppression release controls ready |
| TCPA | SMS/voice consent and revocation/suppression controls ready |

## Evidence chain

```text
src/lib/crm.ts
→ src/lib/crm-compliance.ts
→ ecosystem/crm.json
→ ecosystem/crm-compliance.json
→ .github/workflows/crm.yml
→ .github/workflows/crm-certification-readiness.yml
→ src/lib/crm-certification.ts
→ ecosystem/crm-certification.json
```

The detailed assessor handoff checklist is in [`CRM_COMPLIANCE_READINESS.md`](CRM_COMPLIANCE_READINESS.md).

## External boundary

A repository cannot self-create a SOC 2 report, regulator approval, or independent legal determination. The machine contract therefore keeps external certification at `NOT_ISSUED` until the required production evidence and independent assessor output are attached through reviewed evidence.

Palantir ontology alignment refers to the object/property/link/action architecture used here; it does not claim sponsorship, endorsement, partnership, or a live Foundry deployment.
