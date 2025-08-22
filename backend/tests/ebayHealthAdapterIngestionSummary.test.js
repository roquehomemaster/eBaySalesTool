const request = require('supertest');
const app = require('../src/app');

describe('Health endpoint includes adapter & ingestion summaries', () => {
  test('health summary exposes ingestion retry counters and adapter metrics structure', async () => {
    // Trigger a retrieve with transient failures to populate counters
    process.env.EBAY_ADAPTER_FAIL_ONCE_IDS = '4001,4002';
    await request(app).post('/api/admin/ebay/retrieve').send({ itemIds: '4001,4002,4003', dryRun: true }).expect(200);
    const res = await request(app).get('/api/admin/ebay/health').expect(200);
    expect(res.body.summary).toBeDefined();
    const { ingestion, adapter } = res.body.summary;
    expect(ingestion).toBeDefined();
    expect(ingestion.retries).toBeGreaterThanOrEqual(1);
    expect(adapter).toBeDefined();
    // Calls should reflect at least 3 successful fetches (after retries)
    if (adapter.calls) { expect(adapter.calls).toBeGreaterThanOrEqual(3); }
  });
});
