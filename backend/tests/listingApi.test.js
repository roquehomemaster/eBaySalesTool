const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/utils/database');
const Listing = require('../src/models/listingModel');
const Catalog = require('../src/models/itemModel');

describe('Listing API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    // Create a catalog record for foreign key
    await Catalog.create({ description: 'Test Item', manufacturer: 'TestCo', model: 'T1000', serial_number: 'SN123', sku_barcode: 'SKU123' });
  });

  let listingId;

  it('should create a new listing', async () => {
    const res = await request(app)
      .post('/api/listings')
      .send({ title: 'Test Listing', listing_price: 100, item_id: 1 });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Test Listing');
    expect(Number(res.body.listing_price)).toBeCloseTo(100);
    expect(res.body.item_id).toBe(1);
    listingId = res.body.id;
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
    expect(res.body.id).toBe(listingId);
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
});
