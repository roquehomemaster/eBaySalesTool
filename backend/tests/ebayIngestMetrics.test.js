const request = require('supertest');
const app = require('../src/app');

describe('Ingestion metrics', () => {
  test('running retrieve increments ingest counters', async () => {
    const before = await request(app).get('/api/admin/ebay/metrics');
    await request(app).post('/api/admin/ebay/retrieve').send({ itemIds: '301,302', dryRun: true }).expect(200);
    const after = await request(app).get('/api/admin/ebay/metrics');
    const b = before.body.counters || {};
    const a = after.body.counters || {};
    expect((a['ingest.runs']||0)).toBeGreaterThan((b['ingest.runs']||0));
    expect((a['ingest.requested']||0)).toBeGreaterThanOrEqual((b['ingest.requested']||0)+2);
    if (a['ingest.inserted']) { expect(a['ingest.skipped']).toBeGreaterThanOrEqual(a['ingest.inserted']); }
    // Adapter call metrics should also move (calls observed >= previous)
    if (a['adapter.get_item_detail.calls']) {
      expect(a['adapter.get_item_detail.calls']).toBeGreaterThan((b['adapter.get_item_detail.calls']||0));
    }
  });
});
