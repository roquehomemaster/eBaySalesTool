const request = require('supertest');
process.env.NODE_ENV='test';
process.env.EBAY_ADAPTER_MODE='http';
process.env.EBAY_OAUTH_CLIENT_ID='id';
process.env.EBAY_OAUTH_CLIENT_SECRET='secret';
process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES='0';
process.env.EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES='1';
process.env.EBAY_ADMIN_API_KEY='k';

// Force token failure to drive degraded
jest.mock('axios', () => ({ post: jest.fn(()=>{ const e=new Error('fail'); e.response={status:500}; throw e; }), create: () => ({ get: jest.fn(()=>({ status:200, data:{} })) }) }));

const app = require('../../../app');

describe('alerts preview endpoint', () => {
  test('returns oauth_degraded alert when degraded', async () => {
    // trigger token attempt
    const tokenManager = require('../tokenManager');
    await expect(tokenManager.getAccessToken()).rejects.toBeTruthy();
    const res = await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth','k');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.active)).toBe(true);
    expect(res.body.active.map(a=>a.key)).toContain('oauth_degraded');
  });
});
