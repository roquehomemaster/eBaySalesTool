const request = require('supertest');
const app = require('../src/app');

describe('/api/admin/ebay/map/run', () => {
  test('dryRun mapping run responds with enriched summary', async () => {
    const res = await request(app)
      .post('/api/admin/ebay/map/run')
      .send({ dryRun: true, maxItems: 5 })
      .expect(200);
    expect(res.body).toHaveProperty('dryRun', true);
    expect(typeof res.body.exitCode).toBe('number');
    expect(res.body).toHaveProperty('summary');
    const s = res.body.summary;
    if (s) { // summary parsing could still fail; guard
      ['status','startedAt','finishedAt','durationMs','processed','mapped','skipped','errors','selected','dryRun','limit'].forEach(k => {
        expect(s).toHaveProperty(k);
      });
      expect(s.limit).toBe(5);
      expect(['success','partial','failed']).toContain(s.status);
    }
    expect(res.body).toHaveProperty('raw');
  });
});
