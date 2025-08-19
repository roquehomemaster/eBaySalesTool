const { runIntegrityAudit, auditSnapshotsBatch } = require('../integrityAuditJob');

jest.mock('../../../../models/ebayIntegrationModels', () => {
  const listings = [ { ebay_listing_id:1, internal_listing_id:101, last_publish_hash:'hash_101' } ];
  const snapshots = [
    { snapshot_id: 5, ebay_listing_id:1, snapshot_json:{ x:1 }, snapshot_hash:'bad_hash' },
    { snapshot_id: 4, ebay_listing_id:1, snapshot_json:{ x:1 }, snapshot_hash:'bad_hash' }
  ];
  return {
    EbayListing: { findOne: jest.fn(async () => listings[0]) },
    EbayListingSnapshot: { findAll: jest.fn(async () => snapshots) }
  };
});

jest.mock('../hashUtil', () => ({ hashObject: jest.fn(obj => 'good_hash_'+Object.keys(obj).length) }));
jest.mock('../projectionBuilder', () => ({ buildProjection: jest.fn(async (id) => ({ projection:{ id }, projection_hash: 'proj_'+id })) }));

describe('integrityAuditJob', () => {
  beforeEach(() => { process.env.EBAY_AUDIT_ENABLED = 'true'; });

  test('auditSnapshotsBatch detects hash mismatches', async () => {
    const res = await auditSnapshotsBatch({ limit:2 });
    expect(res.issues.some(i=>i.type==='snapshot_hash_mismatch')).toBe(true);
  });

  test('runIntegrityAudit aggregates batches', async () => {
    const res = await runIntegrityAudit({ batchSize:2, maxBatches:1 });
    expect(res.skipped).toBe(false);
    expect(res.totalScanned).toBeGreaterThan(0);
    expect(res.issues.length).toBeGreaterThan(0);
  });

  test('skips when disabled', async () => {
    process.env.EBAY_AUDIT_ENABLED = 'false';
    const res = await runIntegrityAudit();
    expect(res.skipped).toBe(true);
  });
});
