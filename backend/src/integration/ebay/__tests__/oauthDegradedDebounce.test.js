jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('../../../utils/logger', () => ({ warn: jest.fn(), info: jest.fn(), debug: jest.fn(), error: jest.fn() }));

describe('oauth degraded enter log debounce', () => {
  test('re-degrade within cooldown only logs one degraded_enter', async () => {
    jest.resetModules();
    // Re-obtain mocks after reset
    const axios = require('axios');
    const logger = require('../../../utils/logger');
    process.env.NODE_ENV='test';
    process.env.EBAY_OAUTH_CLIENT_ID='id';
    process.env.EBAY_OAUTH_CLIENT_SECRET='secret';
    process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES='0';
    process.env.EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES='1';
    process.env.EBAY_OAUTH_DEGRADED_LOG_COOLDOWN_MS='100000';
    process.env.EBAY_OAUTH_FORCE_REFRESH_EACH='true';
    // Sequence: fail -> success -> fail (re-degrade within cooldown)
    axios.post
      .mockRejectedValueOnce({ response: { status:500 } })
      .mockResolvedValueOnce({ data:{ access_token:'ok', expires_in:3600 } })
      .mockRejectedValueOnce({ response: { status:500 } });
    const tokenManager = require('../tokenManager');
    await tokenManager.getAccessToken().catch(()=>{}); // degrade
    await tokenManager.getAccessToken().catch(()=>{}); // recover
    await tokenManager.getAccessToken().catch(()=>{}); // re-degrade
    const degradedEnterCalls = logger.warn.mock.calls.filter(c => c[0] && c[0].includes && c[0].includes('oauth_degraded_enter'));
    expect(degradedEnterCalls.length).toBe(1);
  });
});
