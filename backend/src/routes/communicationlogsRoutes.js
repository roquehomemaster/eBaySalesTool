const express = require('express');
const router = express.Router();
const controller = require('../controllers/communicationlogsController');

router.post('/', controller.createCommunicationLog);
router.get('/', controller.getAllCommunicationLogs);
router.get('/:id', controller.getCommunicationLogById);
router.put('/:id', controller.updateCommunicationLogById);
router.delete('/:id', controller.deleteCommunicationLogById);

module.exports = router;
