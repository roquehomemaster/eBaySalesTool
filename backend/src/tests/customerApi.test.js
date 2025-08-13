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
  // Endpoint returns a paginated object: { customers: [...], total, page, pageSize }
  // Older expectation assumed bare array. Support both for forward compatibility.
  const list = Array.isArray(res.body) ? res.body : res.body.customers;
  expect(Array.isArray(list)).toBe(true);
    if (!Array.isArray(res.body)) {
      expect(typeof res.body.total).toBe('number');
      expect(typeof res.body.page).toBe('number');
      expect(typeof res.body.pageSize).toBe('number');
    }
  });
});