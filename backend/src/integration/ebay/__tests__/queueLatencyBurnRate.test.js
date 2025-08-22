const request = require('supertest');
process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.QUEUE_BURN_WINDOW_MS='5000'; // 5s window to avoid sample aging during test
process.env.QUEUE_BURN_HIGH_MS='80';
process.env.QUEUE_BURN_WARN_RATIO='0.4';
process.env.QUEUE_BURN_PAGE_RATIO='0.8';

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
 * We simulate multiple dequeues with controlled waits, then query alerts.
 */

describe('queue latency burn-rate alert', () => {
  test('emits warn then page based on ratio thresholds', async () => {
  const waits = [50, 90, 100, 20, 95]; // 3 of 5 above 80ms => ratio 0.6 (warn)
    let idx = 0;
    global.__TEST_EBAY_QUEUE_MODEL__ = {
      findOne: jest.fn(()=>{
        if (idx < waits.length) {
          const w = waits[idx++];
          return Promise.resolve({ created_at: new Date(Date.now() - w), update: jest.fn(), attempts:0, intent:'create', ebay_listing_id:1, queue_id: 900 + w, status:'pending' });
        }
        return Promise.resolve(null);
      }),
      count: jest.fn(()=>Promise.resolve(Math.max(waits.length - idx,0)))
    };
    // Process all items quickly (within window)
    for (let i=0;i<waits.length;i++) { await runOnce(); }
    let res = await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth','k');
    const warn = res.body.active.find(a=>a.key==='queue_latency_burn_rate');
    expect(warn).toBeDefined();
    expect(warn.severity).toBe('warn');
    // Add more high waits to push ratio >= 0.8
  const more = [120,130,140,150,160]; // Add 5 more high waits => total highs 8 of 10 (low waits=2) => ratio 0.8 => page
    let j=0;
    global.__TEST_EBAY_QUEUE_MODEL__.findOne = jest.fn(()=>{
      if (j < more.length) { const w = more[j++]; return Promise.resolve({ created_at: new Date(Date.now() - w), update: jest.fn(), attempts:0, intent:'create', ebay_listing_id:1, queue_id: 950 + w, status:'pending' }); }
      return Promise.resolve(null);
    });
    for (let k=0;k<more.length;k++) { await runOnce(); }
    res = await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth','k');
    const page = res.body.active.find(a=>a.key==='queue_latency_burn_rate');
    expect(page).toBeDefined();
    expect(page.severity).toBe('page');
    delete global.__TEST_EBAY_QUEUE_MODEL__;
  });
});
