const request = require('supertest');
process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.EBAY_OAUTH_CLIENT_ID='id';
process.env.EBAY_OAUTH_CLIENT_SECRET='secret';
process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES='0';
process.env.EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES='1';
process.env.READINESS_FLAP_WINDOW_MS='10000';

// Force token failure first to induce not_ready then success to flip back
// Use mock-scoped state variable (prefixed) to satisfy Jest out-of-scope guard
jest.mock('axios', () => {
  let mockFailOnce = true;
  return {
    post: jest.fn(()=>{
      if (mockFailOnce) { const e = new Error('fail'); e.response={status:500}; mockFailOnce=false; throw e; }
      return { data:{ access_token:'ok', expires_in:3600 } };
    }),
    create: () => ({ get: jest.fn(()=>({ status:200, data:{} })) })
  };
});

const app = require('../../../app');

function getMetricsSnapshot(){ return require('../metrics').snapshot(); }

describe('readiness flap metrics', () => {
  test('increments transitions and sets gauges', async () => {
    // First call triggers oauth degraded (not_ready)
    await request(app).get('/api/ready');
    // Second call after token success should become ready
    await request(app).get('/api/ready');
    const snap = getMetricsSnapshot();
    expect(snap.counters['readiness.transitions']).toBeGreaterThanOrEqual(1);
    expect(typeof snap.gauges['readiness.current_state']).toBe('number');
  });
});
