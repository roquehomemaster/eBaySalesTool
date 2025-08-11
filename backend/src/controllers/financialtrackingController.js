// financialtrackingController.js
// Controller for FinancialTracking endpoints

const FinancialTracking = require('../models/financialtrackingModel');

// Create a new financial tracking record
exports.createFinancialTracking = async (req, res) => {
    try {
        const requiredFields = ['item_id', 'sales_id'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ message: `Missing required field: ${field}` });
            }
        }
        const newRecord = await FinancialTracking.create(req.body);
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ message: 'Error creating financial tracking record' });
    }
};

// Get all financial tracking records
exports.getAllFinancialTracking = async (req, res) => {
    try {
        const records = await FinancialTracking.findAll();
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching financial tracking records' });
    }
};

// Get financial tracking by ID
exports.getFinancialTrackingById = async (req, res) => {
    try {
        const record = await FinancialTracking.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Financial tracking record not found' }); }
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching financial tracking record' });
    }
};

// Update financial tracking by ID
exports.updateFinancialTrackingById = async (req, res) => {
    try {
        const record = await FinancialTracking.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Financial tracking record not found' }); }
        await record.update(req.body);
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error updating financial tracking record' });
    }
};

// Delete financial tracking by ID
exports.deleteFinancialTrackingById = async (req, res) => {
    try {
        const record = await FinancialTracking.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Financial tracking record not found' }); }
        await record.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting financial tracking record' });
    }
};
