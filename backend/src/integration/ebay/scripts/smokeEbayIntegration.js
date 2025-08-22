#!/usr/bin/env node
/**
 * smokeEbayIntegration.js
 * Purpose: Run a minimal end-to-end smoke of the eBay integration in a real (dev) environment.
 * Steps:
 *  1. Ensure required feature flags enabled (publish + snapshots).
 *  2. Create N placeholder ebay_listing rows (if not already) for existing internal listings (provided via args or default range).
 *  3. Enqueue create intents for any listings missing external_item_id.
 *  4. Process queue until empty (bounded loop safety).
 *  5. Output summary (counts, latest snapshot stats) as JSON.
 * Usage:
 *   node src/integration/ebay/scripts/smokeEbayIntegration.js --listings 101,102,103 --maxRuns 50
 * Env Vars:
 *   EBAY_PUBLISH_ENABLED=true (required)
 *   EBAY_SNAPSHOTS_ENABLED=true (recommended)
 */
const { EbayListing, EbayChangeQueue, EbayListingSnapshot } = require('../../../../models/ebayIntegrationModels');
const { runOnce } = require('../queueWorker');

function parseArg(name, def){
  const idx = process.argv.findIndex(a=> a === `--${name}`);
  if (idx === -1) return def;
  return process.argv[idx+1];
}

(async () => {
  if (process.env.EBAY_PUBLISH_ENABLED !== 'true') { console.error('EBAY_PUBLISH_ENABLED must be true'); process.exit(1); }
  process.env.EBAY_SNAPSHOTS_ENABLED = process.env.EBAY_SNAPSHOTS_ENABLED || 'true';
  const listingArg = parseArg('listings', '');
  const maxRuns = parseInt(parseArg('maxRuns', '100'), 10);
  const ids = listingArg ? listingArg.split(',').map(s=> parseInt(s.trim(),10)).filter(Boolean) : [];
  if (!ids.length) { console.error('Provide --listings id1,id2'); process.exit(1); }

  // Ensure ebay_listing rows exist
  for (const internalId of ids){ // eslint-disable-line no-restricted-syntax
    // Try find existing by internal listing id via unique
    let row = await EbayListing.findOne({ where:{ internal_listing_id: internalId } }); // eslint-disable-line no-await-in-loop
    if(!row){
      // create minimal placeholder
      row = await EbayListing.create({ internal_listing_id: internalId, lifecycle_state:'pending' }); // eslint-disable-line no-await-in-loop
    }
    // Enqueue create if no external id and no pending queue
    if (!row.external_item_id){
      const pending = await EbayChangeQueue.findOne({ where:{ ebay_listing_id: row.ebay_listing_id, status:'pending' } }); // eslint-disable-line no-await-in-loop
      if(!pending){
        await EbayChangeQueue.create({ ebay_listing_id: row.ebay_listing_id, intent:'create', payload_hash:'pending' }); // eslint-disable-line no-await-in-loop
      }
    }
  }

  let runs = 0; let processed = 0;
  // Loop until queue empty or max
  while(runs < maxRuns){ // eslint-disable-line no-constant-condition
    // eslint-disable-next-line no-await-in-loop
    const res = await runOnce();
    runs += 1;
    if (res.processed) { processed += 1; }
    if (!res.processed && res.reason === 'empty') { break; }
  }

  // Summarize snapshots
  const snaps = await EbayListingSnapshot.findAll({ where:{}, limit: 50, order:[['snapshot_id','DESC']] });
  const summary = {
    runs,
    processed,
    listings: ids.length,
    snapshots: snaps.length,
    lastHashes: snaps.slice(0, Math.min(5, snaps.length)).map(s=> ({ id:s.snapshot_id, listing:s.ebay_listing_id, hash:s.snapshot_hash, dedup: !!s.dedup_of_snapshot_id }))
  };
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
})().catch(e=>{ console.error('smoke failed', e); process.exit(1); });
