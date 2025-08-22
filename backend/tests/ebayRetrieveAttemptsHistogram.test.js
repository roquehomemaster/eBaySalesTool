const request = require('supertest');
process.env.EBAY_ADAPTER_FAIL_ONCE_IDS = '6001,6002';
const app = require('../src/app');

describe('Ingestion attempts histogram & avgAttempts', () => {
  test('avgAttempts > 1 when retries occur and histogram present', async () => {
    const res = await request(app)
      .post('/api/admin/ebay/retrieve')
      .send({ itemIds: '6001,6002,6003', dryRun: true })
      .expect(200);
    const s = res.body.summary;
    expect(s.avgAttempts).toBeGreaterThan(1);
    const metricsRes = await request(app).get('/api/admin/ebay/metrics').expect(200);
    const hist = metricsRes.body.histograms || metricsRes.body.metrics?.histograms;
    const h = hist && hist['ingest.attempts_per_item'];
    expect(h).toBeDefined();
    if (h) {
      expect(h.count).toBeGreaterThanOrEqual(3);
      expect(h.percentiles).toBeDefined();
    }
  });
});
