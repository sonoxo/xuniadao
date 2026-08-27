# GLASS ONION License Registry

Command: `/glass licenses`

This registry records licenses verified from repository license files and package metadata. It does not change upstream licenses or infer rights beyond the actual license text.

## Verified repositories

| Repository | Verified license | Class | Notes |
|---|---|---|---|
| `sonoxo/xuniadao` | `Apache-2.0` | Permissive | Preserve license, notices, attribution, and modification notices as required. |
| `sonoxo/zyra` | `BUSL-1.1` | Source available | Production use is constrained by the Additional Use Grant. Change License: `Apache-2.0`; change date rule is four years from publication. |
| `sonoxo/gpt-doug-llm` | `MIT` | Permissive | Preserve copyright and license notice. |
| `sonoxo/AlmightySonoxo` | `MIT` | Permissive | LICENSE file contains the standard MIT permission grant even though the heading is omitted. |
| `sonoxo/gpt-uap-xo` | `Apache-2.0` | Permissive | LICENSE and Python package metadata are locked by CI. |

## TypeScript contract

The machine model lives at `src/lib/licenses.ts`. It exposes SPDX-aligned identifiers, license class, permissions, obligations, restrictions, change-license metadata, and repository lookup/validation functions.

The license registry is also a first-class GLASS ONION route:

```text
REPOSITORY_DISCOVERY
  → LICENSE_FILE_VERIFY
  → SPDX_VALIDATE
  → OBLIGATION_EVALUATE
  → ATTRIBUTION_EVIDENCE
```

## Important boundary

`BUSL-1.1` is source-available, not an OSI open-source license. The authoritative terms remain each repository's actual LICENSE file and any separately executed agreement. Upstream Flow token-registry provenance remains preserved in XUNIA package metadata and documentation.
