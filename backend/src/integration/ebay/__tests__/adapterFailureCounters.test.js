jest.mock('../metrics', () => ({ inc: jest.fn(), observe: jest.fn(), setGauge: jest.fn() }));
const metrics = require('../metrics');
const adapter = require('../ebayAdapter');
const { resetStateForTests } = adapter;

describe('adapter failure counters', () => {
  beforeEach(() => { resetStateForTests(); jest.clearAllMocks(); process.env.EBAY_ADAPTER_FAIL_ONCE_IDS = '9001'; process.env.EBAY_ADAPTER_ALWAYS_FAIL_IDS='9002'; });
  test('counts transient and permanent failures', async () => {
    await expect(adapter.fetchWithRetry('9002', { maxRetries:0 })).rejects.toThrow(); // permanent
  // Trigger transient failure (fail once id) with no retries so it surfaces as transient; then succeed on second call
  await expect(adapter.fetchWithRetry('9001', { maxRetries:0 })).rejects.toThrow();
  await adapter.fetchWithRetry('9001', { maxRetries:0 }); // now should succeed
    const calls = metrics.inc.mock.calls.map(c=>c[0]);
    expect(calls).toContain('adapter.permanent_failures');
    expect(calls).toContain('adapter.transient_failures');
  });
});
