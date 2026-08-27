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
