// communicationlogsController.js
// Controller for CommunicationLogs endpoints

const CommunicationLogs = require('../models/communicationlogsModel');
const audit = require('../utils/auditLogger');
const { ENTITY } = require('../constants/entities');

// Create a new communication log
exports.createCommunicationLog = async (req, res) => {
    try {
        const requiredFields = ['customer_id', 'communication_date'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ message: `Missing required field: ${field}` });
            }
        }
        const newRecord = await CommunicationLogs.create(req.body);
        try {
            const afterObj = newRecord.toJSON ? newRecord.toJSON() : newRecord;
            await audit.logCreate(ENTITY.COMMUNICATION_LOGS, afterObj.communicationlog_id, afterObj, req.user_account_id);
        } catch (e) { console.error('Audit (create communicationlogs) failed:', e?.message || e); }
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ message: 'Error creating communication log' });
    }
};

// Get all communication logs
exports.getAllCommunicationLogs = async (req, res) => {
    try {
        const records = await CommunicationLogs.findAll();
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching communication logs' });
    }
};

// Get communication log by ID
exports.getCommunicationLogById = async (req, res) => {
    try {
        const record = await CommunicationLogs.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Communication log not found' }); }
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching communication log' });
    }
};

// Update communication log by ID
exports.updateCommunicationLogById = async (req, res) => {
    try {
        const record = await CommunicationLogs.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Communication log not found' }); }
        const beforeObj = record.toJSON ? record.toJSON() : { ...record };
        await record.update(req.body);
        try {
            const afterObj = record.toJSON ? record.toJSON() : record;
            await audit.logUpdate(ENTITY.COMMUNICATION_LOGS, record.communicationlog_id, beforeObj, afterObj, req.user_account_id);
        } catch (e) { console.error('Audit (update communicationlogs) failed:', e?.message || e); }
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error updating communication log' });
    }
};

// Delete communication log by ID
exports.deleteCommunicationLogById = async (req, res) => {
    try {
    const record = await CommunicationLogs.findByPk(req.params.id);
    if (!record) { return res.status(404).json({ message: 'Communication log not found' }); }
    const beforeObj = record.toJSON ? record.toJSON() : { ...record };
    await record.destroy();
    try { await audit.logDelete(ENTITY.COMMUNICATION_LOGS, beforeObj.communicationlog_id, beforeObj, req.user_account_id); } catch (e) { console.error('Audit (delete communicationlogs) failed:', e?.message || e); }
    res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting communication log' });
    }
};
