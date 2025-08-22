const request = require('supertest');
process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.QUEUE_ITEM_WAIT_MAX_WARN_MS='200';

jest.mock('../projectionBuilder', () => ({ buildProjection: jest.fn(()=>Promise.resolve({ projection:{}, projection_hash:'h' })) }));
jest.mock('../adapter', () => ({ createListing: jest.fn(()=>Promise.resolve({ success:true })), updateListing: jest.fn(()=>Promise.resolve({ success:true })) }));

jest.mock('../../../models/ebayIntegrationModels', () => ({
  EbayChangeQueue: {},
  EbayListing: { findOne: jest.fn(() => Promise.resolve({ internal_listing_id:1, last_publish_hash:null, update: jest.fn(), lifecycle_state:'pending', external_item_id:null })) },
  EbaySyncLog: { create: jest.fn(()=>Promise.resolve()) },
  EbayFailedEvent: { create: jest.fn(()=>Promise.resolve()) }
}));

const { runOnce } = require('../queueWorker');
const app = require('../../../app');

describe('alerts history endpoint', () => {
  test('returns history including previously fired alerts and supports filters', async () => {
    // Trigger a max wait alert
    global.__TEST_EBAY_QUEUE_MODEL__ = {
      findOne: jest.fn(()=>Promise.resolve({ created_at: new Date(Date.now() - 500), update: jest.fn(), attempts:0, intent:'create', ebay_listing_id:1, queue_id: 900 })),
      count: jest.fn(()=>Promise.resolve(1))
    };
    await runOnce();
    // Hit alerts endpoint to record
    await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth','k');
    // Fetch history
    const histRes = await request(app).get('/api/admin/ebay/metrics/alert-history').set('X-Admin-Auth','k');
    expect(histRes.status).toBe(200);
    expect(histRes.body.items.length).toBeGreaterThan(0);
    const keys = histRes.body.items.map(i=>i.key);
    expect(keys).toContain('queue_max_item_wait');
    const since = Date.now() - 60000;
    const filtered = await request(app).get(`/api/admin/ebay/metrics/alert-history?key=queue_max_item_wait&sinceMs=${since}`).set('X-Admin-Auth','k');
    expect(filtered.status).toBe(200);
    expect(filtered.body.items.every(i=>i.key==='queue_max_item_wait')).toBe(true);
    delete global.__TEST_EBAY_QUEUE_MODEL__;
  });
});
