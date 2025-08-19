// Integration-ish test: adapter against mock server to exercise classification & rate limit behavior
const http = require('http');
const { createServer } = require('../mockEbayServer');

jest.setTimeout(10000);

describe('mockEbayServer + adapter', () => {
  let port; let server; let origBase; let origEnabled;
  beforeAll(async () => {
    server = createServer({ rateLimitEvery: 3 });
    port = await server.start(0);
    origBase = process.env.EBAY_API_BASE_URL;
    origEnabled = process.env.EBAY_PUBLISH_ENABLED;
    process.env.EBAY_API_BASE_URL = `http://127.0.0.1:${port}`;
    process.env.EBAY_PUBLISH_ENABLED = 'true';
  });
  afterAll(async () => {
    process.env.EBAY_API_BASE_URL = origBase;
    process.env.EBAY_PUBLISH_ENABLED = origEnabled;
    await server.stop();
  });

  test('successful create then rate limit classification', async () => {
    const adapter = require('../adapter');
    const first = await adapter.createListing({ title:'T1' });
    expect(first.success).toBe(true);
    const second = await adapter.createListing({ title:'T2' });
    expect(second.success).toBe(true);
    // 3rd call triggers rate limit (every 3rd)
    const third = await adapter.createListing({ title:'T3' });
    expect(third.success).toBe(false);
    expect(third.classification).toBe('rate_limited');
  });
});
