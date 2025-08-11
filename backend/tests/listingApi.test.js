const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/utils/database');
const Listing = require('../src/models/listingModel');
const Catalog = require('../src/models/itemModel'); // Use itemModel.js for catalog

describe('Listing API', () => {
  let catalogItemId;
  let listingId;
  beforeAll(async () => {
    jest.setTimeout(60000);
    // Use API endpoint to seed and reset the database inside the container
    const res = await request(app).post('/api/populate-database');
    if (res.statusCode !== 200) {
      throw new Error(`Database seeding failed: ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
    // Log debug info only when VERBOSE_TESTS is enabled
    if (process.env.VERBOSE_TESTS === '1') {
      console.log('Registered models:', Object.keys(sequelize.models));
    }
  // Log all tables in public schema (robust via pg_tables)
  const [pgTables] = await sequelize.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  const tableNames = pgTables.map(r => r.tablename);
  if (process.env.VERBOSE_TESTS === '1') {
    console.log('Tables in public schema (pg_tables):', tableNames);
  }
    // Check for required tables
    const requiredTables = ['ownership', 'listing', 'ebayinfo', 'application_account', 'roles', 'customer', 'catalog'];
    requiredTables.forEach(tbl => {
      if (!tableNames.includes(tbl)) {
        throw new Error(`Missing required table: ${tbl}`);
      }
    });
    // Create a catalog record for foreign key using itemModel.js with unique SKU
    const uniqueSku = 'SKU' + Date.now();
    const catalogEntry = await Catalog.create({ description: 'Test Item', manufacturer: 'TestCo', model: 'T1000', serial_number: 'SN123', sku_barcode: uniqueSku });
    catalogItemId = catalogEntry.item_id;
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for DB commit
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
});
