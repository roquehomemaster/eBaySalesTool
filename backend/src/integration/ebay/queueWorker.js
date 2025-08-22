/**
 * queueWorker.js
 * Minimal mock queue processor (Phase 1).
 * Pulls a single pending change from ebay_change_queue, marks processing, then complete.
 * Future phases: build payload, call eBay adapter, snapshot, retry logic, error handling.
 */
const { EbayChangeQueue, EbayListing, EbaySyncLog, EbayFailedEvent } = require('../../../models/ebayIntegrationModels');
// Allow tests to inject a lightweight stand-in for EbayChangeQueue to avoid Sequelize
function getQueueModel(){ return global.__TEST_EBAY_QUEUE_MODEL__ || EbayChangeQueue; }
let metrics; try { metrics = require('./metrics'); } catch(_) { /* optional */ }
let snapshotService; try { snapshotService = require('./snapshotService'); } catch(_) { /* optional */ }
const { buildProjection } = require('./projectionBuilder');
let adapter; try { adapter = require('./adapter'); } catch(_) { /* optional */ }
function snapshotsFlag(){ return process.env.EBAY_SNAPSHOTS_ENABLED === 'true'; }
function publishEnabled(){ return process.env.EBAY_PUBLISH_ENABLED === 'true'; }
function now(){ return new Date(); }
function computeBackoffSeconds(attempts){ return Math.min(300, Math.pow(2, Math.min(attempts, 6))); }
function maxAttempts(){ return parseInt(process.env.EBAY_PUBLISH_MAX_ATTEMPTS || '6', 10); }
const crypto = require('crypto');
function hashAttempt(base){ return crypto.createHash('sha256').update(base).digest('hex'); }

/**
 * Process exactly one pending queue item (ordered by priority then created_at) and finalize it.
 * @returns {Promise<object>} result summary
 */
async function runOnce() {
  const QueueModel = getQueueModel();
  // Optional decay of stale max item wait metric
  if (metrics) {
    try {
      const decayWindow = parseInt(process.env.QUEUE_MAX_WAIT_DECAY_WINDOW_MS || '0', 10);
      if (decayWindow > 0) {
        const lastUpdateTs = metrics._internal_state.queue_max_item_wait_last_update_ts;
        const nowTs = Date.now();
        if (lastUpdateTs && (nowTs - lastUpdateTs) > decayWindow) {
          const mode = (process.env.QUEUE_MAX_WAIT_DECAY_MODE || 'reset').toLowerCase();
          const currentMax = metrics._internal_state.queue_max_item_wait_ms || 0;
          if (currentMax > 0) {
            let newVal = 0;
            if (mode === 'halve') {
              newVal = Math.floor(currentMax / 2);
            } else if (mode === 'hold') {
              newVal = currentMax; // no change, but mark stale (mainly for experimentation)
            } else { // reset
              newVal = 0;
            }
            metrics._internal_state.queue_max_item_wait_ms = newVal;
            metrics.setGauge('queue.max_item_wait_ms', newVal);
            metrics.setGauge('queue.max_item_wait_decayed', 1);
            try { metrics.mark('queue.max_item_wait_last_decay'); } catch(_) { /* ignore */ }
          }
        } else {
          // Clear stale indicator each run if not decaying
          metrics.setGauge('queue.max_item_wait_decayed', 0);
        }
      }
    } catch(_) { /* ignore */ }
  }
  const item = await QueueModel.findOne({
    where: { status: 'pending' },
    order: [ ['priority', 'ASC'], ['created_at', 'ASC'] ]
  });
    // Oldest pending age gauge (approx using fetched ordered item)
    if (metrics) {
      try {
        if (item && item.created_at) {
          const age = Date.now() - new Date(item.created_at).getTime();
          metrics.setGauge('queue.oldest_pending_age_ms', age >= 0 ? age : 0);
        } else {
          metrics.setGauge('queue.oldest_pending_age_ms', 0);
        }
      } catch(_) { /* ignore */ }
    }
    if (metrics) {
      try {
  const depth = await QueueModel.count({ where:{ status:'pending' } });
        metrics.setGauge('queue.pending_depth', depth);
        const threshold = parseInt(process.env.EBAY_QUEUE_BACKLOG_READY_THRESHOLD || '0', 10);
        if (threshold > 0) {
          if (depth >= threshold) {
            metrics.setGauge('queue.backlog_exceeded', 1);
            metrics.mark('queue.backlog_last_exceeded');
          } else {
            metrics.setGauge('queue.backlog_exceeded', 0);
          }
        }
      } catch(_) { /* ignore */ }
    }
    if (!item) {
  if (metrics) { metrics.inc('queue.idle_checks'); metrics.mark('queue.last_idle'); }
      return { processed: false, reason: 'empty' };
    }
  // Mark processing
  await item.update({ status: 'processing', last_attempt_at: new Date(), attempts: item.attempts + 1 });
  if (metrics) { metrics.inc('queue.dequeue'); metrics.mark('queue.last_process_start'); }
  if (metrics && item && item.created_at) {
    try {
      const waitMs = Date.now() - new Date(item.created_at).getTime();
      if (waitMs >= 0) {
        metrics.observe('queue.item_wait_ms', waitMs);
        metrics.setGauge('queue.last_item_wait_ms', waitMs);
        try {
          // Maintain bounded recent wait samples for sliding-window burn-rate evaluation
          const cap = parseInt(process.env.QUEUE_WAIT_SAMPLES_CAP || '2000', 10);
          const arr = metrics._internal_state.queue_item_wait_samples || (metrics._internal_state.queue_item_wait_samples = []);
          arr.push({ ts: Date.now(), wait: waitMs });
          if (arr.length > cap) { arr.splice(0, arr.length - cap); }
          try { metrics.setGauge('queue.wait_samples_cap', cap); } catch(_) { /* ignore */ }
        } catch(_) { /* ignore */ }
        const snapMax = metrics._internal_state.queue_max_item_wait_ms || 0;
        if (waitMs > snapMax) {
          metrics._internal_state.queue_max_item_wait_ms = waitMs;
          metrics._internal_state.queue_max_item_wait_last_update_ts = Date.now();
          metrics.setGauge('queue.max_item_wait_ms', waitMs);
          try { metrics.mark('queue.max_item_wait_last_update'); } catch(_) { /* ignore */ }
          try { metrics.inc('queue.max_item_wait_update'); } catch(_) { /* ignore */ }
          try {
            const logger = require('../../../utils/logger');
            logger.warn(JSON.stringify({ event: 'queue_wait_max_update', waitMs, previousMaxMs: snapMax, ts: Date.now() }));
          } catch(_) { /* logging optional */ }
        }
      }
    } catch(_) { /* ignore */ }
  }
  // (Mock publish) Simply mark listing lifecycle_state if create intent
  try {
    const listing = await EbayListing.findOne({ where: { ebay_listing_id: item.ebay_listing_id } });
    if (!listing) {
      await item.update({ status: 'error', error_reason: 'listing_missing' });
      return { processed: true, queue_id: item.queue_id, intent: item.intent, status: 'error' };
    }
    const { projection, projection_hash } = await buildProjection(listing.internal_listing_id);
    // If the listing already has this projection hash published, mark complete without external call (idempotent)
    if (listing.last_publish_hash && listing.last_publish_hash === projection_hash) {
      await item.update({ status: 'complete', error_reason: null });
      if (metrics) { metrics.inc('publish.idempotent_skip'); }
      return { processed: true, queue_id: item.queue_id, intent: item.intent, status: 'complete', idempotent: true };
    }
    let publishRes = { success: true, revision: null, external_item_id: listing.external_item_id };
    let startedAt = Date.now();
    let attempted = false;
    if (publishEnabled() && adapter) {
      attempted = true;
      if (item.intent === 'create') {
        publishRes = await adapter.createListing(projection);
      } else {
        publishRes = await adapter.updateListing(listing.external_item_id, projection);
      }
    }
  const duration = Date.now() - startedAt;
  if (metrics) { metrics.observe('publish.duration_ms', duration); }
    if (!publishRes.success) {
      const attempts = item.attempts + 1;
  const { classification } = publishRes;
      const errorReason = (publishRes.body && typeof publishRes.body === 'string') ? publishRes.body : (publishRes.body?.message || publishRes.body?.error || 'publish_failed');
      const permanentClasses = new Set(['client_error','forbidden','not_found','conflict','locked']);
      const isPermanent = classification && permanentClasses.has(classification);
      const threshold = isPermanent ? Math.min(2, maxAttempts()) : maxAttempts();
  if (isPermanent && metrics) { metrics.inc('publish.permanent_failure'); }
      if (attempts >= threshold) {
        // Dead-letter
        try { await EbayFailedEvent.create({ ebay_listing_id: item.ebay_listing_id, intent: item.intent, payload_hash: projection_hash, request_payload: projection, last_error: errorReason, attempts, last_attempt_at: new Date() }); } catch(_) { /* ignore */ }
        await item.update({ status: 'dead', attempts, error_reason: errorReason });
        if (metrics) { metrics.inc('publish.dead_letter'); metrics.recordError('publish', new Error(errorReason)); }
        return { processed: true, queue_id: item.queue_id, intent: item.intent, status: 'dead_letter' };
      }
      const next = new Date(Date.now() + computeBackoffSeconds(attempts) * 1000);
      await item.update({ status: 'pending', attempts, error_reason: errorReason, next_earliest_run_at: next });
      if (metrics) { metrics.inc('publish.failure'); metrics.inc('publish.retry_scheduled'); metrics.mark('publish.last_retry'); }
      if (attempted && EbaySyncLog) {
        try {
          await EbaySyncLog.create({
            ebay_listing_id: item.ebay_listing_id,
            operation: item.intent,
            request_payload: projection,
            response_code: publishRes.statusCode,
            response_body: publishRes.body,
            result: 'retry',
            duration_ms: duration,
            attempt_hash: hashAttempt((publishRes.statusCode||'')+':' + projection_hash + ':' + item.attempts)
          });
        } catch(e){ /* logging suppressed */ }
      }
      return { processed: true, queue_id: item.queue_id, intent: item.intent, status: 'retry_scheduled' };
    }
    await listing.update({
      lifecycle_state: listing.lifecycle_state === 'pending' ? 'ready' : listing.lifecycle_state,
      last_publish_hash: projection_hash,
      last_published_at: now(),
      last_known_external_revision: publishRes.revision,
      external_item_id: publishRes.external_item_id || listing.external_item_id
    });
  await item.update({ status: 'complete', error_reason: null });
  if (metrics) { metrics.inc('publish.attempt'); metrics.inc('publish.success'); metrics.mark('publish.last_success'); }
    if (attempted && EbaySyncLog) {
      try {
        await EbaySyncLog.create({
          ebay_listing_id: item.ebay_listing_id,
          operation: item.intent,
          request_payload: projection,
          response_code: publishRes.statusCode,
          response_body: publishRes.body,
          result: 'success',
          duration_ms: duration,
          attempt_hash: hashAttempt((publishRes.statusCode||'')+':' + projection_hash + ':' + item.attempts)
        });
      } catch(e){ /* suppress */ }
    }
  if(snapshotService && snapshotsFlag()){
      try { await snapshotService.snapshotListing(item.ebay_listing_id, 'publish_success'); } catch(e){ /* eslint-disable-next-line no-console */ console.warn('snapshotListing failed:', e.message || e); }
    }
    return { processed: true, queue_id: item.queue_id, intent: item.intent, status: 'complete', published: true };
  } catch (err) {
  await item.update({ status: 'error', error_reason: err.message });
  if (metrics) { metrics.inc('publish.attempt'); metrics.inc('publish.failure'); metrics.recordError('publish', err); }
    return { processed: true, queue_id: item.queue_id, intent: item.intent, status: 'error', error: err.message };
  }
}

if (require.main === module) {
  runOnce().then(r => {
    // eslint-disable-next-line no-console
    console.log('[queueWorker] runOnce result:', r);
    process.exit(0);
  }).catch(e => {
    // eslint-disable-next-line no-console
    console.error('[queueWorker] runOnce failed:', e.message || e);
    process.exit(1);
  });
}

module.exports = { runOnce };
