// shippinglogController.js
// Controller for ShippingLog endpoints

const ShippingLog = require('../models/shippinglogModel');

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
        await record.update(req.body);
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
        await record.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting shipping log record' });
    }
};
