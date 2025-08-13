/**
 * listingItemIdImmutable.test.js
 * Ensures that attempting to change item_id on listing update is ignored (immutable) and not audited.
 */
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/utils/database');

describe('Listing item_id immutability', () => {
  let listingId; let originalItemId;
  beforeAll(async () => {
    // Create a catalog item to reference (avoid assuming item_id=1 exists)
    const catalogRes = await request(app).post('/api/catalog').send({ description: 'Immutable Cat', manufacturer: 'IMM', model: 'IMM1', serial_number: `SNIMM-${Date.now()}`, sku_barcode: `SKU-IMM-${Date.now()}` });
    const itemId = catalogRes.body.item_id;
    const createRes = await request(app)
      .post('/api/listings')
      .send({ title: 'Immutable Test', listing_price: 10.5, item_id: itemId });
    listingId = createRes.body.listing_id;
    originalItemId = createRes.body.item_id;
  });

  test('attempting to change item_id is ignored and not audited', async () => {
    await request(app)
      .put(`/api/listings/${listingId}`)
      .send({ item_id: 9999 }) // only immutable field, should be ignored and return current state
      .expect(200);
    const getRes = await request(app).get(`/api/listings/${listingId}`);
    expect(getRes.body.item_id).toBe(originalItemId); // unchanged
    // Ensure no audit update row recorded for item_id change
    const auditRes = await pool.query("SELECT * FROM historylogs WHERE entity='listing' AND entity_id=$1 AND action='update' ORDER BY created_at DESC", [listingId]);
    for (const row of auditRes.rows) {
      if (row.changed_fields) {
        expect(row.changed_fields).not.toContain('item_id');
      }
    }
  });
});
