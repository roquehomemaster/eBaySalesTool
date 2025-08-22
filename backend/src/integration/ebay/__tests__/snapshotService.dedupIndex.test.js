const path = require('path');

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

describe('snapshotService dedup index assumptions', () => {
  const { snapshotListing } = require('../snapshotService');
  const { buildProjection } = require('../projectionBuilder');
  const { _state } = require('../../../../models/ebayIntegrationModels');

  beforeEach(() => {
    process.env.EBAY_SNAPSHOTS_ENABLED = 'true';
    _state.listings.clear();
    _state.snapshots.length = 0;
    _state.listings.set(1, { ebay_listing_id:1, internal_listing_id: 55 });
  });

  test('multiple duplicate snapshots allowed and linked via dedup_of_snapshot_id', async () => {
    buildProjection.mockResolvedValue({ projection:{ listing:{ id:1 }}, projection_hash:'sameHash' });
    const s1 = await snapshotListing(1, 'publish_success');
    const s2 = await snapshotListing(1, 'publish_success');
    const s3 = await snapshotListing(1, 'publish_success');
    expect(s1.dedup).toBe(false);
    expect(s2.dedup).toBe(true);
    expect(s3.dedup).toBe(true);
    const { _state: state } = require('../../../../models/ebayIntegrationModels');
    const snapshotRows = state.snapshots;
    expect(snapshotRows.length).toBe(3);
    // Ensure later duplicates reference the original snapshot id
    const origId = snapshotRows[0].snapshot_id;
    expect(snapshotRows[1].dedup_of_snapshot_id).toBe(origId);
    expect(snapshotRows[2].dedup_of_snapshot_id).toBe(origId);
  });
});
