/**
 * snapshotService.js
 * Create & deduplicate listing snapshots (Phase 1 minimal implementation).
 */
const { EbayListing, EbayListingSnapshot } = require('../../../models/ebayIntegrationModels');
const { buildProjection } = require('./projectionBuilder');
const { diffObjects } = require('./diffUtil');

function snapshotsEnabled(){ return process.env.EBAY_SNAPSHOTS_ENABLED === 'true'; }

/**
 * Capture snapshot for given ebay_listing_id.
 * @param {number} ebay_listing_id
 * @param {string} source_event (e.g., queue_processed, publish_success)
 * @returns {Promise<object>} summary
 */
async function snapshotListing(ebay_listing_id, source_event){
  if(!snapshotsEnabled()){ return { skipped: true, reason: 'feature_flag_disabled' }; }
  const ebayListing = await EbayListing.findOne({ where: { ebay_listing_id } });
  if(!ebayListing){ throw new Error(`EbayListing ${ebay_listing_id} not found`); }
  const { internal_listing_id } = ebayListing;
  const { projection, projection_hash } = await buildProjection(internal_listing_id);
  const last = await EbayListingSnapshot.findOne({ where: { ebay_listing_id }, order: [['snapshot_id','DESC']] });
  if(last && last.snapshot_hash === projection_hash){
    // For a duplicate, always link back to the original non-dedup snapshot (root) so chains remain shallow.
    let rootId = last.snapshot_id;
    if(last.dedup_of_snapshot_id){
      // If last itself was a dedup, root is the first snapshot with this hash (follow pointer once – we don't create deep chains).
      rootId = last.dedup_of_snapshot_id;
    }
    const dup = await EbayListingSnapshot.create({
      ebay_listing_id,
      snapshot_hash: projection_hash,
      snapshot_json: projection,
      diff_from_prev_json: {},
      source_event,
      dedup_of_snapshot_id: rootId
    });
    return { skipped:false, dedup:true, snapshot_id: dup.snapshot_id, hash: projection_hash };
  }
  let diff = {};
  if(last){ diff = diffObjects(last.snapshot_json, projection).changes; }
  const snap = await EbayListingSnapshot.create({
    ebay_listing_id,
    snapshot_hash: projection_hash,
    snapshot_json: projection,
    diff_from_prev_json: diff,
    source_event,
    dedup_of_snapshot_id: null
  });
  return { skipped:false, dedup:false, snapshot_id: snap.snapshot_id, hash: projection_hash, diff_size: Object.keys(diff).length };
}

module.exports = { snapshotListing, _test:{ snapshotsEnabled } };
