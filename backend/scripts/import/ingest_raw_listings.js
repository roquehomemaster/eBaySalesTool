#!/usr/bin/env node
/**
 * ingest_raw_listings.js
 * Dry-run capable ingestion of eBay listing detail payloads into staging table.
 * NOTE: Placeholder API fetch (no real eBay call yet) – replace fetchListingIds & fetchItemDetail.
 */
const crypto = require('crypto');
const { sequelize } = require('../../src/utils/database');
const EbayListingImportRaw = require('../../src/models/ebayListingImportRawModel');

const DRY_RUN = process.env.EBAY_RAW_IMPORT_DRY_RUN !== 'false';
const BATCH_LIMIT = parseInt(process.env.EBAY_RAW_IMPORT_BATCH_SIZE || '10', 10);

function stableHash(obj){
  const json = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash('sha256').update(json).digest('hex');
}

async function fetchListingIds(limit){
  // Placeholder: later call Sell summary or Trading enumeration.
  return Array.from({length: limit}, (_,i)=> 'FAKE_ITEM_' + (i+1));
}

async function fetchItemDetail(itemId){
  // Placeholder detail payload.
  return {
    itemId,
    title: 'Sample Title ' + itemId,
    price: { value: '19.99', currency: 'USD' },
    quantitySold: 3,
    status: 'ACTIVE',
    descriptionHtml: `<p>Demo description for ${itemId}</p>`
  };
}

async function run(){
  await sequelize.authenticate();
  const itemIds = await fetchListingIds(BATCH_LIMIT);
  let inserted = 0, duplicates = 0;
  for (const itemId of itemIds){
    const detail = await fetchItemDetail(itemId);
    const hash = stableHash(detail);
    // Check duplicate by item_id + content_hash
    const existing = await EbayListingImportRaw.findOne({ where: { item_id: itemId, content_hash: hash }});
    if (existing){
      duplicates++; continue;
    }
    if (DRY_RUN){
      console.log('[DRY-RUN] Would insert', itemId, hash);
      continue;
    }
    await EbayListingImportRaw.create({
      item_id: itemId,
      sku: detail.sku || null,
      source_api: 'trading',
      raw_json: detail,
      content_hash: hash,
      fetched_at: new Date(),
      process_status: 'pending'
    });
    inserted++;
  }
  console.log('Ingestion complete', { dryRun: DRY_RUN, attempted: itemIds.length, inserted, duplicates });
  await sequelize.close();
}

run().catch(e=>{ console.error('Ingestion failed', e); process.exit(1); });
