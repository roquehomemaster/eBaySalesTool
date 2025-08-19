/**
 * rawIngestionService.js
 * Shared logic to ingest raw eBay listing payloads into staging table.
 * Currently uses a fake fetch implementation until real API integration is wired.
 */
const crypto = require('crypto');
const EbayListingImportRaw = require('../../models/ebayListingImportRawModel');

function hashPayload(obj) {
  const canonical = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

async function fakeFetchItemDetail(itemId) {
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

/**
 * Ingest a set of eBay item IDs into staging table.
 * @param {Object} opts
 * @param {string[]} opts.itemIds - IDs to fetch
 * @param {boolean} opts.dryRun - if true, don't persist
 */
async function ingestRawListings({ itemIds, dryRun = true }) {
  const results = { inserted: 0, duplicates: 0, skipped: 0, requested: itemIds.length };
  for (const itemId of itemIds) { // eslint-disable-line no-restricted-syntax
    // eslint-disable-next-line no-await-in-loop
    const payload = await fakeFetchItemDetail(itemId);
    const hash = hashPayload(payload);
    // eslint-disable-next-line no-await-in-loop
    const existing = await EbayListingImportRaw.findOne({ where: { item_id: itemId, content_hash: hash } });
    if (existing) { results.duplicates += 1; continue; }
    if (dryRun) { results.skipped += 1; continue; }
    // eslint-disable-next-line no-await-in-loop
    await EbayListingImportRaw.create({
      item_id: itemId,
      sku: payload.SKU || null,
      source_api: 'trading',
      raw_json: payload,
      content_hash: hash,
      fetched_at: new Date(),
      process_status: 'pending'
    });
    results.inserted += 1;
  }
  return results;
}

module.exports = { ingestRawListings };
