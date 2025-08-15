/**
 * listingDefaultStatusConfig.test.js
 * Ensures that if appconfig overrides listing_default_status, new listings adopt it.
 */
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/utils/database');

describe('Configurable default listing status', () => {
  const NEW_DEFAULT = 'ready_to_list';

  beforeAll(async () => {
    await pool.query("INSERT INTO appconfig (config_key, config_value, data_type) VALUES ('listing_default_status', $1, 'text') ON CONFLICT (config_key) DO UPDATE SET config_value=EXCLUDED.config_value, data_type='text'", [NEW_DEFAULT]);
  });

  test('new listing without explicit status uses configured default', async () => {
    // Create catalog item first
  const catResp = await request(app).post('/api/catalog').send({ description: 'CFG Default', manufacturer: 'CfgM', model: 'CfgX', serial_number: 'CFG-1', sku: 'CFG-A-' + Date.now(), barcode: 'CFG-B-' + Date.now() });
    expect(catResp.status).toBe(201);
    const itemId = catResp.body.item_id;

    const createResp = await request(app).post('/api/listings').send({ title: 'Listing Config Default', listing_price: 12.34, item_id: itemId });
    expect(createResp.status).toBe(201);
    expect(createResp.body.status).toBe(NEW_DEFAULT);
  });
});
