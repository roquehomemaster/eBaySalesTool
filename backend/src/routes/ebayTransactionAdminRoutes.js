const express = require('express');
const router = express.Router();
const { EbayTransactionLog } = require('../../models/ebayIntegrationModels');

function parseIntSafe(v,d){ const n = parseInt(v,10); return Number.isNaN(n)?d:n; }

router.get('/transactions', async (req,res) => {
  try {
    const limit = Math.min(200, parseIntSafe(req.query.limit, 50));
    const offset = parseIntSafe(req.query.offset, 0);
    const { channel, operation, status, ebay_listing_id, from, to, format } = req.query;
    const where = {};
    if (channel) { where.channel = channel; }
    if (operation) { where.operation = operation; }
    if (status) { where.status = status; }
    if (ebay_listing_id) { where.ebay_listing_id = parseIntSafe(ebay_listing_id, 0); }
  if (from || to) { const { Op } = require('sequelize'); where.created_at = {}; if(from){ where.created_at[Op.gte] = new Date(from); } if(to){ where.created_at[Op.lte] = new Date(to); } }
    const rows = await EbayTransactionLog.findAll({ where, order:[['txn_id','DESC']], limit, offset });
    if (format === 'csv') {
      const header = 'txn_id,created_at,channel,operation,status,response_code,latency_ms';
      const lines = rows.map(r => [r.txn_id, r.created_at && r.created_at.toISOString(), r.channel, r.operation, r.status, r.response_code, r.latency_ms].join(','));
      res.setHeader('Content-Type','text/csv');
      return res.send([header, ...lines].join('\n'));
    }
    res.json({ items: rows, pagination:{ limit, offset, count: rows.length } });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

module.exports = router;
