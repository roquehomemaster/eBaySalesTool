/**
 * ebayAdapter.js
 * Thin abstraction for eBay API calls (currently simulated) to enable
 * retry/backoff logic and future real HTTP integration.
 *
 * Environment variables to influence behavior (for tests / simulation):
 *  EBAY_ADAPTER_LATENCY_MS        Fixed artificial latency per successful call.
 *  EBAY_ADAPTER_JITTER_MS         Additional random 0..JITTER ms latency.
 *  EBAY_ADAPTER_FAIL_ONCE_IDS     Comma list of itemIds that should fail exactly once (transient) then succeed.
 *  EBAY_ADAPTER_ALWAYS_FAIL_IDS   Comma list of itemIds that always fail (permanent error).
 *  EBAY_ADAPTER_MAX_RETRIES       Max retry attempts for transient errors (default 2 -> total attempts 1+retries).
 */

// Parse environment driven sets lazily (mutable for tests resetting process.env between jest runs)
function parseIdSet(envVar){
  const raw = process.env[envVar];
  if (!raw) { return new Set(); }
  return new Set(String(raw).split(',').map(s=>s.trim()).filter(Boolean));
}

let failOnceState = {}; // itemId -> failedOnce boolean

function resetStateForTests(){
  failOnceState = {};
}

class TransientError extends Error { constructor(message){ super(message); this.name = 'TransientError'; this.transient = true; } }
class PermanentError extends Error { constructor(message){ super(message); this.name = 'PermanentError'; this.transient = false; } }

async function simulateNetworkLatency(){
  const base = parseInt(process.env.EBAY_ADAPTER_LATENCY_MS || '0', 10);
  const jitter = parseInt(process.env.EBAY_ADAPTER_JITTER_MS || '0', 10);
  const extra = jitter ? Math.floor(Math.random()*jitter) : 0;
  const total = base + extra;
  if (total > 0) {
    await new Promise(r => setTimeout(r, total));
  }
}

function buildSamplePayload(itemId){
  return {
    ItemID: itemId,
    SKU: 'SKU-' + itemId,
    Title: 'Sample Title #' + itemId,
    PrimaryCategory: { CategoryID: '12345' },
    SellingStatus: { CurrentPrice: { value: (10 + Number(itemId)).toFixed(2), currency: 'USD' }, QuantitySold: 0 },
    ListingStatus: 'Active',
    WatchCount: 2,
    Description: `<p>Description for ${itemId}</p>`
  };
}

let metrics;
try { metrics = require('./metrics'); } catch(_) { /* optional */ }
let httpClient; try { httpClient = require('./ebayHttpClient'); } catch(_) { /* optional */ }
let tokenManager; try { tokenManager = require('./tokenManager'); } catch(_) { /* optional */ }
const ADAPTER_MODE = process.env.EBAY_ADAPTER_MODE || 'sim'; // 'sim' | 'http'

async function getItemDetail(itemId){
  // Simulated behavior with deterministic transient/permanent failures.
  if (ADAPTER_MODE === 'http' && httpClient) {
    const resp = await httpClient.getListing(itemId);
    if (!resp.ok) {
      if (resp.auth) { throw new PermanentError('http_auth_error:' + resp.code); }
      if (resp.transient) { throw new TransientError('http_transient:' + resp.code); }
      throw new PermanentError('http_permanent:' + resp.code);
    }
    // Normalize minimal fields from response (placeholder until real schema decided)
    const body = resp.body || {};
    const normalized = {
      ItemID: itemId,
      SKU: body.sku || body.SKU || body.inventoryItemGroupKey || ('SKU-' + itemId),
      Title: body.product && body.product.title || body.title || ('Title ' + itemId),
      PrimaryCategory: { CategoryID: (body.product && body.product.aspects && body.product.aspects.CategoryID) || 'unknown' },
      SellingStatus: { CurrentPrice: { value: body.price && body.price.value || body.unitPrice && body.unitPrice.value || '0.00', currency: body.price && body.price.currency || body.unitPrice && body.unitPrice.currency || 'USD' }, QuantitySold: body.sold || 0 },
      ListingStatus: body.availability && body.availability.shipToLocationAvailability && body.availability.shipToLocationAvailability.quantity > 0 ? 'Active' : 'Inactive',
      Description: body.product && body.product.description || ''
    };
    if (metrics) { metrics.inc('adapter.http.normalized_success'); }
    return normalized;
  }
  const failOnce = parseIdSet('EBAY_ADAPTER_FAIL_ONCE_IDS');
  const alwaysFail = parseIdSet('EBAY_ADAPTER_ALWAYS_FAIL_IDS');
  if (alwaysFail.has(itemId)) {
    throw new PermanentError('permanent_failure:' + itemId);
  }
  if (failOnce.has(itemId) && !failOnceState[itemId]) {
    failOnceState[itemId] = true; // mark as failed once
    throw new TransientError('transient_failure_once:' + itemId);
  }
  const start = Date.now();
  await simulateNetworkLatency();
  const payload = buildSamplePayload(itemId);
  const dur = Date.now() - start;
  if (metrics) { metrics.observe('adapter.get_item_detail_ms', dur); metrics.inc('adapter.get_item_detail.calls'); }
  return payload;
}

/**
 * Fetch with retry/backoff for transient errors.
 * @param {string} itemId
 * @param {object} opts
 * @param {number} opts.maxRetries (default from EBAY_ADAPTER_MAX_RETRIES or 2)
 * @param {function} opts.onAttempt (attempt, err?) callback
 */
let rateLimiter;
try { rateLimiter = require('./rateLimiter'); } catch(_) { /* optional */ }
let circuitBreaker; try { circuitBreaker = require('./circuitBreaker'); } catch(_) { /* optional */ }

async function fetchWithRetry(itemId, opts = {}){
  const maxRetries = typeof opts.maxRetries === 'number' ? opts.maxRetries : parseInt(process.env.EBAY_ADAPTER_MAX_RETRIES || '2', 10);
  // Pre-flight gate: if OAuth degraded, short-circuit with permanent style error so callers can surface readiness issue
  if (tokenManager) {
    try {
      const snap = tokenManager.snapshot();
      if (snap.degraded) {
        if (metrics) { metrics.inc('adapter.http.oauth_short_circuit'); }
        throw new PermanentError('oauth_degraded');
      }
    } catch(e) { /* ignore snapshot errors */ }
  }
  let attempt = 0; let lastErr;
  // exponential backoff base 50ms with jitter
  while (attempt <= maxRetries) {
    try {
  if (rateLimiter) { await rateLimiter.acquire(); }
      if (circuitBreaker && !circuitBreaker.allowRequest()) {
        throw new PermanentError('circuit_open');
      }
  if (opts.onAttempt) { opts.onAttempt(attempt); }
      const result = await getItemDetail(itemId); // success -> return payload
      if (circuitBreaker) { circuitBreaker.onSuccess(); }
      return result;
    } catch (e) {
      lastErr = e;
  if (opts.onAttempt) { opts.onAttempt(attempt, e); }
      if (metrics) {
        if (e.transient) { metrics.inc('adapter.transient_failures'); } else { metrics.inc('adapter.permanent_failures'); }
        // Track auth errors vs calls for basic ratio (requires http mode classification earlier)
        // We piggyback on counter values; ratio = auth_failures / (http.calls + 1 to avoid div0)
        try {
          const snap = metrics.snapshot();
          const authFails = (snap.counters['adapter.http.auth_failures']||0);
          const httpCalls = (snap.counters['adapter.http.calls']||0) + (snap.counters['adapter.get_item_detail.calls']||0);
          // Instant ratio
          const ratio = authFails / (httpCalls + 1);
          const ratioRounded = Number(ratio.toFixed(4));
          metrics.setGauge('adapter.http.auth_failure_ratio', ratioRounded);
          // Exponential moving average (EMA) for smoother alerting
          const alpha = parseFloat(process.env.EBAY_HTTP_AUTH_FAILURE_RATIO_EMA_ALPHA || '0.2');
          const snapEma = (snap.gauges['adapter.http.auth_failure_ratio_ema'] || 0);
          const ema = (snapEma === 0) ? ratioRounded : (alpha * ratioRounded + (1 - alpha) * snapEma);
          const emaRounded = Number(ema.toFixed(4));
          metrics.setGauge('adapter.http.auth_failure_ratio_ema', emaRounded);
          const threshold = parseFloat(process.env.EBAY_HTTP_AUTH_FAILURE_RATIO_ALERT || '0');
          if (threshold > 0 && ratio > threshold) {
            metrics.inc('adapter.http.auth_failure_ratio_threshold_exceeded');
            try {
              const logger = require('../../utils/logger');
              const cooldownMs = parseInt(process.env.EBAY_HTTP_AUTH_FAILURE_RATIO_LOG_COOLDOWN_MS || '60000', 10);
              const lk = '__auth_ratio_last_log_ts';
              const globalState = require('./metrics')._internal_state || (require('./metrics')._internal_state = {});
              const nowTs = Date.now();
              if (!globalState[lk] || nowTs - globalState[lk] > cooldownMs) {
                logger.warn(JSON.stringify({ event: 'auth_failure_ratio_threshold', ratio: ratioRounded, ema: emaRounded, threshold, authFailures: authFails, httpCalls, cooldownMs }));
                globalState[lk] = nowTs;
              }
            } catch(_) { /* ignore */ }
          }
        } catch(_) { /* ignore */ }
      }
      if (!e.transient) { if (circuitBreaker) { circuitBreaker.onFailure(); } throw e; }
      if (attempt === maxRetries) { throw e; }
      const backoff = 50 * Math.pow(2, attempt) + Math.floor(Math.random()*30);
      await new Promise(r => setTimeout(r, backoff));
      attempt += 1;
  if (circuitBreaker && !e.transient) { circuitBreaker.onFailure(); }
    }
  }
  // Should not reach here
  throw lastErr || new Error('unknown_adapter_error');
}

module.exports = { fetchWithRetry, getItemDetail, resetStateForTests, TransientError, PermanentError };
