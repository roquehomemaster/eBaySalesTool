// backend/tests/itemApi.test.js
const request = require('supertest');
const app = require('../src/app');
const { sequelize, pool } = require('../src/utils/database');

describe('Item API', () => {
  let createdId;

  beforeAll(async () => {
    // Truncate the Item table before running tests
    await sequelize.query('TRUNCATE "Items" RESTART IDENTITY CASCADE;');
  });

  it('should create an item with valid data', async () => {
    const res = await request(app)
      .post('/api/items')
      .send({
        description: 'Test Item',
        manufacturer: 'TestCo',
        model: 'T1000',
        serial_number: 'SN123',
        sku_barcode: 'SKU12345'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    createdId = res.body.id;
  });

  it('should fail to create item with missing required field', async () => {
    const res = await request(app)
      .post('/api/items')
      .send({
        manufacturer: 'TestCo',
        model: 'T1000',
        serial_number: 'SN123',
        sku_barcode: 'SKU12346'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Missing required field/);
  });

  it('should fail to create item with duplicate SKU', async () => {
    const res = await request(app)
      .post('/api/items')
      .send({
        description: 'Test Item 2',
        manufacturer: 'TestCo',
        model: 'T1000',
        serial_number: 'SN124',
        sku_barcode: 'SKU12345' // duplicate
      });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/Duplicate SKU/);
  });

  it('should ignore extra/unexpected fields on create', async () => {
    const uniqueSku = 'SKU-EXTRA-FIELD-' + Date.now();
    const res = await request(app)
      .post('/api/items')
      .send({
        description: 'Extra Field Item',
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

  it('should get all items', async () => {
    const res = await request(app).get('/api/items');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('should get item by ID', async () => {
    const res = await request(app).get(`/api/items/${createdId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', createdId);
  });

  it('should return 404 for non-existent item', async () => {
    const res = await request(app).get('/api/items/999999');
    expect(res.statusCode).toBe(404);
  });

  it('should update item by ID', async () => {
    const res = await request(app)
      .put(`/api/items/${createdId}`)
      .send({ description: 'Updated Item' });
    expect(res.statusCode).toBe(200);
    expect(res.body.description).toBe('Updated Item');
  });

  it('should fail to update item with duplicate SKU', async () => {
    const uniqueSku = 'SKU-UNIQUE-UPDATE-' + Date.now();
    // Create a second item with a unique SKU
    const res1 = await request(app)
      .post('/api/items')
      .send({
        description: 'Second Item',
        manufacturer: 'TestCo',
        model: 'T1002',
        serial_number: 'SN126',
        sku_barcode: uniqueSku
      });
    expect(res1.statusCode).toBe(201);
    const secondId = res1.body.id;

    // Try to update second item to use the first item's SKU
    const res2 = await request(app)
      .put(`/api/items/${secondId}`)
      .send({ sku_barcode: 'SKU12345' });
    expect(res2.statusCode).toBe(409);
    expect(res2.body.message).toMatch(/Duplicate SKU/);
  });

  it('should delete item by ID', async () => {
    const res = await request(app).delete(`/api/items/${createdId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/);
  });

  it('should return 404 when deleting non-existent item', async () => {
    const res = await request(app).delete('/api/items/999999');
    expect(res.statusCode).toBe(404);
  });

  it('should paginate items correctly', async () => {
    // Create 15 items for pagination
    for (let i = 0; i < 15; i++) {
      await request(app)
        .post('/api/items')
        .send({
          description: `Paginate Item ${i}`,
          manufacturer: 'PaginateCo',
          model: `P${i}`,
          serial_number: `SN-P${i}`,
          sku_barcode: `SKU-PAGINATE-${i}`
        });
    }
    // Request page 2 with limit 5
    const res = await request(app).get('/api/items?page=2&limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page', 2);
    expect(res.body).toHaveProperty('pageSize', 5);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(5);
    expect(res.body.total).toBeGreaterThanOrEqual(15);
  });

  afterAll(async () => {
    await sequelize.close();
    await pool.end(); // Close pg Pool to prevent open handles
  });
});
