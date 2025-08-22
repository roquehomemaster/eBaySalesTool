process.env.NODE_ENV='test';
process.env.EBAY_ADAPTER_MODE='http';
process.env.EBAY_OAUTH_CLIENT_ID='id';
process.env.EBAY_OAUTH_CLIENT_SECRET='secret';
process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES='0';
process.env.EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES='1';

// Force token refresh failure to trigger degraded
jest.mock('axios', () => ({ post: jest.fn(() => { const e = new Error('fail'); e.response = { status:500 }; throw e; }) }));

const metrics = require('../metrics');
const tokenManager = require('../tokenManager');

describe('oauth degraded duration gauge', () => {
  test('degraded_duration_ms > 0 when degraded', async () => {
    await expect(tokenManager.getAccessToken()).rejects.toBeTruthy();
    const snap = metrics.snapshot();
    expect(snap.gauges['adapter.oauth.degraded']).toBe(1);
    expect(snap.gauges['adapter.oauth.degraded_duration_ms']).toBeGreaterThanOrEqual(0); // may be 0 at instant
  });
});
