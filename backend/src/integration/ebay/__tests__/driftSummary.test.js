// Test /drift-events/summary endpoint
jest.mock('../../../../models/ebayIntegrationModels', () => ({
  EbayDriftEvent: { findAll: jest.fn(async () => ([{ classification:'internal_only' }, { classification:'both_changed' }, { classification:'internal_only' }])) },
  EbayListing: {}
}));

const request = require('supertest');
const express = require('express');
const router = require('../../../routes/ebayDriftAdminRoutes');

describe('drift summary route', () => {
  test('GET /drift-events/summary returns counts', async () => {
    const app = express();
    app.use('/api/admin/ebay', router);
    const res = await request(app).get('/api/admin/ebay/drift-events/summary');
    expect(res.status).toBe(200);
    expect(res.body.counts.internal_only).toBe(2);
    expect(res.body.counts.both_changed).toBe(1);
  });
});
