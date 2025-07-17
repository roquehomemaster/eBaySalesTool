const express = require('express');
const router = express.Router();
const controller = require('../controllers/shippinglogController');

router.post('/', controller.createShippingLog);
router.get('/', controller.getAllShippingLogs);
router.get('/:id', controller.getShippingLogById);
router.put('/:id', controller.updateShippingLogById);
router.delete('/:id', controller.deleteShippingLogById);

module.exports = router;
