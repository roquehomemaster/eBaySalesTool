process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.EBAY_ALERT_SUPPRESS_GLOBAL_MS='0';
process.env.QUEUE_BURN_WINDOW_MS='200';
process.env.QUEUE_BURN_HIGH_MS='50';
process.env.QUEUE_BURN_WARN_RATIO='0.5';
process.env.QUEUE_BURN_PAGE_RATIO='0.9';

const request = require('supertest');
const app = require('../../../app');
const { runOnce } = require('../queueWorker');

jest.useFakeTimers();

describe('alert clearing metrics', () => {
  test('increments cleared counters and sets gauges when burn-rate alert expires (window rolls off)', async () => {
    // Inject wait samples: 3 highs, 1 low => ratio 0.75 (warn)
    const waits = [80, 60, 10, 70];
    let idx = 0;
    global.__TEST_EBAY_QUEUE_MODEL__ = {
      findOne: jest.fn(() => {
        if (idx < waits.length) {
          const w = waits[idx++];
          return Promise.resolve({ created_at: new Date(Date.now()-w), update: jest.fn(), attempts:0, intent:'create', ebay_listing_id:1, queue_id: 900+w, status:'pending' });
        }
        return Promise.resolve(null);
      }),
      count: jest.fn(()=>Promise.resolve(Math.max(waits.length - idx,0)))
    };
    for (let i=0;i<waits.length;i++){ await runOnce(); }
    // First alerts call should record warn alert
    await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth','k');
    let metricsRes = await request(app).get('/api/admin/ebay/metrics').set('X-Admin-Auth','k');
    expect(metricsRes.body.counters['alerts.queue_latency_burn_rate.warn_total']).toBe(1);
    const clearedBefore = metricsRes.body.counters['alerts.cleared_total'] || 0;

    // Advance time beyond burn window so samples expire
    jest.advanceTimersByTime(500); // > 200ms window
    // Trigger alert recomputation; should now be absent and counted as cleared
    await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth','k');
    metricsRes = await request(app).get('/api/admin/ebay/metrics').set('X-Admin-Auth','k');
    expect(metricsRes.body.counters['alerts.cleared_total']).toBe(clearedBefore + 1);
    expect(metricsRes.body.counters['alerts.queue_latency_burn_rate.cleared_total']).toBeGreaterThanOrEqual(1);
    expect(typeof metricsRes.body.gauges['alerts.last_cleared_ts']).toBe('number');
    delete global.__TEST_EBAY_QUEUE_MODEL__;
  });

  test('severity downgrade increments cleared counters (page -> warn)', async () => {
    // Configure page threshold low so initial alert is page
    process.env.QUEUE_BURN_PAGE_RATIO='0.6';
    process.env.QUEUE_BURN_WARN_RATIO='0.5';
    // Generate 3 highs, 1 low -> ratio 0.75 page
    const waits2 = [90, 70, 65, 5];
    let i2=0;
    global.__TEST_EBAY_QUEUE_MODEL__ = {
      findOne: jest.fn(()=>{
        if (i2<waits2.length){ const w=waits2[i2++]; return Promise.resolve({ created_at:new Date(Date.now()-w), update: jest.fn(), attempts:0, intent:'create', ebay_listing_id:1, queue_id:950+w, status:'pending' }); }
        return Promise.resolve(null);
      }),
      count: jest.fn(()=>Promise.resolve(Math.max(waits2.length - i2,0)))
    };
    for (let i=0;i<waits2.length;i++){ await runOnce(); }
    await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth','k');
    let metricsRes = await request(app).get('/api/admin/ebay/metrics').set('X-Admin-Auth','k');
    expect(metricsRes.body.counters['alerts.queue_latency_burn_rate.page_total']).toBe(1);
    const clearedPrev = metricsRes.body.counters['alerts.cleared_total'] || 0;
    // Raise page ratio so next evaluation yields only warn (downgrade)
    process.env.QUEUE_BURN_PAGE_RATIO='0.95';
    await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth','k');
    metricsRes = await request(app).get('/api/admin/ebay/metrics').set('X-Admin-Auth','k');
    expect(metricsRes.body.counters['alerts.queue_latency_burn_rate.warn_total']).toBeGreaterThanOrEqual(1);
    expect(metricsRes.body.counters['alerts.cleared_total']).toBeGreaterThanOrEqual(clearedPrev + 1);
    expect(metricsRes.body.counters['alerts.queue_latency_burn_rate.cleared_total']).toBeGreaterThanOrEqual(1);
    delete global.__TEST_EBAY_QUEUE_MODEL__;
  });
});
