# GLASS ONION CRM

Command: `/glass crm`

GLASS ONION CRM provides a typed relationship and sales-workflow layer across XUNIA.

## Core entities

`ACCOUNT → CONTACT → LEAD → OPPORTUNITY → ACTIVITY → TASK → DEAL → CUSTOMER`

## Stages

`NEW → QUALIFIED → DISCOVERY → PROPOSAL → NEGOTIATION → WON | LOST`

## Runtime path

```text
CRM_INGEST
  → AIT_NORMALIZE
  → CRM_RELATIONSHIP_GRAPH
  → VA3LM_ANALYZE
  → ZYRA_WORKFLOW
  → UAP_AGENT_TASKS
```

## Capabilities

The first release supports accounts, contacts, leads, opportunities, activities, tasks, deals, customers, pipeline metrics, open/won value aggregation, follow-up planning, and relationship-graph modeling.

Read-only CRM analysis can use the fast path. Data mutation, destructive changes, external messages, and bulk outreach require human review.

## Certification and control evidence

Run the certification surface through:

`/glass certify crm`

The current repository carries the **XUNIA CRM Internal Control Attestation** (`XUNIA-CRM-ICA-1`) for its code-level CRM baseline. The control graph is modeled with Palantir-ontology-aligned objects, links, actions, evidence, assessments, risks, and attestations.

See [`CRM_CERTIFICATION.md`](CRM_CERTIFICATION.md) and [`../ecosystem/crm-certification.json`](../ecosystem/crm-certification.json).

External frameworks such as SOC 2, GDPR, CCPA, HIPAA, CAN-SPAM, and TCPA remain readiness targets until the required operational or independent evidence is completed.
