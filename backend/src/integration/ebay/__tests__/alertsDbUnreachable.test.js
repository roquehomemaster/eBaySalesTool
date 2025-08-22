const request = require('supertest');
process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.EBAY_OAUTH_CLIENT_ID='id';
process.env.EBAY_OAUTH_CLIENT_SECRET='secret';
process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES='0';
process.env.EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES='9';
process.env.READINESS_DB_CHECK_INTERVAL_MS='0';

// Mock token refresh success
jest.mock('axios', () => ({ post: jest.fn(()=>({ data:{ access_token:'ok', expires_in:3600 } })) }));

// Mock database pool to fail
jest.mock('../../../utils/database', () => {
  const real = jest.requireActual('../../../utils/database');
  const failingPool = { query: jest.fn(() => Promise.reject(new Error('SELECT 1 failed: db down'))) };
  return { ...real, pool: failingPool, getPool: () => failingPool };
});

// Capture metrics module to inspect db.reachable gauge via alerts endpoint
const app = require('../../../app');

describe('alerts db unreachable', () => {
  test('alerts endpoint includes db_unreachable when db probe fails', async () => {
    // Hit readiness to trigger probe instrumentation
    const readyRes = await request(app).get('/api/ready');
    expect(readyRes.status).toBe(503);
    expect(readyRes.body.issues).toContain('db_unreachable');
    // Now call alerts endpoint
    const res = await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth','k');
    expect(res.status).toBe(200);
    const keys = res.body.active.map(a=>a.key);
    expect(keys).toContain('db_unreachable');
    const dbAlert = res.body.active.find(a=>a.key==='db_unreachable');
    expect(dbAlert.severity).toBe('page');
  });
});
