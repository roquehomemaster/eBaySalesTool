process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.EBAY_ALERT_SUPPRESS_GLOBAL_MS='2000';

const request = require('supertest');
const app = require('../../../app');

describe('alert suppression gauges', () => {
  test('sets last_suppressed_ts gauges on duplicate suppression', async () => {
    // First fire (warn)
    await request(app)
      .post('/api/admin/ebay/metrics/_test/record-alert')
      .set('X-Admin-Auth','k')
      .send({ key:'queue_latency_burn_rate', severity:'warn', payload:{ phase:1 } })
      .expect(200);

    // Immediate duplicate -> suppressed
    await request(app)
      .post('/api/admin/ebay/metrics/_test/record-alert')
      .set('X-Admin-Auth','k')
      .send({ key:'queue_latency_burn_rate', severity:'warn', payload:{ phase:2 } })
      .expect(200);

    const metricsRes = await request(app).get('/api/admin/ebay/metrics').set('X-Admin-Auth','k');
    const { counters, gauges } = metricsRes.body;
    expect(counters['alerts.queue_latency_burn_rate.warn_total']).toBe(1); // first only
    expect(counters['alerts.queue_latency_burn_rate.suppressed_total']).toBe(1); // second suppressed
    expect(typeof gauges['alerts.last_suppressed_ts']).toBe('number');
    expect(gauges['alerts.last_suppressed_ts']).toBeGreaterThan(0);
    expect(typeof gauges['alerts.queue_latency_burn_rate.last_suppressed_ts']).toBe('number');
    expect(gauges['alerts.queue_latency_burn_rate.last_suppressed_ts']).toBe(gauges['alerts.last_suppressed_ts']);
  });
});
