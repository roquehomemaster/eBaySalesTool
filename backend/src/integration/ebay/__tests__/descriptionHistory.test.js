const { sequelize } = require('../../../utils/database');
const Listing = require('../../../models/listingModel');
const Catalog = require('../../../models/catalogModel');
const { EbayListing } = require('../../../../models/ebayIntegrationModels');

// This test assumes migrations applied & listing_description_history table exists.
// It verifies idempotent insertion of description revisions and current flag handling.

describe('description history versioning', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('inserts only new revision hashes and flips is_current', async () => {
    // Create catalog/listing/ebay listing
    const cat = await Catalog.create({ manufacturer:'TestCo', model:'ModelX' });
    const listing = await Listing.create({ title:'Item X', listing_price: 10.0, item_id: cat.item_id, status:'imported', watchers:0 });
    const ebay = await EbayListing.create({ internal_listing_id: listing.listing_id, external_item_id: 'ITEM-X', lifecycle_state:'imported' });

    async function insertRevision(html){
      const crypto = require('crypto');
      const norm = html.replace(/\s+/g,' ').trim().toLowerCase();
      const hash = crypto.createHash('sha256').update(norm).digest('hex');
      await sequelize.query(`INSERT INTO listing_description_history (listing_id, ebay_listing_id, revision_hash, raw_html, source, is_current)
        SELECT :listingId, :ebayId, :hash, :html, 'test', true
        WHERE NOT EXISTS (SELECT 1 FROM listing_description_history WHERE listing_id=:listingId AND revision_hash=:hash)`, { replacements:{ listingId: listing.listing_id, ebayId: ebay.ebay_listing_id, hash, html } });
      await sequelize.query('UPDATE listing_description_history SET is_current=false WHERE listing_id=:listingId AND revision_hash<>:hash AND is_current=true', { replacements:{ listingId: listing.listing_id, hash } });
    }

    await insertRevision('<p>First</p>');
    await insertRevision('<p>First</p>'); // duplicate no new row
    await insertRevision('<p>Second</p>');

    const [rows] = await sequelize.query('SELECT revision_hash, is_current FROM listing_description_history WHERE listing_id = :id ORDER BY captured_at ASC', { replacements:{ id: listing.listing_id } });
    expect(rows.length).toBe(2);
    const currentCount = rows.filter(r => r.is_current).length;
    expect(currentCount).toBe(1);
  });
});
