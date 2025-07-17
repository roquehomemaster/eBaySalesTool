const express = require('express');
const router = express.Router();
const controller = require('../controllers/performancemetricsController');

router.post('/', controller.createPerformanceMetrics);
router.get('/', controller.getAllPerformanceMetrics);
router.get('/:id', controller.getPerformanceMetricsById);
router.put('/:id', controller.updatePerformanceMetricsById);
router.delete('/:id', controller.deletePerformanceMetricsById);

module.exports = router;
