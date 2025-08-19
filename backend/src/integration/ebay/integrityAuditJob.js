/**
 * integrityAuditJob.js
 * Task 18: Periodic integrity audit to validate snapshot hash correctness and listing publish hash consistency.
 * Feature flag: EBAY_AUDIT_ENABLED=true
 */
const { EbayListing, EbayListingSnapshot } = require('../../../models/ebayIntegrationModels');
const { hashObject } = require('./hashUtil');
let metrics; try { metrics = require('./metrics'); } catch(_) { /* optional */ }
let txn; try { txn = require('./transactionLogger'); } catch(_) { /* optional */ }
let { redactObject } = require('./redactUtil');
const { buildProjection } = require('./projectionBuilder');
let rateLimiter; try { rateLimiter = require('./rateLimiter'); } catch(_) { /* optional */ }
function throttlingBypass(){ return process.env.EBAY_THROTTLE_BYPASS === 'true'; }

function auditEnabled(){ return process.env.EBAY_AUDIT_ENABLED === 'true'; }

async function auditSnapshotsBatch({ offset = 0, limit = 100, verifyProjection = true } = {}){
  const snaps = await EbayListingSnapshot.findAll({ order:[['snapshot_id','DESC']], offset, limit });
  const issues = [];
  for(const s of snaps){ // eslint-disable-line no-restricted-syntax
    const recomputed = hashObject(s.snapshot_json || {});
    if (recomputed !== s.snapshot_hash){
      issues.push({ type:'snapshot_hash_mismatch', snapshot_id: s.snapshot_id, stored: s.snapshot_hash, recomputed });
    }
    if (verifyProjection){
      // eslint-disable-next-line no-await-in-loop
      const listing = await EbayListing.findOne({ where:{ ebay_listing_id: s.ebay_listing_id } });
      if (listing){
        // eslint-disable-next-line no-await-in-loop
        const { projection_hash } = await buildProjection(listing.internal_listing_id);
        if (listing.last_publish_hash && listing.last_publish_hash !== projection_hash){
          issues.push({ type:'listing_projection_drift', ebay_listing_id: listing.ebay_listing_id, last_publish_hash: listing.last_publish_hash, current_projection_hash: projection_hash });
        }
      }
    }
  }
  if (metrics) { metrics.inc('audit.snapshots_scanned', snaps.length); if (issues.length) { metrics.inc('audit.issues_found', issues.length); } }
  return { scanned: snaps.length, issues };
}

async function runIntegrityAudit({ maxBatches = 50, batchSize = 100, verifyProjection = true } = {}){
  if(!auditEnabled()){ return { skipped:true, reason:'feature_flag_disabled' }; }
  if (rateLimiter && rateLimiter.nearDepletion() && !throttlingBypass()) {
    if (metrics) { metrics.inc('audit.skipped_rate_throttle'); }
    return { skipped:true, reason:'rate_limiter_near_depletion' };
  }
  const started = Date.now();
  let offset = 0; let batches = 0; let totalScanned = 0; const allIssues = [];
  // eslint-disable-next-line no-constant-condition
  while(true){
    // eslint-disable-next-line no-await-in-loop
    const res = await auditSnapshotsBatch({ offset, limit: batchSize, verifyProjection });
    if (!res.scanned){ break; }
    offset += res.scanned; totalScanned += res.scanned; batches += 1;
    allIssues.push(...res.issues);
    if (batches >= maxBatches){ break; }
  }
  const duration = Date.now() - started;
  if (metrics) { metrics.inc('audit.runs'); metrics.mark('audit.last_run'); metrics.observe('audit.run_duration_ms', duration); }
  if (txn) { txn.logTxn({ direction:'inbound', channel:'audit', operation:'run', status:'success', response_body:redactObject({ totalScanned, issues: allIssues.length }) }); }
  return { skipped:false, totalScanned, issues: allIssues, batches, duration_ms: duration };
}

module.exports = { runIntegrityAudit, auditSnapshotsBatch, _test:{ auditEnabled, throttlingBypass } };
