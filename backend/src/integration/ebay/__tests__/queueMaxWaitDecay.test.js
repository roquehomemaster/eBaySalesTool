process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.QUEUE_MAX_WAIT_DECAY_WINDOW_MS='10'; // 10ms decay window
process.env.QUEUE_MAX_WAIT_DECAY_MODE='reset';

const { runOnce } = require('../queueWorker');
const metrics = require('../metrics');

// mock queue model
const baseCreated = Date.now() - 1000;
let fetches = 0;
global.__TEST_EBAY_QUEUE_MODEL__ = {
  findOne: jest.fn(()=>{
    if (fetches === 0) { fetches++; return Promise.resolve({ created_at: new Date(baseCreated), update: jest.fn(), attempts:0, intent:'create', ebay_listing_id:1, queue_id:1, status:'pending' }); }
    if (fetches === 1) { fetches++; return Promise.resolve(null); }
    return Promise.resolve(null);
  }),
  count: jest.fn(()=>Promise.resolve(fetches === 0 ? 1 : 0))
};

jest.mock('../../../models/ebayIntegrationModels', () => ({
  EbayChangeQueue: {},
  EbayListing: { findOne: jest.fn(()=>Promise.resolve({ internal_listing_id:1, last_publish_hash:null, update: jest.fn(), lifecycle_state:'pending', external_item_id:null })) },
  EbaySyncLog: { create: jest.fn(()=>Promise.resolve()) },
  EbayFailedEvent: { create: jest.fn(()=>Promise.resolve()) }
}));

jest.mock('../projectionBuilder', () => ({ buildProjection: jest.fn(()=>Promise.resolve({ projection:{}, projection_hash:'h' })) }));
jest.mock('../adapter', () => ({ createListing: jest.fn(()=>Promise.resolve({ success:true })), updateListing: jest.fn(()=>Promise.resolve({ success:true })) }));

describe('queue max wait decay', () => {
  test('resets max wait after decay window', async () => {
    await runOnce(); // process item, set max wait
    const snap1 = metrics.snapshot();
    expect(snap1.gauges['queue.max_item_wait_ms']).toBeGreaterThan(0);
    // Wait beyond decay window
    await new Promise(r=>setTimeout(r, 30));
    await runOnce(); // triggers decay path (no item)
    const snap2 = metrics.snapshot();
    expect(snap2.gauges['queue.max_item_wait_decayed']).toBe(1);
    expect(snap2.gauges['queue.max_item_wait_ms']).toBe(0); // reset mode
    delete global.__TEST_EBAY_QUEUE_MODEL__;
  });
});
