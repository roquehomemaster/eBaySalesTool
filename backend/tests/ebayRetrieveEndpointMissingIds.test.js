const request = require('supertest');
const app = require('../src/app');

describe('/api/admin/ebay/retrieve missing itemIds', () => {
  test('returns 400 when no IDs provided', async () => {
    const res = await request(app)
      .post('/api/admin/ebay/retrieve')
      .send({ itemIds: '' })
      .expect(400);
    expect(res.body).toHaveProperty('error', 'no_item_ids');
    expect(res.body).toHaveProperty('message');
  });
});
