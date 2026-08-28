# GLASS ONION HEALTH — ONC Readiness v0.3

Command: `/glass certify health onc-ready`

This module is the free, repository-level conformance preparation layer for the ONC Health IT Certification Program. It does not self-issue an ONC certificate, CHPL listing, or government approval.

## Implemented local conformance capabilities

- Single-patient EHI export manifest
- Patient-population EHI export manifest
- SHA-256 export-manifest integrity
- Audit report filtering by actor, target, and time window
- Authentication/access-control evidence from the Health Runtime identity layer
- Tamper-evident SHA-256 audit chaining
- Amendment/version evidence from the EFILE lifecycle
- Automatic access-timeout calculation
- Emergency-access readiness gate requiring reason, audit, and review
- MFA evidence through Health Runtime sessions
- Integrity evidence through document hashes and protected-storage metadata
- QMS evidence contract
- Accessibility-centered design evidence contract
- Local automated tests and CI machine-contract validation

## Candidate criteria matrix

| Criterion | Readiness | Repository evidence |
|---|---|---|
| 170.315(a)(15) | PARTIAL | Behavioral-health document/data model |
| 170.315(b)(10) | IMPLEMENTED | Single-patient and population EHI export |
| 170.315(d)(1) | IMPLEMENTED | Identity, RBAC/ABAC-style access decisions |
| 170.315(d)(2) | IMPLEMENTED | Tamper-evident audit chain |
| 170.315(d)(3) | IMPLEMENTED | Audit reporting |
| 170.315(d)(4) | IMPLEMENTED | Append-only amendment lifecycle |
| 170.315(d)(5) | IMPLEMENTED | Automatic timeout calculation |
| 170.315(d)(6) | IMPLEMENTED | Emergency-access readiness gate |
| 170.315(d)(7) | PARTIAL | Protected storage exists; end-user device deployment control remains environmental |
| 170.315(d)(8) | IMPLEMENTED | SHA-256 integrity and signed-document binding |
| 170.315(d)(9) | PARTIAL | Production trusted-connection/TLS deployment evidence remains required |
| 170.315(d)(12) | PARTIAL | Application avoids storing plaintext credentials; production IdP credential storage remains deployment evidence |
| 170.315(d)(13) | IMPLEMENTED | MFA-aware session contract |
| 170.315(e)(1) | PARTIAL | Export capability exists; production patient portal/V-D-T workflow remains to be validated |
| 170.315(g)(4) | IMPLEMENTED | QMS evidence contract |
| 170.315(g)(5) | IMPLEMENTED | Accessibility evidence contract |

## EHI export contract

`buildSinglePatientEHIExport` produces a computable JSON bundle containing scoped document metadata, authorizations, signatures, audit events, client identifiers, and a deterministic SHA-256 manifest hash.

`buildPopulationEHIExport` produces the equivalent population-level manifest across all supplied clients.

Protected payload references remain references in the manifest. Production export orchestration must retrieve authorized payload content from the protected object store and package it according to the exact official certification test method selected for the certified module.

## Quality management evidence

A QMS record must identify:

- process
- accountable owner
- version
- approval time
- evidence references

The production certification package should contain the actual software-development, change-control, defect-management, release, risk-management, testing, and maintenance procedures used for the certified module.

## Accessibility evidence

Accessibility evidence must identify:

- product area
- standard or evaluation method
- test date
- issue tracking
- remediation process
- evidence references

The repository provides the evidence schema and testable requirement. Product UI accessibility testing remains an operational activity.

## Official boundary

This repository may issue XUNIA / GLASS ONION internal readiness attestations for its own code and controls. It cannot create an official ONC Health IT Certification Program certificate or CHPL listing. Official certification requires successful evaluation under the applicable ONC program requirements and an authorized external testing/certification process.

Machine contract: `ecosystem/glass-onion-health-onc-readiness.json`.
