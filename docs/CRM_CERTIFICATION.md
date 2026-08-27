# GLASS ONION CRM Certification

Command: `/glass certify crm`

GLASS ONION CRM uses a Palantir-ontology-aligned control model to connect systems, controls, evidence, assessments, risks, and attestations.

## Certification status

**XUNIA CRM Internal Control Attestation: ACTIVE**

Attestation ID: `XUNIA-CRM-ICA-1`

Issuer: `XUNIA / GLASS ONION INTERNAL CONTROL PROGRAM`

Scope: code-level controls implemented and continuously checked in this repository.

This is an internal control attestation, not a third-party SOC 2, HIPAA, GDPR, CCPA, CAN-SPAM, or TCPA certification. Those frameworks remain readiness targets until their required operational evidence and, where applicable, independent assessment are completed.

## Ontology

```text
SYSTEM
  ├── GOVERNS ─────────────► CONTROL
  ├── SUPPORTED_BY ─────────► EVIDENCE
  ├── DERIVED_FROM ─────────► ASSESSMENT
  ├── BLOCKED_BY ───────────► RISK
  └── SATISFIES ────────────► ATTESTATION
```

Object types:

`SYSTEM · CONTROL · EVIDENCE · ASSESSMENT · RISK · ATTESTATION`

Link types:

`GOVERNS · SUPPORTED_BY · SATISFIES · BLOCKED_BY · APPLIES_TO · DERIVED_FROM`

Action model:

`ATTACH_EVIDENCE · RUN_CONTROL_CHECK · REQUEST_REVIEW · ISSUE_INTERNAL_ATTESTATION · REVOKE_ATTESTATION`

## Internally attested controls

The following controls are machine-checked and currently pass:

- CRM records require provenance.
- CRM data mutation requires human review.
- External CRM communication requires human review.
- Bulk outreach requires human review.
- CRM machine contracts are CI locked.

## External framework readiness

| Framework | Current state | Remaining evidence |
|---|---|---|
| GDPR | Readiness target | consent/lawful-basis ledger, rights workflows, retention evidence |
| CCPA | Readiness target | deletion/access workflows and consumer-request evidence |
| SOC 2 | Readiness target | RBAC, immutable audit logging, operational control evidence, independent examination |
| HIPAA | Conditional scope | applicable only when PHI is processed; requires HIPAA safeguards and agreements |
| CAN-SPAM | Readiness target | unsubscribe/suppression and commercial-message compliance evidence |
| TCPA | Readiness target | telephone/SMS consent and suppression evidence |

## Evidence chain

```text
src/lib/crm.ts
  → ecosystem/crm.json
  → .github/workflows/crm.yml
  → src/lib/crm-certification.ts
  → src/lib/crm-certification.spec.ts
  → ecosystem/crm-certification.json
```

The certification engine will not represent third-party certification as issued unless separate evidence is attached and the corresponding control state is changed through a reviewed repository change.

## Palantir boundary

The design uses ontology concepts associated with object types, properties, links, actions, and evidence-driven workflows. This architecture alignment does not claim Palantir sponsorship, endorsement, partnership, or a live Foundry deployment.
