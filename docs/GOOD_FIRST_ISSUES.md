# GLASS ONION // Good First Contributions

This file is the contributor queue while GitHub Issues are disabled.

Claim a task by opening a draft PR whose title begins with the task ID, for example: `GF-001 Cadence intent query example`.

## Open

### GF-001 — Cadence intent query example
**Lane:** Flow / Cadence  
**Difficulty:** Starter

Create `cadence/scripts/GetXuniaIntent.cdc` showing a small read-oriented interaction with the XUNIA intent contract interface.

Acceptance:
- valid `.cdc` source structure;
- no transaction signing or asset movement;
- short usage note;
- existing CI remains green.

### GF-002 — Cadence transaction template with explicit approval
**Lane:** Flow / Cadence  
**Difficulty:** Starter+

Add a transaction template demonstrating how a caller could submit an intent while keeping signing outside automated code.

Acceptance:
- transaction source under `cadence/transactions/`;
- no embedded private keys or credentials;
- documentation explicitly marks signing as an operator action;
- no automatic fund movement.

### GF-003 — Flow emulator development guide
**Lane:** Flow / Cadence  
**Difficulty:** Starter

Add `docs/FLOW-DEVELOPMENT.md` showing the local developer path for testing the XUNIA Cadence lane with the Flow emulator.

### GF-004 — VA3LM Cadence explainer
**Lane:** VA3LM / Docs  
**Difficulty:** Starter

Add a 60-second explainer example for how Cadence moves through XUNIA → ZYRA → VA3LM-SAGI.

### GF-005 — Ecosystem manifest validator
**Lane:** XUNIA / TypeScript  
**Difficulty:** Starter+

Add a deterministic validator for `ecosystem/glass-onion.json` with tests for required five-layer IDs and VA3LM port `8088`.

### GF-006 — Quantum ontology fixture
**Lane:** Quantum Intelligence  
**Difficulty:** Starter+

Add a test fixture for one `SamplerV2` and one `EstimatorV2` workload blueprint. No live quantum credential or hardware call is required.

### GF-007 — Palantir-style workflow example
**Lane:** Ontology / Workflows  
**Difficulty:** Starter+

Add one sample object/link/function/action package that remains `REVIEW_REQUIRED` for consequential actions.

### GF-008 — Contributor architecture diagram
**Lane:** Docs  
**Difficulty:** Starter

Add a Mermaid diagram that shows how contributors can enter through Flow/Cadence, TypeScript, VA3LM, ontology, quantum, or documentation lanes and converge at the Glass Onion CI gate.

## Maintainer review standard

A starter contribution is complete when it is small, understandable, testable, and preserves the project command boundaries.
