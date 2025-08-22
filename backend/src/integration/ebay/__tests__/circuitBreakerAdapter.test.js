const adapter = require('../ebayAdapter');
const circuit = require('../circuitBreaker');

describe('adapter circuit breaker integration', () => {
  beforeEach(() => { circuit.reset(); });

  test('opens after configured consecutive failures and blocks calls', async () => {
    process.env.EBAY_ADAPTER_CB_CONSECUTIVE_FAILS = '3';
    process.env.EBAY_ADAPTER_ALWAYS_FAIL_IDS = '111,222,333,444,555';
    const failingId = '111';
    let threw = 0;
    for (let i=0;i<3;i++) {
      await expect(adapter.fetchWithRetry(failingId, { maxRetries:0 })).rejects.toThrow();
      threw++;
    }
    const statusAfter = circuit.status();
    expect(statusAfter.state).toBe('open');
    // Next call should short circuit with circuit_open
    await expect(adapter.fetchWithRetry(failingId, { maxRetries:0 })).rejects.toThrow(/circuit_open|permanent_failure/);
  });
});
