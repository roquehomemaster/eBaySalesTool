/**
 * reconciliationJob.js
 * Task 12 scaffold: detect drift between current projection and latest snapshot hash.
 * Strategy:
 *  - Iterate ebay_listing rows in batches.
 *  - Rebuild projection + hash.
 *  - Compare with last snapshot hash (or listing.last_publish_hash fallback).
 *  - If different and queue not already pending for listing, enqueue update intent.
 * Feature flag: EBAY_RECON_ENABLED=true
 */
const { EbayListing, EbayListingSnapshot, EbayChangeQueue, EbayDriftEvent } = require('../../../models/ebayIntegrationModels');
let metrics; try { metrics = require('./metrics'); } catch(_) { /* optional */ }
let txn; try { txn = require('./transactionLogger'); } catch(_) { /* optional */ }
let { redactObject } = require('./redactUtil');
let adapter; try { adapter = require('./adapter'); } catch(_) { /* optional */ }
let snapshotService; try { snapshotService = require('./snapshotService'); } catch(_) { /* optional */ }
const { buildProjection } = require('./projectionBuilder');
let rateLimiter; try { rateLimiter = require('./rateLimiter'); } catch(_) { /* optional */ }

function throttlingBypass(){ return process.env.EBAY_THROTTLE_BYPASS === 'true'; }

function reconEnabled(){ return process.env.EBAY_RECON_ENABLED === 'true'; }

async function findLatestSnapshot(ebay_listing_id){
  return EbayListingSnapshot.findOne({ where:{ ebay_listing_id }, order:[['snapshot_id','DESC']] });
}

async function listingHasPendingQueue(ebay_listing_id){
  const existing = await EbayChangeQueue.findOne({ where:{ ebay_listing_id, status:'pending' } });
  return !!existing;
}

async function classifyDrift(listing, projection_hash, latestSnapshotHash){
  // Remote fetch optional if adapter enabled & listing has external id
  let remoteHash = null; let remoteOk = false; let remoteBody = null;
  if (adapter && listing.external_item_id){
    try {
      const remote = await adapter.getListing(listing.external_item_id);
      if (remote.success && remote.body){
        remoteBody = remote.body;
        // crude hash: hash JSON string
        remoteHash = require('crypto').createHash('sha256').update(JSON.stringify(remote.body)).digest('hex');
        remoteOk = true;
      }
    } catch(_) { /* ignore */ }
  }
  const localChanged = latestSnapshotHash !== projection_hash;
  const remoteChanged = remoteOk && latestSnapshotHash && remoteHash && remoteHash !== latestSnapshotHash;
  if (localChanged && remoteChanged) { return { classification:'both_changed', remoteHash, remoteBody }; }
  if (localChanged && !remoteChanged) { return { classification:'internal_only', remoteHash, remoteBody }; }
  if (!localChanged && remoteChanged) { return { classification:'external_only', remoteHash, remoteBody }; }
  return { classification:'snapshot_stale', remoteHash, remoteBody };
}

async function processBatch(offset, limit){
  const listings = await EbayListing.findAll({ order:[['ebay_listing_id','ASC']], offset, limit });
  let driftCount = 0; let snapshots = 0; let driftEvents = 0;
  for(const l of listings){ // eslint-disable-line no-restricted-syntax
    // eslint-disable-next-line no-await-in-loop
  const { projection, projection_hash } = await buildProjection(l.internal_listing_id);
  // eslint-disable-next-line no-await-in-loop
  const latestSnap = await findLatestSnapshot(l.ebay_listing_id);
  const latestHash = (latestSnap && latestSnap.snapshot_hash) || l.last_publish_hash;
    if(latestHash && latestHash === projection_hash) { continue; }
    // drift (or first snapshot missing) -> enqueue update if not already queued
    // eslint-disable-next-line no-await-in-loop
    const pending = await listingHasPendingQueue(l.ebay_listing_id);
    if (!pending){
      // classification (best-effort)
      let driftMeta = { classification:'internal_only' };
      try { // eslint-disable-next-line no-await-in-loop
        driftMeta = await classifyDrift(l, projection_hash, latestHash);
      } catch(_) { /* ignore */ }
      // eslint-disable-next-line no-await-in-loop
      await EbayChangeQueue.create({ ebay_listing_id: l.ebay_listing_id, intent: l.external_item_id ? 'update' : 'create', payload_hash: projection_hash });
      driftCount += 1; driftEvents += 1;
      // eslint-disable-next-line no-await-in-loop
      if (EbayDriftEvent){
        try {
          // Build details_json with lightweight diffs (paths only) to keep row small
          let details = null;
          try {
            const diffUtil = require('./diffUtil');
            const snapshotJson = latestSnap ? (latestSnap.snapshot_json || {}) : {};
            const localDiff = diffUtil.diffObjects(snapshotJson, (projection || {}));
            let remoteDiff = null;
            if (driftMeta.remoteBody){
              remoteDiff = diffUtil.diffObjects(snapshotJson, driftMeta.remoteBody || {});
            }
            // Reduce diff maps to list of paths (top N paths to avoid large payloads)
            const localPaths = Object.keys(localDiff.changes).slice(0,50);
            const remotePaths = remoteDiff ? Object.keys(remoteDiff.changes).slice(0,50) : null;
            details = {
              local_changed: latestHash !== projection_hash,
              remote_changed: !!(driftMeta.remoteHash && latestHash && driftMeta.remoteHash !== latestHash),
              changed_paths_from_snapshot_to_local: localPaths,
              changed_paths_from_snapshot_to_remote: remotePaths,
              sample_local: { listing: projection && projection.listing, catalog: projection && projection.catalog ? { id: projection.catalog.id, sku: projection.catalog.sku } : null }
            };
          } catch(e){ /* ignore diff build errors */ }
          // Enforce size cap ~10KB serialized
          let capped = details;
          try {
            const raw = JSON.stringify(details);
            if (raw.length > 10000) {
              capped = { truncated:true, original_keys: Object.keys(details||{}), note: 'details_json exceeded 10KB' };
            }
          } catch(_) { /* ignore */ }
          await EbayDriftEvent.create({ ebay_listing_id: l.ebay_listing_id, classification: driftMeta.classification, local_hash: projection_hash, remote_hash: driftMeta.remoteHash, snapshot_hash: latestHash, details_json: capped });
        } catch(_) { /* ignore */ }
      }
      if (metrics) { metrics.inc(`recon.drift_${driftMeta.classification}`); }
      if (process.env.EBAY_RECON_SNAPSHOT_ON_DRIFT === 'true' && snapshotService) {
        try { // eslint-disable-next-line no-await-in-loop
          await snapshotService.snapshotListing(l.ebay_listing_id, 'recon_drift'); snapshots += 1; } catch(e){ /* ignore */ }
      }
    }
  }
  if (metrics) { metrics.inc('recon.listings_scanned', listings.length); metrics.inc('recon.drift_enqueued', driftCount); if (snapshots) { metrics.inc('recon.snapshots_created', snapshots); } }
  return { processed: listings.length, driftEnqueued: driftCount, snapshots, driftEvents };
}

async function runReconciliation({ batchSize = 50, maxBatches = 200 } = {}){
  if(!reconEnabled()) { return { skipped:true, reason:'feature_flag_disabled' }; }
  if (rateLimiter && rateLimiter.nearDepletion() && !throttlingBypass()) {
    if (metrics) { metrics.inc('recon.skipped_rate_throttle'); }
    return { skipped:true, reason:'rate_limiter_near_depletion' };
  }
  const started = Date.now();
  let offset = 0; let batches = 0; let total = 0; let drift = 0; let snaps = 0;
  // eslint-disable-next-line no-constant-condition
  while(true){
    // eslint-disable-next-line no-await-in-loop
    const res = await processBatch(offset, batchSize);
  if(res.processed === 0) { break; }
    offset += res.processed;
    total += res.processed;
  drift += res.driftEnqueued; snaps += (res.snapshots||0);
    batches += 1;
  if (batches >= maxBatches) { break; }
  }
  const duration = Date.now() - started;
  if (metrics) { metrics.inc('recon.runs'); metrics.mark('recon.last_run'); metrics.observe('recon.run_duration_ms', duration); }
  if (txn) { txn.logTxn({ direction:'inbound', channel:'recon', operation:'run', status:'success', response_body:redactObject({ listingsChecked: total, driftEnqueued: drift, snapshots: snaps }) }); }
  return { skipped:false, listingsChecked: total, driftEnqueued: drift, snapshots: snaps, batches, duration_ms: duration };
}

if(require.main === module){
  runReconciliation().then(r=>{ console.log('[recon]', r); process.exit(0); }) // eslint-disable-line no-console
    .catch(e=>{ console.error('[recon] failed', e); process.exit(1); }); // eslint-disable-line no-console
}

module.exports = { runReconciliation, _test:{ reconEnabled, processBatch, throttlingBypass } };
