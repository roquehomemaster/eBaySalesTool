const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/utils/database');
const Ownership = require('../src/models/ownershipModel');

describe('Ownership API', () => {
  beforeAll(async () => {
    jest.setTimeout(60000);
    // Use API endpoint to seed and reset the database inside the container
    const res = await request(app).post('/api/populate-database');
    if (res.statusCode !== 200) {
      throw new Error(`Database seeding failed: ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
    if (process.env.VERBOSE_TESTS === '1') {
      console.log('Registered models:', Object.keys(sequelize.models));
    }
    // Robust table existence check using pg_tables
    const [pgTables] = await sequelize.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    const tableNames = pgTables.map(r => r.tablename);
    if (process.env.VERBOSE_TESTS === '1') {
      console.log('pg_tables (public):', tableNames);
    }
    // Check for required tables
    const requiredTables = ['ownership', 'listing', 'ebayinfo', 'application_account', 'roles', 'customer', 'catalog'];
    requiredTables.forEach(tbl => {
      if (!tableNames.includes(tbl)) {
        throw new Error(`Missing required table: ${tbl}. Found tables: ${tableNames.join(', ')}`);
      }
    });
  });

  let ownershipId;

  it('should create a new ownership', async () => {
    const res = await request(app)
      .post('/api/ownership')
      .send({
        ownership_type: 'Full',
        first_name: 'John',
        last_name: 'Doe',
        address: '123 Main St',
        telephone: '555-1234',
        email: 'john.doe@example.com',
        company_name: 'Acme Corp',
        company_address: '456 Business Rd',
        company_telephone: '555-5678',
        company_email: 'contact@acme.com',
        assigned_contact_first_name: 'Jane',
        assigned_contact_last_name: 'Smith',
        assigned_contact_telephone: '555-8765',
        assigned_contact_email: 'jane.smith@acme.com'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.ownership_type).toBe('Full');
    ownershipId = res.body.ownership_id;
  });

  it('should get all ownerships (paginated)', async () => {
    const res = await request(app).get('/api/ownership?page=1&limit=10');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.ownerships)).toBe(true);
  });

  it('should search ownerships', async () => {
    const res = await request(app).get('/api/ownership/search?ownership_type=Full');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should get an ownership by ID', async () => {
    const res = await request(app).get(`/api/ownership/${ownershipId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.ownership_id).toBe(ownershipId);
  });

  it('should update an ownership by ID', async () => {
    const res = await request(app)
      .put(`/api/ownership/${ownershipId}`)
      .send({ ownership_type: 'Partial' });
    expect(res.statusCode).toBe(200);
    expect(res.body.ownership_type).toBe('Partial');
  });

  it('should delete an ownership by ID', async () => {
    const res = await request(app).delete(`/api/ownership/${ownershipId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });
});
