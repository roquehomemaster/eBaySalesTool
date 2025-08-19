jest.mock('../../../../models/ebayIntegrationModels', () => {
  const queue = [];
  const listings = new Map();
  const syncLogs = [];
  return {
    EbayChangeQueue: { findOne: jest.fn(async ({ where: { status } }) => queue.find(q => q.status === status) || null) },
    EbayListing: { findOne: jest.fn(async ({ where: { ebay_listing_id } }) => { 
      for (const l of listings.values()) { 
        if (l.ebay_listing_id === ebay_listing_id) { 
          return l; 
        } 
      } 
      return null; 
    }) },
    EbaySyncLog: { create: jest.fn(async rec => { syncLogs.push(rec); return rec; }) },
    _seed: { queue, listings, syncLogs }
  };
});

jest.mock('../projectionBuilder', () => ({
  buildProjection: jest.fn()
}));

jest.mock('../adapter', () => ({
  createListing: jest.fn(async () => ({ success: true, external_item_id: 'MOCK-1', revision: 'r1', statusCode: 201 })),
  updateListing: jest.fn(async () => ({ success: true, revision: 'r2', statusCode: 200 })),
  adapterEnabled: () => true
}));

describe('publisher flow (queueWorker)', () => {
  const { runOnce } = require('../queueWorker');
  const { _seed } = require('../../../../models/ebayIntegrationModels');
  const { buildProjection } = require('../projectionBuilder');

  beforeEach(() => {
    process.env.EBAY_PUBLISH_ENABLED = 'true';
    _seed.queue.length = 0; _seed.listings.clear();
    _seed.listings.set(1, { ebay_listing_id:1, internal_listing_id: 42, lifecycle_state: 'pending', update: async f => Object.assign(_seed.listings.get(1), f) });
    _seed.queue.push({ queue_id:1, ebay_listing_id:1, status:'pending', intent:'create', attempts:0, priority:5, update: async f => Object.assign(_seed.queue[0], f) });
    buildProjection.mockResolvedValue({ projection:{ listing:{ id:42 }}, projection_hash:'hash42' });
  });

  test('processes create and sets publish metadata', async () => {
  const res = await runOnce();
    expect(res.published).toBe(true);
    const l = _seed.listings.get(1);
    expect(l.last_publish_hash).toBe('hash42');
    expect(_seed.queue[0].status).toBe('complete');
  expect(_seed.syncLogs.length).toBe(1);
  expect(_seed.syncLogs[0].result).toBe('success');
  });
});
