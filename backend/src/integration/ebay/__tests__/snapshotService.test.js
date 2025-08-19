jest.mock('../../../../models/ebayIntegrationModels', () => {
  const listings = new Map();
  const snapshots = [];
  return {
    EbayListing: {
      findOne: jest.fn(async ({ where: { ebay_listing_id } }) => {
        for (const l of listings.values()) {
          if (l.ebay_listing_id === ebay_listing_id) {
            return l;
          }
        }
        return null;
      })
    },
    EbayListingSnapshot: {
      findOne: jest.fn(async ({ where: { ebay_listing_id } }) => {
        const filtered = snapshots.filter(s => s.ebay_listing_id === ebay_listing_id);
        filtered.sort((a,b)=> b.snapshot_id - a.snapshot_id);
        return filtered[0] || null;
      }),
      create: jest.fn(async data => { const row = { snapshot_id: snapshots.length+1, ...data }; snapshots.push(row); return row; })
    },
    _state: { listings, snapshots }
  };
});

jest.mock('../projectionBuilder', () => ({
  buildProjection: jest.fn()
}));

describe('snapshotService', () => {
  const { snapshotListing } = require('../snapshotService');
  const { buildProjection } = require('../projectionBuilder');
  const { _state } = require('../../../../models/ebayIntegrationModels');

  beforeEach(() => {
    process.env.EBAY_SNAPSHOTS_ENABLED = 'true';
    _state.listings.clear();
    _state.snapshots.length = 0;
    _state.listings.set(1, { ebay_listing_id:1, internal_listing_id: 55 });
  });

  test('creates first snapshot', async () => {
    buildProjection.mockResolvedValue({ projection:{ listing:{ id:1 }}, projection_hash:'h1' });
    const res = await snapshotListing(1, 'queue_processed');
    expect(res.dedup).toBe(false);
    expect(res.hash).toBe('h1');
  });

  test('dedups identical subsequent snapshot', async () => {
    buildProjection.mockResolvedValue({ projection:{ listing:{ id:1 }}, projection_hash:'h1' });
    await snapshotListing(1, 'queue_processed');
    const res2 = await snapshotListing(1, 'queue_processed');
    expect(res2.dedup).toBe(true);
  });

  test('captures diff on change', async () => {
    buildProjection.mockResolvedValueOnce({ projection:{ listing:{ id:1, title:'A'}}, projection_hash:'hA' });
    buildProjection.mockResolvedValueOnce({ projection:{ listing:{ id:1, title:'B'}}, projection_hash:'hB' });
    await snapshotListing(1, 'queue_processed');
    const res = await snapshotListing(1, 'queue_processed');
    expect(res.dedup).toBe(false);
    expect(res.hash).toBe('hB');
  });
});
