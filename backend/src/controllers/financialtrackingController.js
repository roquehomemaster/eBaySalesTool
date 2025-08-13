// financialtrackingController.js
// Controller for FinancialTracking endpoints

const FinancialTracking = require('../models/financialtrackingModel');
const audit = require('../utils/auditLogger');
const { ENTITY } = require('../constants/entities');

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
        try {
            const afterObj = newRecord.toJSON ? newRecord.toJSON() : newRecord;
            await audit.logCreate(ENTITY.FINANCIAL_TRACKING, afterObj.financialtracking_id, afterObj, req.user_account_id);
        } catch (e) { console.error('Audit (create financialtracking) failed:', e?.message || e); }
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
        const beforeObj = record.toJSON ? record.toJSON() : { ...record };
        await record.update(req.body);
        try {
            const afterObj = record.toJSON ? record.toJSON() : record;
            await audit.logUpdate(ENTITY.FINANCIAL_TRACKING, record.financialtracking_id, beforeObj, afterObj, req.user_account_id);
        } catch (e) { console.error('Audit (update financialtracking) failed:', e?.message || e); }
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
    const beforeObj = record.toJSON ? record.toJSON() : { ...record };
    await record.destroy();
    try { await audit.logDelete(ENTITY.FINANCIAL_TRACKING, beforeObj.financialtracking_id, beforeObj, req.user_account_id); } catch (e) { console.error('Audit (delete financialtracking) failed:', e?.message || e); }
    res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting financial tracking record' });
    }
};
