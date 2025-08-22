const request = require('supertest');
process.env.EBAY_ADAPTER_FAIL_ONCE_IDS = '7001';
process.env.EBAY_RATE_LIMIT_BUCKET_MAX = '2';
process.env.EBAY_RATE_LIMIT_REFILL_MS = '200';
const app = require('../src/app');

describe('Rate limiter integration', () => {
  test('multiple sequential retrieves consume and refill tokens (smoke)', async () => {
    // First batch (2 tokens)
    await request(app).post('/api/admin/ebay/retrieve').send({ itemIds: '7001,7002', dryRun: true }).expect(200);
    // Second batch should trigger waiting for refill when exceeding bucket (depending on timing)
    await request(app).post('/api/admin/ebay/retrieve').send({ itemIds: '7003,7004', dryRun: true }).expect(200);
    const health = await request(app).get('/api/admin/ebay/health').expect(200);
    expect(health.body.summary.rate).toBeDefined();
  });
});
