// performancemetricsController.js
// Controller for PerformanceMetrics endpoints

const PerformanceMetrics = require('../models/performancemetricsModel');

// Create a new performance metrics record
exports.createPerformanceMetrics = async (req, res) => {
    try {
        const requiredFields = ['user_account_id', 'metric_date'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ message: `Missing required field: ${field}` });
            }
        }
        const newRecord = await PerformanceMetrics.create(req.body);
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ message: 'Error creating performance metrics record' });
    }
};

// Get all performance metrics records
exports.getAllPerformanceMetrics = async (req, res) => {
    try {
        const records = await PerformanceMetrics.findAll();
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching performance metrics records' });
    }
};

// Get performance metrics by ID
exports.getPerformanceMetricsById = async (req, res) => {
    try {
        const record = await PerformanceMetrics.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Performance metrics record not found' }); }
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching performance metrics record' });
    }
};

// Update performance metrics by ID
exports.updatePerformanceMetricsById = async (req, res) => {
    try {
        const record = await PerformanceMetrics.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Performance metrics record not found' }); }
        await record.update(req.body);
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error updating performance metrics record' });
    }
};

// Delete performance metrics by ID
exports.deletePerformanceMetricsById = async (req, res) => {
    try {
        const record = await PerformanceMetrics.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Performance metrics record not found' }); }
        await record.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting performance metrics record' });
    }
};
