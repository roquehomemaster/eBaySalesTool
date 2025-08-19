const express = require('express');

jest.mock('../../../../models/ebayIntegrationModels', () => {
  const queue = [ { queue_id:1, priority:5, created_at:new Date(), status:'error', error_reason:'x', update: async f => Object.assign(queue[0], f) } ];
  const failedEvents = [ { failed_event_id: 5, ebay_listing_id: 1, intent: 'update', payload_hash:'h1', last_error:'boom' } ];
  const snapshots = [
    { snapshot_id: 10, ebay_listing_id: 1, snapshot_json: { a:1, b:{ c:2 } } },
    { snapshot_id: 11, ebay_listing_id: 1, snapshot_json: { a:1, b:{ c:3 } } }
  ];
  const syncLogs = [
    { sync_log_id: 100, ebay_listing_id:1, operation:'create', result:'success', response_code:201 },
    { sync_log_id: 101, ebay_listing_id:1, operation:'update', result:'retry', response_code:429 }
  ];
  const policies = [
    { policy_cache_id: 1, policy_type: 'shipping', external_id: 'S1', name: 'ShipPolicy1' },
    { policy_cache_id: 2, policy_type: 'return', external_id: 'R1', name: 'ReturnPolicy1' }
  ];
  return {
  EbayChangeQueue: { findAll: jest.fn(async () => queue), findOne: jest.fn(async ({ where:{ queue_id } }) => queue.find(q=>q.queue_id===queue_id) || null), create: jest.fn(async obj => ({ queue_id: 2, ...obj })) },
  EbayFailedEvent: { findAll: jest.fn(async () => failedEvents), findOne: jest.fn(async ({ where:{ failed_event_id } }) => failedEvents.find(f=>f.failed_event_id===failed_event_id) || null) },
    EbayListingSnapshot: { findAll: jest.fn(async () => snapshots), findOne: jest.fn(async ({ where:{ snapshot_id } }) => snapshots.find(s=>s.snapshot_id===snapshot_id) || null) },
    EbaySyncLog: { findAll: jest.fn(async () => syncLogs) },
    EbayPolicyCache: { findAll: jest.fn(async () => policies), destroy: jest.fn(async () => 1) },
    _seed: { queue, snapshots, syncLogs }
  };
});

const request = require('supertest');
// Mock child_process for /map/run endpoint
jest.mock('child_process', () => ({
  spawn: jest.fn(() => {
    const { EventEmitter } = require('events');
    const emitter = new EventEmitter();
    process.nextTick(() => {
      emitter.stdout.emit('data', 'Mapping pass complete {"mapped":1,"skipped":0}\n');
      emitter.emit('close', 0);
    });
    emitter.stdout = new EventEmitter();
    emitter.stderr = new EventEmitter();
    return emitter;
  })
}));
const queueRoutes = require('../../../routes/ebayQueueAdminRoutes');
const snapshotRoutes = require('../../../routes/ebaySnapshotAdminRoutes');
const syncLogRoutes = require('../../../routes/ebaySyncLogAdminRoutes');
const policyRoutes = require('../../../routes/ebayPolicyAdminRoutes');

function buildApp(){
  const app = express();
  app.use(express.json());
  app.use('/api/admin/ebay', queueRoutes);
  app.use('/api/admin/ebay', snapshotRoutes);
  app.use('/api/admin/ebay', syncLogRoutes);
  app.use('/api/admin/ebay', policyRoutes);
  return app;
}

describe('eBay admin routes', () => {
  let app;
  beforeEach(()=>{ app = buildApp(); });

  test('GET /api/admin/ebay/queue returns queue items', async () => {
    const res = await request(app).get('/api/admin/ebay/queue');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
  });

  test('POST retrieve ingests raw ids (dry-run default)', async () => {
    const res = await request(app).post('/api/admin/ebay/retrieve').send({ itemIds: '101,102' });
    expect(res.status).toBe(200);
    expect(res.body.summary.requested).toBe(2);
  });

  test('POST map/run returns parsed summary', async () => {
    const res = await request(app).post('/api/admin/ebay/map/run').send({ dryRun: true });
    expect(res.status).toBe(200);
    expect(res.body.exitCode).toBe(0);
    expect(res.body.summary).toBeTruthy();
    expect(res.body.summary.mapped).toBe(1);
  });

  test('POST retry transitions error -> pending', async () => {
    const res = await request(app).post('/api/admin/ebay/queue/1/retry');
    expect(res.status).toBe(200);
  });

  test('GET snapshots list', async () => {
    const res = await request(app).get('/api/admin/ebay/snapshots');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  test('GET snapshot diff', async () => {
    const res = await request(app).get('/api/admin/ebay/snapshots/10/diff/11');
    expect(res.status).toBe(200);
    expect(res.body.diff['/b/c'].after).toBe(3);
  });

  test('GET sync logs list', async () => {
    const res = await request(app).get('/api/admin/ebay/sync/logs');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(2);
  });

  test('GET policies list', async () => {
    const res = await request(app).get('/api/admin/ebay/policies');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(2);
  });
});
