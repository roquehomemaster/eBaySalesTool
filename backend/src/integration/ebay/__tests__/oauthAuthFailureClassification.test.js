process.env.NODE_ENV = 'test';
process.env.EBAY_ADMIN_API_KEY = 'k';
process.env.EBAY_OAUTH_CLIENT_ID = 'id';
process.env.EBAY_OAUTH_CLIENT_SECRET = 'secret';
process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES = '0';
process.env.EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES = '3';
process.env.EBAY_ADAPTER_MODE = 'http';

let mockFirst = true; // prefix mock* for jest scope rules
jest.mock('axios', () => ({
  post: jest.fn(() => ({ data: { access_token: 'OK', expires_in: 3600 } })),
  create: () => ({
    get: jest.fn(() => {
      if (mockFirst) {
        mockFirst = false;
        const e = new Error('auth');
        e.response = { status: 401 };
        throw e;
      }
      return { status: 200, data: {} };
    })
  })
}));

const metrics = require('../metrics');
const adapter = require('../ebayAdapter');

describe('http auth failure classification', () => {
  test('401 classified permanent auth error and metrics increment', async () => {
    try {
      await adapter.fetchWithRetry('9001');
    } catch (e) {
      expect(e.message).toContain('http_auth_error:401');
    }
    const snap = metrics.snapshot();
    expect((snap.counters['adapter.http.auth_failures'] || 0)).toBeGreaterThanOrEqual(1);
    const data = await adapter.fetchWithRetry('9001');
    expect(data).toBeDefined();
  });
});
