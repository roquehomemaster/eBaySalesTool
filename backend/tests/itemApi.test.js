// backend/tests/catalogApi.test.js
const request = require('supertest');
const app = require('../src/app');
const { sequelize, pool } = require('../src/utils/database');

describe('Catalog API', () => {
  let createdId;

  beforeAll(async () => {
    // Truncate the Catalog table before running tests
    await sequelize.query('TRUNCATE "Catalog" RESTART IDENTITY CASCADE;');
  });

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
    expect(res.body).toHaveProperty('id');
    createdId = res.body.id;
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
    const res = await request(app)
      .post('/api/catalog')
      .send({
        description: 'Test Catalog 2',
        manufacturer: 'TestCo',
        model: 'T1000',
        serial_number: 'SN124',
        sku_barcode: `SKU${Date.now()}A` // duplicate
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
    expect(res.body).toHaveProperty('id');
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
    expect(res.body).toHaveProperty('id', createdId);
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
    const uniqueSku = 'SKU-UNIQUE-UPDATE-' + Date.now();
    // Create a second catalog entry with a unique SKU
    const res1 = await request(app)
      .post('/api/catalog')
      .send({
        description: 'Second Catalog',
        manufacturer: 'TestCo',
        model: 'T1002',
        serial_number: 'SN126',
        sku_barcode: uniqueSku
      });
    expect(res1.statusCode).toBe(201);
    const secondId = res1.body.id;

    // Try to update second catalog entry to use the first entry's SKU
    const res2 = await request(app)
      .put(`/api/catalog/${secondId}`)
      .send({ sku_barcode: `SKU${Date.now()}A` });
    expect(res2.statusCode).toBe(409);
    expect(res2.body.message).toMatch(/Duplicate SKU/);
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
