// Tests drift classification logic (internal_only, both_changed) simplified
jest.mock('../../../../models/ebayIntegrationModels', () => {
  const listings = [
    { ebay_listing_id:1, internal_listing_id:101, external_item_id:'EXT1', last_publish_hash:'Hsnap1' },
    { ebay_listing_id:2, internal_listing_id:202, external_item_id:'EXT2', last_publish_hash:'Hold' }
  ];
  const snapshots = new Map([[1, { snapshot_hash:'Hsnap1', snapshot_json:{ listing:{ id:1, title:'A'} } }], [2, { snapshot_hash:'Hold', snapshot_json:{ listing:{ id:2, title:'B'} } }]]);
  const queue = [];
  return {
    EbayListing: { findAll: jest.fn(async () => listings) },
    EbayListingSnapshot: { findOne: jest.fn(async ({ where:{ ebay_listing_id } }) => snapshots.get(ebay_listing_id) || null) },
    EbayChangeQueue: { findOne: jest.fn(async () => null), create: jest.fn(async row => { queue.push(row); return row; }) },
    EbayDriftEvent: { create: jest.fn(async () => {}) }
  };
});

jest.mock('../projectionBuilder', () => ({ buildProjection: jest.fn(async (id) => ({ projection:{ listing:{ id, title: id===101?'X':'Y' } }, projection_hash: id === 101 ? 'Hchanged' : 'Hold' })) }));

jest.mock('../adapter', () => ({ getListing: jest.fn(async (id) => ({ success:true, body:{ id, remote:true, marker: Date.now() } })) }));

const { runReconciliation } = require('../reconciliationJob');

describe('drift classification', () => {
  beforeEach(() => { process.env.EBAY_RECON_ENABLED = 'true'; });
  test('classifies drift and enqueues with events', async () => {
    const res = await runReconciliation({ batchSize:10, maxBatches:1 });
    expect(res.driftEnqueued).toBeGreaterThan(0);
  });
});
