process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';

const request = require('supertest');
const app = require('../../../app');
const { runOnce } = require('../queueWorker');

jest.mock('../projectionBuilder', () => ({ buildProjection: jest.fn(()=>Promise.resolve({ projection:{}, projection_hash:'h' })) }));
jest.mock('../adapter', () => ({ createListing: jest.fn(()=>Promise.resolve({ success:true })), updateListing: jest.fn(()=>Promise.resolve({ success:true })) }));

jest.mock('../../../models/ebayIntegrationModels', () => ({
  EbayChangeQueue: {},
  EbayListing: { findOne: jest.fn(() => Promise.resolve({ internal_listing_id:1, last_publish_hash:null, update: jest.fn(), lifecycle_state:'pending', external_item_id:null })) },
  EbaySyncLog: { create: jest.fn(()=>Promise.resolve()) },
  EbayFailedEvent: { create: jest.fn(()=>Promise.resolve()) }
}));

describe('internal state metrics enrichment', () => {
  test('exposes wait_samples_size and last wait metric', async () => {
    const waits = [15, 25, 35];
    let idx=0;
    global.__TEST_EBAY_QUEUE_MODEL__ = {
      findOne: jest.fn(()=>{
        if (idx < waits.length) {
          const w = waits[idx++];
          return Promise.resolve({ created_at: new Date(Date.now()-w), update: jest.fn(), attempts:0, intent:'create', ebay_listing_id:1, queue_id: 800 + w, status:'pending' });
        }
        return Promise.resolve(null);
      }),
      count: jest.fn(()=>Promise.resolve(Math.max(waits.length - idx,0)))
    };
    for (let i=0;i<waits.length;i++) { await runOnce(); }
    const res = await request(app).get('/api/admin/ebay/metrics').set('X-Admin-Auth','k');
    expect(res.status).toBe(200);
    expect(res.body.gauges['queue.wait_samples_size']).toBe(3);
    expect(res.body.gauges['queue.wait_samples_last_wait_ms']).toBeGreaterThanOrEqual(35);
    delete global.__TEST_EBAY_QUEUE_MODEL__;
  });
});
