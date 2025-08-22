const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.EBAY_ADMIN_API_KEY = 'k';
process.env.EBAY_OAUTH_CLIENT_ID = 'id';
process.env.EBAY_OAUTH_CLIENT_SECRET = 'secret';
process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES = '0';
process.env.EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES = '1';
process.env.EBAY_ADAPTER_MODE = 'http';

// Mock axios to force token endpoint failure
jest.mock('axios', () => ({ post: jest.fn(() => { const e = new Error('fail'); e.response = { status:500 }; throw e; }) }));

// Use consistent path casing matching other tests to avoid Windows case-insensitive duplication warnings
const app = require('../../../app');
const tokenManager = require('../tokenManager');

describe('readiness endpoint', () => {
  test('returns 503 when oauth degraded', async () => {
    await expect(tokenManager.getAccessToken()).rejects.toBeTruthy();
    const res = await request(app).get('/api/ready');
    expect(res.status).toBe(503);
    expect(res.body.issues).toContain('oauth_degraded');
  });
});
