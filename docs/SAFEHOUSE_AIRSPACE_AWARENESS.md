# BLACK HOUSE SAFEHOUSE — Airspace Awareness

`/glass safehouse airspace`

This capability places defensive low-altitude airspace awareness inside the Black House SAFEHOUSE protective envelope and keeps GLASS ONION as the observable governance and provenance layer.

## Architecture

```text
THE BLACK HOUSE
  -> SAFEHOUSE
    -> GLASS ONION
      -> PROTECTED SITE
        -> REMOTE ID / RF / ACOUSTIC OBSERVATIONS
          -> SENSOR NORMALIZATION
            -> EVIDENCE CORRELATION + FUSION
              -> AIRCRAFT TRACK
                -> CLASSIFICATION
                  -> THREAT ASSESSMENT
                    -> ALERT / MONITOR / REVIEW
                      -> ZYRA APPROVAL WORKFLOW
                        -> AUDIT EVIDENCE
```

## Defensive object model

- `PROTECTED_SITE`
- `AIRSPACE_SENSOR`
- `REMOTE_ID_OBSERVATION`
- `RF_OBSERVATION`
- `ACOUSTIC_OBSERVATION`
- `AIRCRAFT_TRACK`
- `CLASSIFICATION`
- `THREAT_ASSESSMENT`
- `AIRSPACE_ALERT`
- `OPERATOR_REVIEW`
- `SAFEHOUSE_EVIDENCE`

Classification states are `KNOWN`, `EXPECTED`, `UNKNOWN`, and `SUSPICIOUS`. An uncertain observation is not automatically hostile.

## Policy

SAFEHOUSE may detect, correlate, classify, visualize, alert, and route an event for authorized review. Detection alone never authorizes an active countermeasure.

Fail-closed invariants:

- provenance is required;
- missing or contradictory evidence routes to review;
- consequential action requires explicit authorization;
- autonomous jamming, spoofing, takeover, kinetic action, or other countermeasure execution is blocked;
- external affiliation, endorsement, certification, or vendor integration is never inferred from a public reference source.

## XUNIA integration

Preferred surfaces:

- `sonoxo/MMGISxunia-` for defensive geospatial visualization;
- `sonoxo/zyra` for alerts, approvals, routing, and audit workflow;
- `sonoxo/xuniadao` for ontology, provenance, and policy contracts;
- `sonoxo/gpt-doug-llm/the-black-house` for global SAFEHOUSE authority.

Machine contract: [`../ecosystem/safehouse-airspace-awareness.json`](../ecosystem/safehouse-airspace-awareness.json)

## Public architecture reference

The public repository `maya-gargoyle-agent/gargoyle_fact_sheet` is registered only as an architecture reference for the general sensing pattern of Remote ID, radio-frequency, and acoustic awareness plus classification/alerting. XUNIA does not copy its branding, imagery, pricing, or imply a relationship with Gargoyle Systems or Neptune SHIELD.

## Truth state

- ontology contract: `IMPLEMENTED`
- Black House layer manifest: `IMPLEMENTED`
- live sensor adapters: `NOT_YET_RUNTIME_VERIFIED`
- live hardware integration: `NOT_CLAIMED`
- external vendor integration: `NOT_CLAIMED`
