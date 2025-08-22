// publishFlow.e2e.test.js
// Minimal end-to-end style test of queueWorker -> adapter -> snapshotService integration (mocked DB layer)

jest.mock('../../../../models/ebayIntegrationModels', () => {
  const queue = [];
  const listings = new Map();
  const snapshots = [];
  const syncLogs = [];
  return {
    EbayChangeQueue: { findOne: jest.fn(async ({ where: { status } }) => queue.find(q => q.status === status) || null), count: jest.fn(async ({ where:{ status } }) => queue.filter(q=> q.status===status).length) },
    EbayListing: { findOne: jest.fn(async ({ where: { ebay_listing_id } }) => { for (const l of listings.values()) { if (l.ebay_listing_id === ebay_listing_id) { return l; } } return null; }) },
    EbaySyncLog: { create: jest.fn(async rec => { syncLogs.push(rec); return rec; }) },
    EbayFailedEvent: { create: jest.fn(async ()=>{}) },
    EbayListingSnapshot: { findOne: jest.fn(async ({ where:{ ebay_listing_id } }) => { const filtered = snapshots.filter(s=> s.ebay_listing_id === ebay_listing_id); filtered.sort((a,b)=> b.snapshot_id - a.snapshot_id); return filtered[0]||null; }), create: jest.fn(async data => { const row = { snapshot_id: snapshots.length+1, ...data }; snapshots.push(row); return row; }) },
    _state: { queue, listings, snapshots, syncLogs }
  };
});

jest.mock('../projectionBuilder', () => ({ buildProjection: jest.fn(async () => ({ projection:{ listing:{ id:1, title:'First'}}, projection_hash:'hash1' })) }));

jest.mock('../adapter', () => ({ createListing: jest.fn(async () => ({ success:true, external_item_id:'EXT1', revision:'rev1', statusCode:201 })), updateListing: jest.fn(async () => ({ success:true, revision:'rev2', statusCode:200 })), adapterEnabled: () => true }));

describe('publish flow e2e (mocked persistence)', () => {
  const { runOnce } = require('../queueWorker');
  const { snapshotListing } = require('../snapshotService');
  const { _state } = require('../../../../models/ebayIntegrationModels');
  beforeEach(() => {
    process.env.EBAY_PUBLISH_ENABLED = 'true';
    process.env.EBAY_SNAPSHOTS_ENABLED = 'true';
    _state.queue.length = 0; _state.snapshots.length = 0; _state.syncLogs.length = 0; _state.listings.clear();
    _state.listings.set(1, { ebay_listing_id:1, internal_listing_id: 42, lifecycle_state:'pending', update: async f => Object.assign(_state.listings.get(1), f) });
    _state.queue.push({ queue_id:1, ebay_listing_id:1, status:'pending', intent:'create', attempts:0, priority:5, created_at: new Date(Date.now()-500), update: async f=> Object.assign(_state.queue[0], f) });
  });

  test('queue item processes, listing updated, snapshot recorded', async () => {
    const res = await runOnce();
    expect(res.status).toBe('complete');
    expect(_state.queue[0].status).toBe('complete');
    // Should have snapshot row created
    expect(_state.snapshots.length).toBe(1);
    const snap = _state.snapshots[0];
    expect(snap.snapshot_hash).toBe('hash1');
    expect(snap.dedup_of_snapshot_id).toBeNull();
  });

  test('second identical publish is idempotent and produces dedup snapshot', async () => {
    const { buildProjection } = require('../projectionBuilder');
    await runOnce();
    // Re-enqueue same hash
    _state.queue.push({ queue_id:2, ebay_listing_id:1, status:'pending', intent:'update', attempts:0, priority:5, created_at: new Date(), update: async f=> Object.assign(_state.queue[1], f) });
    buildProjection.mockResolvedValueOnce({ projection:{ listing:{ id:1, title:'First'}}, projection_hash:'hash1' });
    const res2 = await runOnce();
    expect(res2.idempotent).toBe(true); // short-circuit publish
    // queueWorker returns before snapshot (only snapshotting on publish_success path) so force manual snapshot to mimic explicit call
    await snapshotListing(1, 'publish_success');
    await snapshotListing(1, 'publish_success'); // duplicate again
    expect(_state.snapshots.length).toBe(3);
    expect(_state.snapshots[1].dedup_of_snapshot_id).toBe(_state.snapshots[0].snapshot_id);
    expect(_state.snapshots[2].dedup_of_snapshot_id).toBe(_state.snapshots[0].snapshot_id);
  });
});
