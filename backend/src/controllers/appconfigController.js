// appconfigController.js
// Controller for AppConfig endpoints

const AppConfig = require('../models/appconfigModel');

// Create a new app config record
exports.createAppConfig = async (req, res) => {
    try {
        const requiredFields = ['config_key'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ message: `Missing required field: ${field}` });
            }
        }
        const newRecord = await AppConfig.create(req.body);
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ message: 'Error creating app config record' });
    }
};

// Get app config by key
exports.getAppConfigByKey = async (req, res) => {
    try {
        const key = req.params.config_key;
        if (!key) {
            return res.status(400).json({ message: 'Missing config_key' });
        }
        const record = await AppConfig.findOne({ where: { config_key: key } });
        if (!record) {
            return res.status(404).json({ message: 'Config not found' });
        }
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching app config by key' });
    }
};

// Get all app config records
exports.getAllAppConfig = async (req, res) => {
    try {
        const records = await AppConfig.findAll();
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching app config records' });
    }
};

// Get app config by ID
exports.getAppConfigById = async (req, res) => {
    try {
        const record = await AppConfig.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'App config record not found' }); }
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching app config record' });
    }
};

// Update app config by ID
exports.updateAppConfigById = async (req, res) => {
    try {
        const record = await AppConfig.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'App config record not found' }); }
        await record.update(req.body);
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error updating app config record' });
    }
};

// Delete app config by ID
exports.deleteAppConfigById = async (req, res) => {
    try {
        const record = await AppConfig.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'App config record not found' }); }
        await record.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting app config record' });
    }
};
