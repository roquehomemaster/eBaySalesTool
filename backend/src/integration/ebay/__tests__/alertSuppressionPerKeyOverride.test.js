process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
// Large global suppression window
process.env.EBAY_ALERT_SUPPRESS_GLOBAL_MS='5000';
// Per-key override (much shorter)
process.env.EBAY_ALERT_SUPPRESS_QUEUE_LATENCY_BURN_RATE_MS='100';

const request = require('supertest');
const app = require('../../../app');

// Use fake timers so we can advance time beyond per-key window without exceeding global
jest.useFakeTimers();

describe('alert suppression per-key override', () => {
  test('per-key shorter window allows earlier re-fire than global', async () => {
    const baseTime = Date.now();
    jest.setSystemTime(baseTime);

    // First fire (should record)
    await request(app)
      .post('/api/admin/ebay/metrics/_test/record-alert')
      .set('X-Admin-Auth','k')
      .send({ key:'queue_latency_burn_rate', severity:'warn', payload:{ test:1 } })
      .expect(200);

    let metricsRes = await request(app).get('/api/admin/ebay/metrics').set('X-Admin-Auth','k');
    let counters = metricsRes.body.counters;
    expect(counters['alerts.queue_latency_burn_rate.warn_total']).toBe(1);
    expect(counters['alerts.queue_latency_burn_rate.suppressed_total'] || 0).toBe(0);

    // Immediate duplicate (within 100ms) suppressed
    await request(app)
      .post('/api/admin/ebay/metrics/_test/record-alert')
      .set('X-Admin-Auth','k')
      .send({ key:'queue_latency_burn_rate', severity:'warn', payload:{ test:2 } })
      .expect(200);

    metricsRes = await request(app).get('/api/admin/ebay/metrics').set('X-Admin-Auth','k');
    counters = metricsRes.body.counters;
    expect(counters['alerts.queue_latency_burn_rate.warn_total']).toBe(1); // unchanged
    expect(counters['alerts.queue_latency_burn_rate.suppressed_total']).toBe(1);

    // Advance just beyond per-key 100ms but far below global 5000ms
    jest.advanceTimersByTime(150);
    jest.setSystemTime(baseTime + 150);

    await request(app)
      .post('/api/admin/ebay/metrics/_test/record-alert')
      .set('X-Admin-Auth','k')
      .send({ key:'queue_latency_burn_rate', severity:'warn', payload:{ test:3 } })
      .expect(200);

    metricsRes = await request(app).get('/api/admin/ebay/metrics').set('X-Admin-Auth','k');
    counters = metricsRes.body.counters;
    expect(counters['alerts.queue_latency_burn_rate.warn_total']).toBe(2); // re-fired
    expect(counters['alerts.queue_latency_burn_rate.suppressed_total']).toBe(1);
    // Global suppressed_total aggregate should be >=1
    expect(counters['alerts.suppressed_total']).toBeGreaterThanOrEqual(1);
  });
});
