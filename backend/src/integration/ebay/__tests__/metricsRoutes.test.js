const express = require('express');

jest.mock('../../../../models/ebayIntegrationModels', () => ({ EbayChangeQueue:{ count: jest.fn(async () => 0) } }));

jest.mock('../metrics', () => ({
  inc: jest.fn(), setGauge: jest.fn(), mark: jest.fn(), snapshot: () => ({ counters:{ a:1 }, gauges:{ g:2 }, timestamps:{ t: 1000 }, histograms:{ 'adapter.get_item_detail_ms': { buckets:[5,10], counts:[1,0,1], sum:6, percentiles:{ p50:5, p90:5, p95:5, p99:5 } } }, ts:123 })
}));

const metricsRoutes = require('../../../routes/ebayMetricsAdminRoutes');
const healthRoutes = require('../../../routes/ebayHealthAdminRoutes');

const request = require('supertest');

function buildApp(){
  const app = express();
  app.use('/api/admin/ebay', metricsRoutes);
  app.use('/api/admin/ebay', healthRoutes);
  return app;
}

describe('metrics & health routes', () => {
  let app;
  beforeEach(()=>{ app = buildApp(); });
  test('GET /metrics returns snapshot', async () => {
    const res = await request(app).get('/api/admin/ebay/metrics');
    expect(res.status).toBe(200);
    expect(res.body.counters.a).toBe(1);
  });
  test('GET /health returns flags + metrics', async () => {
    const res = await request(app).get('/api/admin/ebay/health');
    expect(res.status).toBe(200);
    expect(res.body.featureFlags).toBeDefined();
  });
  test('GET /metrics/prometheus returns text exposition', async () => {
    const res = await request(app).get('/api/admin/ebay/metrics/prometheus');
    expect(res.status).toBe(200);
    expect(res.text).toContain('a 1');
    expect(res.text).toContain('adapter_get_item_detail_ms_bucket');
    expect(res.headers['content-type']).toContain('text/plain');
  });
});
