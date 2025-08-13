// shippinglogController.js
// Controller for ShippingLog endpoints

const ShippingLog = require('../models/shippinglogModel');
const audit = require('../utils/auditLogger');
const { ENTITY } = require('../constants/entities');

// Create a new shipping log record
exports.createShippingLog = async (req, res) => {
    try {
        const requiredFields = ['sales_id'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ message: `Missing required field: ${field}` });
            }
        }
        const newRecord = await ShippingLog.create(req.body);
        try {
            const afterObj = newRecord.toJSON ? newRecord.toJSON() : newRecord;
            await audit.logCreate(ENTITY.SHIPPING_LOG, afterObj.shippinglog_id, afterObj, req.user_account_id);
        } catch (e) { console.error('Audit (create shippinglog) failed:', e?.message || e); }
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ message: 'Error creating shipping log record' });
    }
};

// Get all shipping log records
exports.getAllShippingLogs = async (req, res) => {
    try {
        const records = await ShippingLog.findAll();
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shipping log records' });
    }
};

// Get shipping log by ID
exports.getShippingLogById = async (req, res) => {
    try {
        const record = await ShippingLog.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Shipping log record not found' }); }
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shipping log record' });
    }
};

// Update shipping log by ID
exports.updateShippingLogById = async (req, res) => {
    try {
        const record = await ShippingLog.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Shipping log record not found' }); }
        const beforeObj = record.toJSON ? record.toJSON() : { ...record };
        await record.update(req.body);
        try {
            const afterObj = record.toJSON ? record.toJSON() : record;
            await audit.logUpdate(ENTITY.SHIPPING_LOG, record.shippinglog_id, beforeObj, afterObj, req.user_account_id);
        } catch (e) { console.error('Audit (update shippinglog) failed:', e?.message || e); }
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error updating shipping log record' });
    }
};

// Delete shipping log by ID
exports.deleteShippingLogById = async (req, res) => {
    try {
    const record = await ShippingLog.findByPk(req.params.id);
    if (!record) { return res.status(404).json({ message: 'Shipping log record not found' }); }
    const beforeObj = record.toJSON ? record.toJSON() : { ...record };
    await record.destroy();
    try { await audit.logDelete(ENTITY.SHIPPING_LOG, beforeObj.shippinglog_id, beforeObj, req.user_account_id); } catch (e) { console.error('Audit (delete shippinglog) failed:', e?.message || e); }
    res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting shipping log record' });
    }
};
