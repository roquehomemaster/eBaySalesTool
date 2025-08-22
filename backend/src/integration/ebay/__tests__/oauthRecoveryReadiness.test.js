const request = require('supertest');

jest.useFakeTimers();

process.env.NODE_ENV = 'test';
process.env.EBAY_ADMIN_API_KEY = 'k';
process.env.EBAY_OAUTH_CLIENT_ID = 'id';
process.env.EBAY_OAUTH_CLIENT_SECRET = 'secret';
process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES = '0';
process.env.EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES = '1';
process.env.EBAY_ADAPTER_MODE = 'http';

let mockFail = true; // must be prefixed with mock* for jest scope allowance
jest.mock('axios', () => ({ post: jest.fn(() => { if (mockFail) { const e = new Error('fail'); e.response = { status:500 }; throw e; } return { data:{ access_token:'OK', expires_in:3600 } }; }) }));

const app = require('../../../app');
const tokenManager = require('../tokenManager');

describe('oauth recovery readiness', () => {
  test('readiness turns 503 then 200 after recovery', async () => {
    // First attempt fails -> degraded (threshold 1)
    await expect(tokenManager.getAccessToken()).rejects.toBeTruthy();
    let res = await request(app).get('/api/ready');
    expect(res.status).toBe(503);
    expect(res.body.issues).toContain('oauth_degraded');
    // Switch to success
  mockFail = false;
    // Force refresh by resetting internal state
    tokenManager._internal.reset();
    const t = await tokenManager.getAccessToken();
    expect(t).toBe('OK');
    res = await request(app).get('/api/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
  });
});
