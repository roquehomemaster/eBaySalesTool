// Tests for idempotent enqueue & publish skip integration
jest.mock('../projectionBuilder', () => ({ buildProjection: jest.fn() }));

jest.mock('../../../../models/ebayIntegrationModels', () => {
  const listings = new Map();
  const queue = [];
  return {
    EbayListing: {
      findOne: jest.fn(async ({ where: { internal_listing_id, ebay_listing_id } }) => {
        if (internal_listing_id !== undefined) return listings.get(internal_listing_id) || null;
        if (ebay_listing_id !== undefined) {
          for (const l of listings.values()) { if (l.ebay_listing_id === ebay_listing_id) return l; }
        }
        return null;
      }),
      create: jest.fn(async data => { const obj = { ebay_listing_id: listings.size + 1, lifecycle_state:'pending', last_publish_hash:null, update: async f => Object.assign(obj, f), ...data }; listings.set(data.internal_listing_id, obj); return obj; })
    },
    EbayChangeQueue: {
      create: jest.fn(async data => { const entry = { queue_id: queue.length + 1, status:'pending', attempts:0, update: async f => Object.assign(entry, f), ...data }; queue.push(entry); return entry; }),
      findOne: jest.fn(async ({ where }) => {
        return queue.find(q => {
          return Object.entries(where).every(([k,v]) => {
            if (k === 'status') {
              if (Array.isArray(v)) return v.includes(q.status);
              if (v && typeof v === 'object') { const syms = Object.getOwnPropertySymbols(v); const key = syms[0] || Object.keys(v)[0]; return (v[key]||[]).includes(q.status); }
              return q.status === v;
            }
            return q[k] === v;
          });
        }) || null;
      })
    },
    _state: { listings, queue }
  };
});

// Mock adapter create/update to count external calls
jest.mock('../adapter', () => ({
  createListing: jest.fn(async () => ({ success:true, external_item_id:'EXT-1', revision:'r1', statusCode:201 })),
  updateListing: jest.fn(async () => ({ success:true, revision:'r2', statusCode:200 })),
  adapterEnabled: () => true
}));

const { buildProjection } = require('../projectionBuilder');
const changeDetector = require('../changeDetector');
const { runOnce } = require('../queueWorker');
const adapter = require('../adapter');

describe('idempotency integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EBAY_QUEUE_ENABLED = 'true';
    process.env.EBAY_PUBLISH_ENABLED = 'true';
    const st = require('../../../../models/ebayIntegrationModels')._state;
    st.listings.clear();
    st.queue.length = 0;
  });

  test('duplicate enqueue suppressed and duplicate publish skipped', async () => {
  buildProjection.mockImplementation(async () => ({ projection:{}, projection_hash:'Hsame' }));
    const first = await changeDetector.processListingChange(1, 'trigger');
    expect(first.skipped).toBe(false);
    const second = await changeDetector.processListingChange(1, 'trigger');
    expect(second.skipped).toBe(true);
    expect(second.reason).toBe('duplicate_pending');
    // Process queue: first publish
    await runOnce();
    // Listing now has last_publish_hash set to Hsame
    // Enqueue again after publish - should skip due to hash_unchanged
    const third = await changeDetector.processListingChange(1, 'trigger');
    expect(third.skipped).toBe(true);
    expect(['hash_unchanged','duplicate_pending']).toContain(third.reason);
    // Force a second queue entry with same hash (simulate race) and ensure worker idempotent skip
    const st = require('../../../../models/ebayIntegrationModels')._state;
    const listing = st.listings.get(1);
    // Manually push a duplicate queue item (would be blocked by index in real DB if pending)
    st.queue.push({ queue_id: 99, ebay_listing_id: listing.ebay_listing_id, status:'pending', intent:'update', attempts:0, payload_hash:'Hsame', update: async f => Object.assign(st.queue[st.queue.length-1], f) });
    const res = await runOnce();
    expect(res.idempotent).toBe(true);
    expect(adapter.updateListing).not.toHaveBeenCalled();
  });
});
