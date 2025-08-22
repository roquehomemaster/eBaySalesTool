process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.QUEUE_BURN_WINDOW_MS='4000';
process.env.QUEUE_BURN_HIGH_MS='50';
process.env.QUEUE_BURN_WARN_RATIO='0.5';
process.env.QUEUE_BURN_PAGE_RATIO='0.8'; // initial page ratio high so first fire is only warn
process.env.EBAY_ALERT_SUPPRESS_GLOBAL_MS='3000'; // 3s suppression window for identical key+severity

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

describe('alert suppression', () => {
  test('suppresses duplicate alert within window but allows escalation', async () => {
    // Generate initial wait samples producing ratio 0.6 (3/5 >=50ms) -> warn (< page 0.8)
    const waits = [60,10,70,15,90]; // 3 highs, 2 lows
    let idx = 0;
    global.__TEST_EBAY_QUEUE_MODEL__ = {
      findOne: jest.fn(() => {
        if (idx < waits.length) {
          const w = waits[idx++];
          return Promise.resolve({ created_at: new Date(Date.now() - w), update: jest.fn(), attempts: 0, intent: 'create', ebay_listing_id: 1, queue_id: 600 + w, status: 'pending' });
        }
        return Promise.resolve(null);
      }),
      count: jest.fn(() => Promise.resolve(Math.max(waits.length - idx, 0)))
    };
    for (let i = 0; i < waits.length; i++) { await runOnce(); }
    let res = await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth', 'k');
    const first = res.body.active.find(a => a.key === 'queue_latency_burn_rate');
    expect(first).toBeDefined();
    expect(first.severity).toBe('warn');

    // Re-run same pattern quickly -> duplicate warn should be suppressed
    idx = 0;
    for (let i = 0; i < waits.length; i++) { await runOnce(); }
    res = await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth', 'k');
    const afterSuppress = res.body.active.filter(a => a.key === 'queue_latency_burn_rate');
    expect(afterSuppress.length).toBe(1); // still just one active alert

    // Now lower page ratio below current ratio to force escalation (severity change should bypass suppression)
    process.env.QUEUE_BURN_PAGE_RATIO = '0.55'; // below 0.6 current ratio
    process.env.QUEUE_BURN_WARN_RATIO = '0.5'; // keep warn threshold
    // No new samples needed; thresholds change causes escalation evaluation
    res = await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth', 'k');
    const escalated = res.body.active.find(a => a.key === 'queue_latency_burn_rate');
    expect(escalated).toBeDefined();
    expect(escalated.severity).toBe('page');

    // Validate counters
    const metricsRes = await request(app).get('/api/admin/ebay/metrics').set('X-Admin-Auth', 'k');
    const counters = metricsRes.body.counters;
    expect(counters['alerts.queue_latency_burn_rate.warn_total']).toBe(1); // first warn only (duplicate suppressed)
    expect(counters['alerts.queue_latency_burn_rate.page_total']).toBe(1); // escalation
    expect(counters['alerts.queue_latency_burn_rate.fired_total']).toBe(2); // warn + page
    expect(counters['alerts.queue_latency_burn_rate.suppressed_total']).toBe(1); // duplicate suppressed
    expect(counters['alerts.suppressed_total']).toBeGreaterThanOrEqual(1);
    delete global.__TEST_EBAY_QUEUE_MODEL__;
  });
});
