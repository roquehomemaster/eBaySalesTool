// ownershipagreementsController.js
// Controller for OwnershipAgreements endpoints

const OwnershipAgreements = require('../models/ownershipagreementsModel');

// Create a new ownership agreement
exports.createOwnershipAgreement = async (req, res) => {
    try {
        const requiredFields = ['agreement_name', 'agreement_type'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ message: `Missing required field: ${field}` });
            }
        }
        const newRecord = await OwnershipAgreements.create(req.body);
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ message: 'Error creating ownership agreement' });
    }
};

// Get all ownership agreements
exports.getAllOwnershipAgreements = async (req, res) => {
    try {
        const records = await OwnershipAgreements.findAll();
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching ownership agreements' });
    }
};

// Get ownership agreement by ID
exports.getOwnershipAgreementById = async (req, res) => {
    try {
        const record = await OwnershipAgreements.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Ownership agreement not found' }); }
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching ownership agreement' });
    }
};

// Update ownership agreement by ID
exports.updateOwnershipAgreementById = async (req, res) => {
    try {
        const record = await OwnershipAgreements.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Ownership agreement not found' }); }
        await record.update(req.body);
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error updating ownership agreement' });
    }
};

// Delete ownership agreement by ID
exports.deleteOwnershipAgreementById = async (req, res) => {
    try {
        const record = await OwnershipAgreements.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Ownership agreement not found' }); }
        await record.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting ownership agreement' });
    }
};
