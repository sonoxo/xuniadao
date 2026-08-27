# GCPXUNIA / VIRGINIA / VA3LM Defense Layer

Command: `/glass defense`

Root: `sonoxo/xuniadao`

This is the XUNIAverse defensive cloud-identity and runtime-governance model.

## Flow

```text
XUNIA_SCOPE
  → AGENT_IDENTITY_VERIFY
  → GCPXUNIA_AUTH_BROKER
  → VIRGINIA_POLICY_BOUNDARY
  → VA3LM_REASON_AND_PLAN
  → RUNTIME_GUARDRAIL
  → ZYRA_ACTION_GATE
  → AUDIT_EVIDENCE
```

## Agent identity rules

- Every governed agent is represented as its own principal.
- SPIFFE-style workload identity is the preferred canonical identifier.
- Agent credentials are short-lived.
- Shared or long-lived agent credentials are blocked by policy.
- DPoP and/or mTLS can bind issued credentials to the agent context.
- Least privilege is required.
- Project-wide or organization-wide agent grants require human review.
- User-delegated authorization is modeled separately from an agent's own authority.
- Sensitive mutations remain human-gated.

## Ontology

Objects:

`XUNIAVERSE_ROOT · CLOUD_SECURITY_LAYER · POLICY_BOUNDARY · VA3LM_RUNTIME · AGENT_IDENTITY · AUTH_PROVIDER · ACCESS_POLICY · GUARDRAIL · EVIDENCE · SECURITY_EVENT`

Links:

`ROOTS · IDENTIFIES · AUTHORIZES · BROKERS_AUTH_FOR · ENFORCES · PROTECTS · PRODUCES_EVIDENCE · OBSERVES · BLOCKS`

Actions:

`REGISTER_AGENT_IDENTITY · VERIFY_AGENT_IDENTITY · REQUEST_SHORT_LIVED_CREDENTIAL · BROKER_USER_DELEGATED_AUTH · EVALUATE_AGENT_SCOPE · REQUIRE_HUMAN_REVIEW · REVOKE_AGENT_ACCESS · RECORD_SECURITY_EVIDENCE`

## Source intelligence

The control model is derived from current Google Cloud IAM guidance on agent-owned identity and centralized Auth Manager patterns, Google Cloud Security Community material on IAM/agent governance, and Palantir's public Ontology model for objects, properties, links, actions, functions, and governance.

This repository does not claim that GCPXUNIA is a Google Cloud product, that the system is deployed in Google Cloud, or that Palantir or Google endorses XUNIA.
