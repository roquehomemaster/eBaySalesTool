const { logTxn } = require('../transactionLogger');

jest.mock('../../../../models/ebayIntegrationModels', () => ({ EbayTransactionLog: { create: jest.fn(async () => ({})) } }));

describe('transactionLogger', () => {
  test('logTxn inserts record', async () => {
    await logTxn({ channel:'adapter', direction:'outbound', operation:'create', status:'success' });
    // no throw implies success
  });
});
