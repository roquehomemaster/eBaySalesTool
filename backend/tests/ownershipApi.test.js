const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/utils/database');
const Ownership = require('../src/models/ownershipModel');

describe('Ownership API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  let ownershipId;

  it('should create a new ownership', async () => {
    const res = await request(app)
      .post('/api/ownership')
      .send({ ownership_type: 'Full' });
    expect(res.statusCode).toBe(201);
    expect(res.body.ownership_type).toBe('Full');
    ownershipId = res.body.id;
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
    expect(res.body.id).toBe(ownershipId);
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
