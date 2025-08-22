process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.QUEUE_BURN_WINDOW_MS='2000';
process.env.QUEUE_BURN_HIGH_MS='50';
process.env.QUEUE_BURN_WARN_RATIO='0.2';

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

describe('alert metrics counters', () => {
  test('increments per-key counters when alert fires', async () => {
    // Simulate waits above threshold to trigger burn-rate warn
    const waits = [60,10,70,80]; // 3/4 high => ratio 0.75 >= warn
    let idx=0;
    global.__TEST_EBAY_QUEUE_MODEL__ = {
      findOne: jest.fn(()=>{
        if (idx < waits.length) {
          const w = waits[idx++];
          return Promise.resolve({ created_at: new Date(Date.now()-w), update: jest.fn(), attempts:0, intent:'create', ebay_listing_id:1, queue_id: 700 + w, status:'pending' });
        }
        return Promise.resolve(null);
      }),
      count: jest.fn(()=>Promise.resolve(Math.max(waits.length - idx,0)))
    };
    for (let i=0;i<waits.length;i++){ await runOnce(); }
    const res = await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth','k');
    expect(res.status).toBe(200);
    const alert = res.body.active.find(a=>a.key==='queue_latency_burn_rate');
    expect(alert).toBeDefined();
    // Fetch raw metrics snapshot to examine counters
    const metricsRes = await request(app).get('/api/admin/ebay/metrics').set('X-Admin-Auth','k');
    const counters = metricsRes.body.counters || {};
    expect(counters['alerts.fired_total']).toBeGreaterThanOrEqual(1);
    expect(counters['alerts.queue_latency_burn_rate.fired_total']).toBe(1);
    expect(counters['alerts.queue_latency_burn_rate.warn_total']).toBe(1);
    delete global.__TEST_EBAY_QUEUE_MODEL__;
  });
});
