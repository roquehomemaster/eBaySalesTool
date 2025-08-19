#!/usr/bin/env node
/**
 * map_listings_raw.js
 * Skeleton mapping script: reads pending raw rows and logs intended transformations.
 * CURRENT: dry-run only until mapping rules finalized.
 */
const EbayListingImportRaw = require('../../models/ebayListingImportRawModel');
const logger = require('../../src/utils/logger');

const MAP_BATCH_SIZE = parseInt(process.env.EBAY_RAW_MAP_BATCH_SIZE || '5', 10);
const DRY_RUN = true; // force dry-run until explicitly enabled

async function processBatch(){
  const pending = await EbayListingImportRaw.findAll({ where: { process_status: 'pending' }, order: [['fetched_at','ASC']], limit: MAP_BATCH_SIZE });
  if (!pending.length){
    logger.info('No pending rows to map.');
    return;
  }
  for (const row of pending){
    try {
      const payload = row.raw_json || {}; // full raw
      const item = payload.Item || {};
      const extracted = {
        itemId: item.ItemID,
        title: item.Title,
        price: item.CurrentPrice?.Value,
        currency: item.CurrentPrice?.CurrencyID,
        quantity: item.Quantity,
        quantitySold: item.QuantitySold,
        status: item.ListingStatus,
        sku: item.SKU,
        descriptionLength: (item.Description || '').length
      };
      logger.info(`[MAP_DRY_RUN] import_id=${row.import_id} itemId=${extracted.itemId} title='${extracted.title}' price=${extracted.price} status=${extracted.status}`);
      if (!DRY_RUN){
        // TODO: upsert listing + ebay_listing + description versioning
        row.process_status = 'mapped';
        row.processed_at = new Date();
        await row.save();
      }
    } catch (e){
      logger.error('Mapping failure', { import_id: row.import_id, err: e.message });
      row.process_status = 'failed';
      row.process_error = e.message;
      row.attempt_count += 1;
      await row.save();
    }
  }
}

processBatch().then(()=>{ logger.info('Mapping batch complete (dry-run).'); }).catch(e=>{ logger.error('Mapping script error', e); process.exit(1); });
