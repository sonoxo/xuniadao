# GLASS ONION CRM Port

Command: `/glass crm port`

The CRM port layer provides governed bulk read, bulk write, and system-to-system migration for CRM data.

## Supported formats

- CSV
- JSON arrays
- NDJSON
- ZIP bundle manifests containing CSV/JSON/NDJSON entries

ZIP archives are represented by a validated bundle manifest. The runtime that receives a binary archive is responsible for extraction, while GLASS ONION validates entry metadata, provenance, optional hashes, formats, and duplicate names before records enter the migration pipeline.

## Import pipeline

```text
PORT_INGEST
  → FORMAT_PARSE
  → SCHEMA_MAP
  → DEDUPE
  → CONSENT_PROVENANCE_CHECK
  → DRY_RUN
  → HUMAN_REVIEW
  → BATCH_WRITE
  → AUDIT
  → ROLLBACK_MANIFEST
```

Bulk writes require a role with `CRM_WRITE`, provenance, a maximum-record limit, and a batch size. Dry runs can be executed without approving the final mutation. Non-dry-run imports remain review-gated.

`INSERT_ONLY` preserves existing records. `UPSERT` replaces records with the same stable ID and emits restore operations for rollback.

## Export pipeline

```text
EXPORT_SCOPE
  → RBAC
  → FILTER
  → REDACT
  → PACKAGE
  → AUDIT
```

Exports require `CRM_EXPORT`. Callers can filter records and redact selected top-level fields or custom properties before packaging.

## Data quality and safety

The engine includes schema mapping, value validation, stable-ID dedupe, configurable dedupe keys, marketing-consent gating, provenance on every mapped row, batch limits, maximum-record limits, audit events, and rollback manifests.

## Migration sequence

Recommended production sequence:

1. Parse and map the source dataset.
2. Run a dry-run import.
3. Review rejected and duplicate rows.
4. Confirm provenance and consent requirements.
5. Approve the write.
6. Apply in bounded batches.
7. Store the audit and rollback manifests.
8. Verify counts and sampling against the source.

## Machine contract

See [`ecosystem/crm-port.json`](../ecosystem/crm-port.json).
