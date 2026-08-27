# Contributing to XUNIA // GLASS ONION

GLASS ONION is designed to accept focused contributions across the XUNIA ecosystem without requiring a contributor to understand every layer first.

## Contributor lanes

Choose one lane and keep the first pull request small.

| Lane | Good contribution examples |
|---|---|
| **Flow / Cadence** | `.cdc` contracts, scripts, transactions, emulator examples, Flow SDK integration tests |
| **XUNIA / TypeScript** | registry APIs, manifest validation, SDK ergonomics, tests |
| **VA3LM / SAGI** | coding workflows, explainers, guardrail tests, 8088 API integrations |
| **Ontology / Workflows** | object/link models, validation functions, reviewable action plans |
| **Quantum Intelligence** | IBM Quantum workload blueprints, SamplerV2/EstimatorV2 examples, non-hardware test fixtures |
| **Docs / Commercial Explainers** | tutorials, diagrams, 60-second explainers, examples |
| **Security / Quality** | CI, lint, dependency hygiene, provenance checks, safe failure modes |

## First contribution

1. Read `docs/GOOD_FIRST_ISSUES.md` and select one unclaimed task.
2. Fork the repository and create a focused branch such as `contrib/cadence-intent-script`.
3. Make the smallest complete change that satisfies the acceptance criteria.
4. Run the relevant validation locally.
5. Open a pull request using the repository template.
6. A maintainer reviews the change for correctness, provenance, safety boundaries, and scope.

## Minimum validation

```bash
yarn install --frozen-lockfile
yarn build:main
yarn test:unit
```

Cadence contributions should also remain under `cadence/` and include either an example, test, or documented verification path.

## Pull-request rules

- One primary concern per PR.
- Explain what changed and why.
- Include tests or a verification path when behavior changes.
- Never commit secrets, private keys, seed phrases, access tokens, or production credentials.
- Flow transactions that sign, move funds, vote, or modify production state must remain explicit human actions.
- New ontology claims must include provenance or clearly identify themselves as design/inference.
- External affiliation is optional. A contributor may state their own background, but contribution does not imply endorsement by their employer or ecosystem.

## Contributor recognition

Merged contributors may be listed in `CONTRIBUTORS.md` with their GitHub handle, contribution area, and merged PR. Recognition is based on accepted work, not claimed affiliation.

## Current issue-board limitation

GitHub Issues are currently disabled on this repository. Until that changes, `docs/GOOD_FIRST_ISSUES.md` is the canonical open contributor queue. Contributors can open a pull request for an unclaimed item and reference its task ID in the PR title.

## Conduct

Be technically rigorous and respectful. Critique code, architecture, evidence, and tests—not people.
