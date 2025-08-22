const request = require('supertest');
process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
// Set p99 thresholds low to trigger
process.env.QUEUE_ITEM_WAIT_P99_WARN_MS='200';
process.env.QUEUE_ITEM_WAIT_P99_PAGE_MS='400';

jest.mock('../projectionBuilder', () => ({ buildProjection: jest.fn(()=>Promise.resolve({ projection:{}, projection_hash:'h' })) }));
jest.mock('../adapter', () => ({ createListing: jest.fn(()=>Promise.resolve({ success:true })), updateListing: jest.fn(()=>Promise.resolve({ success:true })) }));

jest.mock('../../../models/ebayIntegrationModels', () => ({
  EbayChangeQueue: {},
  EbayListing: { findOne: jest.fn(() => Promise.resolve({ internal_listing_id:1, last_publish_hash:null, update: jest.fn(), lifecycle_state:'pending', external_item_id:null })) },
  EbaySyncLog: { create: jest.fn(()=>Promise.resolve()) },
  EbayFailedEvent: { create: jest.fn(()=>Promise.resolve()) }
}));

const metrics = require('../metrics');
const { runOnce } = require('../queueWorker');
const app = require('../../../app');

describe('alerts queue item wait p99', () => {
  test('alerts endpoint includes queue_item_wait_p99 when percentile exceeds thresholds', async () => {
    // Create several items with increasing waits to shape histogram
    const waits = [100,250,260,500];
    for (const w of waits) {
      global.__TEST_EBAY_QUEUE_MODEL__ = {
        findOne: jest.fn(()=>Promise.resolve({ created_at: new Date(Date.now() - w), update: jest.fn(), attempts:0, intent:'create', ebay_listing_id:1, queue_id: 400 + w })),
        count: jest.fn(()=>Promise.resolve(1))
      };
      await runOnce();
    }
    const res = await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth','k');
    expect(res.status).toBe(200);
    const keys = res.body.active.map(a=>a.key);
    expect(keys).toContain('queue_item_wait_p99');
    const alert = res.body.active.find(a=>a.key==='queue_item_wait_p99');
    expect(['warn','page']).toContain(alert.severity);
    delete global.__TEST_EBAY_QUEUE_MODEL__;
  });
});
