jest.mock('../../../../models/ebayIntegrationModels', () => {
  const queue = [ { queue_id:1, ebay_listing_id:10, intent:'update', payload_hash:'h1', status:'dead', attempts:6, update: jest.fn(async function(fields){ Object.assign(this, fields); }) } ];
  const failed = [ { failed_event_id:5, ebay_listing_id:10, intent:'update', payload_hash:'h1' } ];
  return {
    EbayChangeQueue: { findAll: jest.fn(async ({ where }) => queue.filter(q=> !where || q.status===where.status)), findOne: jest.fn(async ({ where:{ queue_id } }) => queue.find(q=>q.queue_id===queue_id) || null), create: jest.fn(async row => ({ ...row, queue_id: 2 })) },
    EbayFailedEvent: { findAll: jest.fn(async () => failed), findOne: jest.fn(async ({ where:{ failed_event_id } }) => failed.find(f=>f.failed_event_id===failed_event_id) || null) }
  };
});

const express = require('express');
const request = require('supertest');
const queueRoutes = require('../../../routes/ebayQueueAdminRoutes');

describe('dead letter & replay routes', () => {
  let app;
  beforeEach(()=>{ app = express(); app.use('/api/admin/ebay', queueRoutes); });
  test('GET dead-letter returns deadQueue & failedEvents', async () => {
    const res = await request(app).get('/api/admin/ebay/queue/dead-letter');
    expect(res.status).toBe(200);
    expect(res.body.deadQueue.length).toBeGreaterThanOrEqual(0);
    expect(res.body.failedEvents.length).toBeGreaterThanOrEqual(1);
  });
  test('replay failed event creates queue item', async () => {
    const res = await request(app).post('/api/admin/ebay/failed-events/5/replay');
    expect(res.status).toBe(200);
    expect(res.body.replayed).toBe(true);
  });
});
