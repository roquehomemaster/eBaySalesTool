#!/usr/bin/env node
/**
 * ingestRawEbayListings.js
 * Dry-run capable ingestion of raw eBay listing details into staging table.
 * NOTE: Placeholder eBay fetch logic (replace with real API calls later).
 */
const crypto = require('crypto');
const EbayListingImportRaw = require('../../src/models/ebayListingImportRawModel');
const { sequelize } = require('../../src/utils/database');

async function fakeFetchItemDetail(itemId) {
  // Placeholder payload; mimic real structure shape
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

function hashPayload(obj) {
  const canonical = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

async function ingest({ itemIds, dryRun = true }) {
  const results = { inserted: 0, duplicates: 0, skipped: 0 };
  for (const itemId of itemIds) {
    const payload = await fakeFetchItemDetail(itemId);
    const hash = hashPayload(payload);
    const existing = await EbayListingImportRaw.findOne({ where: { item_id: itemId, content_hash: hash } });
    if (existing) { results.duplicates++; continue; }
    if (dryRun) { results.skipped++; continue; }
    await EbayListingImportRaw.create({
      item_id: itemId,
      sku: payload.SKU || null,
      source_api: 'trading',
      raw_json: payload,
      content_hash: hash,
      fetched_at: new Date(),
      process_status: 'pending'
    });
    results.inserted++;
  }
  return results;
}

(async () => {
  const dryRun = process.env.DRY_RUN !== 'false';
  const list = (process.env.ITEM_IDS || '1001,1002,1003').split(',').map(s => s.trim());
  try {
    await sequelize.authenticate();
    const summary = await ingest({ itemIds: list, dryRun });
    console.log(JSON.stringify({ dryRun, ...summary }, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Ingestion failed', e);
    process.exit(1);
  }
})();
