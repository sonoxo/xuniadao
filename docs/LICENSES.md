# GLASS ONION License Registry

Command: `/glass licenses`

This registry records only licenses that were verified from repository license files. It does not create new rights, change upstream licenses, or infer permissions where no license is declared.

## Verified repositories

| Repository | Verified license | Class | Notes |
|---|---|---|---|
| `sonoxo/xuniadao` | `Apache-2.0` | Permissive | Preserve license, notices, attribution, and modification notices as required. |
| `sonoxo/zyra` | `BUSL-1.1` | Source available | Production use is constrained by the Additional Use Grant. Change License: `Apache-2.0`; change date rule is four years from publication. |
| `sonoxo/gpt-doug-llm` | `MIT` | Permissive | Preserve copyright and license notice. |
| `sonoxo/AlmightySonoxo` | `MIT` | Permissive | LICENSE file contains the standard MIT permission grant even though the heading is omitted. |
| `sonoxo/gpt-uap-xo` | `UNDECLARED` | Undeclared | No LICENSE file was verified. Do not infer permission to copy, modify, or redistribute. |

## TypeScript contract

The machine model lives at `src/lib/licenses.ts`. It exposes SPDX-aligned identifiers, license class, permissions, obligations, restrictions, change-license metadata, and repository lookup/validation functions.

## Important boundary

`BUSL-1.1` is source-available, not an OSI open-source license. `UNDECLARED` means the registry makes no grant of rights. The authoritative terms remain each repository's actual LICENSE file and any separately executed agreement.
