const request = require('supertest');
const createInjectedApp = require('./testHelpers/createInjectedApp');
let app; let sequelize; let pool;
const Listing = require('../src/models/listingModel');
const Catalog = require('../src/models/itemModel'); // Use itemModel.js for catalog

describe('Listing API', () => {
  let catalogItemId;
  let listingId;
  beforeAll(async () => {
    jest.setTimeout(60000);
    const injected = await createInjectedApp({ database: process.env.PGDATABASE || 'listflowhq_test' });
    app = injected.app; sequelize = injected.sequelize; pool = injected.pool;
    // Global seed already executed; create isolated catalog entry for this suite
    const uniqueSku = 'SKU' + Date.now();
    const catalogEntry = await Catalog.create({ description: 'Test Item', manufacturer: 'TestCo', model: 'T1000', serial_number: 'SN123', sku: uniqueSku, barcode: uniqueSku + 'B' });
    catalogItemId = catalogEntry.item_id;
  }, 60000);

  it('should create a new listing', async () => {
    const res = await request(app)
      .post('/api/listings')
      .send({ title: 'Test Listing', listing_price: 100, item_id: catalogItemId });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Test Listing');
    expect(Number(res.body.listing_price)).toBeCloseTo(100);
    expect(res.body.item_id).toBe(catalogItemId);
    listingId = res.body.listing_id;
  });

  it('should get all listings (paginated)', async () => {
    const res = await request(app).get('/api/listings?page=1&limit=10');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.listings)).toBe(true);
  });

  it('should search listings', async () => {
    const res = await request(app).get('/api/listings/search?title=Test');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should get a listing by ID', async () => {
    const res = await request(app).get(`/api/listings/${listingId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.listing_id).toBe(listingId);
  });

  it('should update a listing by ID', async () => {
    const res = await request(app)
      .put(`/api/listings/${listingId}`)
      .send({ listing_price: 150 });
    expect(res.statusCode).toBe(200);
    expect(Number(res.body.listing_price)).toBeCloseTo(150);
  });

  it('should delete a listing by ID', async () => {
    const res = await request(app).delete(`/api/listings/${listingId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });
  afterAll(async () => {
    try { if (sequelize && sequelize.close) await sequelize.close(); } catch(_){}
    try { if (pool && pool.end) await pool.end(); } catch(_){}
  });
});
