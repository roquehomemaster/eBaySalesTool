# eBay Integration Implementation Plan & Tracking

Last Updated: 2025-08-18
Owner: (assign)

## Legend
- Status: NOT_STARTED | IN_PROGRESS | BLOCKED | DONE | DEFERRED
- Priority: P1 (critical path), P2 (important), P3 (nice to have)

## High-Level Phases
1. Schema & Persistence Foundations
2. Projection & Hashing Core
3. Change Queue + Event Ingestion
4. Snapshot & Diff Subsystem
5. Publisher (Mock → Real Adapter)
6. Reconciliation / Drift Detection
7. Admin & Observability Surfaces
8. Hardening (tests, integrity, retention, security)

## Task Matrix
| # | Task | Description | Deliverables | Depends On | Priority | Status | Notes |
|---|------|-------------|--------------|------------|----------|--------|-------|
| 1 | Create migrations for ebay_* tables | Tables: ebay_listing, ebay_change_queue, ebay_sync_log, ebay_policy_cache, ebay_listing_snapshot (+ optional ebay_auth_token) | SQL migration file `20250815_create_ebay_integration_tables.sql` | - | P1 | DONE | Added & ready; pending container rebuild to apply |
| 2 | Add model definitions | Sequelize models + associations (internal listing FK) | `backend/models/ebayIntegrationModels.js` | 1 | P1 | DONE | Models created (schema-only) |
| 3 | Projection builder utility | Resolve internal listing → canonical projection object | projectionBuilder.js + unit tests | 1 | P1 | DONE | Deterministic ordering required |
| 4 | Canonical JSON + hash util | Stable key sort + SHA256 function | hashUtil.js + tests | 3 | P1 | DONE | Excludes volatile fields by omission |
| 5 | Change detection & enqueue hook | On internal listing create/update/status-change → compare hash; enqueue intent | changeDetector.js + tests integrated into controller | 3,4 | P1 | DONE | Status changes covered via update path; dedicated status endpoint not separate |
| 6 | Queue processor skeleton (mock) | Worker that pulls queue, logs intended action only | queueWorker.js + npm script | 5 | P1 | DONE | No external calls yet |
| 7 | Snapshot creation module | createSnapshot(event, context) + diff vs previous | snapshotService.js + tests | 1,4 | P1 | DONE | Feature-flagged EBAY_SNAPSHOTS_ENABLED |
| 8 | Diff generator | Structured diff for nested objects & arrays | diffUtil.js + tests | 7 | P1 | DONE | Flat path-based change map |
| 9 | Integrate snapshot into publish flow | Snapshot on successful (mock) publish | Updated worker + tests | 6,7 | P1 | DONE | publish_success source event wired |
| 10 | Real eBay adapter (sandbox) | REST client, auth injection, rate limiting wrapper | adapter.js + config | 6 | P2 | DONE | HTTP + rate limit + refresh + classification |
| 11 | Publisher full path | Build payload + call adapter + update state | Enhanced worker + tests | 3,4,10 | P1 | DONE | Backoff, hash update, metadata, basic sync logging |
| 12 | Reconciliation job | Scheduled drift detector + snapshot on drift | reconJob.js + tests | 3,4,7,10 | P2 | IN_PROGRESS | Drift enqueue + optional snapshot implemented; metrics pending |
| 13 | Admin endpoints (queue) | List queue, dead letters, retry | Express routes + controller tests | 6 | P2 | IN_PROGRESS | List + retry + dead-letter + bulk retry + sync logs list implemented & tested |
| 14 | Admin endpoints (snapshots) | List snapshots, get snapshot, diff two | Routes + tests | 7,8 | P2 | IN_PROGRESS | List + get + diff implemented & tested |
| 15 | Admin dashboards UI | Queue depth, recent sync log, snapshot timeline | React components | 13,14 | P3 | NOT_STARTED | Reuse table state hook |
| 16 | Policy cache fetcher | Retrieve & persist shipping/return/payment policies | policyService.js + tests | 1,10 | P2 | NOT_STARTED | TTL + manual invalidate |
| 17 | Policy change impact snapshot | On policy change, re-projection + snapshot w/ event | Extended snapshot logic | 7,16 | P2 | NOT_STARTED | Avoid flood; debounce |
| 18 | Integrity audit job | Periodic re-hash sampling & log | auditJob.js + tests | 7 | P3 | NOT_STARTED | Configurable sample size |
| 19 | Security hardening | Token encryption + secret handling pattern | Updated adapter + docs | 10 | P2 | NOT_STARTED | Consider external vault |
| 20 | Documentation update pass | Sync any schema/flow changes back to docs | Updated docs | Ongoing | P1 | IN_PROGRESS | Living doc cycle |

## Immediate Next Actions (P1 Focus)
Replaced by consolidated roadmap below (see "Roadmap Enhancements"), with current active focus on Observability & Metrics (Item R1).

## Roadmap Enhancements (Post-Core Completion)
| ID | Theme | Item | Description | Outcome / KPIs |
|----|-------|------|-------------|----------------|
| R1 | Observability | Per-job metrics & health enrichment | Add duration, success/failure counters, last run timestamps for queue worker, reconciliation, integrity audit, policy fetch. Extend /api/ebay/metrics & global /api/health. | Time-to-detect failures <5m; export queue depth & last_success age. |
| R2 | Reliability | Retry + DLQ | Standard retry (expo + jitter) for publish & snapshot side-effects; dead-letter table + admin replay endpoint. | Zero silent drops; DLQ size visible. |
| R3 | Rate Limiting | Central client wrapper | Token bucket around adapter; pause non-critical jobs near quota; expose remaining quota metric. | Prevent HTTP 429 spikes; smooth publish latency. |
| R4 | Idempotency | Dedupe + uniqueness enforcement | Partial unique index and in-worker/hash guards suppress duplicate enqueues & publishes. | Duplicate external calls reduced to ~0. |
| R5 | Chaos & Testing | Mock eBay server | Deterministic sandbox server to simulate rate limits, transient errors, schema drift; inject faults in tests. | Reliable reproduction of failure modes. |
| R6 | Drift Detection | Enhanced reconciliation | Hash remote state, diff classification (external_only vs internal_only changes), drift events table. | Mean drift detection latency <30m. |
| R7 | Admin Controls | Replay & dry-run | Endpoints for replaying DLQ, force snapshot, dry-run publish returning validation + proposed payload. | Faster operator recovery. |
| R8 | Config Live Reload | Dynamic intervals | Move job intervals & thresholds into appconfig with live reload + admin trigger. | No restarts for tuning; change propagation <1m. |
| R9 | Security | Secret & PII hardening | Encrypt tokens, structured redaction tests, secret rotation procedure doc. | No plaintext secrets at rest; redaction tests green. |
| R10 | Performance | Batch & debounce | Aggregate rapid successive listing updates; coalesce into single publish intent window. | Reduce redundant publish intents >50%. |
| R11 | Retention | Snapshot/log pruning | Policy-based archival or pruning with hash dedup preservation; size metrics. | Controlled storage growth (<X GB/mo). |
| R12 | UI | Admin dashboards | Queue depth graph, publish success ratio, drift events timeline, snapshot diff viewer. | Faster diagnosis (MTTR ↓). |

### R1 (In Detail: Observability & Metrics Implementation Plan)
Scope:
1. Extend metrics collector to support histograms (simple fixed buckets) and monotonic last error tracking.
2. Instrument: queueWorker (loop duration, item processing duration, success/fail), reconciliation job, integrity audit job, snapshotService (creation duration, dedup hits), adapter calls (latency & result), changeDetector events (enqueued vs skipped due to identical hash).
3. Health (/api/health) additions: ebay: { queue_depth, last_publish_success_age_ms, last_publish_error_age_ms, reconciliation: { last_run_ms }, audit: { last_run_ms } }.
4. /api/ebay/metrics route: return structured snapshot including new histograms & top counters.
5. Add lightweight tests asserting presence & increment of key counters and timestamp updates.
6. Documentation of metric names & semantics appended to architecture doc.

Metric Naming Conventions:
- Counters: verb.object[.qualifier] (publish.attempt, publish.success, publish.failure, queue.dequeue, queue.enqueue_skipped_hash)
- Gauges: resource.state (queue.pending_depth)
- Timers/Histograms: duration.object_ms (publish.duration_ms)
- Timestamps: last.event (publish.last_success, publish.last_error, reconciliation.last_run)

Acceptance Criteria R1:
- Metrics appear after at least one job run.
- All timestamps update on success paths; failures increment failure counters.
- Health endpoint includes ebay block with required fields and never blocks (>50ms execution) by using cached snapshot.

Open Questions R1:
- Need Prometheus exposition now or keep JSON? (Defer until external monitoring stack determined.)
- Do we need cardinality control for status codes beyond success/failure? (Initial: success/failure only.)

## R2 (Retry + Dead-Letter Queue) - Status: DONE
Implemented:
- Exponential backoff with cap (max 300s) and configurable max attempts (EBAY_PUBLISH_MAX_ATTEMPTS, default 6).
- On exceeding max attempts, queue row -> status=dead and snapshot written to `ebay_failed_event` (DLQ) table.
- Admin endpoints:
	- GET /api/admin/ebay/queue/dead-letter (deadQueue + failedEvents)
	- POST /api/admin/ebay/queue/dead-letter/retry (bulk retry dead rows)
	- POST /api/admin/ebay/failed-events/:id/replay (re-enqueue single failed event)
- Metrics added: publish.dead_letter, publish.retry_scheduled, publish.failure.
- Health summary now exposes dead_queue_count & failed_event_count.

Completed Additions:
1. Adaptive classification of permanent errors (client_error, forbidden, not_found, conflict, locked) → early dead-letter with lower attempt threshold.
2. Metrics: publish.permanent_failure, publish.dead_letter, publish.retry_scheduled.

Pending (Optional Enhancements):
1. Capture last_error classification (transient vs permanent) to short-circuit obvious permanent failures (e.g., validation) with lower max attempts.
2. Add pruning/retention policy for `ebay_failed_event` (e.g., appconfig days_to_keep_failed_events).
3. Add DLQ replay audit log entry (transactionLogger) for traceability.
4. Add UI sorting/filtering for DLQ entries (once admin UI is introduced).

Acceptance Criteria R2 (Updated):
- Dead-letter entries never reprocessed automatically.
- Replay endpoint creates fresh queue item with attempts=0.
- Health summary counts reflect DLQ sizes (<2s response even with >10k rows — future indexing consideration).


## R3 (Rate Limiting) - Status: DONE
Implemented:
- Central `rateLimiter.js` token bucket with adjustable capacity (EBAY_RATE_LIMIT_RPS) & refill.
- Header-based dynamic adjustments (x-rate-limit-remaining / retry-after) to tune remaining tokens.
- Health summary includes `rate.near_depletion` boolean.
- Metrics: adapter.create.calls, adapter.update.calls, rate limiter indirectly surfaced via near depletion flag.

Pending Enhancements:
- Adaptive throttling of non-critical jobs (recon/audit/policy) when near depletion.
- Exposure of remaining tokens gauge (future if Prometheus integration added).

## R4 (Idempotency) - Status: DONE
Implemented:
1. Enqueue duplicate suppression: `changeDetector` checks for existing pending/processing row with same (listing, payload_hash) and skips (reason: duplicate_pending) with counter `queue.enqueue_skipped_duplicate`.
2. Publish-time idempotent skip: `queueWorker` early-completes item if listing.last_publish_hash already equals current projection hash; counter `publish.idempotent_skip`.
3. Partial unique index `ux_ebay_change_queue_listing_hash_active` enforcing no duplicate active rows (pending|processing) for same listing + hash.
4. Integration test (`idempotency.test.js`) verifying duplicate suppression and worker skip without adapter call.

Planned (Optional):
- Dedicated dedupe stats table (ebay_publish_dedupe) tracking enqueue_count & first/last_seen for richer analytics.
- Cleanup task to prune obsolete pending duplicates left from historical bugs (currently prevented going forward).

Acceptance Criteria R4 (Met):
- Second identical change while first pending returns skipped duplicate.
- Worker does not invoke adapter twice for same hash.
- Health/metrics reflect counters for duplicate suppression & idempotent skips.

## Acceptance Criteria (Selected Key Tasks)
### Task 3 (Projection Builder)
- Deterministic ordering of object keys.
- Returns stable output for unchanged internal state.
- Unit test covers added/removed field scenarios.

### Task 7 (Snapshot Service)
- Creates row with snapshot_hash; dedups identical state (marks reference).
- Diff stored or `{}` when identical.
- Concurrent publishes safe (transaction + unique constraint on (ebay_listing_id, created_at, snapshot_hash)).

### Task 11 (Publisher Flow)
- Skips enqueue/publish when hash identical (idempotency guard).
- Logs success/failure with attempt metadata.
- On success: snapshot + state update; on failure: attempts++, backoff scheduling.

## Risk Register
| Risk | Impact | Mitigation |
|------|--------|------------|
| High snapshot volume | Storage bloat | Dedup + optional compression flag |
| Race between internal update & publish | Inconsistent snapshot | Wrap projection + enqueue in single transaction or version check |
| eBay API throttling | Delays publishing | Rate limiter + exponential backoff |
| Hash collisions (extremely low) | Incorrect dedup | SHA256 acceptable; monitor improbable duplicate with unequal payload lengths |
| Policy drift unnoticed | Outdated listings | Scheduled policy refresh + dependency snapshot trigger |

## Metrics (Planned)
- queue_depth by intent
- publish_attempt_total{result}
- snapshot_created_total{source_event}
- drift_detected_total
- projection_hash_miss_ratio (changed vs unchanged)

## Open Questions
- Need variation / multi-SKU support now or defer?
- Required retention period for logs & snapshots?
- Do we need soft-delete for ebay_listing when internal listing archived?

## Update Process
- Edit this file with status changes.
- Keep “Immediate Next Actions” section to <=3 active focus items.

