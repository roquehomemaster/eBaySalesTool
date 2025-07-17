const express = require('express');
const router = express.Router();
const controller = require('../controllers/appconfigController');

router.post('/', controller.createAppConfig);
router.get('/', controller.getAllAppConfig);
router.get('/:id', controller.getAppConfigById);
router.put('/:id', controller.updateAppConfigById);
router.delete('/:id', controller.deleteAppConfigById);

module.exports = router;
