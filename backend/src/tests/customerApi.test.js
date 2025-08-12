const request = require('supertest');
const app = require('../../src/app');

describe('Customer API (smoke)', () => {
  it('health endpoint responds', async () => {
    const res = await request(app).get('/api/health');
    expect([200,204]).toContain(res.statusCode);
  });
  it('customers list returns array', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});