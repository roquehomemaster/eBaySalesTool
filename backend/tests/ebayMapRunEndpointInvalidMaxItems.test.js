const request = require('supertest');
const app = require('../src/app');

describe('/api/admin/ebay/map/run invalid maxItems', () => {
  test('returns 400 for invalid maxItems', async () => {
    const res = await request(app)
      .post('/api/admin/ebay/map/run')
      .send({ dryRun: true, maxItems: 0 })
      .expect(400);
    expect(res.body).toHaveProperty('error', 'invalid_maxItems');
  });
});
