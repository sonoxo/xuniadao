# XUNIA × AIP Civil-Defense Consequence Simulation

Status: SAFE OPERATIONAL USE CASE = TRUE

## Mission

Use consequence-model outputs from an approved simulation provider to support **civil defense, emergency preparedness, public safety training, infrastructure resilience, medical surge planning, and disaster-response exercises**.

This module is explicitly **not** for weapon design, target selection, strike planning, yield optimization, burst optimization, or maximizing casualties/damage.

## Why AIP fits

Palantir AIP + Foundry Ontology can represent the operational state around a simulated emergency and let authorized users compare sandboxed scenarios before committing real-world response actions.

The simulator is treated as a consequence-estimation provider. AIP is the governed decision layer.

```text
Approved consequence model / simulator
            |
            v
     Simulation Adapter
            |
            v
   XUNIA / Foundry Ontology
   |        |         |
   v        v         v
Scenario  AIP Agent  Resource Graph
   |        |         |
   +--------+---------+
            |
            v
 Human-reviewed response proposal
            |
            v
  Automate / approved actions
            |
            v
 alerts | shelters | hospitals | logistics | recovery
```

## Safe operational use cases

1. Emergency exercise planning: compare hypothetical consequence footprints without modifying live operations.
2. Hospital surge planning: estimate demand bands and identify capacity shortfalls.
3. Shelter planning: identify shelters inside/outside modeled hazard zones and estimate occupancy pressure.
4. Critical-infrastructure resilience: flag hospitals, fire stations, substations, water assets, communications facilities, and transport nodes that may be disrupted.
5. Evacuation support: compare pre-authored emergency-management evacuation plans against modeled closures and capacity constraints. The system does not optimize weapon effects.
6. Logistics planning: stage movement of water, medical supplies, generators, communications equipment, and response teams.
7. Training and tabletop exercises: generate injects, timelines, decision points, and after-action records.
8. Recovery planning: estimate restoration priorities from infrastructure dependency graphs.

## Ontology objects

- `CivilDefenseScenario`
- `HazardZone`
- `PopulationArea`
- `CriticalFacility`
- `HospitalCapacity`
- `Shelter`
- `TransportRoute`
- `InfrastructureAsset`
- `ResourceStockpile`
- `ResponseTeam`
- `ResponseProposal`
- `ApprovalDecision`
- `AfterActionFinding`

## Governed actions

Allowed actions are response-oriented only:

- `OpenShelter`
- `StageMedicalResources`
- `StageEmergencySupplies`
- `RequestMutualAid`
- `ActivateBackupPower`
- `IssueTrainingAlert`
- `ProposeRouteClosure`
- `ProposeFacilityEvacuation`
- `CreateAfterActionFinding`

All real-world effects must be staged for authorized human review. Simulation runs never directly trigger public alerts, dispatch personnel, or modify emergency systems.

## Required simulation-provider contract

The adapter accepts only consequence-oriented fields needed for emergency planning:

- provider ID/version
- scenario ID
- simulation timestamp
- geographic origin or bounded exercise area
- predefined scenario class
- hazard-zone polygons/radii supplied by the provider
- modeled effect category and severity band
- model uncertainty/confidence metadata
- source/provenance metadata

The XUNIA adapter MUST reject requests containing offensive optimization intent, including fields or prompts requesting target ranking, casualty maximization, ideal burst parameters, penetration, weapon engineering, or strike sequencing.

## AIP workflow

1. Import a consequence-model result as a `CivilDefenseScenario`.
2. Link modeled zones to population, hospital, shelter, transport, utility, and emergency-resource objects.
3. Create an Ontology Scenario sandbox.
4. Run deterministic capacity and dependency calculations.
5. Allow AIP Analyst/agent workflows to summarize response gaps and generate **response proposals only**.
6. Stage proposed Ontology edits/actions for human review.
7. Authorized operators accept/reject proposals.
8. Record every decision and rationale for audit and after-action review.

## Agent policy

The agent may answer:

- Which hospitals are likely to exceed exercise surge capacity?
- Which shelters remain outside the modeled hazard area?
- Which critical facilities have single points of failure?
- What emergency resources should be pre-positioned for this exercise?
- Which response plan produces the shortest restoration backlog?

The agent must refuse or route to safety review:

- Where should a weapon be detonated?
- What yield or burst height causes the most damage?
- Which target creates the greatest casualties?
- How can effects be optimized against a specific facility?
- How should multiple strikes be sequenced?

## Integration rule

Do not scrape or depend directly on a public website UI. Prefer an authorized API, exported exercise dataset, or internal consequence-model service. Keep a provider adapter boundary so the simulation source can be replaced without changing the Ontology.

## Provenance

External model outputs must retain source, version, timestamp, assumptions, and uncertainty. Model outputs are estimates and must not be presented as ground truth.

## Palantir architecture mapping

- Foundry Ontology: operational objects, links, permissions, provenance, and action log.
- Ontology Scenarios: isolated what-if exercise forks.
- Models in Ontology: registered consequence/capacity models.
- AIP Analyst / AIP Agent workflows: natural-language analysis over authorized exercise data.
- AIP Logic: proposal generation and structured reasoning.
- Automate: monitor exercise conditions and stage approved response actions.
- Human review: mandatory before any real-world operational effect.

## Acceptance criteria

- No offensive targeting or weapon optimization features.
- Scenario isolation enabled.
- Human approval required for live actions.
- Provider provenance stored.
- Uncertainty exposed in every model result.
- Critical-infrastructure and response-capacity joins tested.
- Agent safety tests block prohibited intents.
- Audit trail generated for every proposal and approval.
