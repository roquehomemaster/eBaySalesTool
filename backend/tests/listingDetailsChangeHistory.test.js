const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/utils/database');
const Catalog = require('../src/models/itemModel');

/**
 * Verifies listing details endpoint returns change_history with configurable limit.
 */
describe('Listing Details Change History Limit', () => {
  let listingId;
  let itemId;

  beforeAll(async () => {
    // Create a catalog item for listing
    const uniqueSku = 'SKU-DETAILS-CH-' + Date.now();
  const cat = await Catalog.create({ description: 'Details CH Item', manufacturer: 'DetCo', model: 'D100', serial_number: 'DET' + Date.now(), sku: uniqueSku, barcode: uniqueSku + 'B' });
    itemId = cat.item_id;
  });

  test('respects appconfig history_display_limit when fetching details', async () => {
    // Ensure a known small limit (3) in appconfig (direct DB insert for speed)
    await pool.query("INSERT INTO appconfig (config_key, config_value) VALUES ('history_display_limit','3') ON CONFLICT (config_key) DO UPDATE SET config_value=EXCLUDED.config_value");

    // Create listing (creates 1 audit row)
    const createRes = await request(app)
      .post('/api/listings')
      .send({ title: 'Details Hist Listing', listing_price: 10.5, item_id: itemId });
    expect(createRes.statusCode).toBe(201);
    listingId = createRes.body.listing_id;

    // Generate multiple updates (more than limit) to exceed limit (5 updates)
    const updates = [12.34, 13.34, 14.34, 15.34, 16.34];
    for (const price of updates) {
      const u = await request(app).put(`/api/listings/${listingId}`).send({ listing_price: price });
      expect(u.statusCode).toBe(200);
    }

    // Fetch details
  const detailsRes = await request(app).get(`/api/listings/${listingId}/details?history_limit=2&history_offset=0`);
    expect(detailsRes.statusCode).toBe(200);
    const body = detailsRes.body;
  expect(Array.isArray(body.change_history)).toBe(true);
  expect(body.change_history_limit).toBe(3); // config cap
  expect(body.change_history_requested_limit).toBe(2);
  expect(body.change_history_effective_limit).toBe(2);
  expect(body.change_history_offset).toBe(0);
  expect(body.change_history_total).toBeGreaterThan(3);
  expect(body.change_history.length).toBe(2); // requested 2 within cap
    // Because controller orders ASC then slices, first entries should include the create action
    const actions = body.change_history.map(r => r.action);
    expect(actions).toContain('create');
  });

  test('increasing limit returns more history rows (possibly all) and ownership_history key absent', async () => {
    // Retrieve appconfig entries; if history_display_limit exists update via API (fallback to direct if needed)
    // Update via raw SQL (faster) but validate via details fetch
    await pool.query("UPDATE appconfig SET config_value='50' WHERE config_key='history_display_limit'");
  const detailsRes = await request(app).get(`/api/listings/${listingId}/details?history_limit=80&history_offset=1`);
    expect(detailsRes.statusCode).toBe(200);
    const body = detailsRes.body;
  expect(body.change_history_limit).toBe(50); // config updated
  expect(body.change_history_requested_limit).toBe(80); // requested higher than config -> capped
  expect(body.change_history_effective_limit).toBe(50);
  expect(body.change_history_offset).toBe(1);
  // Because of offset 1, length <= total and first entry is skipped
  expect(body.change_history.length).toBeLessThanOrEqual(body.change_history_total - 1);
  expect(body.change_history_total).toBeGreaterThan(3);
    expect(body).not.toHaveProperty('ownership_history');
  });

  afterAll(async () => {
    // Explicitly end pool connections opened directly here (globalTeardown will also run but this shortens lifetime)
    try { await pool.end(); } catch(_) {}
  });
});
