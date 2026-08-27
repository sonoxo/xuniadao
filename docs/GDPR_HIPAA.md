# GDPR + HIPAA Control Package

Command: `/glass certify crm`

This package completes the repository's software and policy control model for GDPR and the HIPAA Privacy, Security, and Breach Notification Rules. It is designed for evidence-driven operation inside GLASS ONION using typed objects, controls, evidence, assessments, risks, and attestations.

## Status

`SOFTWARE_POLICY_CONTROLS_COMPLETE`

This means the repository contains executable control logic, validation, machine contracts, tests, and CI gates for the requirements below. It does **not** mean a regulator, HHS, an EU supervisory authority, or an independent assessor has certified the organization's real-world operations.

## GDPR controls

The implementation covers:

- Article 5 principles: lawfulness/fairness/transparency, purpose limitation, minimization, accuracy, storage limitation, integrity/confidentiality, accountability.
- Articles 12-14 transparency information and data-subject notice requirements.
- Article 6 lawful-basis recording.
- Article 9 special-category processing condition gate.
- Chapter III rights workflows: information, access, rectification, erasure, restriction, portability, objection, and human review for qualifying automated decisions.
- Article 25 data protection by design and by default.
- Article 28 processor/contract evidence requirements.
- Article 30 records of processing activities (RoPA).
- Article 32 security measures and evidence.
- Articles 33-34 breach assessment, supervisory-authority timing, and high-risk data-subject notification.
- Article 35 DPIA before qualifying high-risk processing.
- Article 36 prior consultation gate when residual high risk remains.
- Articles 37-39 DPO/contact governance where applicable.
- Chapter V international transfer mechanism and transfer-assessment evidence.

Primary implementation: `src/lib/gdpr-hipaa.ts`

## HIPAA controls

The implementation follows the HIPAA rules currently in effect and covers:

### Scope and Privacy Rule

- covered-entity/business-associate/subcontractor scope determination;
- minimum-necessary use/disclosure controls;
- permitted/authorized use and disclosure governance;
- Notice of Privacy Practices process;
- individual access, amendment, accounting of disclosures, restriction, and confidential-communications workflows;
- authorization management;
- complaints/non-retaliation and workforce sanctions.

### Security Rule administrative safeguards

- security management process;
- accurate and thorough ePHI risk analysis;
- risk management;
- assigned security responsibility;
- workforce security and authorization;
- information access management;
- security awareness and training;
- incident procedures;
- contingency planning;
- periodic technical/non-technical evaluation;
- business-associate agreement governance.

### Security Rule physical safeguards

- facility access controls;
- workstation use;
- workstation security;
- device and media controls including disposal/reuse procedures.

### Security Rule technical safeguards

- access control;
- unique user identification;
- emergency access procedures;
- automatic logoff policy;
- encryption/decryption policy;
- audit controls;
- integrity controls;
- person/entity authentication;
- transmission security.

### Contingency and documentation

- data backup;
- disaster recovery;
- emergency-mode operations;
- testing/revision;
- application/data criticality analysis;
- six-year retention requirement for required HIPAA documentation.

### Business associates

The BAA validator requires permitted uses/disclosures, safeguards, incident/breach reporting, support for individual rights, HHS access, return/destruction at termination, subcontractor flow-down, and termination rights for material breach.

### Breach Notification Rule

The breach model requires the four-factor compromise assessment for impermissible uses/disclosures, individual notification when the low-probability exception is not established, HHS notification preparation, and media-notification preparation when applicable. Individual notification is bounded to no later than 60 days after discovery in the machine control.

## Evidence still required in production

A code repository cannot manufacture operational compliance evidence. Before representing actual GDPR/HIPAA operations as compliant, attach evidence for the real deployed environment, including:

1. actual data-flow inventory and approved RoPA;
2. production privacy notices, lawful-basis determinations, Article 9 determinations, and DPO/contact governance where applicable;
3. executed processor agreements, DPAs, BAAs, and subcontractor flow-down agreements;
4. completed DPIAs and transfer assessments for the actual processing and destinations;
5. production encryption/key management, identity/MFA, least privilege, access reviews, and audit-log retention;
6. complete ePHI inventory and HIPAA security risk analysis covering every location/system that creates, receives, maintains, or transmits ePHI;
7. facility/workstation/device/media procedures and evidence of use;
8. tested backups, disaster recovery, emergency-mode operations, and restore evidence;
9. workforce authorization and security-awareness/training records;
10. incident-response and breach-notification exercises plus actual incident records when events occur;
11. periodic technical/non-technical evaluations and remediation records;
12. data-subject/individual-rights request logs showing real response performance;
13. required six-year HIPAA documentation retention.

## Authoritative sources

GDPR:
- European Commission GDPR principles: https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en
- European Commission obligations, security, breach notification, DPIA: https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/obligations_en

HIPAA:
- HHS Security Rule: https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html
- HHS Minimum Necessary: https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/minimum-necessary-requirement/index.html
- HHS Breach Notification Rule: https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html
- HHS Business Associate contracts: https://www.hhs.gov/hipaa/for-professionals/covered-entities/sample-business-associate-agreement-provisions/index.html

The 2025 HHS proposal to modify the HIPAA Security Rule is not treated here as a final mandatory rule; this package follows the Security Rule currently in effect.
