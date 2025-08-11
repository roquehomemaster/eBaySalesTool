const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/utils/database');
const Customer = require('../src/models/customerModel');
const Ownership = require('../src/models/ownershipModel');
const Sales = require('../src/models/salesModel');
const Item = require('../src/models/itemModel');
const Listing = require('../src/models/listingModel');
const EbayInfo = require('../src/models/ebayInfoModel');

describe('Customer API', () => {
  beforeAll(async () => {
    jest.setTimeout(60000);
    // Use API endpoint to seed and reset the database inside the container
    const res = await request(app).post('/api/populate-database');
    if (res.statusCode !== 200) {
      throw new Error(`Database seeding failed: ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
    if (process.env.VERBOSE_TESTS === '1') {
      // Print all registered models before sync
      console.log('DEBUG: Registered models:', Object.keys(sequelize.models));
      // Print Sequelize config
      console.log('DEBUG: Sequelize config:', sequelize.config);
      console.log('DEBUG: Sequelize dialect:', sequelize.getDialect());
    }
  // Print tables after sync (robust via pg_tables)
  const [pgTables] = await sequelize.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  if (process.env.VERBOSE_TESTS === '1') {
    console.log('DEBUG: Tables in public schema after sync:', pgTables.map(r => r.tablename));
  }
    // Seed the Customer table for tests
    await Customer.bulkCreate([
      {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        address: '123 Main St',
        status: 'active'
      },
      {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone: '555-5678',
        address: '456 Elm St',
        status: 'active'
      }
    ]);
    // DEBUG: Print current database, schema, and all tables to verify Customer table exists
    const [dbResult] = await sequelize.query('SELECT current_database() as db');
    const [schemaResult] = await sequelize.query("SELECT current_schema() as schema");
    if (process.env.VERBOSE_TESTS === '1') {
      console.log('DEBUG: Current database:', dbResult[0]?.db);
      console.log('DEBUG: Current schema:', schemaResult[0]?.schema);
    }
    // Try a raw select from Customer
    try {
      const [customerRows] = await sequelize.query('SELECT * FROM customerdetails');
      if (process.env.VERBOSE_TESTS === '1') {
        console.log('DEBUG: Raw select from customerdetails after sync:', customerRows);
      }
    } catch (err) {
      console.error('DEBUG: Error selecting from customerdetails after sync:', err.message);
    }
  }, 60000);

  afterAll(async () => {
    await sequelize.close();
  });

  let customerId;

  it('should create a new customer', async () => {
    const res = await request(app)
      .post('/api/customers')
      .send({ first_name: 'John', last_name: 'Doe', email: 'john.unique@example.com' }); // Use unique email
    expect(res.statusCode).toBe(201);
    expect(res.body.first_name).toBe('John');
    customerId = res.body.id;
    // Try a raw select from customerdetails after create
    try {
      const [customerRows] = await sequelize.query('SELECT * FROM customerdetails');
      if (process.env.VERBOSE_TESTS === '1') {
        console.log('DEBUG: Raw select from customerdetails after create:', customerRows);
      }
    } catch (err) {
      console.error('DEBUG: Error selecting from customerdetails after create:', err.message);
    }
  });

  it('should get all customers (paginated)', async () => {
    const res = await request(app).get('/api/customers?page=1&limit=10');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.customers)).toBe(true);
  });

  it('should search customers', async () => {
    const res = await request(app).get('/api/customers/search?first_name=John');
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
      .send({ last_name: 'Smith' });
    expect(res.statusCode).toBe(200);
    expect(res.body.last_name).toBe('Smith');
  });

  it('should delete a customer by ID', async () => {
    const res = await request(app).delete(`/api/customers/${customerId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });
});
