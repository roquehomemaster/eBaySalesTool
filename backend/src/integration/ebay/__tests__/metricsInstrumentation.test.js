const metrics = require('../metrics');

describe('metrics instrumentation histograms & timestamps', () => {
  test('observe records buckets & snapshot exposes histogram', () => {
    metrics.observe('test.duration_ms', 12);
    metrics.observe('test.duration_ms', 120);
    const snap = metrics.snapshot();
    expect(snap.histograms['test.duration_ms']).toBeDefined();
    const h = snap.histograms['test.duration_ms'];
    expect(h.sum).toBeGreaterThanOrEqual(132);
    expect(h.counts.reduce((a,b)=>a+b,0)).toBeGreaterThanOrEqual(2);
  expect(h.percentiles).toBeDefined();
  expect(h.percentiles.p50).toBeDefined();
  });
  test('recordError sets lastErrors entry', () => {
    metrics.recordError('publish', new Error('fail!'));
    const snap = metrics.snapshot();
    expect(snap.lastErrors.publish).toBeDefined();
    expect(snap.lastErrors.publish.message).toContain('fail');
  });
});
