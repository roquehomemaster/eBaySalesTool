const metrics = require('../metrics');

describe('metrics', () => {
  test('increments and snapshots counters', () => {
    metrics.inc('test.counter');
    metrics.inc('test.counter', 2);
    metrics.setGauge('test.gauge', 42);
    const snap = metrics.snapshot();
    expect(snap.counters['test.counter']).toBe(3);
    expect(snap.gauges['test.gauge']).toBe(42);
  });
});
