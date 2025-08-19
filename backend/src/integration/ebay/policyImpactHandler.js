/**
 * policyImpactHandler.js
 * Task 17: When policies change, mark affected listings for update and optionally snapshot.
 * Simplified heuristic:
 *  - Assume all listings potentially depend on shipping/return/payment policies (no relation table yet).
 *  - For each changed policy type, we enqueue update for all listings (bounded by MAX_LISTINGS_IMPACT to prevent overload).
 * Feature flag: EBAY_POLICY_IMPACT_ENABLED=true
 */
const { EbayListing, EbayChangeQueue } = require('../../../models/ebayIntegrationModels');
let snapshotService; try { snapshotService = require('./snapshotService'); } catch(_) { /* optional */ }
let metrics; try { metrics = require('./metrics'); } catch(_) { /* optional */ }
let txn; try { txn = require('./transactionLogger'); } catch(_) { /* optional */ }
let { redactObject } = require('./redactUtil');
const { buildProjection } = require('./projectionBuilder');

function impactEnabled(){ return process.env.EBAY_POLICY_IMPACT_ENABLED === 'true'; }
const MAX_LISTINGS_IMPACT = parseInt(process.env.EBAY_POLICY_IMPACT_MAX || '500', 10);

async function handlePolicyChanges(changedPolicies){
  if(!impactEnabled()) { return { skipped:true, reason:'feature_flag_disabled' }; }
  // naive implementation: impact all listings (bounded)
  const listings = await EbayListing.findAll({ order:[['ebay_listing_id','ASC']], limit: MAX_LISTINGS_IMPACT });
  let enqueued = 0; let snapshots = 0;
  for(const l of listings){ // eslint-disable-line no-restricted-syntax
    // eslint-disable-next-line no-await-in-loop
    const { projection_hash } = await buildProjection(l.internal_listing_id);
    // eslint-disable-next-line no-await-in-loop
    await EbayChangeQueue.create({ ebay_listing_id: l.ebay_listing_id, intent: l.external_item_id ? 'update':'create', payload_hash: projection_hash });
    enqueued += 1;
    if(process.env.EBAY_POLICY_IMPACT_SNAPSHOT === 'true' && snapshotService){
      try { // eslint-disable-next-line no-await-in-loop
        await snapshotService.snapshotListing(l.ebay_listing_id, 'policy_change'); snapshots += 1; } catch(e){ /* ignore */ }
    }
  }
  if (metrics) { metrics.inc('policy.impact_runs'); metrics.inc('policy.listings_impacted', listings.length); metrics.inc('policy.listing_enqueues', enqueued); if (snapshots) { metrics.inc('policy.snapshots_created', snapshots); } }
  if (txn) { txn.logTxn({ direction:'inbound', channel:'policy', operation:'impact', status:'success', response_body:redactObject({ listingsImpacted: listings.length, changedPolicies: changedPolicies.length }) }); }
  return { skipped:false, listingsImpacted: listings.length, enqueued, snapshots, changedPolicies: changedPolicies.length };
}

module.exports = { handlePolicyChanges, _test:{ impactEnabled } };
