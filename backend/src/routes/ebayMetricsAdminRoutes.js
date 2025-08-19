const express = require('express');
const router = express.Router();
let metrics; try { metrics = require('../integration/ebay/metrics'); } catch(_) { /* optional */ }

router.get('/metrics', (req,res) => {
  if(!metrics){ return res.status(503).json({ error:'metrics_unavailable' }); }
  res.json(metrics.snapshot());
});

module.exports = router;
