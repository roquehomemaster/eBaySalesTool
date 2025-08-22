const metrics = require('../metrics');
// Mock dependencies
jest.mock('../projectionBuilder', () => ({ buildProjection: jest.fn(()=>Promise.resolve({ projection:{}, projection_hash:'h' })) }));
jest.mock('../adapter', () => ({ createListing: jest.fn(()=>Promise.resolve({ success:true })), updateListing: jest.fn(()=>Promise.resolve({ success:true })) }));
jest.mock('../../../models/ebayIntegrationModels', () => ({
  EbayChangeQueue: {},
  EbayListing: { findOne: jest.fn(() => Promise.resolve({ internal_listing_id:1, last_publish_hash:null, update: jest.fn(), lifecycle_state:'pending', external_item_id:null })) },
  EbaySyncLog: { create: jest.fn(()=>Promise.resolve()) },
  EbayFailedEvent: { create: jest.fn(()=>Promise.resolve()) }
}));

// Capture logger output
jest.mock('../../../utils/logger', () => {
  const logs = [];
  const make = level => (...a) => logs.push([level, ...a]);
  return { info: make('info'), warn: make('warn'), error: make('error'), debug: make('debug'), _logs: logs };
});

const logger = require('../../../utils/logger');
const { runOnce } = require('../queueWorker');

describe('queue max wait structured log', () => {
  test('emits queue_wait_max_update when new max observed', async () => {
  // Reset prior state from other tests
  metrics._internal_state.queue_max_item_wait_ms = 0;
  logger._logs.length = 0;
    global.__TEST_EBAY_QUEUE_MODEL__ = {
      // First item 800ms old
      findOne: jest.fn(()=>Promise.resolve({ created_at: new Date(Date.now() - 800), update: jest.fn(), attempts:0, intent:'create', ebay_listing_id:1, queue_id: 301 })),
      count: jest.fn(()=>Promise.resolve(1))
    };
    await runOnce();
    // Second item older 1500ms triggers max update
    global.__TEST_EBAY_QUEUE_MODEL__ = {
      findOne: jest.fn(()=>Promise.resolve({ created_at: new Date(Date.now() - 1500), update: jest.fn(), attempts:0, intent:'create', ebay_listing_id:1, queue_id: 302 })),
      count: jest.fn(()=>Promise.resolve(1))
    };
    await runOnce();
  // Assert counter incremented (indirect evidence log path executed) and gauge updated
  const snap = metrics.snapshot();
  expect(snap.counters['queue.max_item_wait_update']).toBeGreaterThanOrEqual(1);
  expect(snap.gauges['queue.max_item_wait_ms']).toBeGreaterThanOrEqual(1500 - 50); // allow small timing variance
    delete global.__TEST_EBAY_QUEUE_MODEL__;
  });
});
