const express = require('express');
const router = express.Router();
const controller = require('../controllers/ownershipagreementsController');

router.post('/', controller.createOwnershipAgreement);
router.get('/', controller.getAllOwnershipAgreements);
router.get('/:id', controller.getOwnershipAgreementById);
router.put('/:id', controller.updateOwnershipAgreementById);
router.delete('/:id', controller.deleteOwnershipAgreementById);

module.exports = router;
