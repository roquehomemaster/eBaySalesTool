const request = require('supertest');
const app = require('../src/app');

// Basic integration test to validate /api/admin/ebay/retrieve returns enriched summary fields.
describe('/api/admin/ebay/retrieve', () => {
  test('dryRun true returns expected summary shape', async () => {
    const res = await request(app)
      .post('/api/admin/ebay/retrieve')
      .send({ itemIds: '101,102,103', dryRun: true })
      .expect(200);
    expect(res.body).toHaveProperty('dryRun', true);
    expect(res.body).toHaveProperty('summary');
    const s = res.body.summary;
  ['requested','fetched','succeeded','inserted','duplicates','skipped','errors','invalidIds','durationMs'].forEach(k => {
      expect(s).toHaveProperty(k);
    });
    expect(s.requested).toBe(3);
    expect(s.fetched).toBe(3);
    expect(s.inserted).toBe(0); // dry run should not insert
    expect(s.skipped).toBeGreaterThanOrEqual(1); // each new would be skipped in dryRun
  });
});
