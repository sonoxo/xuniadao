# XRPL Token and Wallet Pathways

Command: **`/glass xrpl pathways`**

XuniaDAO joins three separately maintained XRPL repositories into one governed ontology without rewriting their histories:

| Layer | XUNIA repository | Authoritative upstream | Role |
|---|---|---|---|
| Standards | [XRPL-StandardsXUNIA-](https://github.com/sonoxo/XRPL-StandardsXUNIA-) | [XRPLF/XRPL-Standards](https://github.com/XRPLF/XRPL-Standards) | XLS definitions and compatibility requirements |
| Client | [xrpl.jsXUNIA](https://github.com/sonoxo/xrpl.jsXUNIA) | [XRPLF/xrpl.js](https://github.com/XRPLF/xrpl.js) | Typed requests, account reads, unsigned transaction construction |
| Node | [rippledXUNIA](https://github.com/sonoxo/rippledXUNIA) | [XRPLF/rippled](https://github.com/XRPLF/rippled) | Validated ledger state and transaction submission |
| Governance | [xuniadao](https://github.com/sonoxo/xuniadao) | XUNIA | Policy decisions, approval gates, provenance and audit |

These XUNIA repositories are derivatives or integration surfaces. Their presence in XUNIA does not imply sponsorship, endorsement, partnership, or ownership by XRPLF or Ripple.

## Read pathway

```text
XRPL STANDARD
  -> XRPL.JS CONNECT
  -> RIPPLED VALIDATED LEDGER
  -> ACCOUNT
  -> TOKEN / ISSUER
  -> TRUST LINES
  -> SECRET-FREE AUDIT EVIDENCE
```

Validated public reads are allowed when provenance is supplied. Reads include ledger status, account information, balances, issued-token metadata and trust lines.

## Token and wallet transaction pathway

```text
DISCOVER XLS STANDARD
  -> BUILD UNSIGNED TRANSACTION
  -> VALIDATE TYPE + NETWORK + FEE + DESTINATION
  -> HUMAN APPROVAL
  -> EXTERNAL WALLET SIGNER
  -> RIPPLED SUBMISSION
  -> VALIDATED-LEDGER VERIFICATION
  -> SECRET-FREE AUDIT EVIDENCE
```

The ontology can describe XRP payments, issued tokens, trust lines, account settings and other XRPL transaction families. Executable support must be added one transaction type at a time with its applicable XLS/protocol evidence and tests.

## Wallet boundary

XuniaDAO stores public addresses and transaction evidence only. Seed phrases, family seeds, private keys and signing material must remain in a user-controlled external signer. Signing and submission require explicit human approval. Automatic token issuance, trust-line mutation, signing and fund movement remain disabled.

## Networks

- **Mainnet:** public reads; every mutation requires approval and external signing.
- **Testnet/Devnet:** public reads and test workflows; signing still requires explicit approval.
- **Custom node:** endpoint identity and network provenance must be recorded before use.

Contract: [`ecosystem/xrpl-token-wallet.json`](../ecosystem/xrpl-token-wallet.json)
