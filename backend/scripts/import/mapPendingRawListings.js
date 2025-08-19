#!/usr/bin/env node
/**
 * mapPendingRawListings.js
 * Skeleton mapping script: selects pending raw rows and marks them mapped (dry-run by default)
 * TODO: Implement real field extraction & upserts.
 */
const EbayListingImportRaw = require('../../src/models/ebayListingImportRawModel');
const { sequelize } = require('../../src/utils/database');

async function processBatch(limit = 25, dryRun = true) {
  const rows = await EbayListingImportRaw.findAll({ where: { process_status: 'pending' }, order: [['fetched_at','ASC']], limit });
  let mapped = 0;
  for (const row of rows) {
    try {
      // Placeholder parse
      const itemId = row.item_id;
      const raw = row.raw_json || {};
      // TODO: real mapping logic here
      if (!dryRun) {
        row.process_status = 'mapped';
        row.processed_at = new Date();
        await row.save();
      }
      mapped++;
    } catch (e) {
      if (!dryRun) {
        row.process_status = 'failed';
        row.process_error = e.message;
        row.attempt_count = (row.attempt_count || 0) + 1;
        await row.save();
      }
    }
  }
  return { selected: rows.length, mapped, dryRun };
}

(async () => {
  const dryRun = process.env.DRY_RUN !== 'false';
  const limit = parseInt(process.env.MAP_LIMIT || '25', 10);
  try {
    await sequelize.authenticate();
    const summary = await processBatch(limit, dryRun);
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Mapping failed', e);
    process.exit(1);
  }
})();
