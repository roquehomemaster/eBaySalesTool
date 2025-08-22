const metrics = require('../metrics');

// Mock dependencies BEFORE loading queueWorker
jest.mock('../projectionBuilder', () => ({ buildProjection: jest.fn(()=>Promise.resolve({ projection:{}, projection_hash:'h' })) }));
jest.mock('../adapter', () => ({ createListing: jest.fn(()=>Promise.resolve({ success:true })), updateListing: jest.fn(()=>Promise.resolve({ success:true })) }));
// Provide minimal listing + related models but NOT queue (queue is injected via global)
jest.mock('../../../models/ebayIntegrationModels', () => ({
  EbayChangeQueue: {}, // unused due to injection
  EbayListing: { findOne: jest.fn(() => Promise.resolve({ internal_listing_id:1, last_publish_hash:null, update: jest.fn(), lifecycle_state:'pending', external_item_id:null })) },
  EbaySyncLog: { create: jest.fn(()=>Promise.resolve()) },
  EbayFailedEvent: { create: jest.fn(()=>Promise.resolve()) }
}));

const { runOnce } = require('../queueWorker');

describe('queue oldest pending age metric', () => {
  test('sets queue.oldest_pending_age_ms gauge when item present', async () => {
    global.__TEST_EBAY_QUEUE_MODEL__ = {
      findOne: jest.fn(() => Promise.resolve({ created_at: new Date(Date.now() - 1500), update: jest.fn(), attempts:0, intent:'create', ebay_listing_id:1, queue_id: 10 })),
      count: jest.fn(() => Promise.resolve(5))
    };
    await runOnce();
    const snap = metrics.snapshot();
    expect(typeof snap.gauges['queue.oldest_pending_age_ms']).toBe('number');
    expect(snap.gauges['queue.oldest_pending_age_ms']).toBeGreaterThanOrEqual(1000);
    delete global.__TEST_EBAY_QUEUE_MODEL__;
  });
});
