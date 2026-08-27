# VA3LM-SAGI // SUPER ARTIFICIAL GUARDRAIL INTELLIGENCE

`/VA3LM-SAGI` is the Glass Onion super-agent command layer for fast engineering intelligence.

## Speed-run stack

```text
Operator intent
   ↓
XUNIA typed intent
   ↓
Cadence / Flow lane (.cdc)
   ↓
Glass Onion ontology objects + links
   ↓
ZYRA workflow planner
   ↓
VA3LM :8088 code / test / explain
   ↓
IBM Quantum workload blueprint
   ├─ SamplerV2
   └─ EstimatorV2
   ↓
Palantir-style function + action package
   ↓
SAGI decision
   ├─ ALLOW  → non-mutating fast path
   ├─ REVIEW → explicit command approval
   └─ BLOCK  → prohibited automatic boundary
```

## Fast-path capabilities

<details open>
<summary><strong>Show unlocked capabilities</strong></summary>

- repository analysis
- code generation
- test generation
- Cadence / Flow program authoring
- ontology object/link construction
- workflow planning
- Palantir-style action-model blueprints
- IBM Quantum SamplerV2 / EstimatorV2 workload blueprints
- VA3LM `:8088` planning and explanation
- CI validation

</details>

## Command boundaries

| Action | SAGI decision |
|---|---|
| Analyze, plan, generate code/tests | **ALLOW** |
| Build Cadence contract/transaction blueprint | **ALLOW** |
| Build IBM Quantum workload blueprint | **ALLOW** |
| Build ontology objects/links/functions | **ALLOW** |
| Mutate repository | **REVIEW** |
| Sign Flow transaction | **REVIEW** |
| Cast governance vote | **REVIEW** |
| Deploy production | **REVIEW** |
| Access secrets | **REVIEW** |
| Automatic fund movement | **BLOCK** |
| Arbitrary remote shell | **BLOCK** |

## Cadence lane

The first Glass Onion Cadence contract lives at `cadence/contracts/XuniaIntent.cdc`. It gives the ecosystem a typed Flow-language artifact lane while keeping signing and value movement outside the automatic fast path.

## IBM Quantum lane

`src/lib/quantum-ontology.ts` models quantum workloads using `SamplerV2` and `EstimatorV2` primitives and converts them into reviewable ontology objects, links, function plans and action state.

## Palantir speed-run lane

The ontology package follows the operational pattern of objects/properties/links for semantics and functions/action types for workflow execution. In this repository it is an architecture package; a live Foundry deployment requires an explicitly configured Foundry environment.

## Command

```text
/VA3LM-SAGI
```

SAGI is a VA3LM capability layer inside GLASS ONION, not a sixth XUNIA ecosystem layer.
