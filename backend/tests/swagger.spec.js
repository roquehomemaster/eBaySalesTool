const request = require('supertest');
const app = require('../src/app');

describe('Swagger endpoints', () => {
  test('GET /swagger.json returns openapi spec', async () => {
    const res = await request(app).get('/swagger.json');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('openapi');
    expect(res.body).toHaveProperty('paths');
  });
  test('GET /api-docs/swagger.json returns openapi spec', async () => {
    const res = await request(app).get('/api-docs/swagger.json');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('openapi');
    expect(res.body).toHaveProperty('paths');
  });
});
