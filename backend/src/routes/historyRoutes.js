const express = require('express');
const router = express.Router();
const { getEntityHistory } = require('../controllers/historyController');

// GET /api/history/:entity/:id
router.get('/:entity/:id', getEntityHistory);

module.exports = router;
