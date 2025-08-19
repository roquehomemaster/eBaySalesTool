// Tests adaptive throttling for reconciliation and audit jobs
jest.mock('../rateLimiter', () => ({
  nearDepletion: jest.fn(() => true)
}));

jest.mock('../../../../models/ebayIntegrationModels', () => ({
  EbayListing: { findAll: jest.fn(async () => []) },
  EbayListingSnapshot: { findOne: jest.fn(), findAll: jest.fn(async () => []) },
  EbayChangeQueue: { findOne: jest.fn(), create: jest.fn() }
}));

describe('adaptive throttling', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.EBAY_RECON_ENABLED = 'true';
    process.env.EBAY_AUDIT_ENABLED = 'true';
    delete process.env.EBAY_THROTTLE_BYPASS;
  });

  test('reconciliation skips when near depletion', async () => {
    const { runReconciliation } = require('../reconciliationJob');
    const res = await runReconciliation({ batchSize:1, maxBatches:1 });
    expect(res.skipped).toBe(true);
    expect(res.reason).toBe('rate_limiter_near_depletion');
  });

  test('audit skips when near depletion', async () => {
    const { runIntegrityAudit } = require('../integrityAuditJob');
    const res = await runIntegrityAudit({ batchSize:1, maxBatches:1 });
    expect(res.skipped).toBe(true);
    expect(res.reason).toBe('rate_limiter_near_depletion');
  });

  test('bypass flag allows run despite near depletion', async () => {
    process.env.EBAY_THROTTLE_BYPASS = 'true';
    const { runReconciliation } = require('../reconciliationJob');
    const r = await runReconciliation({ batchSize:1, maxBatches:1 });
    expect(r.skipped).toBe(false);
    const { runIntegrityAudit } = require('../integrityAuditJob');
    const a = await runIntegrityAudit({ batchSize:1, maxBatches:1 });
    expect(a.skipped).toBe(false);
  });
});
