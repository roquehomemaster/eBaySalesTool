// adapter.test.js
// Focus: classify failures, mock vs real flag behavior, token refresh path (simulated)

jest.mock('axios', () => {
  const mock = {
    create: jest.fn(() => ({
      get: jest.fn(async (url, opts) => {
        if (url.includes('fail401')) { const e = new Error('401'); e.response = { status:401, data:{ error:'unauthorized' }, headers:{} }; throw e; }
        if (url.includes('fail500')) { const e = new Error('500'); e.response = { status:500, data:{ error:'boom' }, headers:{} }; throw e; }
        return { status:200, data:{ id:'ITM123', revision:'r1', ok:true }, headers:{} };
      }),
      post: jest.fn(async (url, body, opts) => {
        if (body && body.trigger === '401_once') { if(!global.__TRIGGERED401){ global.__TRIGGERED401=true; const e = new Error('401'); e.response = { status:401, data:{ error:'bad token' }, headers:{} }; throw e; } }
        if (body && body.trigger === 'always500') { const e = new Error('500'); e.response = { status:500, data:{ error:'server' }, headers:{} }; throw e; }
        return { status:201, data:{ id:'NEW123', revision:'r2', ok:true }, headers:{} };
      }),
      put: jest.fn(async (url, body, opts) => {
        if (body && body.trigger === 'always500') { const e = new Error('500'); e.response = { status:500, data:{ error:'server' }, headers:{} }; throw e; }
        return { status:200, data:{ id:'EXIST123', revision:'r3', ok:true }, headers:{} };
      })
    }))
  };
  return mock;
});

jest.mock('../../../models/ebayIntegrationModels', () => ({ EbayTransactionLog: { create: jest.fn(async () => {}) } }));

// Stub rateLimiter to immediate success
jest.mock('../rateLimiter', () => ({ acquire: jest.fn(async () => {}), adjustFromHeaders: jest.fn(()=>{}) }));

// Provide redactor
jest.mock('../redactUtil', () => ({ redactObject: o => o }));

describe('adapter', () => {
  const { createListing, updateListing, getListing, adapterEnabled } = require('../adapter');
  beforeEach(() => {
    delete process.env.EBAY_API_BASE_URL; // force mock path unless set
    process.env.EBAY_PUBLISH_ENABLED = 'true';
    process.env.EBAY_API_OAUTH_TOKEN = 't0';
    process.env.EBAY_API_REFRESH_URL = 'https://refresh.example.com';
    process.env.EBAY_API_REFRESH_TOKEN = 'rt0';
    global.__TRIGGERED401 = false;
  });

  test('mock createListing returns success when no base url', async () => {
    const res = await createListing({ foo:'bar' });
    expect(res.success).toBe(true);
    expect(res.external_item_id).toBeTruthy();
  });

  test('mock updateListing returns success when no base url', async () => {
    const res = await updateListing('EXIST1', { foo:'bar' });
    expect(res.success).toBe(true);
  });

  test('getListing mock path returns mock body when no base url', async () => {
    const res = await getListing('X1');
    expect(res.success).toBe(true);
    expect(res.body.mock).toBe(true);
  });

  test('createListing retries once after simulated 401 and succeeds', async () => {
    process.env.EBAY_API_BASE_URL = 'https://api.example.com';
    // Simulate successful refresh by monkeypatching axios.post used in refresh path
    const axios = require('axios');
    axios.post = jest.fn(async () => ({ data:{ access_token:'t1' } }));
    const res = await createListing({ trigger:'401_once' });
    expect(res.success).toBe(true);
  });

  test('updateListing reports server_error classification', async () => {
    process.env.EBAY_API_BASE_URL = 'https://api.example.com';
    const res = await updateListing('EXIST1', { trigger:'always500' });
    expect(res.success).toBe(false);
    expect(res.classification).toBe('server_error');
  });
});
