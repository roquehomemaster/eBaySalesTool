const request = require('supertest');
const app = require('../src/app');

describe('/api/admin/ebay/retrieve invalid IDs', () => {
  test('counts invalidIds for malformed IDs', async () => {
    const res = await request(app)
      .post('/api/admin/ebay/retrieve')
      .send({ itemIds: '123,abc,456,!!bad', dryRun: true })
      .expect(200);
    const s = res.body.summary;
    expect(s.requested).toBe(4);
    expect(s.invalidIds).toBeGreaterThanOrEqual(2); // 'abc' and '!!bad'
    expect(s.errors).toBeGreaterThanOrEqual(2);
  });
});
