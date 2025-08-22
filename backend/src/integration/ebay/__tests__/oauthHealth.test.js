jest.mock('axios', () => ({ post: jest.fn(() => { const e = new Error('fail'); e.response = { status:500 }; throw e; }) }));
process.env.EBAY_OAUTH_CLIENT_ID = 'cid';
process.env.EBAY_OAUTH_CLIENT_SECRET = 'secret';
process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES = '0';
process.env.EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES = '1';
process.env.EBAY_ADAPTER_MODE = 'http';

const request = require('supertest');
// Use direct path to app (works for integration tests)
const app = require('../../../app');
const tokenManager = require('../tokenManager');

describe('oauth health summary', () => {
  test('reports degraded after consecutive failure', async () => {
    await expect(tokenManager.getAccessToken()).rejects.toBeTruthy();
    const res = await request(app).get('/api/admin/ebay/health').set('X-Admin-Auth', process.env.EBAY_ADMIN_API_KEY || '');
    expect(res.status).toBe(200);
    expect(res.body.summary.oauth.degraded).toBe(true);
    expect(res.body.summary.oauth.consecutive_failures).toBeGreaterThanOrEqual(1);
  });
});
