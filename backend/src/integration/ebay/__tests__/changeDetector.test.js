// Tests for changeDetector logic with mocked dependencies
jest.mock('../projectionBuilder', () => ({
  buildProjection: jest.fn()
}));

jest.mock('../../../../models/ebayIntegrationModels', () => {
  const listings = new Map();
  const queue = [];
  return {
    EbayListing: {
      findOne: jest.fn(async ({ where: { internal_listing_id, ebay_listing_id } }) => {
        if (internal_listing_id !== undefined) {
          return listings.get(internal_listing_id) || null;
        }
        if (ebay_listing_id !== undefined) {
          for (const l of listings.values()) {
            if (l.ebay_listing_id === ebay_listing_id) {
              return l;
            }
          }
        }
        return null;
      }),
      create: jest.fn(async (data) => {
        const obj = { ebay_listing_id: listings.size + 1, last_publish_hash: null, lifecycle_state: 'pending', update: async f => Object.assign(obj, f), ...data };
        listings.set(data.internal_listing_id, obj);
        return obj;
      })
    },
    EbayChangeQueue: {
      create: jest.fn(async data => { queue.push({ queue_id: queue.length + 1, status: 'pending', ...data }); return data; }),
      findOne: jest.fn(async ({ where: { ebay_listing_id, payload_hash, status } }) => {
        let statuses;
        if (Array.isArray(status)) { statuses = status; }
        else if (status && typeof status === 'object') { 
          const k = Object.keys(status)[0]; 
          if (k) { statuses = status[k]; }
          const symKeys = Object.getOwnPropertySymbols(status);
          if (!statuses && symKeys.length) { statuses = status[symKeys[0]]; }
        }
        else { statuses = [status]; }
        statuses = Array.isArray(statuses) ? statuses : [];
        return queue.find(q => q.ebay_listing_id === ebay_listing_id && q.payload_hash === payload_hash && statuses.includes(q.status));
      })
    },
    _testState: { listings, queue }
  };
});

describe('changeDetector', () => {
  const { buildProjection } = require('../projectionBuilder');
  let changeDetector;
  let state;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EBAY_QUEUE_ENABLED = 'true';
    changeDetector = require('../changeDetector');
    state = require('../../../../models/ebayIntegrationModels')._testState;
    state.listings.clear();
    state.queue.length = 0;
  });

  test('skips when feature flag disabled', async () => {
  process.env.EBAY_QUEUE_ENABLED = 'false';
  const res = await changeDetector.processListingChange(1, 'create');
    expect(res.skipped).toBe(true);
    expect(res.reason).toBe('feature_flag_disabled');
  });

  test('enqueues create when listing absent', async () => {
    buildProjection.mockImplementation(async () => ({ projection: {}, projection_hash: 'h1' }));
    const res = await changeDetector.processListingChange(101, 'create');
    expect(res.skipped).toBe(false);
    expect(res.intent).toBe('create');
    // Simulate post-publish setting of last_publish_hash for later tests
    state.listings.get(101).last_publish_hash = 'h1';
    expect(state.queue.length).toBe(1);
  });

  test('skips enqueue if hash unchanged (update)', async () => {
    buildProjection.mockImplementation(async () => ({ projection: {}, projection_hash: 'hSame' }));
    await changeDetector.processListingChange(202, 'create');
    const l = state.listings.get(202);
    // Simulate publish set last hash
    l.last_publish_hash = 'hSame';
    const res = await changeDetector.processListingChange(202, 'update');
    expect(res.skipped).toBe(true);
    expect(res.reason).toBe('hash_unchanged');
    expect(state.queue.length).toBe(1); // only initial create
  });

  test('enqueues update when hash changed', async () => {
    // First create with hOld
    buildProjection.mockImplementationOnce(async () => ({ projection: {}, projection_hash: 'hOld' }));
    await changeDetector.processListingChange(303, 'create');
    const l = state.listings.get(303);
    l.last_publish_hash = 'hOld';
    // Update with new hash
    buildProjection.mockImplementationOnce(async () => ({ projection: {}, projection_hash: 'hNew' }));
    const res = await changeDetector.processListingChange(303, 'update');
    expect(res.skipped).toBe(false);
    expect(res.intent).toBe('update');
    expect(state.queue.length).toBe(2);
  });

  test('skips duplicate pending with same hash (idempotent enqueue)', async () => {
    buildProjection.mockImplementation(async () => ({ projection: {}, projection_hash: 'dupHash' }));
    const first = await changeDetector.processListingChange(909, 'create');
    expect(first.skipped).toBe(false);
    // Do not simulate publish (so last_publish_hash remains null) to force update path to consider hash change logic
    const second = await changeDetector.processListingChange(909, 'update');
    expect(second.skipped).toBe(true);
    expect(second.reason).toBe('duplicate_pending');
  });
});
