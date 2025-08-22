process.env.NODE_ENV='test';
process.env.EBAY_ADAPTER_MODE='http';
process.env.EBAY_OAUTH_CLIENT_ID='id';
process.env.EBAY_OAUTH_CLIENT_SECRET='secret';
process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES='0';
process.env.EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES='1';

// Force token refresh failure -> degraded
jest.mock('axios', () => ({
  post: jest.fn(() => { const e = new Error('fail'); e.response = { status:500 }; throw e; }),
  create: () => ({ get: jest.fn(() => ({ status:200, data:{} })) })
}));

const metrics = require('../metrics');
const adapter = require('../ebayAdapter');
const tokenManager = require('../tokenManager');

describe('oauth short circuit metric', () => {
  test('increments on adapter pre-flight gate when degraded', async () => {
  // Force snapshot to report degraded regardless of internal state so gate triggers
  jest.spyOn(tokenManager, 'snapshot').mockImplementation(() => ({ degraded:true }));
  const before = metrics.snapshot().counters['adapter.http.oauth_short_circuit'] || 0;
  try {
    await adapter.fetchWithRetry('12345');
    throw new Error('expected failure');
  } catch(e) {
    expect(e.message).toMatch(/oauth_degraded|http_permanent/);
  }
  const after = metrics.snapshot().counters['adapter.http.oauth_short_circuit'] || 0;
  expect(after).toBe(before + 1);
  });
});
