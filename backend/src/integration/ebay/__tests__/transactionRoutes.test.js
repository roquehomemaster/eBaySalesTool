const express = require('express');

jest.mock('../../../../models/ebayIntegrationModels', () => ({ EbayTransactionLog: { findAll: jest.fn(async () => ([{ txn_id:1, channel:'adapter', operation:'create', status:'success' }])) } }));

const txnRoutes = require('../../../routes/ebayTransactionAdminRoutes');
const request = require('supertest');

function buildApp(){ const app = express(); app.use('/api/admin/ebay', txnRoutes); return app; }

describe('transaction admin routes', () => {
  test('GET /transactions returns list', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/admin/ebay/transactions');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
  });
});
