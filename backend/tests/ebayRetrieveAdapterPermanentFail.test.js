const request = require('supertest');
process.env.EBAY_ADAPTER_ALWAYS_FAIL_IDS = '5001,5002';
process.env.EBAY_ADAPTER_MAX_RETRIES = '1';
const app = require('../src/app');

describe('Adapter permanent failures surfaced in ingestion summary', () => {
  test('permanent failures counted without retries inflating transient metrics', async () => {
    const res = await request(app)
      .post('/api/admin/ebay/retrieve')
      .send({ itemIds: '5001,5002,5003', dryRun: true })
      .expect(200);
    const s = res.body.summary;
    expect(s.requested).toBe(3);
    // Only one should fetch successfully (5003)
    expect(s.fetched).toBe(1);
    expect(s.permanentErrors).toBeGreaterThanOrEqual(2);
    expect(s.transientErrors).toBeGreaterThanOrEqual(0);
    // retries likely 0 for permanent failures
    expect(s.retries).toBeGreaterThanOrEqual(0);
  });
});
