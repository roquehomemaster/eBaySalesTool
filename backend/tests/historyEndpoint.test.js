const request = require('supertest');
const app = require('../src/app');
const { ENTITY } = require('../src/constants/entities');

// This test relies on existing listingAudit test seeding a listing through API
// We create a fresh listing here to ensure isolated audit rows.

describe('History Endpoint', () => {
  let listingId;
  test('create listing and fetch its history', async () => {
    // Create a catalog item to ensure item_id is valid (avoid assumption item_id=1)
    const uniqueSku = 'SKU-HIST-ENDPT-' + Date.now();
    const catRes = await request(app)
      .post('/api/catalog')
      .send({ description: 'Hist Endpoint Item', manufacturer: 'HEI', model: 'HEND', serial_number: 'HSN' + Date.now(), sku_barcode: uniqueSku });
    expect(catRes.status).toBe(201);
    const itemId = catRes.body.item_id;
    const createRes = await request(app)
      .post('/api/listings')
      .send({ title: 'Hist Test', listing_price: '12.34', item_id: itemId });
    expect(createRes.status).toBe(201);
    listingId = createRes.body.listing_id;

    // Update listing twice
    await request(app).put(`/api/listings/${listingId}`).send({ listing_price: '15.00' });
    await request(app).put(`/api/listings/${listingId}`).send({ title: 'Hist Test Updated' });

    const histRes = await request(app).get(`/api/history/${ENTITY.LISTING}/${listingId}?limit=10`);
    expect(histRes.status).toBe(200);
    expect(histRes.body.entity).toBe(ENTITY.LISTING);
    expect(histRes.body.entity_id).toBe(listingId);
    expect(histRes.body.results.length).toBeGreaterThanOrEqual(3); // create + 2 updates
    const actions = histRes.body.results.map(r => r.action);
    expect(actions).toContain('create');
    expect(actions.filter(a => a === 'update').length).toBeGreaterThanOrEqual(2);
  });

  test('field filter returns only matching rows', async () => {
    const res = await request(app).get(`/api/history/${ENTITY.LISTING}/${listingId}?fields=title`);
    expect(res.status).toBe(200);
    // Only rows where title changed should have changed_fields including title
    for (const row of res.body.results) {
      if (row.action === 'update') {
        expect(row.changed_fields).toContain('title');
      }
    }
  });
});
