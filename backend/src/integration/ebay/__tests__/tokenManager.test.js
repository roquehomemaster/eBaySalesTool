jest.mock('axios', () => ({
  post: jest.fn(async () => ({ data: { access_token: 'NEW_TOKEN', expires_in: 120 } }))
}));

const tokenManager = require('../tokenManager');

describe('tokenManager', () => {
  beforeEach(() => {
    delete process.env.EBAY_OAUTH_TOKEN; // ensure dynamic
    process.env.EBAY_OAUTH_CLIENT_ID = 'cid';
    process.env.EBAY_OAUTH_CLIENT_SECRET = 'secret';
    delete process.env.EBAY_OAUTH_REFRESH_TOKEN;
  });
  test('fetches token on first access', async () => {
    const t = await tokenManager.getAccessToken();
    expect(t).toBe('NEW_TOKEN');
    const snap = tokenManager.snapshot();
    expect(snap.accessToken).toBe('NEW_TOKEN');
  });
  test('reuses token if not near expiry', async () => {
    const first = await tokenManager.getAccessToken();
    const second = await tokenManager.getAccessToken();
    expect(first).toBe(second);
  });
  test('retries on transient refresh failure', async () => {
    const axios = require('axios');
    // Force refresh each time to trigger refresh path
    process.env.EBAY_OAUTH_FORCE_REFRESH_EACH = 'true';
    process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES = '2';
    let call = 0;
    axios.post.mockImplementation(async () => {
      call++;
      if (call < 2) {
        const err = new Error('boom');
        err.response = { status: 500 };
        throw err;
      }
      return { data: { access_token: 'NEW_TOKEN2', expires_in: 60 } };
    });
    const t = await tokenManager.getAccessToken();
    expect(t).toBe('NEW_TOKEN2');
    expect(call).toBe(2);
  });
});
