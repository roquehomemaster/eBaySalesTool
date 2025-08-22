/**
 * rawIngestionService.js
 * Shared logic to ingest raw eBay listing payloads into staging table.
 * Currently uses a simulated adapter; a real HTTP integration can replace adapter module.
 */
const crypto = require('crypto');
const EbayListingImportRaw = require('../../models/ebayListingImportRawModel');
let metrics;
try { metrics = require('./metrics'); } catch(_) { /* ignore metrics absence in some contexts */ }

function hashPayload(obj) {
  const canonical = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

let adapter;
try { adapter = require('./ebayAdapter'); } catch(_) { /* adapter optional */ }
let rateLimiter; try { rateLimiter = require('./rateLimiter'); } catch(_) { /* optional */ }

/**
 * Ingest a set of eBay item IDs into staging table.
 * @param {Object} opts
 * @param {string[]} opts.itemIds - IDs to fetch
 * @param {boolean} opts.dryRun - if true, don't persist
 */
async function ingestRawListings({ itemIds, dryRun = true }) {
  // NOTE: Real adapter integration (HTTP, auth, rate limiting) can replace ebayAdapter
  // Future TODOs: classify richer error types, expose per-adapter latency metrics, integrate token bucket
  const started = Date.now();
  if (metrics) { metrics.inc('ingest.runs'); metrics.mark('ingest.last_run'); metrics.inc('ingest.requested', itemIds.length); }
  const results = {
    requested: itemIds.length,
    fetched: 0,
    succeeded: 0,
    inserted: 0,
    duplicates: 0,
    skipped: 0,
    errors: 0,
    invalidIds: 0,
    transientErrors: 0,
    permanentErrors: 0,
    retries: 0,
  backpressureDelays: 0,
    avgAttempts: 0,
    durationMs: 0,
    errorSamples: []
  };
  let attemptsSum = 0;
  const concurrency = Math.max(1, parseInt(process.env.EBAY_INGEST_CONCURRENCY || '5', 10));
  let index = 0;
  async function worker(){
    while (index < itemIds.length) { // eslint-disable-line no-await-in-loop
      const itemId = itemIds[index++];
      // Basic validation: digits only (adjust when real API supports different formats)
      if (!/^\d+$/.test(itemId)) {
        results.invalidIds += 1; results.errors += 1;
        const msg = 'invalid_item_id:' + itemId;
        if (results.errorSamples.length < 5) { results.errorSamples.push(msg); }
        if (metrics) { metrics.inc('ingest.errors'); metrics.recordError('ingest', new Error(msg)); }
        continue; // next id
      }
      try {
        let payload; let attempts = 0;
        // Adaptive backpressure: pause briefly if rate limiter near depletion
        if (rateLimiter && rateLimiter.nearDepletion()) {
          results.backpressureDelays += 1;
          if (metrics) { metrics.inc('ingest.backpressure_delays'); }
          const delayMs = parseInt(process.env.EBAY_INGEST_BACKPRESSURE_DELAY_MS || '25', 10);
          // eslint-disable-next-line no-await-in-loop
          await new Promise(r => setTimeout(r, delayMs));
        }
        if (adapter && adapter.fetchWithRetry) {
          payload = await adapter.fetchWithRetry(itemId, { onAttempt: (a, err) => { attempts = a+1; if (err && err.transient) { results.transientErrors += 1; if (metrics) { metrics.inc('ingest.transient_errors'); } } } }); // eslint-disable-line no-await-in-loop
          if (attempts > 1) { results.retries += (attempts - 1); if (metrics) { metrics.inc('ingest.retries', attempts - 1); } }
        } else {
          // Minimal fallback sample payload
          payload = { ItemID: itemId, SKU: 'SKU-' + itemId, Title: 'Sample Title #' + itemId };
        }
  results.fetched += 1;
  attemptsSum += (attempts || 1);
  if (metrics) { metrics.observe('ingest.attempts_per_item', attempts || 1); }
        const hash = hashPayload(payload);
        const existing = await EbayListingImportRaw.findOne({ where: { item_id: itemId, content_hash: hash } }); // eslint-disable-line no-await-in-loop
        if (existing) { results.duplicates += 1; if (metrics) { metrics.inc('ingest.duplicates'); } continue; }
        if (dryRun) { results.skipped += 1; if (metrics) { metrics.inc('ingest.skipped'); } continue; }
        await EbayListingImportRaw.create({ // eslint-disable-line no-await-in-loop
          item_id: itemId,
          sku: payload.SKU || null,
          source_api: 'trading',
          raw_json: payload,
          content_hash: hash,
          fetched_at: new Date(),
          process_status: 'pending'
        });
        results.inserted += 1; results.succeeded += 1;
        if (metrics) { metrics.inc('ingest.inserted'); metrics.inc('ingest.succeeded'); }
      } catch (e) {
        if (e && e.transient) {
          // exhausted retries
          results.transientErrors += 1;
          if (metrics) { metrics.inc('ingest.transient_errors'); }
        } else {
          results.permanentErrors += 1;
          if (metrics) { metrics.inc('ingest.permanent_errors'); }
        }
        results.errors += 1;
        if (results.errorSamples.length < 5) { results.errorSamples.push(e.message); }
        if (metrics) { metrics.inc('ingest.errors'); metrics.recordError('ingest', e); }
      }
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, itemIds.length) }, () => worker());
  await Promise.all(workers);
  results.durationMs = Date.now() - started;
  if (results.fetched > 0) { results.avgAttempts = Number((attemptsSum / results.fetched).toFixed(2)); }
  if (metrics) { metrics.observe('ingest.duration_ms', results.durationMs); }
  return results;
}

module.exports = { ingestRawListings };
