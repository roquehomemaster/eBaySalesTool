/**
 * ebayPolicyAdminRoutes.js
 * List cached business policies and optionally purge expired.
 */
const express = require('express');
const router = express.Router();
const { EbayPolicyCache } = require('../../models/ebayIntegrationModels');
const { refreshPolicies, purgeExpired } = require('../integration/ebay/policyService');

function parseIntSafe(v,d){ const n = parseInt(v,10); return Number.isNaN(n)?d:n; }

router.get('/policies', async (req,res) => {
  try {
    const limit = Math.min(200, parseIntSafe(req.query.limit, 50));
    const offset = parseIntSafe(req.query.offset, 0);
    const { policy_type } = req.query;
    const where = {};
    if (policy_type) { where.policy_type = policy_type; }
    const rows = await EbayPolicyCache.findAll({ where, order:[['policy_cache_id','DESC']], limit, offset });
    res.json({ items: rows, pagination:{ limit, offset, count: rows.length } });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

router.post('/policies/refresh', async (req,res) => {
  try { const r = await refreshPolicies(); res.json(r); } catch(e){ res.status(500).json({ error: e.message }); }
});

router.delete('/policies/expired', async (req,res) => {
  try { const r = await purgeExpired(); res.json(r); } catch(e){ res.status(500).json({ error: e.message }); }
});

module.exports = router;
