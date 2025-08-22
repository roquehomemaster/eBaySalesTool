const request = require('supertest');
process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
// Token manager will be mocked, real OAuth vars not needed
process.env.READINESS_FLAP_WINDOW_MS='5000';
process.env.READINESS_FLAP_TRANSITIONS_WARN='2';
process.env.READINESS_FLAP_TRANSITIONS_PAGE='4';

// Mock tokenManager to alternate degraded state each snapshot call
jest.mock('../tokenManager', () => {
  let state = false;
  return {
    snapshot: () => { state = !state; return { degraded: state }; },
    getAccessToken: () => Promise.resolve('token')
  };
});

// Provide dummy axios to satisfy any incidental imports
jest.mock('axios', () => ({ post: jest.fn(()=>({ data:{ access_token:'ok', expires_in:3600 } })), create: () => ({ get: jest.fn(()=>({ status:200, data:{} })) }) }));

const app = require('../../../app');

async function hitReadyEndpoint(times){
  for (let i=0;i<times;i++) { await request(app).get('/api/ready'); }
}

describe('alerts readiness flapping', () => {
  test('alerts endpoint reports readiness_flapping when transitions exceed thresholds', async () => {
    // Drive several transitions: degraded (fail) -> not_ready, recover -> ready, degrade again etc.
  await hitReadyEndpoint(10);
    const res = await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth','k');
    expect(res.status).toBe(200);
    const flaps = res.body.active.filter(a=>a.key==='readiness_flapping');
    expect(flaps.length).toBeGreaterThan(0);
    const alert = flaps[0];
    expect(['warn','page']).toContain(alert.severity);
    expect(alert.transitions).toBeGreaterThanOrEqual(2);
  });
});
