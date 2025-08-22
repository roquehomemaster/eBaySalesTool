process.env.NODE_ENV='test';
process.env.EBAY_ADAPTER_MODE='http';
process.env.EBAY_OAUTH_CLIENT_ID='id';
process.env.EBAY_OAUTH_CLIENT_SECRET='secret';
process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES='0';
process.env.EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES='5';

let mockFirst = true; // prefix mock* to satisfy jest scope rules
jest.mock('axios', () => ({
  post: jest.fn(() => ({ data:{ access_token:'OK', expires_in:3600 } })),
  create: () => ({ get: jest.fn(() => { if (mockFirst) { mockFirst=false; const e = new Error('auth'); e.response = { status:401 }; throw e; } return { status:200, data:{} }; }) })
}));

const metrics = require('../metrics');
const adapter = require('../ebayAdapter');

describe('auth_failure_ratio gauge', () => {
  test('auth_failure_ratio gauge updates after auth failure', async () => {
    // First attempt should throw auth perm failure
    try { await adapter.fetchWithRetry('abc'); } catch(e) { /* ignore */ }
    // Second attempt success
    await adapter.fetchWithRetry('abc');
    const snap = metrics.snapshot();
  const ratio = snap.gauges['adapter.http.auth_failure_ratio'];
  expect(ratio).toBeDefined();
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThanOrEqual(1);
  });
});
