const { handlePolicyChanges } = require('../policyImpactHandler');

jest.mock('../../../../models/ebayIntegrationModels', () => {
  const listings = [
    { ebay_listing_id:1, internal_listing_id:101, external_item_id:'X1' },
    { ebay_listing_id:2, internal_listing_id:102, external_item_id:null }
  ];
  const queue = [];
  return {
    EbayListing: { findAll: jest.fn(async () => listings) },
    EbayChangeQueue: { create: jest.fn(async (row) => { queue.push(row); return { queue_id: queue.length, ...row }; }) },
    _seed: { listings, queue }
  };
});

jest.mock('../projectionBuilder', () => ({ buildProjection: jest.fn(async (id) => ({ projection:{ id }, projection_hash: 'hash_'+id })) }));

jest.mock('../snapshotService', () => ({ snapshotListing: jest.fn(async () => ({ snapshot_id:1 })) }));

describe('policyImpactHandler', () => {
  beforeEach(() => { process.env.EBAY_POLICY_IMPACT_ENABLED = 'true'; process.env.EBAY_POLICY_IMPACT_SNAPSHOT = 'true'; });

  test('enqueues updates for listings on policy change', async () => {
    const res = await handlePolicyChanges([{ policy_type:'shipping', external_id:'S1' }]);
    expect(res.skipped).toBe(false);
    expect(res.enqueued).toBe(2);
    expect(res.snapshots).toBe(2);
  });

  test('skips when feature disabled', async () => {
    process.env.EBAY_POLICY_IMPACT_ENABLED = 'false';
    const res = await handlePolicyChanges([{ policy_type:'shipping', external_id:'S1' }]);
    expect(res.skipped).toBe(true);
  });
});
