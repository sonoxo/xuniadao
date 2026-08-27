# XUNIA XRPL Documentation Integration

Command: **`/glass xrpl`**

XuniaDAO registers `sonoxo/xrpl-dev-portalXUNIA` as a federated, read-only XUNIA extension. The documentation repository keeps its own Git history and can continue receiving upstream documentation updates without copying its full codebase into the XuniaDAO root.

## Source boundaries

| Role | Source | Authority |
|---|---|---|
| XUNIA integration repository | [sonoxo/xrpl-dev-portalXUNIA](https://github.com/sonoxo/xrpl-dev-portalXUNIA) | XUNIA-maintained derivative |
| Authoritative source repository | [XRPLF/xrpl-dev-portal](https://github.com/XRPLF/xrpl-dev-portal) | XRPL documentation upstream |
| Canonical documentation website | [xrpl.org](https://xrpl.org) | Authoritative published documentation |
| XUNIA governance root | [sonoxo/xuniadao](https://github.com/sonoxo/xuniadao) | XUNIA integration and policy |

XUNIA ownership does not imply XRP Ledger Foundation sponsorship, endorsement, partnership, or ownership.

## Integration boundary

```text
XUNIA / XuniaDAO
  -> XRPL documentation contract
  -> sonoxo/xrpl-dev-portalXUNIA
  -> XRPLF/xrpl-dev-portal
  -> xrpl.org
```

This merge provides documentation discovery, provenance, and upstream link resolution. It does not store wallet seeds, sign transactions, move XRP, issue tokens, establish trust lines, or claim XRPLF affiliation.

A future live-ledger adapter must be introduced separately, use the official XRPL client libraries, default to read-only access, keep secrets outside the repository, and require explicit human approval for every signing or fund-moving action.
