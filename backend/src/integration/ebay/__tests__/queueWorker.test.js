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

// Mock projectionBuilder for queue worker (simple hash/projection)
jest.mock('../projectionBuilder', () => ({
  buildProjection: jest.fn(async () => ({ projection: { listing:{ id:1 }}, projection_hash: 'h-test' }))
}));

// Mock adapter to bypass real publish path
jest.mock('../adapter', () => ({
  createListing: jest.fn(async () => ({ success: true, external_item_id: 'MOCK-X', revision: 'rX', statusCode: 201 })),
  updateListing: jest.fn(async () => ({ success: true, revision: 'rY', statusCode: 200 })),
  adapterEnabled: () => true
}));

describe('queueWorker', () => {
  const { runOnce } = require('../queueWorker');
  const { _seed } = require('../../../../models/ebayIntegrationModels');

  beforeEach(() => {
    process.env.EBAY_PUBLISH_ENABLED = 'true';
    _seed.queue.length = 0;
    _seed.listings.clear();
    _seed.listings.set(1, { ebay_listing_id: 1, lifecycle_state: 'pending', update: async f => Object.assign(_seed.listings.get(1), f) });
    _seed.queue.push({ queue_id: 1, ebay_listing_id: 1, status: 'pending', intent: 'create', attempts: 0, priority: 5, update: async f => Object.assign(_seed.queue[0], f) });
  });

  test('processes one pending item and marks complete and logs sync', async () => {
    const res = await runOnce();
    expect(res.processed).toBe(true);
    expect(res.status).toBe('complete');
    expect(_seed.queue[0].status).toBe('complete');
    expect(_seed.syncLogs.length).toBe(1);
    expect(_seed.syncLogs[0].result).toBe('success');
  });

  test('returns empty when no pending items', async () => {
    _seed.queue[0].status = 'complete';
    const res = await runOnce();
    expect(res.processed).toBe(false);
    expect(res.reason).toBe('empty');
  });
});
