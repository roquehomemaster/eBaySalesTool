const express = require('express');

jest.mock('../../../../models/ebayIntegrationModels', () => ({ EbayChangeQueue:{ count: jest.fn(async () => 0) } }));

jest.mock('../metrics', () => ({
  inc: jest.fn(), setGauge: jest.fn(), mark: jest.fn(), snapshot: () => ({ counters:{ a:1 }, gauges:{ g:2 }, timestamps:{}, ts:123 })
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
});
