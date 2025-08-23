# ListFlowHQ (formerly eBay Sales Tool)

> See `CHANGELOG.md` for recent changes.

## Development Environment
## Project Overview
ListFlowHQ is a full-stack application for managing product listings, synchronizing channel data (initial focus: eBay), and maintaining a growing product catalog. It includes a backend API, a frontend user interface, and a database for storing sales, catalog, and listing data.

## eBay Integration Architecture (June 2025 Additions)
The eBay integration subsystem provides a resilient, observable pipeline for synchronizing listing data and related policies with eBay. It is composed of modular services with feature flags so you can enable only what you need during development.

### Core Concepts
- Projection & Hashing: Listing payloads are converted into a deterministic projection and hashed to drive idempotent change detection.
- Change Queue: Detected listing changes are enqueued (when enabled) and processed with retry + exponential backoff.
- Snapshots & Diff: Each published (or reconciled) state can persist a snapshot and a structural diff to support drift detection.
- Policy Cache & Impact: Policy refreshes are cached with a TTL; changes trigger targeted listing re-queues (impact propagation).
- Reconciliation Job: Periodic drift scan re-syncs any listings whose stored hash no longer matches the canonical projection.
- Integrity Audit: Verifies internal hash invariants & snapshot references to flag silent corruption or logic regressions.

### Feature Flags (Environment Variables)
| Flag | Purpose |
|------|---------|
| EBAY_QUEUE_ENABLED | Enable async queue-based processing of listing changes |
| EBAY_SNAPSHOTS_ENABLED | Persist listing projections + diffs for history & drift detection |
| EBAY_PUBLISH_ENABLED | Actually perform (or simulate) outbound publish operations |
| EBAY_RECON_ENABLED | Run periodic reconciliation job |
| EBAY_RECON_SNAPSHOT_ON_DRIFT | Take a fresh snapshot when drift is detected |
| EBAY_POLICY_ENABLED | Enable scheduled policy refresh + cache |
| EBAY_POLICY_IMPACT_ENABLED | Trigger listing impact recalculation when policies change |
| EBAY_POLICY_IMPACT_SNAPSHOT | Snapshot listings affected by policy impact cycle |
| EBAY_POLICY_IMPACT_MAX | Upper bound on listings processed per impact cycle |
| EBAY_AUDIT_ENABLED | Enable integrity audit job |
| EBAY_ADMIN_API_KEY | Protect admin endpoints with header auth (X-Admin-Auth) |

All flags default to a safe disabled state unless explicitly set (implementation checks guard scheduling & side-effects).

### Transaction Logging & Redaction
A dedicated table `ebay_transaction_log` now records every integration transaction for full traceability:

| Column | Description |
|--------|-------------|
| txn_id | Surrogate primary key |
| correlation_id | Correlates multi-step flows (request ↔ response, retries) |
| ebay_listing_id | Optional linkage to an internal listing record |
| direction | `outbound`, `inbound`, or `internal` (summary/system events) |
| channel | Logical source (e.g., `adapter`, `policy`, `recon`, `impact`, `audit`) |
adapter.http.auth_failure_ratio_ema // Exponential moving average (alpha configurable)
adapter.http.auth_failure_ratio_threshold_exceeded // Counter of threshold breach events (subject to cooldown)
| operation | Action performed (e.g., `createListing`, `updateListing`, `policyRefresh`) |
| request_payload / response_payload | Redacted JSON (see below) |
| status | `success`, `failure`, `skipped`, `noop` |
| classification | Optional tag (e.g., `retryable`, `terminal`) |
| latency_ms | Measured round-trip or internal processing duration |
| created_at | Timestamp of the event |

Sensitive fields (tokens, credentials, passwords, apiKey, secret, auth headers, etc.) are recursively redacted using a centralized utility before persistence. This ensures production logs remain safe for export and analysis.

### Admin & Observability Endpoints
All eBay admin endpoints are mounted behind optional API key middleware. Set `EBAY_ADMIN_API_KEY` and include header `X-Admin-Auth: <value>` in requests.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /admin/ebay/transactions | GET | List or export transaction log entries |
| EBAY_HTTP_AUTH_FAILURE_RATIO_ALERT | Alert threshold for instantaneous auth failure ratio (0 disables) | 0 |
| EBAY_HTTP_AUTH_FAILURE_RATIO_EMA_ALPHA | Smoothing factor for EMA ratio gauge | 0.2 |
| EBAY_HTTP_AUTH_FAILURE_RATIO_LOG_COOLDOWN_MS | Min ms between threshold warning logs | 60000 |
| /admin/ebay/metrics | GET | In-memory integration metrics (counters, timestamps) |
| /admin/ebay/metrics/alert-history | GET | Full alert history with optional filters key, sinceMs, limit, offset |
| /admin/ebay/metrics/alert-history.ndjson | GET | Stream alert history (DB if persistence enabled) |
| /admin/ebay/metrics/alert-history/retention/run | POST | Manually trigger persisted alert prune (if retention days set) |
| /admin/ebay/health | GET | Point-in-time health summary (flags, last run markers) |
| /admin/ebay/drift-events | GET | Paginated drift events (filters: classification, listingId, fromMs, toMs, limit/offset) |
| /admin/ebay/drift-events/summary | GET | Aggregated drift classification counts |
| /admin/ebay/drift-events/retention/run | POST | Manually trigger drift retention cleanup |
| /api/admin/ebay/retrieve | POST | Ingest (or simulate) raw listing payloads (see docs/ebay_admin_endpoints.md) |
| /api/admin/ebay/map/run | POST | Execute mapping pipeline for pending raw rows (see docs/ebay_admin_endpoints.md) |
| /api/ready | GET | Readiness probe (503 if critical integration dependencies degraded) |

#### Transaction Query Parameters
- channel, operation, status: Exact match filters
- ebay_listing_id: Numeric filter
- from, to: ISO 8601 or YYYY-MM-DD date boundaries (applied to created_at)
- format=csv: Stream a CSV export (includes header row)
- limit / offset: (If implemented) Pagination controls; otherwise default internal limit safeguards apply.

Example (PowerShell):
```
curl -H "X-Admin-Auth: $env:EBAY_ADMIN_API_KEY" "http://localhost:5000/admin/ebay/transactions?channel=adapter&status=success&from=2025-06-10&format=csv"
```

### Metrics Highlights
Metrics (exposed via /admin/ebay/metrics) include counts for publish attempts, successes, failures, policy refresh cycles, impact runs, reconciliation drift events, and audit findings. Timestamp markers (e.g., lastPolicyRefresh, lastReconciliationRun) aid temporal correlation. Additional drift metrics & counters:

- recon.drift_internal_only / external_only / both_changed / snapshot_stale
- drift.retention_deleted (number of drift event rows purged by retention job)

Health summary ( /admin/ebay/health ) now includes:
```
drift: {
   classifications: { internal_only: <n>, external_only: <n>, ... },
   retention_deleted: <total_deleted_so_far>
}
```

Use these to set alerts (e.g., sustained rise in external_only could indicate unauthorized manual edits on eBay).

Adapter metrics (simulated adapter layer) now include:
```
adapter.get_item_detail.calls   // total successful detail fetches
histogram: adapter.get_item_detail_ms (p50/p90/p95/p99 latency)
adapter.transient_failures / adapter.permanent_failures // failure classification counts
map.runs / map.processed / map.mapped / map.errors
### Alerts Preview Endpoint
For quick local inspection of which conditions would currently alert (without Prometheus), call:
```
GET /api/admin/ebay/metrics/alerts  (auth key required)
```
Response shape:
```
{ ts: 1755702000000, active: [ { key: "oauth_degraded", severity: "page", sinceMs: 12345 }, { key: "auth_failure_ratio_threshold", severity: "warn", ratio: 0.22, threshold: 0.15, ema: 0.18 } ] }
```
Keys align loosely with suggested Prometheus alert names for easier correlation.

### Readiness Transition Logs
Structured JSON logs are emitted on readiness state transitions:
```
{"event":"readiness_transition","from":"ready","to":"not_ready","issues":["oauth_degraded"],"ts":...}
```
Use these to correlate with external orchestrator restarts or traffic routing changes.
histogram: map.run_duration_ms
```
Ingestion adds retry classification counters:
```
ingest.transient_errors
ingest.permanent_errors
ingest.retries
histogram: ingest.attempts_per_item (distribution of attempts per item)
avgAttempts (in retrieve summary response)
ingest.backpressure_delays (count of adaptive pauses)

Prometheus-style metrics scraping is available at `/api/admin/ebay/metrics/prometheus` (same auth as JSON endpoints). The exporter renders counters, gauges, histogram buckets + cumulative counts, `_sum` and `_count`, plus derived percentile gauges.
Circuit breaker metrics:
```
adapter.circuit_state (0=closed,1=open,2=half_open)
adapter.circuit_opened
adapter.circuit_half_open_probe_success
adapter.circuit_half_open_probe_failure
```
```
Health summary (`/api/admin/ebay/health`) now surfaces a condensed view:
```
summary: {
   ingestion: { transient_errors, permanent_errors, retries },
   ingestion.backpressureDelays
   adapter: { calls, transient_failures, permanent_failures, latency_ms: { p50, p90, p95, p99 } },
   mapping: { runs, processed, mapped, errors, last_run_age_ms, duration_ms: { p50, p90, p95, p99 } },
   circuitBreaker: { state, consecutiveFailures, openUntil, lastOpenedAt }
   oauth: { has_token, expires_in_ms, last_refresh_success_age_ms, last_refresh_error_age_ms, last_error }
   oauth.degraded reflects EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES threshold; consecutive_failures counter exposed.
    oauth.degraded_duration_ms, last_degraded_at, last_recovered_at for SLO burn tracking
}
```

Readiness (`/api/ready`): returns 200 when no critical issue; 503 with JSON `{ status: 'not_ready', issues: [...] }` when:
```
issues may include:
   oauth_degraded            // token refresh in sustained failure (>= EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES)
   circuit_breaker_open      // adapter circuit breaker currently open
   db_unreachable            // DB probe failed or timed out
   queue_backlog             // queue.pending_depth >= EBAY_QUEUE_BACKLOG_READY_THRESHOLD
   oauth_check_error         // internal snapshot error (unexpected)
   circuit_breaker_check_error
```
Use this endpoint for Kubernetes readinessProbe or load balancer health gating.

### Prometheus Alert Rule Examples
Example recording & alerting rules (YAML snippets) you can adapt:
```yaml
groups:
   - name: ebay-integration.rules
      interval: 30s
      rules:
         # Record 5m rate of auth failures (requires counter availability)
         - record: job:adapter_http_auth_failures:rate5m
            expr: rate(adapter_http_auth_failures[5m])

         # Alert: OAuth degraded sustained > 2 minutes
         - alert: EbayOAuthDegradedSustained
            expr: adapter_oauth_degraded == 1
            for: 2m
            labels:
               severity: page
            annotations:
               summary: "eBay OAuth degraded for >2m"
               description: "Consecutive failures exceeded threshold (env EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES). Investigate token endpoint / credentials."

         # Alert: High auth failure ratio (rolling snapshot gauge) above 15% for 10m
         - alert: EbayAuthFailureRatioHigh
            expr: adapter_http_auth_failure_ratio > 0.15
            for: 10m
            labels:
               severity: warn
            annotations:
               summary: "Auth failure ratio >15%"
               description: "Investigate expired/invalid token or permission changes. gauge={{ $value }}"

         # Alert: Circuit breaker open > 1 minute
         - alert: EbayAdapterCircuitOpen
            expr: adapter_circuit_state == 1
            for: 1m
            labels:
               severity: warn
            annotations:
               summary: "Adapter circuit breaker open"
               description: "Persistent permanent failures. Check upstream API availability."        
         # Alert: Queue oldest pending age high (warn/page thresholds mirrored via recording rules)
         - alert: EbayQueueOldestPendingAgeHigh
            expr: queue_oldest_pending_age_ms > 60000
            for: 2m
            labels:
               severity: warn
            annotations:
               summary: "Queue oldest pending age >60s"
               description: "Items waiting too long before first processing. Consider scaling workers or investigating stalls."

         # Alert: Max item wait time extreme (historical peak observed)
         - alert: EbayQueueMaxItemWaitExtreme
            expr: queue_max_item_wait_ms > 300000
            for: 5m
            labels:
               severity: page
            annotations:
               summary: "Queue max observed wait >5m"
               description: "Severe queue latency. Publishing throughput likely insufficient or blocked."
         # Alert: Queue item wait p99 sustained high
         - alert: EbayQueueItemWaitP99High
            expr: queue_item_wait_ms_p99 > 120000
            for: 5m
            labels:
               severity: warn
            annotations:
               summary: "Queue item wait p99 >120s"
               description: "High tail latency in queue processing; investigate worker saturation or external publish slowness."
```
Adjust metric names if your Prometheus normalization (dots to underscores) differs; exporter converts dots to underscores.

OAuth degraded transition metrics:
```
adapter.oauth.degraded_enter
adapter.oauth.degraded_exit
adapter.oauth.degraded (gauge 0/1)
```
HTTP adapter adds:
```
adapter.http.auth_failures          // 401/403 token/auth issues
adapter.http.oauth_short_circuit    // Count of calls blocked pre-flight due to OAuth degraded
adapter.http.auth_failure_ratio     // Rolling snapshot ratio auth_failures / (http calls + 1)
adapter.http.auth_failure_ratio_threshold_exceeded // Incremented when ratio > EBAY_HTTP_AUTH_FAILURE_RATIO_ALERT
```
During degraded OAuth, adapter short-circuits with permanent error `oauth_degraded` before making outbound calls to limit cascading failures.

Queue backlog & DB reachability metrics:
```
queue.pending_depth            // Current pending items in change queue
queue.backlog_exceeded         // 1 when pending_depth >= EBAY_QUEUE_BACKLOG_READY_THRESHOLD else 0
queue.backlog_last_exceeded    // Timestamp (ms epoch) when backlog last crossed threshold
queue.oldest_pending_age_ms    // Age in ms of the currently oldest pending change (0 if queue empty)
queue.item_wait_ms histogram   // Distribution of per-item wait time from enqueue to processing
queue.last_item_wait_ms        // Wait time of the most recently dequeued item
queue.max_item_wait_ms         // Max observed wait time since process start (resets on restart)
 queue.max_item_wait_decayed   // 1 on iterations where decay was applied (cleared on next run without decay)
 queue.max_item_wait_last_decay // Timestamp when decay last applied
db.reachable                   // 1 when last readiness probe succeeded, 0 on failure/timeout
db.last_check                  // Timestamp of last DB readiness probe attempt
db.last_unreachable            // Timestamp when DB was last observed unreachable
readiness.current_state        // 1=ready, 0=not_ready
readiness.transitions          // Total readiness state transitions
readiness.transitions_to_ready // Count of transitions entering ready
readiness.transitions_to_not_ready // Count of transitions entering not_ready
readiness.last_transition      // Timestamp of most recent readiness state change
readiness.flap_window_transitions // Number of state transitions in the current sliding window
readiness.flap_window_ms       // Size of sliding window used for flapping calculations
```
Alerts preview now includes `queue_backlog` and `db_unreachable` when firing.
Additional latency-based alerts (if thresholds configured):
```
queue_oldest_age        // Firing when queue.oldest_pending_age_ms >= QUEUE_OLDEST_AGE_* thresholds
queue_max_item_wait     // Firing when queue.max_item_wait_ms >= QUEUE_ITEM_WAIT_MAX_* thresholds
 queue_item_wait_p99    // Firing when p99 >= QUEUE_ITEM_WAIT_P99_* thresholds
 queue_latency_backlog_burn // Composite: p99 >= QUEUE_BURN_P99_MS AND backlog depth >= QUEUE_BURN_BACKLOG_DEPTH (severity escalates to page if p99 >= QUEUE_BURN_P99_PAGE_MS)
 queue_latency_burn_rate   // Sliding window ratio of high wait samples exceeds QUEUE_BURN_WARN_RATIO / PAGE_RATIO

Additional internal gauges (for observability & Prometheus export):
- queue.wait_samples_size: Current in-memory sample count used for burn-rate evaluation (bounded 2000)
- queue.wait_samples_last_wait_ms: Wait (ms) of the most recently processed queue item
 - queue.wait_samples_cap: Configured cap for retained wait samples (matches QUEUE_WAIT_SAMPLES_CAP)

Alert counter metrics (incremented when an alert fires):
- alerts.fired_total: Total alerts fired (all keys)
- alerts.<alert_key>.fired_total: Total times a specific alert key fired
- alerts.<alert_key>.warn_total / page_total: Per-severity counts per key
- alerts.<alert_key>.last_fired_ts (gauge): Epoch ms when alert last fired
- alerts.<alert_key>.last_fired_severity (gauge): 0=none,1=warn,2=page numeric severity of last fire
Duplicate alert suppression:
- If suppression is configured (see EBAY_ALERT_SUPPRESS_* vars) and an alert with the same key+severity re-fires within its window, it is suppressed (not persisted and fired counters not incremented). Instead these counters increment:
   - alerts.suppressed_total
   - alerts.<alert_key>.suppressed_total
- Severity changes (e.g. warn -> page) are never suppressed.
Additional suppression gauges:
- alerts.last_suppressed_ts (epoch ms)
- alerts.<alert_key>.last_suppressed_ts (epoch ms per key)
Active / cleared tracking:
- Gauges: alerts.active_total, alerts.active_warn, alerts.active_page (current non-suppressed active set).
- Counters: alerts.cleared_total, alerts.<alert_key>.cleared_total increment when an alert key fully clears OR a page severity downgrades to warn.
- Gauges: alerts.last_cleared_ts, alerts.<alert_key>.last_cleared_ts capture last clear/downgrade timestamp.
```

Structured OAuth degraded transition logs (JSON one-line):
```
{"event":"oauth_degraded_enter","consecutiveFailures":6,"failureThreshold":5,"lastError":"token_endpoint_error:500","ts":<epoch_ms>}
{"event":"oauth_degraded_exit","consecutiveFailures":0,"failureThreshold":5,"degradedDurationMs":12345,"ts":<epoch_ms>}
```
Auth failure ratio threshold log (when ratio exceeds configured value):
```
{"event":"auth_failure_ratio_threshold","ratio":0.32,"threshold":0.15,"authFailures":48,"httpCalls":150}
```
Queue latency structured log when a new max wait is observed:
```
{"event":"queue_wait_max_update","waitMs":4200,"previousMaxMs":3100,"ts":<epoch_ms>}
```

### Drift Detection & Retention

Drift compares three hashes per listing:
1. Local projection (fresh build)
2. Last snapshot / last_publish_hash
3. Remote live state (adapter.getListing)

Classification outcomes:
- internal_only: local diverged; enqueue create/update.
- external_only: remote diverged (possible manual change) – investigate / pull back.
- both_changed: conflict – may need merge or operator action.
- snapshot_stale: bookkeeping issue (snapshot missing/misaligned).

Stored rows: `ebay_drift_event` capturing hashes + limited diff path samples (capped to 10KB). Older rows are purged by a retention job.

Retention:
- Enabled with `EBAY_DRIFT_RETENTION_ENABLED=true`.
- Days window configurable via `EBAY_DRIFT_RETENTION_DAYS` (default 30).
- Scheduled daily; manual trigger available via POST /admin/ebay/drift-events/retention/run (optionally body `{ "retentionDays": 14 }`).

Example (PowerShell) manual trigger:
```
curl -H "X-Admin-Auth: $env:EBAY_ADMIN_API_KEY" -X POST http://localhost:5000/admin/ebay/drift-events/retention/run -H "Content-Type: application/json" -d '{"retentionDays":14}'
```

Filtering drift events:
```
curl -H "X-Admin-Auth: $env:EBAY_ADMIN_API_KEY" "http://localhost:5000/admin/ebay/drift-events?classification=external_only&fromMs=$(Get-Date (Get-Date).AddDays(-1) -UFormat %s)000&limit=20"
```

Pagination response shape:
```
{
   items: [...],
   pagination: { limit, offset, count, total }
}
```

Environment variables (new additions):
| Variable | Purpose | Default |
|----------|---------|---------|
| EBAY_DRIFT_RETENTION_ENABLED | Enable scheduled drift retention | false |
| EBAY_DRIFT_RETENTION_DAYS | Days to keep drift events | 30 |
| EBAY_ADAPTER_FAIL_ONCE_IDS | Comma list of itemIds that fail once with transient error then succeed | (empty) |
| EBAY_ADAPTER_ALWAYS_FAIL_IDS | Comma list of itemIds that always fail (permanent) | (empty) |
| EBAY_ADAPTER_MAX_RETRIES | Max retries for transient adapter errors | 2 |
| EBAY_ADAPTER_LATENCY_MS | Fixed latency (ms) added to each adapter success | 0 |
| EBAY_ADAPTER_JITTER_MS | Random 0..N ms added latency per call | 0 |
| EBAY_RATE_LIMIT_BUCKET_MAX | Max tokens in adapter call bucket | 50 |
| EBAY_RATE_LIMIT_REFILL_INTERVAL_MS | Refill interval in ms | 1000 |
| EBAY_RATE_LIMIT_REFILL_AMOUNT | Tokens added each interval | 50 |
| EBAY_ADAPTER_CB_CONSECUTIVE_FAILS | Consecutive permanent failures to open circuit | 10 |
| EBAY_ADAPTER_CB_COOLDOWN_MS | Cooldown before half-open probe | 30000 |
| EBAY_ADAPTER_MODE | Adapter mode: sim or http | sim |
| EBAY_API_BASE_URL | Base URL for real eBay API (when http mode) | https://api.ebay.com |
| EBAY_OAUTH_TOKEN | OAuth token for real eBay API calls | (unset) |
| EBAY_HTTP_TIMEOUT_MS | HTTP client timeout ms | 8000 |
| EBAY_OAUTH_CLIENT_ID | OAuth client id (dynamic token mode) | (unset) |
| EBAY_OAUTH_CLIENT_SECRET | OAuth client secret | (unset) |
| EBAY_OAUTH_REFRESH_TOKEN | Refresh token (if using refresh_token grant) | (unset) |
| EBAY_OAUTH_SCOPE | Space-delimited scopes | (unset) |
| EBAY_OAUTH_TOKEN_URL | OAuth token endpoint | https://api.ebay.com/identity/v1/oauth2/token |
| EBAY_OAUTH_REFRESH_SAFETY_MS | Pre-expiry refresh window ms | 60000 |
| EBAY_OAUTH_FORCE_REFRESH_EACH | Force refresh every access (test) | false |
| EBAY_OAUTH_REFRESH_MAX_RETRIES | Max retry attempts for a single token refresh | 3 |
| EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES | Threshold to mark oauth degraded | 5 |
| EBAY_HTTP_AUTH_FAILURE_RATIO_ALERT | Float (e.g. 0.15). If > 0, warns & counts when auth_failure_ratio exceeds | (unset / 0) |
| EBAY_HTTP_AUTH_FAILURE_RATIO_EMA_ALPHA | Smoothing alpha for EMA auth failure ratio | 0.2 |
| EBAY_HTTP_AUTH_FAILURE_RATIO_LOG_COOLDOWN_MS | Cooldown between auth ratio threshold logs | 60000 |
| EBAY_OAUTH_DEGRADED_LOG_COOLDOWN_MS | Cooldown between oauth_degraded_enter logs | 60000 |
| READINESS_DB_CHECK_INTERVAL_MS | Min ms between DB readiness probes | 10000 |
| READINESS_DB_CHECK_TIMEOUT_MS | Timeout ms for DB readiness probe | 1500 |
| EBAY_QUEUE_BACKLOG_READY_THRESHOLD | Pending queue depth that triggers readiness failure (0=disabled) | 0 |
| (implicit metrics) db.reachable / queue.backlog_exceeded | Emitted automatically; use for alerting | n/a |
| READINESS_FLAP_WINDOW_MS | Sliding window (ms) used internally to bound flapping history (future usage) | 600000 |
| READINESS_FLAP_TRANSITIONS_WARN | Transition count in window that triggers flapping warn alert | 6 |
| READINESS_FLAP_TRANSITIONS_PAGE | Transition count in window that triggers flapping page alert | 12 |
| QUEUE_OLDEST_AGE_WARN_MS | Warn alert when queue.oldest_pending_age_ms >= value (0 disables) | 0 |
| QUEUE_OLDEST_AGE_PAGE_MS | Page alert when queue.oldest_pending_age_ms >= value (0 disables) | 0 |
| QUEUE_ITEM_WAIT_MAX_WARN_MS | Warn alert when queue.max_item_wait_ms >= value (0 disables) | 0 |
| QUEUE_ITEM_WAIT_MAX_PAGE_MS | Page alert when queue.max_item_wait_ms >= value (0 disables) | 0 |
| QUEUE_ITEM_WAIT_P99_WARN_MS | Warn alert when p99 of queue.item_wait_ms >= value (0 disables) | 0 |
| QUEUE_ITEM_WAIT_P99_PAGE_MS | Page alert when p99 of queue.item_wait_ms >= value (0 disables) | 0 |
| EBAY_ALERT_HISTORY_LIMIT | Max in-memory stored alert entries (process lifetime) | 500 |
| EBAY_ALERT_HISTORY_PERSIST | If '1', persist alert history to table `ebay_alert_history` (enables DB pagination & NDJSON export) | 0 |
| QUEUE_MAX_WAIT_DECAY_WINDOW_MS | If >0, when no higher max wait observed for this many ms, apply decay mode to `queue.max_item_wait_ms` | 0 |
| QUEUE_MAX_WAIT_DECAY_MODE | One of `reset`, `halve`, `hold` applied when decay window elapses | reset |
| QUEUE_ITEM_WAIT_BUCKETS | Comma list overriding default histogram buckets for `queue.item_wait_ms` | (preset sequence) |
| QUEUE_BURN_P99_MS | p99 wait (ms) threshold participating in composite saturation (burn) alert | 0 |
| QUEUE_BURN_BACKLOG_DEPTH | Pending depth threshold for composite burn alert | 0 |
| QUEUE_BURN_P99_PAGE_MS | Optional higher p99 threshold that escalates composite burn severity to `page` | 0 |
| EBAY_ALERT_HISTORY_RETENTION_DAYS | If set (>0) prune persisted alert rows older than N days (opportunistic + manual) | (unset) |
| EBAY_ALERT_HISTORY_RETENTION_ENABLED | If 'true', run daily scheduled prune (uses EBAY_ALERT_HISTORY_RETENTION_DAYS) | false |
| EBAY_ALERT_HISTORY_RETENTION_INTERVAL_MS | Override interval for scheduled prune (testing/tuning) | 86400000 |
| EBAY_ALERT_HISTORY_RETENTION_INITIAL_DELAY_MS | Override initial delay before first prune | 45000 |
| EBAY_DRIFT_RETENTION_INTERVAL_MS | Override drift retention interval | 86400000 |
| EBAY_DRIFT_RETENTION_INITIAL_DELAY_MS | Override initial delay for first drift retention run | 30000 |
| ALLOW_SCHEDULERS_UNDER_TEST | If 'true', enables schedulers during tests for timing-based tests | false |
| QUEUE_WAIT_SAMPLES_CAP | Max in-memory wait latency samples retained for burn-rate calculation | 2000 |
| EBAY_ALERT_SUPPRESS_GLOBAL_MS | Global suppression window (ms) for duplicate alerts (same key+severity). 0 disables. | 0 |
| EBAY_ALERT_SUPPRESS_<KEY>_MS | Per-alert override suppression window (KEY uppercased, non-alphanumerics -> '_'). | (unset) |
QUEUE_BURN_WINDOW_MS=600000     # Sliding window size for latency burn-rate samples (default 10m) 
QUEUE_BURN_HIGH_MS=2000         # High-latency threshold counted as 'burning' sample
QUEUE_BURN_WARN_RATIO=0.3       # Warn when high-latency sample ratio over window >= this
QUEUE_BURN_PAGE_RATIO=0.6       # Page when high-latency sample ratio over window >= this
QUEUE_WAIT_SAMPLES_CAP=2000     # (optional) Cap for queue.wait_samples_size & burn window sample retention

Implementation notes:
- details_json is truncated if serialized size exceeds ~10KB (flagged with `truncated:true`).
- Retention metric increments only when rows actually deleted.
- Time-range filtering uses epoch millis (fromMs / toMs) for precision & simplicity.

### Security
When `EBAY_ADMIN_API_KEY` is set, any missing or mismatched `X-Admin-Auth` header yields HTTP 401. Leave the variable unset for unsecured local exploration (NOT recommended for shared environments).

### CSV Export Notes
CSV responses are generated on demand. For very large datasets consider adding pagination plus streaming with a cursor or time-sliced export (future enhancement). Current implementation redacts sensitive fields prior to serialization.

### Roadmap (Next Enhancements)
- Graceful shutdown orchestration (stop schedulers & drain queues).
- Circuit breaker / adaptive backoff for external publish failures.
- Integrity issue persistence table for recurring anomalies.
- Fine-grained policy-to-listing mapping to narrow impact scope.

---

## Data Model Overview


**Catalog**: The master list of all products ever tracked, regardless of whether they were ever listed on eBay. This table grows over time and serves as a historical record of all products.

**Listing**: Tracks all eBay listings, past or present, regardless of their status (active, sold, ended, etc.). Each entry corresponds to an eBay listing. Not every catalog item must have a corresponding Listing, but every Listing should reference a product in the Catalog.

**HistoryLogs**: Records all changes to tracked entities (such as Listing, Customer, etc.) for auditing purposes. Each log entry includes the entity name, entity ID, action performed, details of the change, the user (by Ownership ID) who made the change, and the timestamp. This ensures all changes are auditable and attributable to a specific user.

## Features
- **Backend**: Built with Node.js and Express, providing RESTful APIs for managing sales, catalog, listings, and ownership.
- **Frontend**: Developed with React, offering a user-friendly interface for catalog management, sales tracking, and product research.
- **Database**: Uses PostgreSQL for storing sales, catalog, and listing data.
- **Dockerized**: Fully containerized setup for easy deployment and development.
- **Swagger Documentation**: API documentation available at `/api-docs`. See also `docs/ebay_admin_endpoints.md` for ingestion & mapping examples.

## Project Structure
```
backend/
  Dockerfile
  package.json
  src/
    app.js
    controllers/
    models/
    routes/
    templates/
frontend/
  Dockerfile
  package.json
  src/
    App.js
    components/
    context/
    services/
database/
  migrations/
  seeds/
scripts/
  docker_build.bat
  build_ui.bat
  npm_cleanup_and_install.bat
```

## Prerequisites
- **Node.js**: v16 or higher
- **Docker**: Installed and running
- **PostgreSQL**: Provided via Docker Compose (default).

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ListFlowHQ
   ```

2. Install dependencies:
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

3. Start the application using Docker:
   ```bash
   .\scripts\docker_build.bat
   ```

4. Access the application:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000)

## Build Instructions

### Official Build Policy (Enforced)
ONLY the following batch scripts constitute an official build artifact:
1. Full stack (backend + DB migrations + tests + seeding + swagger): `backend\scripts\run_build.bat`
2. Frontend/UI only (rebuild + restart UI container): `scripts\build_ui.bat`

Anything else (e.g. `npm run build`, ad-hoc Node scripts, direct docker compose commands) is for local development convenience ONLY and is NOT an official build. This policy prevents drift between documented SOP and produced artifacts.

If additional automation is desired (CI/CD), it must invoke the batch scripts directly, not intermediate npm aliases.

### Standard Operating Procedure (SOP)
To build the project, follow these steps:

#### Backend/Database Build (includes migrations, API tests, and seeding)
1. Navigate to the `backend/scripts` directory.
2. Run the `run_build.bat` script:
   ```
   backend\scripts\run_build.bat
   ```
3. After the script completes, verify the `build.log` file for any errors or warnings.
4. Ensure all containers are healthy and the database is seeded successfully (if enabled).
5. Test the application to confirm functionality.

### Lean Build Practices
To keep the pipeline simple and fast:
- Deterministic installs: backend build uses `npm ci` when `package-lock.json` is present for reproducible dependency trees.
- Skip reinstall when unchanged: set environment variable `SKIP_NPM_INSTALL=true` before running the build script to reuse existing `node_modules` during rapid local iterations.
- Forbidden dependency guard: `npm run verify:deps` fails if deprecated stacks (e.g., MongoDB libraries) reappear.
- Single source of truth: Commit both `package.json` and `package-lock.json` after dependency changes; avoid manual edits to the lockfile.
- Fast feedback: Run targeted tests with `npm run test:ebay` to validate integration subsystem changes without the full suite.

Minimal everyday cycle:
```
cd backend
set SKIP_NPM_INSTALL=true
node scripts/build.js
```
Unset `SKIP_NPM_INSTALL` (or omit it) when dependencies change to force a clean `npm ci`.

### Operational Runtime Enhancements

Recent ops-focused additions (August 2025):
- Graceful shutdown: On SIGINT/SIGTERM the server stops accepting new connections, halts eBay schedulers, and closes the PostgreSQL pool (15s fail-safe timeout).
- Health endpoint (`/api/health`): Now returns `{ status, uptimeSeconds, build: { version, commit, node } }` for lightweight liveness + traceability. Override with environment variables `APP_VERSION` and `GIT_COMMIT` (or `SOURCE_VERSION`).
- Minimal global rejection logging: Unhandled promise rejections are logged to aid post-mortem analysis.


**Note:**
- The backend/database build and the frontend build are now independent. Use the appropriate script for each (see below).
- API tests and database seeding are both controlled by configuration flags in `backend/build.json` (see below). The Node.js build script handles these steps and logs the results in `backend/scripts/build.log`.
- API test results are written to `logs/API-Test-Results.txt`.
- The build will fail if any test fails or if any test suite is empty.
- The `run_build.bat` script in `backend/scripts` is the official and only supported backend build script.
- Any other build scripts or folders (e.g., `build/scripts`) are deprecated and should not be used.

#### Frontend (UI) Build Only
To rebuild and restart the frontend (UI only), without affecting the backend or database:
1. Make your code changes in `frontend/src/` or `frontend/public/`.
2. Run the UI build script:
   ```
   scripts\build_ui.bat
   ```
   This will rebuild the frontend Docker image and restart only the frontend container. Backend and database are untouched.
3. Visit [http://localhost:3000](http://localhost:3000) to view the production build.

## Build Configuration Flags

The following flags in `backend/build.json` control build-time testing and seeding:

```
  "runApiTests": true,
  "testdata": true
```
- If `runApiTests` is `true`, API tests are executed automatically during the build and results are saved to `logs/API-Test-Results.txt`. If `false`, API tests are skipped.
- If `testdata` is `true`, the database is truncated and seeded with test data after API tests complete. If `false`, seeding is skipped.

**Important:**
- As of June 2025, database seeding now occurs *after* API tests. This ensures the database is always left in a known, seeded state for development after the build completes.
- You can change these flags to enable or disable API test execution and database seeding as needed. All actions and their results are logged in `backend/scripts/build.log`.

## API Test Configuration

The execution of backend API tests during the build is controlled by the `runApiTests` flag in `backend/build.json`:

```
  "runApiTests": true
```
- If `true`, API tests are executed automatically during the build and results are saved to `logs/API-Test-Results.txt`. If `false`, API tests are skipped.

You can change this flag to enable or disable API test execution as needed.

## Instrumentation and Diagnostics

As of May 2025, all backend, database, and frontend instrumentation, diagnostics, and test code should be placed in dedicated helpers:
- `backend/src/utils/backendInstrumentation.js` (backend/database)
- `frontend/src/frontendInstrumentation.js` (frontend)

This keeps the production codebase clean and makes it easy to enable/disable diagnostics as needed. See the helpers for usage examples.

For details on past issues and resolutions, see `logs/backend_docker_debugging_notes.md` and `logs/mount-issue.log`.

## Troubleshooting: Database Connection Issues (June 2025)

### Problem
After refactoring the build and separating frontend/backend processes, repeated database connection errors (`ETIMEDOUT` and `ENOTFOUND`) occurred during the official build process. The backend build script was unable to connect to the database, causing the build to fail.

### Root Cause
- The database host was set to a static IP (`192.168.0.220`) in `backend/build.json` and related configs. This worked only in a specific network setup.
- When the host was changed to `postgres_db` (the Docker Compose service name), the build script failed with `ENOTFOUND postgres_db` when run from the Windows host, because `postgres_db` is only resolvable inside Docker containers.
- The build script was not distinguishing between running on the host (should use `localhost`) and running in a container (should use `postgres_db`).

### Solution
- Set the database host in `backend/build.json` to `localhost` for host-based scripts.
- In Docker Compose, set `PG_HOST=postgres_db` for backend containers.
- In backend code, use the environment variable if set (`process.env.PG_HOST`), otherwise fall back to the config file value. This ensures the correct host is used in all environments.

### Prevention
- Always use `localhost` for host-based scripts and the Docker Compose service name for container-to-container communication.
- Avoid hardcoding static IPs for Docker services unless absolutely necessary.
- Document the expected environment for each config value and ensure scripts are environment-aware.

## Contributing
1. Fork the repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Description of changes"
   ```
4. Push to your branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request.

## License
This project is licensed under the MIT License.

---

## August 2025 Enhancements Summary

The following operations-focused capabilities were added this month:

1. Alert History Persistence (opt-in): Set `EBAY_ALERT_HISTORY_PERSIST=1` to persist emitted alerts (`/admin/ebay/metrics/alerts`) into PostgreSQL table `ebay_alert_history` with query (`/admin/ebay/metrics/alert-history?source=db`) and NDJSON export (`/admin/ebay/metrics/alert-history.ndjson`). In-memory ring buffer still active (bounded by `EBAY_ALERT_HISTORY_LIMIT`).
2. Queue Max Wait Decay: Prevent stale `queue.max_item_wait_ms` spikes from lingering indefinitely. Configure `QUEUE_MAX_WAIT_DECAY_WINDOW_MS` and choose `QUEUE_MAX_WAIT_DECAY_MODE` (`reset`, `halve`, `hold`). Observability via gauges: `queue.max_item_wait_decayed` (binary) and timestamp `queue.max_item_wait_last_decay`.
3. Histogram Bucket Override: Customize latency resolution for `queue.item_wait_ms` using `QUEUE_ITEM_WAIT_BUCKETS` (comma-separated ms values). Enables tighter percentile accuracy within target SLO bands.
4. Composite Burn Alert: `queue_latency_backlog_burn` fires only when BOTH tail latency (p99 >= `QUEUE_BURN_P99_MS`) and backlog depth (>= `QUEUE_BURN_BACKLOG_DEPTH`) indicate sustained saturation. Optional escalation to page severity if p99 >= `QUEUE_BURN_P99_PAGE_MS`.
5. Additional Percentile Alert: `queue_item_wait_p99` derived from histogram percentiles with independent warn/page thresholds (`QUEUE_ITEM_WAIT_P99_WARN_MS`, `QUEUE_ITEM_WAIT_P99_PAGE_MS`).

### Alert History Retention (Experimental)
Set `EBAY_ALERT_HISTORY_RETENTION_DAYS` to enable pruning of old persisted alert rows. Pruning occurs:
- Opportunistically when new alerts are recorded.
- On demand via `POST /admin/ebay/metrics/alert-history/retention/run`.

Metrics:
- `alert_history.retention_deleted` counter increments by number of rows deleted.

Notes:
- No scheduled daily job yet (keeps implementation simple); can be added later similar to drift retention scheduler.
- NDJSON export always streams full remaining set post-prune.

Usage Tips:
- Start with WARN thresholds for new signals; observe 1-2 weeks before enabling PAGE severities.
- Composite burn alert reduces noisy pages from transient latency bumps without backlog growth.
- Decay window should exceed your typical diurnal quiet period between bursts; if uncertain, begin with 30m (1800000 ms) in test before production.

Planned Follow-Ups:
- Configurable retention / pruning for persisted alert history (age or max rows).
- Sliding burn rate style evaluation (multi-window error/latency ratios) for more nuanced alerting.
- Export tooling: time-sliced alert history export for large datasets.

## eBay Integration Gap Assessment & Priority Roadmap (Focused Delivery)

Mission Focus: Achieve an end-to-end reliable listing sync loop (projection -> queue -> publish -> snapshot -> reconciliation) with minimal viable real eBay adapter and durable history before adding further peripheral optimizations.

Current Implemented (relevant to core loop):
- Change queue + worker (single-process) with wait/latency metrics.
- Projection hashing & idempotent skip semantics.
- Basic publish mock + success/failure counters.
- Rich observability & alert lifecycle (suppression, clearing, burn-rate, backlog, etc.).

Key Gaps Blocking Core Mission:
1. Real eBay Adapter Integration
    - Missing HTTP mode, error taxonomy, retry classification, token handling.
2. Snapshot & Diff Persistence
    - No implemented `ebay_listing_snapshot` table usage; diff & hash dedup logic absent.
3. Reconciliation Job
    - No scheduled pull of external state to detect drift & enqueue corrective actions.
4. Policy Cache Layer
    - No TTL fetch/storage for policies (shipping/return/fulfillment) impacting projection.
5. Multi-Worker Safe Concurrency
    - Lacks DB-level locking (e.g., SELECT ... FOR UPDATE SKIP LOCKED) / queue visibility timeout.
6. Secure Token Storage
    - No encrypted token persistence or refresh workflow; only simulated auth metrics.
7. End-to-End Tests (E2E)
    - Missing integrated tests covering projection → enqueue → publish → snapshot → reconciliation cycle.

Secondary (Can Wait Until After 1–7):
- Multi-window SLO burn & error budget metrics (current single-window good enough short term).
- Policy impact cascade & targeted requeue logic.
- UI panels for snapshots & drift browsing.
- Persistent suppression state across restarts.
- Config consolidation (env validation service / dynamic reload).

Immediate Priority Execution Plan (Sequenced):
P1: Migrations & Snapshot Table
   - Create/verify `ebay_listing_snapshot` schema (hash, diff, dedup ref, source_event). Add model & write path in worker on successful publish.
P2: Real Adapter (Sim → HTTP toggle)
   - Implement adapter with retry/backoff taxonomy, latency & classification metrics; feature flag to stay off by default.
P3: Snapshot Diff & Dedup
   - Canonical serialization + structural diff (omit unchanged branches) + dedup referencing previous snapshot.
P4: Reconciliation Job
   - Scheduled task (flag-controlled) pulling changed external listings, producing drift classification + enqueue corrective update + snapshot.
P5: Policy Cache
   - Fetch + cache with expires_at; invalidation triggers requeue of impacted listings (bounded batch).
P6: Queue Concurrency Hardening
   - Introduce DB locking query; instrumentation for lock wait & active worker count.
P7: Token Storage & Refresh
   - Secure storage abstraction (in-memory fallback), refresh scheduler, degraded state integration (existing oauth_degraded alert ready).
P8: E2E Test Suite
   - Minimum: create listing → projection hash differs → queue item processed → snapshot written → reconciliation sees no drift.

Definition of "Core Loop Complete": P1–P4 implemented & passing E2E tests with snapshots + drift detection.

Status Snapshot (Aug 20 2025):
- Core Loop Completion Progress: 0% (snapshots not persisted) → Target next sprint.
- Observability/Alerting: 90% (sufficient for initial production pilot).
- Risk to Mission if Deferred: External state divergence undetected; lack of historical payload lineage; inability to tune projections via drift feedback.

Next Action (proposed): Start P1 – add snapshot table model & write path plus minimal unit test.