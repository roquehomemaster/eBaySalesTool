const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/utils/database');
const Catalog = require('../src/models/itemModel');

/**
 * Verifies audit entries in historylogs for listing lifecycle.
 */
describe('Listing Audit Logging', () => {
  let listingId;
  let itemId;

  beforeAll(async () => {
    // Create a catalog item
    const uniqueSku = 'SKU-AUDIT-' + Date.now();
    const cat = await Catalog.create({ description: 'Audit Item', manufacturer: 'AuditCo', model: 'A100', serial_number: 'AUD123', sku_barcode: uniqueSku });
    itemId = cat.item_id;
  });

  it('creates listing and writes create audit row', async () => {
    const res = await request(app)
      .post('/api/listings')
      .send({ title: 'Audit Listing', listing_price: 12.34, item_id: itemId });
    expect(res.statusCode).toBe(201);
    listingId = res.body.listing_id;
    const auditRes = await pool.query("SELECT * FROM historylogs WHERE entity='listing' AND entity_id=$1 AND action='create' ORDER BY created_at DESC", [listingId]);
    expect(auditRes.rowCount).toBeGreaterThanOrEqual(1);
    const row = auditRes.rows[0];
    expect(row.changed_fields).toEqual(expect.arrayContaining(['title','listing_price','item_id']));
    expect(row.after_data.title).toBe('Audit Listing');
  });

  it('updates listing and logs only changed fields', async () => {
    const res = await request(app)
      .put(`/api/listings/${listingId}`)
      .send({ listing_price: 99.99 });
    expect(res.statusCode).toBe(200);
    const auditRes = await pool.query("SELECT * FROM historylogs WHERE entity='listing' AND entity_id=$1 AND action='update' ORDER BY created_at DESC", [listingId]);
    expect(auditRes.rowCount).toBeGreaterThanOrEqual(1);
    const last = auditRes.rows[0];
    expect(last.changed_fields).toEqual(['listing_price']);
    expect(last.before_data.listing_price).toBeDefined();
  expect(Number(last.after_data.listing_price)).toBeCloseTo(99.99);
  });

  it('deletes listing and logs delete snapshot', async () => {
    const res = await request(app).delete(`/api/listings/${listingId}`);
    expect(res.statusCode).toBe(200);
    const auditRes = await pool.query("SELECT * FROM historylogs WHERE entity='listing' AND entity_id=$1 AND action='delete' ORDER BY created_at DESC", [listingId]);
    expect(auditRes.rowCount).toBe(1);
    const row = auditRes.rows[0];
    expect(row.before_data.title).toBeDefined();
    expect(row.after_data).toBeNull();
  });
});
