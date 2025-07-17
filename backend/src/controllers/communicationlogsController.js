// communicationlogsController.js
// Controller for CommunicationLogs endpoints

const CommunicationLogs = require('../models/communicationlogsModel');

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
        await record.update(req.body);
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
        await record.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting communication log' });
    }
};
