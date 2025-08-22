const request = require('supertest');
const app = require('../src/app');

// Tests timeout behavior of mapping run endpoint using simulateDelayMs + low MAP_RUN_TIMEOUT_MS

describe('/api/admin/ebay/map/run timeout path', () => {
  test('returns 504 mapping_timeout when run exceeds configured timeout', async () => {
    process.env.MAP_RUN_TIMEOUT_MS = '20'; // very low timeout (ms)
    const res = await request(app)
      .post('/api/admin/ebay/map/run')
      .send({ dryRun: true, maxItems: 1, simulateDelayMs: 100 }) // force delay beyond timeout
      .expect(504);
    expect(res.body).toHaveProperty('error', 'mapping_timeout');
    expect(res.body).toHaveProperty('dryRun', true);
    expect(res.body).toHaveProperty('raw');
  });
});
