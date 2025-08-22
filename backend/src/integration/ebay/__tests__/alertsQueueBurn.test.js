const request = require('supertest');
process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.QUEUE_BURN_P99_MS='150';
process.env.QUEUE_BURN_BACKLOG_DEPTH='3';
process.env.QUEUE_BURN_P99_PAGE_MS='400';

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

/**
 * Strategy: create several items with increasing wait to push p99 past threshold
 * and simulate backlog depth by keeping pending count high (count mock returns depth)
 */

describe('composite queue burn alert', () => {
  test('emits queue_latency_backlog_burn when p99 and backlog exceed thresholds', async () => {
  // First wait ensures p99 >= burn threshold while backlog (remaining) still high
  const waits = [200,50,60,70];
  let idx = 0;
    global.__TEST_EBAY_QUEUE_MODEL__ = {
      findOne: jest.fn(()=>{
        if (idx < waits.length) {
          const w = waits[idx++];
          return Promise.resolve({ created_at: new Date(Date.now() - w), update: jest.fn(), attempts:0, intent:'create', ebay_listing_id:1, queue_id: 800 + w, status:'pending' });
        }
        return Promise.resolve(null);
      }),
      count: jest.fn(()=>Promise.resolve(Math.max(4 - idx,0)))
    };
  // Process only first item to keep backlog depth (remaining simulated) high
  await runOnce();
    const res = await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth','k');
    expect(res.status).toBe(200);
    const keys = res.body.active.map(a=>a.key);
    expect(keys).toContain('queue_latency_backlog_burn');
    const burn = res.body.active.find(a=>a.key==='queue_latency_backlog_burn');
    expect(burn.backlogDepth).toBeGreaterThanOrEqual(3);
    delete global.__TEST_EBAY_QUEUE_MODEL__;
  });
});
