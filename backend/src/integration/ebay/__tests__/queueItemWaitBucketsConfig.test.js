process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.QUEUE_ITEM_WAIT_BUCKETS='10, 20, 40, 80';

const metrics = require('../metrics');

describe('queue item wait custom buckets', () => {
  test('applies configured buckets', () => {
    metrics.observe('queue.item_wait_ms', 15);
    const snap = metrics.snapshot();
    const h = snap.histograms['queue.item_wait_ms'];
    expect(h.buckets).toEqual([10,20,40,80]);
    // Ensure counts distributed: value 15 should increment bucket 20
    const idx20 = h.buckets.indexOf(20);
    // counts length = buckets + 1 overflow; sum should be 1
    expect(h.count).toBe(1);
    let cumulative = 0; for (let i=0;i<=idx20;i++){ cumulative += h.counts[i]; }
    expect(cumulative).toBeGreaterThan(0);
  });
});
