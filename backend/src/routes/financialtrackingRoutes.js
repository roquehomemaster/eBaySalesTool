const express = require('express');
const router = express.Router();
const controller = require('../controllers/financialtrackingController');

router.post('/', controller.createFinancialTracking);
router.get('/', controller.getAllFinancialTracking);
router.get('/:id', controller.getFinancialTrackingById);
router.put('/:id', controller.updateFinancialTrackingById);
router.delete('/:id', controller.deleteFinancialTrackingById);

module.exports = router;
