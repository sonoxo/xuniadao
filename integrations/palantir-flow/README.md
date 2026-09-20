# XUNIA Palantir + Flow + XRPL Integration

This directory is the integration boundary requested for the XuniaDAO monetary
ecosystem.

- **Flow provenance:** `FlowFans/flow-token-list`, already preserved by
  XuniaDAO as its upstream Flow token registry.
- **Palantir reference:** public Palantir Ontology documentation is used as an
  architecture reference for object/link/action/evidence modeling.
- **XRPL settlement:** Universal Hive reward events compile into unsigned XRP
  or issued-currency Payment intents.
- **Signing boundary:** private keys are never stored here; a human-approved,
  user-controlled external wallet signs and submits.

This is an original XUNIA implementation, not a copy of proprietary Palantir
Foundry source code and not a claim of Palantir, Flow Foundation, Ripple, or
XRPL Foundation affiliation.

Machine contracts:

- `../../ecosystem/palantir-flow-xrpl.json`
- `../../ecosystem/universal-hive-xrpl.json`
