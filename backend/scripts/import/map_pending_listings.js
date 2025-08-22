#!/usr/bin/env node
/**
 * map_pending_listings.js
 * Maps pending staging rows into core tables.
 * Phase 1: minimal subset (listing + ebay_listing + description history) with idempotent upserts.
 */
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize } = require('../../src/utils/database');
const EbayListingImportRaw = require('../../src/models/ebayListingImportRawModel');
const Listing = require('../../src/models/listingModel');
const Catalog = require('../../src/models/catalogModel');
const { EbayListing } = require('../../models/ebayIntegrationModels');
let metrics; try { metrics = require('../../src/integration/ebay/metrics'); } catch(_) { /* optional */ }

const DRY_RUN = process.env.EBAY_RAW_MAP_DRY_RUN !== 'false';
const MAP_LIMIT = parseInt(process.env.EBAY_RAW_MAP_BATCH_SIZE || '10', 10);

function hashDescription(html){
  const norm = (html || '').replace(/\s+/g,' ').trim().toLowerCase();
  return crypto.createHash('sha256').update(norm).digest('hex');
}

async function findOrCreateCatalog({ sku, title }){
  if (!sku){
    // Derive stub from title (basic heuristic)
    const parts = (title||'').split(/[-:,]/).map(s=>s.trim()).filter(Boolean);
    const manufacturer = parts[0] || 'UNKNOWN';
    const model = parts[1] || (title ? title.substring(0,60) : 'UNKNOWN');
    // no SKU -> cannot look up unique; create anonymous stub each time not ideal -> reuse by (manufacturer, model) if exists
    const existing = await Catalog.findOne({ where: { manufacturer, model } });
  if (existing) { return existing; }
    return Catalog.create({ manufacturer, model, description: null });
  }
  let cat = await Catalog.findOne({ where: { sku } });
  if (!cat){ cat = await Catalog.create({ sku, manufacturer: null, model: null }); }
  return cat;
}

async function upsertListingAndEbay({ itemId, title, price, currency, quantitySold, status, descriptionHtml, sku }){
  // Find existing ebay_listing by external item id
  let ebay = await EbayListing.findOne({ where: { external_item_id: itemId } });
  let listing;
  if (ebay){
    listing = await Listing.findOne({ where: { listing_id: ebay.internal_listing_id } });
  }
  if (!listing){
    // Create new listing + ebay listing
    const catalog = await findOrCreateCatalog({ sku, title });
    listing = await Listing.create({ title: title || 'Untitled', listing_price: price || null, item_id: catalog.item_id, status: 'imported', watchers: 0 });
    ebay = await EbayListing.create({ internal_listing_id: listing.listing_id, external_item_id: itemId, lifecycle_state: 'imported' });
  } else {
    // Update mutable fields
    await listing.update({ listing_price: price || listing.listing_price, watchers: listing.watchers });
  }
  // Description history versioning (insert if hash new)
  const hash = hashDescription(descriptionHtml||'');
  await sequelize.query(`INSERT INTO listing_description_history (listing_id, ebay_listing_id, revision_hash, raw_html, source, is_current) 
    SELECT :listingId, :ebayId, :hash, :html, 'import', true
    WHERE NOT EXISTS (
      SELECT 1 FROM listing_description_history WHERE listing_id = :listingId AND revision_hash = :hash
    )`, { replacements: { listingId: listing.listing_id, ebayId: ebay.ebay_listing_id, hash, html: descriptionHtml||'' } });
  // Mark older revisions not current
  await sequelize.query('UPDATE listing_description_history SET is_current = false WHERE listing_id = :listingId AND revision_hash <> :hash AND is_current = true', { replacements: { listingId: listing.listing_id, hash } });
  return { listingId: listing.listing_id, ebayListingId: ebay.ebay_listing_id };
}

async function run(){
  const startedAt = new Date();
  await sequelize.authenticate();
  const rows = await EbayListingImportRaw.findAll({ where: { process_status: 'pending' }, order: [['fetched_at','ASC']], limit: MAP_LIMIT });
  if (metrics) { metrics.inc('map.runs'); metrics.inc('map.selected', rows.length); metrics.mark('map.last_run'); }
  let processed=0, mapped=0, errors=0, skipped=0;
  for (const row of rows){
    try {
      const data = row.raw_json || {};
      const itemId = data.itemId || data.ItemID || data.Item?.ItemID;
      const title = data.title || data.Title || data.Item?.Title;
      const price = data.price?.value || data.SellingStatus?.CurrentPrice?.value || data.Item?.CurrentPrice?.Value;
      const currency = data.price?.currency || data.SellingStatus?.CurrentPrice?.currency || data.Item?.CurrentPrice?.CurrencyID;
      const quantitySold = data.quantitySold || data.SellingStatus?.QuantitySold || data.Item?.QuantitySold;
      const status = data.status || data.ListingStatus || data.Item?.ListingStatus;
      const descriptionHtml = data.descriptionHtml || data.Description || data.Item?.Description;
      const sku = data.sku || data.SKU || data.Item?.SKU;
      if (!itemId){ throw new Error('Missing itemId'); }
      if (DRY_RUN){
        skipped++;
        console.log('[DRY-RUN] Would map', itemId, { title, price, currency, quantitySold, status, hasDescription: !!descriptionHtml });
      } else {
        await sequelize.transaction(async t => {
          await upsertListingAndEbay({ itemId, title, price, currency, quantitySold, status, descriptionHtml, sku });
          row.process_status = 'mapped';
          row.processed_at = new Date();
          await row.save({ transaction: t });
        });
        mapped++;
        if (metrics) { metrics.inc('map.mapped'); }
      }
      processed++;
      if (metrics) { metrics.inc('map.processed'); }
    } catch(e){
      errors++;
      if (metrics) { metrics.inc('map.errors'); metrics.recordError('map', e); }
      if (!DRY_RUN){
        row.process_status = 'failed';
        row.process_error = e.message;
        row.attempt_count = (row.attempt_count||0)+1;
        await row.save();
      }
      console.error('Row failed', row.import_id, e.message);
    }
  }
  const finishedAt = new Date();
  const summary = {
    status: errors ? (mapped ? 'partial' : 'failed') : 'success',
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    processed,
    mapped,
    skipped,
    errors,
    selected: rows.length,
    dryRun: DRY_RUN,
    limit: MAP_LIMIT
  };
  if (metrics) { metrics.observe('map.run_duration_ms', summary.durationMs); }
  // Optional artificial delay for test scenarios (to exercise timeout handling)
  const testDelay = parseInt(process.env.MAP_TEST_DELAY_MS || '0', 10);
  if (testDelay > 0) {
    await new Promise(r => setTimeout(r, testDelay));
  }
  // Emit a machine-parseable one-line JSON form to simplify tests & tooling
  console.log('Mapping pass complete ' + JSON.stringify(summary));
  await sequelize.close();
}

run().catch(e=>{ console.error('Mapping failed', e); process.exit(1); });
