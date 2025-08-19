/**
 * ebayDriftAdminRoutes.js
 * Admin endpoints for drift events.
 * GET /api/admin/ebay/drift-events?classification=internal_only&limit=50&offset=0
 */
const express = require('express');
const router = express.Router();
const { EbayDriftEvent, EbayListing } = require('../../models/ebayIntegrationModels');
const { Op } = require('sequelize');

function parseIntSafe(v, d){ const n = parseInt(v,10); return Number.isNaN(n)?d:n; }

router.get('/drift-events', async (req,res) => {
  try {
    const limit = Math.min(200, parseIntSafe(req.query.limit, 50));
    const offset = parseIntSafe(req.query.offset, 0);
    const { classification, listingId, fromMs, toMs } = req.query;
    const where = {};
    if (classification) { where.classification = classification; }
    if (listingId) { where.ebay_listing_id = parseIntSafe(listingId, -1); }
    if (fromMs || toMs) {
      where.created_at = {};
      if (fromMs) { where.created_at[Op.gte] = new Date(Number(fromMs)); }
      if (toMs) { where.created_at[Op.lte] = new Date(Number(toMs)); }
    }
    const [rows, total] = await Promise.all([
      EbayDriftEvent.findAll({ where, order:[['drift_event_id','DESC']], limit, offset, include:[{ model: EbayListing, attributes:['internal_listing_id','external_item_id'] }] }),
      EbayDriftEvent.count({ where })
    ]);
    res.json({ items: rows, pagination:{ limit, offset, count: rows.length, total } });
  } catch(e){
    res.status(500).json({ error: e.message });
  }
});

router.get('/drift-events/summary', async (req,res) => {
  try {
    const events = await EbayDriftEvent.findAll({ attributes:['classification'] });
    const counts = {};
    for (const ev of events){ counts[ev.classification] = (counts[ev.classification]||0)+1; }
    res.json({ counts });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

router.post('/drift-events/retention/run', async (req,res) => {
  try {
    const { runDriftRetention } = require('../integration/ebay/driftRetentionJob');
    const result = await runDriftRetention({ retentionDays: req.body && req.body.retentionDays });
    res.json(result);
  } catch(e){ res.status(500).json({ error: e.message }); }
});

module.exports = router;
