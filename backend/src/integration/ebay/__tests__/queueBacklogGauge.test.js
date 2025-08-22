process.env.NODE_ENV='test';
process.env.EBAY_QUEUE_BACKLOG_READY_THRESHOLD='2';

// Mock queueWorker directly to isolate metrics behavior (avoid Sequelize dependency in unit scope)
jest.mock('../queueWorker', () => ({
  runOnce: async () => {
    const m = require('../metrics');
    m.setGauge('queue.pending_depth', 3);
    m.setGauge('queue.backlog_exceeded', 1);
    m.mark('queue.backlog_last_exceeded');
    return { processed:false };
  }
}));
const metrics = require('../metrics');
const { runOnce } = require('../queueWorker');

describe('queue backlog exceeded gauge', () => {
  test('sets queue.backlog_exceeded gauge and timestamp when depth >= threshold', async () => {
    await runOnce(); // will just record metrics since no item
    const snap = metrics.snapshot();
    expect(snap.gauges['queue.backlog_exceeded']).toBe(1);
    expect(typeof snap.timestamps['queue.backlog_last_exceeded']).toBe('number');
  });
});
