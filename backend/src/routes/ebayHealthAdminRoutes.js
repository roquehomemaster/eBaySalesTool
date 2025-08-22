const express = require('express');
const router = express.Router();
let metrics; try { metrics = require('../integration/ebay/metrics'); } catch(_) { /* optional */ }
let models; try { models = require('../../models/ebayIntegrationModels'); } catch(_) { /* optional */ }
let rateLimiter; try { rateLimiter = require('../integration/ebay/rateLimiter'); } catch(_) { /* optional */ }
let circuitBreaker; try { circuitBreaker = require('../integration/ebay/circuitBreaker'); } catch(_) { /* optional */ }
let tokenManager; try { tokenManager = require('../integration/ebay/tokenManager'); } catch(_) { /* optional */ }
const featureFlags = [
  'EBAY_QUEUE_ENABLED','EBAY_SNAPSHOTS_ENABLED','EBAY_PUBLISH_ENABLED','EBAY_RECON_ENABLED',
  'EBAY_RECON_SNAPSHOT_ON_DRIFT','EBAY_POLICY_ENABLED','EBAY_POLICY_IMPACT_ENABLED','EBAY_AUDIT_ENABLED'
];

router.get('/health', async (req,res) => {
  const ff = {}; featureFlags.forEach(k => { ff[k] = process.env[k] === 'true'; });
  const snap = metrics ? metrics.snapshot() : null;
  let ebaySummary = null;
  if (snap) {
    const tsNow = Date.now();
    const t = snap.timestamps || {};
    function age(name){ return t[name] ? tsNow - t[name] : null; }
    let deadCounts = { dead_queue_count: null, failed_event_count: null };
    if (models) {
      try {
        const [deadQ, failedE] = await Promise.all([
          models.EbayChangeQueue.count({ where:{ status:'dead' } }),
          models.EbayFailedEvent ? models.EbayFailedEvent.count() : Promise.resolve(null)
        ]);
        deadCounts.dead_queue_count = deadQ;
        deadCounts.failed_event_count = failedE;
      } catch(_) { /* ignore counting errors */ }
    }
    const idemp = {
      enqueue_skipped_duplicate: snap.counters['queue.enqueue_skipped_duplicate'] || 0,
      publish_idempotent_skip: snap.counters['publish.idempotent_skip'] || 0
    };
    const throttling = {
      recon_skipped: snap.counters['recon.skipped_rate_throttle'] || 0,
      audit_skipped: snap.counters['audit.skipped_rate_throttle'] || 0,
      near_depletion: rateLimiter ? rateLimiter.nearDepletion() : null
    };
  const driftCounts = Object.fromEntries(Object.entries(snap.counters || {}).filter(([k]) => k.startsWith('recon.drift_')).map(([k,v]) => [k.replace('recon.drift_',''), v]));
  const retentionDeleted = snap.counters['drift.retention_deleted'] || 0;
    ebaySummary = {
      queue_depth: snap.gauges.queue_pending_depth || snap.gauges['queue.pending_depth'] || 0,
      last_publish_success_age_ms: age('publish.last_success'),
      last_publish_error_age_ms: age('publish.last_error'),
      reconciliation: { last_run_age_ms: age('recon.last_run') },
      audit: { last_run_age_ms: age('audit.last_run') },
  dead_letters: deadCounts,
  rate: rateLimiter ? { near_depletion: rateLimiter.nearDepletion() } : null,
  circuitBreaker: circuitBreaker ? circuitBreaker.status() : null,
  idempotency: idemp,
  throttling,
  drift: { classifications: driftCounts, retention_deleted: retentionDeleted },
  ingestion: {
    transient_errors: snap.counters['ingest.transient_errors'] || 0,
    permanent_errors: snap.counters['ingest.permanent_errors'] || 0,
    retries: snap.counters['ingest.retries'] || 0
  },
  adapter: (() => {
    const h = snap.histograms && snap.histograms['adapter.get_item_detail_ms'];
  const base = { calls: snap.counters['adapter.get_item_detail.calls'] || 0, transient_failures: snap.counters['adapter.transient_failures'] || 0, permanent_failures: snap.counters['adapter.permanent_failures'] || 0 };
  return h ? { ...base, latency_ms: h.percentiles } : base;
  })()
  , mapping: (() => {
    const h = snap.histograms && snap.histograms['map.run_duration_ms'];
    return {
      runs: snap.counters['map.runs'] || 0,
      processed: snap.counters['map.processed'] || 0,
      mapped: snap.counters['map.mapped'] || 0,
      errors: snap.counters['map.errors'] || 0,
      last_run_age_ms: (snap.timestamps && snap.timestamps['map.last_run']) ? (Date.now() - snap.timestamps['map.last_run']) : null,
      duration_ms: h ? h.percentiles : undefined
    };
  })()
  , oauth: (() => {
    if (!tokenManager) { return null; }
    const ts = tokenManager.snapshot();
    return {
      has_token: !!ts.accessToken,
      expires_in_ms: ts.expiresAt ? (ts.expiresAt - Date.now()) : null,
      last_refresh_success_age_ms: ts.lastRefreshSuccess ? (Date.now() - ts.lastRefreshSuccess) : null,
      last_refresh_error_age_ms: ts.lastRefreshError ? (Date.now() - ts.lastRefreshError) : null,
  last_error: ts.lastErrorMessage,
  consecutive_failures: ts.consecutiveFailures,
  degraded: ts.degraded,
  degraded_duration_ms: (ts.degraded && ts.lastDegradedAt) ? (Date.now() - ts.lastDegradedAt) : null,
  last_degraded_at: ts.lastDegradedAt,
  last_recovered_at: ts.lastRecoveredAt
    };
  })()
    };
  }
  res.json({ featureFlags: ff, metrics: snap, summary: ebaySummary });
});

module.exports = router;
