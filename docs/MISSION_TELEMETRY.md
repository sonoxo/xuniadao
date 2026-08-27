# GLASS ONION Mission Telemetry Twin

Command: `/glass mission`

Language: **VIRGINIA**

This layer combines public mission data and F´-style simulated telemetry into a Palantir-style object/link ontology for analytics, dashboards, provenance, and human-reviewed decision support.

## Ontology

Objects:

- `MISSION`
- `LAUNCH`
- `VEHICLE`
- `LAUNCHPAD`
- `PAYLOAD`
- `FPRIME_COMPONENT`
- `TELEMETRY_FRAME`
- `SOURCE_EVIDENCE`

Links:

- `USES_VEHICLE`
- `LAUNCHES_FROM`
- `CARRIES_PAYLOAD`
- `EMITS_TELEMETRY`
- `SUPPORTED_BY_EVIDENCE`

## VIRGINIA commands

```text
MISSION TWIN STATUS
SPACEX LATEST
SPACEX LAUNCHES
FPRIME TELEMETRY simulation
BRAIN UPDATE https://example.com/spec
https://github.com/sonoxo/fprimeXUNIA- /// https://github.com/sonoxo/SpaceX-APIxunia
```

`///` is a VIRGINIA brain-update delimiter: URL segments are treated as knowledge sources, not execution authority.

## Control boundary

This integration is intentionally limited to public/authorized data, telemetry, simulation, normalization, ontology operations, and evidence export. Real-world flight commands, telecommands, vehicle control, and actuation are disabled.

The SpaceX data source is the independent open-source `r-spacex/SpaceX-API` project and does not imply SpaceX affiliation. F´ provenance and upstream ownership remain unchanged. Palantir-style ontology means the object/link/action architecture pattern; it does not claim a live Palantir tenant deployment.
