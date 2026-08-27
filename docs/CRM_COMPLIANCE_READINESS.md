# GLASS ONION CRM Certification Readiness

Command: `/glass certify crm`

This package closes the software and policy gaps identified by the CRM certification ontology and prepares the CRM layer for external assessment. It is an internal readiness package, not an external auditor's report or regulator-issued certification.

## Control domains

### Privacy and data rights

- Maintain purpose and provenance for CRM records.
- Minimize collected fields to the stated business purpose.
- Maintain consent/lawful-basis records where applicable.
- Support access/know, deletion, correction, opt-out, limit, and portability workflows.
- Verify identity for requests that expose, delete, or change personal data.
- Apply documented retention schedules and legal holds.
- Maintain a data inventory and vendor/subprocessor register.

### Security

- Enforce role-based CRM permissions and least privilege.
- Require authenticated access.
- Require encryption in transit and at rest in production deployments.
- Maintain ordered, provenance-bearing audit events.
- Maintain incident triage, containment, investigation, notification review, and closure workflows.
- Assign a security owner and perform periodic risk assessments.
- Require workforce privacy/security training.

### Commercial email

Before commercial email is released, the operator must confirm accurate sender/routing information, non-deceptive subject lines, required advertising disclosure when applicable, a valid postal address, and a functioning unsubscribe mechanism. Opt-outs must be placed on a suppression list before future marketing sends.

### Calls and text messages

SMS/voice campaigns must maintain channel-specific consent evidence when consent is required and must honor revocation. Revoked recipients remain suppressed unless a new valid grant is captured.

### HIPAA conditional scope

HIPAA controls activate only when the CRM is used by a covered entity/business associate for ePHI. The readiness package requires minimum-necessary access, authentication, audit controls, transmission protection, incident procedures, device/media handling, vendor/business-associate agreement tracking, risk analysis, workforce training, and retention of required security documentation. Operational deployment evidence and executed agreements must be verified separately.

## External-assessor evidence packet

The repository now supplies code and policy evidence. Before any third-party certification or legal compliance claim, collect and provide the assessor with:

1. Production architecture and data-flow diagram.
2. Production encryption configuration and key-management evidence.
3. Identity-provider/MFA and access-review evidence.
4. Sample audit-log exports and retention configuration.
5. Incident-response exercise evidence.
6. Risk assessment and remediation register.
7. Workforce training completion evidence.
8. Vendor/subprocessor inventory and executed DPAs/BAAs where applicable.
9. Privacy notice, notice-at-collection, and request-channel evidence for deployed products.
10. Marketing templates, postal-address configuration, unsubscribe tests, suppression-list tests, and SMS/voice consent records.
11. Backup, restore, availability, and change-management evidence when SOC 2 availability or processing-integrity criteria are in scope.
12. Independent auditor/assessor engagement and signed report where a formal third-party attestation is required.

## Status vocabulary

- `INTERNAL_ATTESTED`: XUNIA's internal code/control baseline has passed repository evidence checks.
- `READY_FOR_EXTERNAL_ASSESSMENT`: software and policy controls are present; operational evidence and independent assessment remain.
- `NOT_ISSUED`: no third-party report/certification has been issued.

The machine contract intentionally refuses to translate internal readiness into claims of Palantir endorsement, SOC 2 attestation, HIPAA certification, or regulator approval.
