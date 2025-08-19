jest.mock('../../../../models/ebayIntegrationModels', () => {
  const listings = [
    { ebay_listing_id:1, internal_listing_id: 101, last_publish_hash: 'h-old', external_item_id: 'EXT-1' },
    { ebay_listing_id:2, internal_listing_id: 102, last_publish_hash: 'h-same', external_item_id: 'EXT-2' }
  ];
  const snapshots = [];
  const queue = [];
  return {
    EbayListing: { findAll: jest.fn(async ({ offset, limit }) => listings.slice(offset, offset+limit)) },
    EbayListingSnapshot: { findOne: jest.fn(async ({ where:{ ebay_listing_id } }) => snapshots.filter(s=>s.ebay_listing_id===ebay_listing_id).slice(-1)[0] || null) },
    EbayChangeQueue: { findOne: jest.fn(async ({ where:{ ebay_listing_id, status } }) => queue.find(q=>q.ebay_listing_id===ebay_listing_id && q.status===status) || null), create: jest.fn(async rec => { queue.push({ ...rec, status:'pending' }); return rec; }) },
    _seed: { listings, snapshots, queue }
  };
});

jest.mock('../projectionBuilder', () => ({
  buildProjection: jest.fn(async (listingId) => {
    if (listingId === 101) { return { projection: { id:101, v:2 }, projection_hash: 'h-new' }; }
    return { projection: { id:102, v:1 }, projection_hash: 'h-same' };
  })
}));

jest.mock('../snapshotService', () => ({
  snapshotListing: jest.fn(async () => ({ skipped:false, snapshot_id: 1 }))
}));

describe('reconciliationJob', () => {
  const { runReconciliation } = require('../reconciliationJob');
  const { _seed } = require('../../../../models/ebayIntegrationModels');
  beforeEach(()=>{ process.env.EBAY_RECON_ENABLED = 'true'; process.env.EBAY_RECON_SNAPSHOT_ON_DRIFT='true'; _seed.queue.length = 0; });

  test('enqueues drift for changed hash only', async () => {
  const res = await runReconciliation({ batchSize: 10, maxBatches: 1 });
    expect(res.driftEnqueued).toBe(1);
  expect(res.snapshots).toBe(1);
    expect(_seed.queue.length).toBe(1);
    expect(_seed.queue[0].payload_hash).toBe('h-new');
  });
});
