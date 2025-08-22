const request = require('supertest');
process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
// Set low thresholds so test triggers quickly
process.env.QUEUE_OLDEST_AGE_WARN_MS='500';
process.env.QUEUE_OLDEST_AGE_PAGE_MS='1000';
process.env.QUEUE_ITEM_WAIT_MAX_WARN_MS='500';
process.env.QUEUE_ITEM_WAIT_MAX_PAGE_MS='1000';

// Mock token manager (not degraded)
jest.mock('../tokenManager', () => ({ snapshot: () => ({ degraded:false }), getAccessToken: () => Promise.resolve('t') }));
// Mock adapter to succeed
jest.mock('../adapter', () => ({ createListing: jest.fn(()=>Promise.resolve({ success:true })), updateListing: jest.fn(()=>Promise.resolve({ success:true })) }));
// Mock projection builder
jest.mock('../projectionBuilder', () => ({ buildProjection: jest.fn(()=>Promise.resolve({ projection:{}, projection_hash:'h' })) }));
// Mock models (inject queue via global)
jest.mock('../../../models/ebayIntegrationModels', () => ({
  EbayChangeQueue: {},
  EbayListing: { findOne: jest.fn(() => Promise.resolve({ internal_listing_id:1, last_publish_hash:null, update: jest.fn(), lifecycle_state:'pending', external_item_id:null })) },
  EbaySyncLog: { create: jest.fn(()=>Promise.resolve()) },
  EbayFailedEvent: { create: jest.fn(()=>Promise.resolve()) }
}));

const metrics = require('../metrics');
const { runOnce } = require('../queueWorker');
const app = require('../../../app');

function ageItem(ms){
  return { created_at: new Date(Date.now() - ms), update: jest.fn(), attempts:0, intent:'create', ebay_listing_id:1, queue_id: 101 };
}

describe('alerts queue latency', () => {
  test('alerts endpoint includes queue_oldest_age and queue_max_item_wait when thresholds exceeded', async () => {
    // First run with item aged 1200ms -> should set oldest age & wait metrics beyond page thresholds
    global.__TEST_EBAY_QUEUE_MODEL__ = {
      findOne: jest.fn(()=>Promise.resolve(ageItem(1200))),
      count: jest.fn(()=>Promise.resolve(3))
    };
    await runOnce();

    const res = await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth','k');
    expect(res.status).toBe(200);
    const keys = res.body.active.map(a=>a.key);
    expect(keys).toContain('queue_oldest_age');
    expect(keys).toContain('queue_max_item_wait');
    const oldest = res.body.active.find(a=>a.key==='queue_oldest_age');
    const maxWait = res.body.active.find(a=>a.key==='queue_max_item_wait');
    expect(oldest.severity).toBe('page');
    expect(maxWait.severity).toBe('page');

    delete global.__TEST_EBAY_QUEUE_MODEL__;
  });
});
