## eBay Integration Architecture

### Purpose
Provide a clean, auditable, and easily evolvable integration layer between the internal inventory/listing workflow and the external eBay marketplace while preserving strict domain separation and historical truth.

---
### Core Principles
1. Separation of Concerns: Internal listing lifecycle remains independent; eBay tables never drive core internal workflow.
2. Explicit Mapping Layer: No direct coupling of internal DB columns to eBay payload structure—mapping functions translate.
3. Idempotency & Determinism: Publishing and synchronization produce repeatable results guarded by content hashes.
4. Immutable History: Every externally‐visible state transition or data change relevant to an eBay listing is snapshotted.
5. Least Privilege & Containment: Only the integration service owns eBay credential usage and API calls.
6. Observability First: Each sync/publish attempt logged with status, timing, and diff summary.

---
### Table Overview (Proposed)

| Table | Purpose | Key Columns | Notes |
|-------|---------|-------------|-------|
| ebay_listing | Canonical current representation of an internal listing as projected for eBay (one row per internal listing destined for eBay) | id, internal_listing_id (FK), external_item_id (nullable), external_site, lifecycle_state, last_publish_hash, last_published_at, last_known_external_revision | Holds current projection & control flags. |
| ebay_change_queue | Pending change intents awaiting publish (create/update/end/relist) | id, ebay_listing_id, intent, payload_hash, created_at, priority, status, attempts, last_attempt_at, error_reason | Acts as lightweight outbox/job queue. |
| ebay_sync_log | Log of all publish/sync attempts | id, ebay_listing_id, operation, request_payload, response_code, response_body, result, duration_ms, attempt_hash, created_at | Durable forensic record; not deduped. |
| ebay_policy_cache | Cached reference data (shipping, return, fulfillment, payment policies, categories) | id, policy_type, external_id, name, raw_json, fetched_at, expires_at, content_hash | TTL or manual invalidation. |
| ebay_listing_snapshot | Immutable snapshots of the fully resolved eBay-bound data model | id, ebay_listing_id, snapshot_hash, snapshot_json, diff_from_prev_json, created_at, source_event, dedup_of_snapshot_id (nullable) | Hash allows dedup + integrity verification. |
| ebay_auth_token (optional) | Stores long-lived token/refresh metadata | id, token_type, access_token_encrypted, refresh_token_encrypted, scope, expires_at, obtained_at | Could instead be external secret store. |

Indexes (illustrative):
- ebay_listing(internal_listing_id UNIQUE)
- ebay_change_queue(status, priority, created_at)
- ebay_sync_log(ebay_listing_id, created_at DESC)
- ebay_listing_snapshot(ebay_listing_id, created_at DESC)
- ebay_listing_snapshot(snapshot_hash UNIQUE)

---
### Data Flow Lifecycle
1. Internal Change Detected (create/update/listing status change) → Projection builder resolves combined internal data (catalog, listing, ownership, config) into a normalized JSON structure (PrePublishModel).
2. Projection Hash Computed (stable canonical ordering) → If differs from ebay_listing.last_publish_hash, enqueue intent (create|update).
3. Publisher Worker dequeues ebay_change_queue row → Builds eBay API payload via mapping functions; performs call.
4. On success → Update ebay_listing (external ids, last_publish_hash, timestamps, lifecycle_state), create snapshot, log sync, mark queue row complete.
5. On failure → Increment attempts, store error_reason; requeue with backoff or mark dead after threshold.
6. Periodic Reconciliation Job → Pull current state from eBay, compare to local projection hash; if drift detected (unexpected changes) create snapshot (source_event = external_drift) and optionally enqueue corrective update.

---
### Snapshot Strategy Integration
Trigger snapshot creation on:
- Successful publish (create/update/end/relist)
- External reconciliation drift detection
- Policy dependency change causing projection diff
- Manual administrative force-snapshot

Each snapshot stores:
```json
{
  "version": 3,
  "generated_at": "2025-07-15T12:34:56.123Z",
  "internal_listing_id": 42,
  "ebay_listing_id": 17,
  "projection": { /* fully resolved internal -> eBay mapping inputs */ },
  "ebay_payload": { /* exact payload body sent to eBay (sanitized of auth) */ },
  "policies": {"shippingPolicyId":"...","returnPolicyId":"..."},
  "config_context_hash": "abc123...",
  "internal_sources": {
     "catalog_row_version": 11,
     "listing_row_version": 19,
     "appconfig_hash": "def456..."
  }
}
```

Hashing: `snapshot_hash = SHA256( canonicalJSONString(snapshot_json.projection + ebay_payload) )` (excluding volatile timestamps). Dedup: If identical to previous snapshot_hash, record row referencing previous via `dedup_of_snapshot_id` and store empty diff.

Diff: Structural JSON diff (remove unchanged subtrees). Store minimal patch in `diff_from_prev_json` to optimize history browsing.

---
### Mapping Layer (Illustrative Modules)
- mapping/resolveProjection.js → Gathers internal data + config, returns stable projection object.
- mapping/projectionToEbayPayload.js → Converts projection to eBay API specific payload (create/update) and validates constraints (required categories, item aspects, condition, fulfillment, pricing).
- mapping/normalizeExternal.js → Normalizes pulled eBay listing JSON to internal comparison shape for drift detection.

Validation Stages:
1. Projection validation (internal completeness)
2. Payload validation (marketplace rules/constraints)
3. Publish pre-flight (duplicate prevention via hash check)

---
### Queue & Concurrency
- Single row lock (SELECT ... FOR UPDATE SKIP LOCKED) pattern to allow multiple worker processes.
- Exponential backoff columns: attempts, next_earliest_run_at.
- Poison handling: after N (configurable) failures → status=dead; operator review endpoint lists dead rows.

---
### Reconciliation Job
Runs on schedule (e.g., every 30 min):
1. Pull subset of listings changed externally since last checkpoint (using eBay revision or modification time if available).
2. For each, normalize JSON, compute hash, compare to local projection hash.
3. If mismatch: snapshot (source_event=external_drift) + optionally enqueue corrective update if internal still authoritative.
4. Record metrics: drift_count, recovered_count.

---
### Metrics & Observability
Current & Planned Metrics (see `ebay_integration_next_steps.md` R1 for full plan):

Counters:
- publish.attempt, publish.success, publish.failure
- queue.enqueue, queue.dequeue, queue.enqueue_skipped_hash
- snapshot.created, snapshot.dedup_hit
- drift.detected, drift.corrective_enqueued
- reconciliation.run, audit.run

Gauges:
- queue.pending_depth
- rate.remaining_quota (future)

Histograms (planned simple fixed buckets):
- publish.duration_ms
- queue.item_process_duration_ms

Timestamps:
- publish.last_success, publish.last_error
- reconciliation.last_run, audit.last_run
- queue.last_idle, queue.last_process_start

Health Enrichment (planned):
```json
"ebay": {
  "queue_depth": 0,
  "last_publish_success_age_ms": 1234,
  "last_publish_error_age_ms": null,
  "reconciliation": { "last_run_ms": 53211 },
  "audit": { "last_run_ms": 104550 }
}
```

Implemented summary now lives at `/api/admin/ebay/health` response `summary` field with the same shape; values are ages (ms since last event) computed from timestamps without additional DB queries.

Structured Log Example:
`{"ts":"...","component":"ebay_publisher","listing":42,"intent":"update","result":"success","duration_ms":412,"hash":"abc123"}`

---
### Security & Secrets
- Tokens encrypted at rest (field-level using KMS or application AES key).
- Payload logs scrub access tokens & PII where applicable.
- Principle of least privilege in eBay developer key scopes.

---
### Phased Implementation Plan
1. Migrations: Create ebay_* tables (minus auth if external secret store chosen).
2. Projection + Hash utility (no network calls) + unit tests.
3. Queue ingestion on internal listing change (dry run logging only).
4. Publisher worker with mock adapter (feature flag disabled by default).
5. Snapshot creation & diff logic.
6. Real eBay API adapter integration.
7. Reconciliation job.
8. Admin endpoints & UI panels (queue depth, recent sync log, drift report, snapshot browser).

---
### Open Questions / Future Considerations
- Multi-account support (introduce account_id foreign keys).
- Multisite (US vs other marketplaces) partitioning.
- Handling of variations (multi-SKU) — require projection extension.
- SLA metrics & alert thresholds.
- Archival / retention policy for large snapshot volume (tiered storage or pruning with hash dedup retained).

---
### Glossary
- Projection: Internal canonical representation primed for mapping to external payload.
- Payload: Exact body sent to eBay API.
- Drift: Divergence between external marketplace state and internal authoritative projection.
- Snapshot: Immutable persisted record binding projection + payload + context.
