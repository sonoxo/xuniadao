# Universal Hive XRPL Monetary Ecosystem

Commands:

- `/glass hive xrpl`
- `/glass palantir flow`

## Mission

XuniaDAO maps Universal Hive swarm creation into a provenance-bearing monetary
graph whose settlement boundary is the XRP Ledger.

```text
GPT-DOUG / GPT-CHAOS
        |
    SWARM_CREATED
        |
BUILDER_REWARD_EVENT
        |
PROVENANCE COMMITMENT
        |
UNSIGNED XRPL PAYMENT INTENT
        |
HUMAN APPROVAL
        |
EXTERNAL WALLET SIGNER
        |
XRPL VALIDATED LEDGER
        |
AUDIT EVIDENCE
```

The code never stores a family seed, seed phrase, private key, or signing
material. XuniaDAO constructs and validates unsigned payment intents; signing
is deliberately delegated to a user-controlled external wallet.

## XRP rewards

XRP amounts are represented in drops. Every builder allocation is explicit:
builder ID, classic XRPL destination address, and reward amount. This avoids
silently inventing a payout formula.

The resulting transaction object intentionally omits `Sequence`, `Fee` and
`LastLedgerSequence`. A connected XRPL client or external wallet should
autofill those fields immediately before signing.

## XUN token blueprint

`XUN` is registered only as an XRPL issued-currency blueprint. No issuer
address is fabricated and no token is issued by this repository. Activating it
requires an explicit issuer account, token policy, trust-line policy, human
approval and external signing.

## Palantir + Flow bridge

XuniaDAO already preserves `FlowFans/flow-token-list` as its upstream Flow
token-registry provenance. The Palantir side is an original XUNIA integration
that models public Ontology concepts such as objects, links, actions and
governance. It does not copy proprietary Palantir Foundry code or claim
Palantir affiliation.

```text
FLOW TOKEN REGISTRY
      |
PROVENANCE
      |
OBJECT / LINK GRAPH
      |
UNIVERSAL HIVE
      |
XRPL PAYMENT INTENT
      |
VALIDATED RECEIPT
```

Contracts:

- `ecosystem/universal-hive-xrpl.json`
- `ecosystem/palantir-flow-xrpl.json`
- `ecosystem/xrpl-token-wallet.json`

Runtime modules:

- `src/lib/universal-hive-xrpl.ts`
- `src/lib/palantir-flow-xrpl.ts`

## Production boundary

The default architecture target is XRPL Testnet. Production settlement should
use a production-grade XRPL endpoint or self-operated infrastructure, explicit
human transaction approval, external wallet signing, validated-ledger
verification and secret-free audit evidence.
