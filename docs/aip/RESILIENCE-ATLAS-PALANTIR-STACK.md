# XUNIA Resilience Atlas — Palantir Stack Integration

## Product stack

XUNIA Resilience Atlas is a civil-defense and emergency-resilience application built around a provider-agnostic consequence model and a governed operational ontology.

```text
XUNIA JUPITER
resilience / infrastructure orchestration layer
                |
                v
Palantir Apollo
software delivery, environment promotion, rollback, telemetry
                |
                v
Palantir Gotham
operational map / geospatial mission application surface
                |
                v
Foundry Ontology
objects + links + actions + provenance + permissions
                |
                v
Palantir AIP
agents + logic + evals + human-reviewed automation
                |
                v
Resilience Atlas consequence provider adapter
```

> `JUPITER` is an XUNIA architecture codename. It is not represented as an official Palantir platform.

## AIP layer

AIP is the governed reasoning layer. It may summarize exercise conditions, identify emergency-response gaps, compare approved response plans, create proposed resource movements, and generate after-action findings.

Required controls:

- agent scopes map to Ontology permissions;
- every model call retains provenance;
- AIP Evals must test prohibited offensive intents;
- live operational actions remain human-approved;
- no weapon design, targeting, strike sequencing, yield/burst optimization, or casualty-maximization features.

## Ontology layer

Primary object types:

- `CivilDefenseScenario`
- `HazardZone`
- `CriticalFacility`
- `HospitalCapacity`
- `Shelter`
- `InfrastructureAsset`
- `TransportRoute`
- `ResourceStockpile`
- `ResponseTeam`
- `ResponseProposal`
- `ApprovalDecision`
- `AfterActionFinding`

Primary links:

- scenario `AFFECTS` hazard zone
- hazard zone `INTERSECTS` critical facility
- hospital `DEPENDS_ON` infrastructure asset
- shelter `SERVED_BY` transport route
- response proposal `USES` resource stockpile
- response proposal `REQUIRES_APPROVAL` approval decision

Safe action types:

- `OpenShelter`
- `StageMedicalResources`
- `StageEmergencySupplies`
- `RequestMutualAid`
- `ActivateBackupPower`
- `IssueTrainingAlert`
- `ProposeRouteClosure`
- `ProposeFacilityEvacuation`
- `CreateAfterActionFinding`

## Gotham layer

Gotham is the operational visualization and geospatial application surface. Resilience Atlas exports scenario objects and hazard-zone geometries for ingestion by an authorized Gotham/Defense Ontology deployment.

Intended views:

- hazard / protective-action overlays;
- hospitals and surge status;
- shelters and capacity;
- utilities, telecom, water and transport dependencies;
- responder staging locations;
- incident chronology and after-action artifacts.

No Gotham workflow in this module provides offensive targeting or weapon-effects optimization.

## Apollo layer

Apollo governs delivery of the Resilience Atlas application and its adapters across approved environments.

Suggested release channels:

- `dev`: synthetic data only;
- `exercise`: authorized training datasets;
- `production-readonly`: operational data, analysis-only;
- `production-action`: human-approved actions enabled only after accreditation and explicit authorization.

Promotion criteria:

1. unit / schema tests pass;
2. scenario admission safety gate passes;
3. AIP prohibited-intent evals pass;
4. dependency and provenance checks pass;
5. operator acceptance tests pass;
6. environment policy allows promotion.

Rollback criteria include schema incompatibility, unsafe action exposure, provenance loss, geospatial rendering regression, or authorization-policy regression.

## JUPITER layer

`JUPITER` is the XUNIA resilience command layer above the platform integrations. It does not replace Palantir products. It coordinates multi-region infrastructure state and gives XUNIA a stable abstraction whether the deployment uses Palantir, another platform, or a local training stack.

JUPITER responsibilities:

- regional readiness scorecards;
- infrastructure dependency graph federation;
- scenario catalog and exercise lifecycle;
- provider registry;
- deployment/environment inventory;
- agent policy registry;
- cross-system audit references;
- recovery-priority dashboards.

## Interoperability contract

The browser application exports a JSON envelope with:

- schema ID;
- `CivilDefenseScenario` object type;
- consequence metrics;
- provider/version provenance;
- uncertainty label;
- human-approval requirement;
- explicit prohibited capability list.

A production adapter should translate that envelope into the authorized Foundry/Gotham object APIs rather than coupling the UI to proprietary endpoints.

## Security posture

- provider-agnostic adapter boundary;
- least-privilege OAuth/service identity;
- purpose-based access controls;
- immutable audit trail for proposals/approvals;
- scenario isolation;
- synthetic defaults;
- no autonomous public alerting or responder dispatch;
- no offensive optimization capabilities.
