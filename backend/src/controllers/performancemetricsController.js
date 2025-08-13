// performancemetricsController.js
// Controller for PerformanceMetrics endpoints

const PerformanceMetrics = require('../models/performancemetricsModel');
const audit = require('../utils/auditLogger');
const { ENTITY } = require('../constants/entities');

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
    try { const afterObj = newRecord.toJSON ? newRecord.toJSON() : newRecord; await audit.logCreate(ENTITY.PERFORMANCE_METRICS, afterObj.id, afterObj, req.user_account_id); } catch (e) { console.error('Audit (create performancemetrics) failed:', e?.message || e); }
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
    const beforeObj = record.toJSON ? record.toJSON() : { ...record };
    await record.update(req.body);
    try { const afterObj = record.toJSON ? record.toJSON() : record; await audit.logUpdate(ENTITY.PERFORMANCE_METRICS, record.id, beforeObj, afterObj, req.user_account_id); } catch (e) { console.error('Audit (update performancemetrics) failed:', e?.message || e); }
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
    const beforeObj = record.toJSON ? record.toJSON() : { ...record };
    await record.destroy();
    try { await audit.logDelete(ENTITY.PERFORMANCE_METRICS, beforeObj.id, beforeObj, req.user_account_id); } catch (e) { console.error('Audit (delete performancemetrics) failed:', e?.message || e); }
    res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting performance metrics record' });
    }
};
