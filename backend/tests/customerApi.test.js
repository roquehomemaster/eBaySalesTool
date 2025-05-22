const request = require('supertest');
const { app } = require('../src/app');
const { sequelize } = require('../src/utils/database');
const Customer = require('../src/models/customerModel');
const Ownership = require('../src/models/ownershipModel');
const Sales = require('../src/models/salesModel');
const Item = require('../src/models/itemModel');
const Listing = require('../src/models/listingModel');
const EbayInfo = require('../src/models/ebayInfoModel');

describe('Customer API', () => {
  beforeAll(async () => {
    // Print all registered models before sync
    console.log('DEBUG: Registered models:', Object.keys(sequelize.models));
    // Print Sequelize config
    console.log('DEBUG: Sequelize config:', sequelize.config);
    console.log('DEBUG: Sequelize dialect:', sequelize.getDialect());
    // Ensure model is registered and force sync in public schema
    await sequelize.sync({ force: true });
    // Print tables after sync
    const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('DEBUG: Tables in public schema after sync:', results.map(r => r.table_name));
    // Seed the Customer table for tests
    await Customer.bulkCreate([
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        address: '123 Main St',
        status: 'active'
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '555-5678',
        address: '456 Elm St',
        status: 'active'
      }
    ]);
    // DEBUG: Print current database, schema, and all tables to verify Customer table exists
    const [dbResult] = await sequelize.query('SELECT current_database() as db');
    const [schemaResult] = await sequelize.query("SELECT current_schema() as schema");
    console.log('DEBUG: Current database:', dbResult[0]?.db);
    console.log('DEBUG: Current schema:', schemaResult[0]?.schema);
    // Try a raw select from Customer
    try {
      const [customerRows] = await sequelize.query('SELECT * FROM "Customer"');
      console.log('DEBUG: Raw select from Customer after sync:', customerRows);
    } catch (err) {
      console.error('DEBUG: Error selecting from Customer after sync:', err.message);
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  let customerId;

  it('should create a new customer', async () => {
    const res = await request(app)
      .post('/api/customers')
      .send({ firstName: 'John', lastName: 'Doe', email: 'john.unique@example.com' }); // Use unique email
    expect(res.statusCode).toBe(201);
    expect(res.body.firstName).toBe('John');
    customerId = res.body.id;
    // Try a raw select from Customer after create
    try {
      const [customerRows] = await sequelize.query('SELECT * FROM "Customer"');
      console.log('DEBUG: Raw select from Customer after create:', customerRows);
    } catch (err) {
      console.error('DEBUG: Error selecting from Customer after create:', err.message);
    }
  });

  it('should get all customers (paginated)', async () => {
    const res = await request(app).get('/api/customers?page=1&limit=10');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.customers)).toBe(true);
  });

  it('should search customers', async () => {
    const res = await request(app).get('/api/customers/search?firstName=John');
    if (res.statusCode !== 200) {
      console.error('SEARCH CUSTOMERS ERROR:', res.body);
    }
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.customers)).toBe(true);
  });

  it('should get a customer by ID', async () => {
    const res = await request(app).get(`/api/customers/${customerId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(customerId);
  });

  it('should update a customer by ID', async () => {
    const res = await request(app)
      .put(`/api/customers/${customerId}`)
      .send({ lastName: 'Smith' });
    expect(res.statusCode).toBe(200);
    expect(res.body.lastName).toBe('Smith');
  });

  it('should delete a customer by ID', async () => {
    const res = await request(app).delete(`/api/customers/${customerId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });
});
