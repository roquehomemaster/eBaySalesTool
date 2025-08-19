/**
 * ebaySnapshotAdminRoutes.js
 * Initial admin endpoints for listing snapshots (Task 14 - partial)
 * GET /admin/ebay/snapshots            -> list snapshots (filter by listing)
 * GET /admin/ebay/snapshots/:id        -> fetch single snapshot
 */
const express = require('express');
const router = express.Router();
const { EbayListingSnapshot } = require('../../models/ebayIntegrationModels');
let diffUtil; try { diffUtil = require('../integration/ebay/diffUtil'); } catch(_) { /* optional */ }

function parseIntSafe(v, d){ const n = parseInt(v,10); return Number.isNaN(n)?d:n; }

router.get('/snapshots', async (req, res) => {
  try {
    const limit = Math.min(100, parseIntSafe(req.query.limit, 20));
    const offset = parseIntSafe(req.query.offset, 0);
    const { ebay_listing_id } = req.query;
    const where = {};
    if (ebay_listing_id) { where.ebay_listing_id = parseIntSafe(ebay_listing_id, 0); }
    const rows = await EbayListingSnapshot.findAll({ where, order: [['snapshot_id','DESC']], limit, offset });
    res.json({ items: rows, pagination: { limit, offset, count: rows.length } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/snapshots/:id', async (req, res) => {
  try {
    const id = parseIntSafe(req.params.id, 0);
    const row = await EbayListingSnapshot.findOne({ where: { snapshot_id: id } });
    if (!row) { return res.status(404).json({ error: 'not_found' }); }
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Diff two snapshots (id vs otherId) - returns unified diff map
router.get('/snapshots/:id/diff/:otherId', async (req, res) => {
  try {
    if (!diffUtil) { return res.status(501).json({ error: 'diff_unavailable' }); }
    const idA = parseIntSafe(req.params.id, 0);
    const idB = parseIntSafe(req.params.otherId, 0);
    const [a, b] = await Promise.all([
      EbayListingSnapshot.findOne({ where: { snapshot_id: idA } }),
      EbayListingSnapshot.findOne({ where: { snapshot_id: idB } })
    ]);
    if (!a || !b) { return res.status(404).json({ error: 'not_found' }); }
  const diff = diffUtil.diffObjects(a.snapshot_json || {}, b.snapshot_json || {});
  res.json({ from: idA, to: idB, diff: diff.changes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
