// returnhistoryController.js
// Controller for ReturnHistory endpoints

const ReturnHistory = require('../models/returnhistoryModel');
const audit = require('../utils/auditLogger');
const { ENTITY } = require('../constants/entities');

// Create a new return history record
exports.createReturnHistory = async (req, res) => {
    try {
        const requiredFields = ['sales_id', 'return_date'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ message: `Missing required field: ${field}` });
            }
        }
    const newRecord = await ReturnHistory.create(req.body);
    try { const afterObj = newRecord.toJSON ? newRecord.toJSON() : newRecord; await audit.logCreate(ENTITY.RETURN_HISTORY, afterObj.returnhistory_id, afterObj, req.user_account_id); } catch (e) { console.error('Audit (create returnhistory) failed:', e?.message || e); }
    res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ message: 'Error creating return history record' });
    }
};

// Get all return history records
exports.getAllReturnHistory = async (req, res) => {
    try {
        const records = await ReturnHistory.findAll();
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching return history records' });
    }
};

// Get return history by ID
exports.getReturnHistoryById = async (req, res) => {
    try {
        const record = await ReturnHistory.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Return history record not found' }); }
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching return history record' });
    }
};

// Update return history by ID
exports.updateReturnHistoryById = async (req, res) => {
    try {
    const record = await ReturnHistory.findByPk(req.params.id);
    if (!record) { return res.status(404).json({ message: 'Return history record not found' }); }
    const beforeObj = record.toJSON ? record.toJSON() : { ...record };
    await record.update(req.body);
    try { const afterObj = record.toJSON ? record.toJSON() : record; await audit.logUpdate(ENTITY.RETURN_HISTORY, record.returnhistory_id, beforeObj, afterObj, req.user_account_id); } catch (e) { console.error('Audit (update returnhistory) failed:', e?.message || e); }
    res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error updating return history record' });
    }
};

// Delete return history by ID
exports.deleteReturnHistoryById = async (req, res) => {
    try {
    const record = await ReturnHistory.findByPk(req.params.id);
    if (!record) { return res.status(404).json({ message: 'Return history record not found' }); }
    const beforeObj = record.toJSON ? record.toJSON() : { ...record };
    await record.destroy();
    try { await audit.logDelete(ENTITY.RETURN_HISTORY, beforeObj.returnhistory_id, beforeObj, req.user_account_id); } catch (e) { console.error('Audit (delete returnhistory) failed:', e?.message || e); }
    res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting return history record' });
    }
};
