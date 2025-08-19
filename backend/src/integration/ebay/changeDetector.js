/**
 * changeDetector.js
 * Detect projection changes and enqueue create/update intents.
 */
const { buildProjection } = require('./projectionBuilder');
const { EbayListing, EbayChangeQueue } = require('../../../models/ebayIntegrationModels');
let Op; try { ({ Op } = require('sequelize')); } catch(_) { /* optional for tests */ }
let metrics; try { metrics = require('./metrics'); } catch(_) { /* optional */ }

function featureFlagEnabled() {
  return process.env.EBAY_QUEUE_ENABLED === 'true';
}

async function processListingChange(listingId, trigger) {
  if (!featureFlagEnabled()) {
    if (metrics) { metrics.inc('queue.enqueue_skipped_flag'); }
    return { skipped: true, reason: 'feature_flag_disabled' };
  }
  const { projection_hash } = await buildProjection(listingId);
  let ebayListing = await EbayListing.findOne({ where: { internal_listing_id: listingId } });
  let intent = 'create';
  if (!ebayListing) {
    ebayListing = await EbayListing.create({ internal_listing_id: listingId, lifecycle_state: 'pending' });
  } else if (ebayListing.last_publish_hash === projection_hash) {
    if (metrics) { metrics.inc('queue.enqueue_skipped_hash'); }
    return { skipped: true, reason: 'hash_unchanged' };
  } else {
    intent = 'update';
  }
  // Idempotency: avoid enqueueing duplicate work if a pending/processing item with same hash exists
  const statusCond = Op ? { [Op.in]: ['pending','processing'] } : ['pending','processing'];
  const existing = await EbayChangeQueue.findOne({ where: { ebay_listing_id: ebayListing.ebay_listing_id, payload_hash: projection_hash, status: statusCond } });
  if (existing) {
    if (metrics) { metrics.inc('queue.enqueue_skipped_duplicate'); }
    return { skipped: true, reason: 'duplicate_pending' };
  }
  await EbayChangeQueue.create({ ebay_listing_id: ebayListing.ebay_listing_id, intent, payload_hash: projection_hash });
  if (metrics) { metrics.inc('queue.enqueue'); metrics.inc(`queue.enqueue_intent_${intent}`); }
  return { skipped: false, intent, hash: projection_hash, trigger };
}

module.exports = { processListingChange, _test: { featureFlagEnabled } };
