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

describe('snapshotService diff content', () => {
  const { snapshotListing } = require('../snapshotService');
  const { buildProjection } = require('../projectionBuilder');
  const { _state } = require('../../../../models/ebayIntegrationModels');

  beforeEach(() => {
    process.env.EBAY_SNAPSHOTS_ENABLED = 'true';
    _state.listings.clear();
    _state.snapshots.length = 0;
    _state.listings.set(1, { ebay_listing_id:1, internal_listing_id: 55 });
  });

  test('diff_from_prev_json contains changed paths as keys', async () => {
    buildProjection.mockResolvedValueOnce({ projection:{ listing:{ id:1, title:'A', price:10 }}, projection_hash:'hA' });
    await snapshotListing(1, 'publish_success');
    buildProjection.mockResolvedValueOnce({ projection:{ listing:{ id:1, title:'B', price:10 }}, projection_hash:'hB' });
    const res = await snapshotListing(1, 'publish_success');
    expect(res.dedup).toBe(false);
    const { _state: state } = require('../../../../models/ebayIntegrationModels');
    const rows = state.snapshots;
    expect(rows.length).toBe(2);
    const second = rows[1];
    expect(second.diff_from_prev_json).toBeTruthy();
    const keys = Object.keys(second.diff_from_prev_json);
    expect(keys).toContain('/listing/title');
    // Ensure unchanged field not present in diff map
    expect(keys).not.toContain('/listing/price');
  });
});
