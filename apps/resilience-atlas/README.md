# XUNIA Resilience Atlas

Runnable governed emergency-consequence simulation platform for civil-defense exercises, infrastructure resilience, hospital/shelter surge planning, and AIP/Ontology integration.

## Run locally

```bash
cd apps/resilience-atlas
npm start
```

Open `http://localhost:8787`.

## API

- `GET /api/health`
- `POST /api/scenarios/run`
- `POST /api/ontology/publish`
- `POST /api/actions/propose`
- `GET /api/audit`

Example safe scenario:

```json
{
  "type": "radiological",
  "severity": 3,
  "populationContext": "moderate",
  "weather": "stable"
}
```

## Palantir adapter

The service is tenant-safe by default. Set these only for an authorized Palantir environment:

- `PALANTIR_BASE_URL`
- `PALANTIR_TOKEN`
- `PALANTIR_ONTOLOGY_ENDPOINT`

Without those values the adapter returns a staged envelope and never guesses tenant-specific API routes.

## Platform stack

Operator Console → XUNIA API → Governance Admission → Scenario Engine → Ontology Envelope → Palantir Adapter → Human Approval → Apollo-managed deployment / Gotham operational view / JUPITER orchestration.

## Safety boundary

The platform is limited to emergency preparedness, consequence analysis, resilience, training, and recovery. Offensive targeting, weapon design, yield/burst optimization, strike sequencing, casualty maximization, autonomous public alerts, and autonomous responder dispatch are prohibited by runtime and CI guardrails.
