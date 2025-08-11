// backend/tests/catalogApi.test.js
const request = require('supertest');
const app = require('../src/app');
const { sequelize, pool } = require('../src/utils/database');

describe('Catalog API', () => {
  let createdId;

  beforeAll(async () => {
    jest.setTimeout(60000);
    // Use API endpoint to seed and reset the database inside the container
    const res = await request(app).post('/api/populate-database');
    if (res.statusCode !== 200) {
      throw new Error(`Database seeding failed: ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
    // Truncate the catalog table before running tests
    await sequelize.query('TRUNCATE catalog RESTART IDENTITY CASCADE;');
  }, 60000);

  it('should create a catalog entry with valid data', async () => {
    const res = await request(app)
      .post('/api/catalog')
      .send({
        description: 'Test Catalog',
        manufacturer: 'TestCo',
        model: 'T1000',
        serial_number: 'SN123',
        sku_barcode: `SKU${Date.now()}A`
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('item_id');
    createdId = res.body.item_id;
  });

  it('should fail to create catalog entry with missing required field', async () => {
    const res = await request(app)
      .post('/api/catalog')
      .send({
        manufacturer: 'TestCo',
        model: 'T1000',
        serial_number: 'SN123',
        sku_barcode: 'SKU12346'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Missing required field/);
  });

  it('should fail to create catalog entry with duplicate SKU', async () => {
    const duplicateSku = 'SKU-DUPLICATE-TEST';
    // First create
    await request(app)
      .post('/api/catalog')
      .send({
        description: 'Test Catalog 2',
        manufacturer: 'TestCo',
        model: 'T1000',
        serial_number: 'SN124',
        sku_barcode: duplicateSku
      });
    // Second create with same SKU
    const res = await request(app)
      .post('/api/catalog')
      .send({
        description: 'Test Catalog 3',
        manufacturer: 'TestCo',
        model: 'T1000',
        serial_number: 'SN125',
        sku_barcode: duplicateSku // true duplicate
      });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/Duplicate SKU/);
  });

  it('should ignore extra/unexpected fields on create', async () => {
    const uniqueSku = 'SKU-EXTRA-FIELD-' + Date.now();
    const res = await request(app)
      .post('/api/catalog')
      .send({
        description: 'Extra Field Catalog',
        manufacturer: 'TestCo',
        model: 'T1001',
        serial_number: 'SN125',
        sku_barcode: uniqueSku,
        extra_field: 'should be ignored'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('item_id');
    expect(res.body).not.toHaveProperty('extra_field');
  });

  it('should get all catalog entries', async () => {
    const res = await request(app).get('/api/catalog');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('catalog');
    expect(Array.isArray(res.body.catalog)).toBe(true);
  });

  it('should get catalog entry by ID', async () => {
    const res = await request(app).get(`/api/catalog/${createdId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('item_id', createdId);
  });

  it('should return 404 for non-existent catalog entry', async () => {
    const res = await request(app).get('/api/catalog/999999');
    expect(res.statusCode).toBe(404);
  });

  it('should update catalog entry by ID', async () => {
    const res = await request(app)
      .put(`/api/catalog/${createdId}`)
      .send({ description: 'Updated Catalog' });
    expect(res.statusCode).toBe(200);
    expect(res.body.description).toBe('Updated Catalog');
  });

  it('should fail to update catalog entry with duplicate SKU', async () => {
    const duplicateSku = 'SKU-DUPLICATE-UPDATE';
    // Create two entries
    const res1 = await request(app)
      .post('/api/catalog')
      .send({
        description: 'Test Catalog 4',
        manufacturer: 'TestCo',
        model: 'T1000',
        serial_number: 'SN126',
        sku_barcode: duplicateSku
      });
    const res2 = await request(app)
      .post('/api/catalog')
      .send({
        description: 'Test Catalog 5',
        manufacturer: 'TestCo',
        model: 'T1000',
        serial_number: 'SN127',
        sku_barcode: 'SKU-UNIQUE-UPDATE'
      });
    // Try to update second entry to duplicate SKU
    const updateRes = await request(app)
      .put(`/api/catalog/${res2.body.item_id}`)
      .send({ sku_barcode: duplicateSku });
    expect(updateRes.statusCode).toBe(409);
    expect(updateRes.body.message).toMatch(/Duplicate SKU/);
  });

  it('should delete catalog entry by ID', async () => {
    const res = await request(app).delete(`/api/catalog/${createdId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/);
  });

  it('should return 404 when deleting non-existent catalog entry', async () => {
    const res = await request(app).delete('/api/catalog/999999');
    expect(res.statusCode).toBe(404);
  });

  it('should paginate catalog entries correctly', async () => {
    // Create 15 catalog entries for pagination
    for (let i = 0; i < 15; i++) {
      await request(app)
        .post('/api/catalog')
        .send({
          description: `Paginate Catalog ${i}`,
          manufacturer: 'PaginateCo',
          model: `P${i}`,
          serial_number: `SN-P${i}`,
          sku_barcode: `SKU-PAGINATE-${i}`
        });
    }
    // Request page 2 with limit 5
    const res = await request(app).get('/api/catalog?page=2&limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('catalog');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page', 2);
    expect(res.body).toHaveProperty('pageSize', 5);
    expect(Array.isArray(res.body.catalog)).toBe(true);
    expect(res.body.catalog.length).toBe(5);
    expect(res.body.total).toBeGreaterThanOrEqual(15);
  });

  afterAll(async () => {
    await sequelize.close();
    await pool.end(); // Close pg Pool to prevent open handles
  });
});
