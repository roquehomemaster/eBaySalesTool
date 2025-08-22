const tokenManager = require('../tokenManager');
const metrics = require('../metrics');

process.env.NODE_ENV = 'test';
process.env.EBAY_ADAPTER_MODE = 'http';
process.env.EBAY_HTTP_AUTH_FAILURE_RATIO_ALERT = '0.1';
process.env.EBAY_OAUTH_CLIENT_ID = 'id';
process.env.EBAY_OAUTH_CLIENT_SECRET = 'secret';
process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES = '0';
process.env.EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES = '9'; // avoid degraded path

// Force HTTP client to always return auth failure via axios.create mock
jest.mock('axios', () => ({
  post: jest.fn(async () => ({ data: { access_token: 't', expires_in: 3600 } })),
  create: () => ({ get: jest.fn(() => { const e = new Error('auth'); e.response = { status:401 }; throw e; }) })
}));

// After axios mock so http client uses it
const { fetchWithRetry } = require('../ebayAdapter');

describe('auth failure ratio threshold metric', () => {
  test('exceeds threshold triggers metric increment', async () => {
    // Warm token
    try { await tokenManager.getAccessToken(); } catch(_) {}
    // Perform several calls to drive ratio > 0.1 (all will fail auth)
    for (let i=0;i<3;i++) {
      try { await fetchWithRetry('X'+i, { maxRetries:0 }); } catch(_) { /* ignore */ }
    }
    const snap = metrics.snapshot();
    const authFails = snap.counters['adapter.http.auth_failures'];
    const ratio = snap.gauges['adapter.http.auth_failure_ratio'];
    const thresholdExceeded = snap.counters['adapter.http.auth_failure_ratio_threshold_exceeded'];
    expect(authFails).toBeGreaterThan(0);
    expect(ratio).toBeGreaterThan(0.1);
    expect(thresholdExceeded).toBeGreaterThan(0);
  });
});
