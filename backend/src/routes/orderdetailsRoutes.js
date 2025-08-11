const express = require('express');
const router = express.Router();
const controller = require('../controllers/orderdetailsController');

router.post('/', controller.createOrderDetails);
router.get('/', controller.getAllOrderDetails);
router.get('/:id', controller.getOrderDetailsById);
router.put('/:id', controller.updateOrderDetailsById);
router.delete('/:id', controller.deleteOrderDetailsById);

module.exports = router;
