# GLASS ONION LAYER

**Command:** `/glass`  
**Umbrella:** XUNIA  
**Version:** 2.0.0

Glass Onion is the cross-repository intelligence and orchestration membrane joining XUNIA / XuniaDAO, ZYRA, SONOXO / GPT-DOUG-LLM, AlmightySonoxo, and VA3LM.

## What it does

A request enters Glass Onion with an objective, capability, target layers, provenance, and action flags. The router selects a typed pipeline and returns one of three decisions:

- `ALLOW` — read-only planning, analysis, ontology, media, quantum-blueprint, Cadence-intent, or CI work can continue.
- `REVIEW` — repository mutation, signing, production deployment, or intelligence promotion without provenance requires human command review.
- `BLOCK` — automatic fund movement, automatic governance voting, arbitrary remote shell, empty objectives, or invalid targets stop immediately.

## Routing lanes

- `INTELLIGENCE_QUERY` → provenance check → SONOXO ontology → VA3LM reasoning → ZYRA verification
- `CODE_PLAN` → XUNIA scope → VA3LM plan → SONOXO code intelligence → ZYRA validation
- `ONTOLOGY_WORKFLOW` → XUNIA objects → SONOXO ontology → VA3LM function plan → ZYRA action gate
- `MEDIA_WORKFLOW` → AlmightySonoxo media → XUNIA provenance → SONOXO index → ZYRA workflow
- `QUANTUM_BLUEPRINT` → XUNIA scope → VA3LM quantum plan → SONOXO ontology → ZYRA verification
- `CADENCE_FLOW` → XUNIA Cadence intent → VA3LM plan → ZYRA transaction gate → XUNIA verification
- `CI_VALIDATION` → XUNIA scope → ZYRA CI → SONOXO evidence → XUNIA verification

## TypeScript

```ts
import { routeGlassOnion } from './src';

const route = routeGlassOnion({
  objective: 'Build a cross-repo ontology workflow',
  capability: 'ONTOLOGY_WORKFLOW',
  targets: ['xunia', 'sonoxo', 'va3lm', 'zyra'],
});

console.log(route.decision); // ALLOW
```

The machine-readable contract lives at `ecosystem/glass-onion-layer.json` and tests live at `src/lib/glass-onion-layer.spec.ts`.
