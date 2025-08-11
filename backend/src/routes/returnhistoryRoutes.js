const express = require('express');
const router = express.Router();
const controller = require('../controllers/returnhistoryController');

router.post('/', controller.createReturnHistory);
router.get('/', controller.getAllReturnHistory);
router.get('/:id', controller.getReturnHistoryById);
router.put('/:id', controller.updateReturnHistoryById);
router.delete('/:id', controller.deleteReturnHistoryById);

module.exports = router;
