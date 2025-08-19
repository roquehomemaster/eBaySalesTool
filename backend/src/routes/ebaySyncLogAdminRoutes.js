/**
 * ebaySyncLogAdminRoutes.js
 * List sync logs with optional filters (listing id, operation, result)
 */
const express = require('express');
const router = express.Router();
const { EbaySyncLog } = require('../../models/ebayIntegrationModels');

function parseIntSafe(v,d){ const n = parseInt(v,10); return Number.isNaN(n)?d:n; }

router.get('/sync/logs', async (req, res) => {
  try {
    const limit = Math.min(200, parseIntSafe(req.query.limit, 50));
    const offset = parseIntSafe(req.query.offset, 0);
    const { ebay_listing_id, operation, result } = req.query;
    const where = {};
  if (ebay_listing_id) { where.ebay_listing_id = parseIntSafe(ebay_listing_id, 0); }
  if (operation) { where.operation = operation; }
  if (result) { where.result = result; }
    const rows = await EbaySyncLog.findAll({ where, order: [['sync_log_id','DESC']], limit, offset });
    res.json({ items: rows, pagination: { limit, offset, count: rows.length } });
  } catch(e){
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
