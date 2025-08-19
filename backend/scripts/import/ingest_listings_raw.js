#!/usr/bin/env node
/**
 * ingest_listings_raw.js
 * Dry-run capable raw ingestion script.
 * CURRENTLY: placeholder fetch function returns mocked items until eBay API integration added.
 */
const crypto = require('crypto');
const EbayListingImportRaw = require('../../models/ebayListingImportRawModel');
const logger = require('../../src/utils/logger');

const DRY_RUN = process.env.EBAY_RAW_IMPORT_DRY_RUN !== 'false';
const BATCH_SIZE = parseInt(process.env.EBAY_RAW_IMPORT_BATCH_SIZE || '5', 10);

async function mockFetchItemIds(limit){
  return Array.from({length: limit}, (_,i)=> 'MOCK_ITEM_'+(i+1));
}

async function mockFetchItemDetail(itemId){
  return {
    Item: {
      ItemID: itemId,
      Title: `Mock Title for ${itemId}`,
      SKU: 'SKU_'+itemId.split('_').pop(),
      ListingStatus: 'Active',
      Quantity: 10,
      QuantitySold: 3,
      CurrentPrice: { Value: 42.50, CurrencyID: 'USD' },
      Description: `<p>Description for ${itemId}</p>`,
      WatchCount: 5,
      StartTime: new Date().toISOString(),
      PrimaryCategory: { CategoryID: '12345' }
    }
  };
}

function hashPayload(obj){
  const json = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash('sha256').update(json).digest('hex');
}

async function ingest(){
  const itemIds = await mockFetchItemIds(BATCH_SIZE);
  let inserted = 0, skipped = 0;
  for (const itemId of itemIds){
    const detail = await mockFetchItemDetail(itemId);
    const raw = detail; // future: actual API response
    const item_id = detail.Item.ItemID;
    const sku = detail.Item.SKU || null;
    const content_hash = hashPayload(raw);
    // Check duplicate by item_id + hash
    const existing = await EbayListingImportRaw.findOne({ where: { item_id, content_hash } });
    if (existing){
      skipped++; continue;
    }
    if (DRY_RUN){
      logger.info(`[DRY_RUN] Would insert raw row for ${item_id} hash=${content_hash}`);
      inserted++; continue;
    }
    await EbayListingImportRaw.create({ item_id, sku, source_api: 'trading', raw_json: raw, content_hash });
    inserted++;
  }
  logger.info(`Ingestion complete. Inserted=${inserted} Skipped=${skipped} DryRun=${DRY_RUN}`);
}

ingest().then(()=>{ if (DRY_RUN) process.exit(0); }).catch(e=>{ logger.error('Ingestion failed', e); process.exit(1); });
