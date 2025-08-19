// Test drift admin route basic listing
jest.mock('../../../../models/ebayIntegrationModels', () => {
  const events = [
    { drift_event_id:1, ebay_listing_id:10, classification:'internal_only', local_hash:'A', remote_hash:null, snapshot_hash:'A0', created_at:new Date().toISOString(), EbayListing:{ internal_listing_id:100, external_item_id:'EXT10' } }
  ];
  return {
    EbayDriftEvent: { findAll: jest.fn(async () => events), count: jest.fn(async () => events.length) },
    EbayListing: {}
  };
});

const request = require('supertest');
const express = require('express');
const router = require('../../../routes/ebayDriftAdminRoutes');

describe('drift admin routes', () => {
  test('GET /drift-events returns events', async () => {
    const app = express();
    app.use('/api/admin/ebay', router);
    const res = await request(app).get('/api/admin/ebay/drift-events');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });
});
