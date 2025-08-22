const metrics = require('../metrics');

// Mock dependencies first
jest.mock('../projectionBuilder', () => ({ buildProjection: jest.fn(()=>Promise.resolve({ projection:{}, projection_hash:'h' })) }));
jest.mock('../adapter', () => ({ createListing: jest.fn(()=>Promise.resolve({ success:true })), updateListing: jest.fn(()=>Promise.resolve({ success:true })) }));

jest.mock('../../../models/ebayIntegrationModels', () => ({
  EbayChangeQueue: {}, // unused (we inject via global)
  EbayListing: { findOne: jest.fn(() => Promise.resolve({ internal_listing_id:1, last_publish_hash:null, update: jest.fn(), lifecycle_state:'pending', external_item_id:null })) },
  EbaySyncLog: { create: jest.fn(()=>Promise.resolve()) },
  EbayFailedEvent: { create: jest.fn(()=>Promise.resolve()) }
}));

const { runOnce } = require('../queueWorker');

describe('queue item wait metrics', () => {
  test('observes queue.item_wait_ms and updates gauges', async () => {
    const createdAt = new Date(Date.now() - 2500);
    global.__TEST_EBAY_QUEUE_MODEL__ = {
      findOne: jest.fn(() => Promise.resolve({ created_at: createdAt, update: jest.fn(), attempts:0, intent:'create', ebay_listing_id:1, queue_id: 22 })),
      count: jest.fn(() => Promise.resolve(3))
    };
    await runOnce();
    const snap = metrics.snapshot();
    expect(typeof snap.gauges['queue.last_item_wait_ms']).toBe('number');
    expect(snap.gauges['queue.last_item_wait_ms']).toBeGreaterThanOrEqual(2000);
    expect(snap.gauges['queue.max_item_wait_ms']).toBeGreaterThanOrEqual(snap.gauges['queue.last_item_wait_ms']);
    const h = snap.histograms['queue.item_wait_ms'];
    expect(h).toBeTruthy();
    expect(h.count).toBeGreaterThanOrEqual(1);
    delete global.__TEST_EBAY_QUEUE_MODEL__;
  });
});
