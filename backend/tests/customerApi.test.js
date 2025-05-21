const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/utils/database');
const Customer = require('../models/customerModel');

describe('Customer API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  let customerId;

  it('should create a new customer', async () => {
    const res = await request(app)
      .post('/api/customers')
      .send({ firstName: 'John', lastName: 'Doe', email: 'john@example.com' });
    expect(res.statusCode).toBe(201);
    expect(res.body.firstName).toBe('John');
    customerId = res.body.id;
  });

  it('should get all customers (paginated)', async () => {
    const res = await request(app).get('/api/customers?page=1&limit=10');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.customers)).toBe(true);
  });

  it('should search customers', async () => {
    const res = await request(app).get('/api/customers/search?firstName=John');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
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
