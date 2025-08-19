/**
 * ebayQueueAdminRoutes.js
 * Minimal admin endpoints for eBay change queue (Task 13 - initial slice)
 * GET /admin/ebay/queue              -> list queue items (basic pagination)
 * POST /admin/ebay/queue/:id/retry   -> force reset of error item to pending
 */
const express = require('express');
const router = express.Router();
const { EbayChangeQueue, EbayFailedEvent } = require('../../models/ebayIntegrationModels');

function parseIntSafe(v, d){ const n = parseInt(v,10); return Number.isNaN(n)?d:n; }

router.get('/queue', async (req, res) => {
  try {
    const limit = Math.min(100, parseIntSafe(req.query.limit, 20));
    const offset = parseIntSafe(req.query.offset, 0);
    const { status } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }
    const rows = await EbayChangeQueue.findAll({ where, order: [['priority','ASC'], ['created_at','ASC']], limit, offset });
    res.json({ items: rows, pagination: { limit, offset, count: rows.length } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/queue/:id/retry', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = await EbayChangeQueue.findOne({ where: { queue_id: id } });
    if (!row) {
      return res.status(404).json({ error: 'not_found' });
    }
    if (row.status !== 'error' && row.status !== 'dead') {
      return res.status(400).json({ error: 'not_in_retryable_state' });
    }
    await row.update({ status: 'pending', error_reason: null, next_earliest_run_at: null });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Dead-letter listing: queue rows with status=dead and failed events table
router.get('/queue/dead-letter', async (req, res) => {
  try {
  const rows = await EbayChangeQueue.findAll({ where: { status: 'dead' }, order: [['updated_at','DESC']], limit: 200 });
  const failedEvents = await EbayFailedEvent.findAll({ order: [['failed_event_id','DESC']], limit: 200 });
  res.json({ deadQueue: rows, failedEvents, deadCount: rows.length, failedCount: failedEvents.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Bulk retry all error items (caps at 500 per call)
router.post('/queue/dead-letter/retry', async (req, res) => {
  try {
    const rows = await EbayChangeQueue.findAll({ where: { status: 'dead' }, limit: 500 });
    let updated = 0;
    for (const r of rows) { // eslint-disable-line no-restricted-syntax
      // eslint-disable-next-line no-await-in-loop
      await r.update({ status: 'pending', error_reason: null, next_earliest_run_at: null });
      updated += 1;
    }
    res.json({ retried: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Replay a failed event (failed_event_id) by creating a fresh queue item
router.post('/failed-events/:id/replay', async (req,res) => {
  try {
    const id = parseInt(req.params.id,10);
    const row = await EbayFailedEvent.findOne({ where:{ failed_event_id: id } });
    if(!row){ return res.status(404).json({ error:'failed_event_not_found' }); }
    const created = await EbayChangeQueue.create({ ebay_listing_id: row.ebay_listing_id, intent: row.intent, payload_hash: row.payload_hash, status:'pending', priority:5 });
    res.json({ replayed:true, queue_id: created.queue_id });
  } catch(e){
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
