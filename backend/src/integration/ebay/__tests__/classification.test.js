process.env.EBAY_ADAPTER_MODE = 'http';

jest.mock('../ebayHttpClient', () => {
  const attemptCounts = {};
  return {
    getListing: jest.fn(async (id) => {
      attemptCounts[id] = (attemptCounts[id] || 0) + 1;
      if (id === '1') { // transient first, then success
        if (attemptCounts[id] === 1) {
          return { ok: false, transient: true, code: 'ETIMEDOUT', error: 'timeout' };
        }
        return { ok: true, body: { sku: 'S-' + id, product: { title: 'Item ' + id, description: 'Desc ' + id } } };
      }
      if (id === '2') { // permanent always
        return { ok: false, transient: false, code: 404, error: 'not found' };
      }
      return { ok: true, body: { sku: 'S-' + id, product: { title: 'Item ' + id, description: 'Desc ' + id } } };
    })
  };
});

jest.mock('../metrics', () => ({ inc: jest.fn(), observe: jest.fn(), setGauge: jest.fn() }));

const httpClient = require('../ebayHttpClient');
const adapter = require('../ebayAdapter');

describe('http classification', () => {
  test('transient error triggers a retry and then succeeds', async () => {
    const result = await adapter.fetchWithRetry('1', { maxRetries: 2 });
    expect(result.ItemID).toBe('1');
    // Two calls: first transient failure, second success
    const callsFor1 = httpClient.getListing.mock.calls.filter(c => c[0] === '1').length;
    expect(callsFor1).toBe(2);
  });
  test('permanent error does not retry multiple times', async () => {
    const startCalls = httpClient.getListing.mock.calls.length;
    await expect(adapter.fetchWithRetry('2', { maxRetries: 5, baseDelayMs: 1 })).rejects.toThrow('http_permanent:404');
    const newCalls = httpClient.getListing.mock.calls.length - startCalls;
    expect(newCalls).toBe(1); // only initial attempt
  });
});
