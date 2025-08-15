/**
 * listingStatusDefault.test.js
 * Verifies status defaults to 'draft' at creation and does not produce a separate update audit just for initialization.
 */
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/utils/database');

describe('Listing status default', () => {
  test('create listing without status -> status matches configured default and only create audit contains status', async () => {
  const catalogRes = await request(app).post('/api/catalog').send({ description: 'Status Test Cat', manufacturer: 'M', model: 'X', serial_number: 'S1', sku: `SKU-STATUS-${Date.now()}`, barcode: `BC-STATUS-${Date.now()}` });
    const itemId = catalogRes.body.item_id;
    const createRes = await request(app).post('/api/listings').send({ title: 'Status Test Listing', listing_price: 5.55, item_id: itemId });
    expect(createRes.status).toBe(201);
    // Determine current configured default (fallback 'draft')
    let expectedDefault = 'draft';
    try {
      const cfg = await pool.query("SELECT config_value FROM appconfig WHERE config_key='listing_default_status'");
      if (cfg.rowCount > 0 && cfg.rows[0].config_value) {
        expectedDefault = cfg.rows[0].config_value.trim();
      }
    } catch (_) { /* ignore */ }
    expect(createRes.body.status).toBe(expectedDefault);
    const listingId = createRes.body.listing_id;
    const audits = await pool.query("SELECT * FROM historylogs WHERE entity='listing' AND entity_id=$1 ORDER BY created_at ASC", [listingId]);
    const createAudit = audits.rows.find(r => r.action === 'create');
    expect(createAudit).toBeDefined();
    if (createAudit.changed_fields) {
      expect(createAudit.changed_fields).toContain('status');
    }
    const immediateUpdates = audits.rows.filter(r => r.action === 'update');
    if (immediateUpdates.length) {
      for (const row of immediateUpdates) {
        expect(row.changed_fields || []).not.toEqual(['status']);
      }
    }
  });
});
