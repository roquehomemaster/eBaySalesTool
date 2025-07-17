const express = require('express');
const router = express.Router();
const controller = require('../controllers/database_configurationController');

router.post('/', controller.createDatabaseConfiguration);
router.get('/', controller.getAllDatabaseConfiguration);
router.get('/:id', controller.getDatabaseConfigurationById);
router.put('/:id', controller.updateDatabaseConfigurationById);
router.delete('/:id', controller.deleteDatabaseConfigurationById);

module.exports = router;
