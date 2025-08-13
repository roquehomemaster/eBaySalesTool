const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/utils/database');
const Ownership = require('../src/models/ownershipModel');

describe('Ownership API', () => {
  beforeAll(async () => {
    jest.setTimeout(60000);
    // Global seed done; nothing else needed pre-tests
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
