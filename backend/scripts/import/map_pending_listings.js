#!/usr/bin/env node
/**
 * map_pending_listings.js
 * Maps pending staging rows into core tables (placeholder logic only; no mutations yet in dry run).
 */
const crypto = require('crypto');
const { sequelize } = require('../../src/utils/database');
const EbayListingImportRaw = require('../../src/models/ebayListingImportRawModel');

const DRY_RUN = process.env.EBAY_RAW_MAP_DRY_RUN !== 'false';
const MAP_LIMIT = parseInt(process.env.EBAY_RAW_MAP_BATCH_SIZE || '5', 10);

function hashDescription(html){
  const norm = (html || '').replace(/\s+/g,' ').trim();
  return crypto.createHash('sha256').update(norm).digest('hex');
}

async function run(){
  await sequelize.authenticate();
  const rows = await EbayListingImportRaw.findAll({ where: { process_status: 'pending' }, order: [['fetched_at','ASC']], limit: MAP_LIMIT });
  let processed=0;
  for (const row of rows){
    try {
      const data = row.raw_json || {};
      const mapped = {
        itemId: data.itemId,
        title: data.title,
        price: data.price?.value,
        currency: data.price?.currency,
        quantitySold: data.quantitySold,
        status: data.status,
        descriptionHash: hashDescription(data.descriptionHtml)
      };
      if (DRY_RUN){
        console.log('[DRY-RUN] Would map', mapped.itemId, mapped);
      } else {
        // TODO: upsert catalog/listing/ebay_listing + description history
        row.process_status = 'mapped';
        row.processed_at = new Date();
        await row.save();
      }
      processed++;
    } catch(e){
      row.process_status = 'failed';
      row.process_error = e.message;
      row.attempt_count = (row.attempt_count||0)+1;
      await row.save();
      console.error('Row failed', row.import_id, e.message);
    }
  }
  console.log('Mapping pass complete', { dryRun: DRY_RUN, selected: rows.length, processed });
  await sequelize.close();
}

run().catch(e=>{ console.error('Mapping failed', e); process.exit(1); });
