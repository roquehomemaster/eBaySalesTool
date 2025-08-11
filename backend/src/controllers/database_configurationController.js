// database_configurationController.js
// Controller for Database_Configuration endpoints

const DatabaseConfiguration = require('../models/database_configurationModel');

// Create a new database configuration record
exports.createDatabaseConfiguration = async (req, res) => {
    try {
        const requiredFields = ['config_name'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ message: `Missing required field: ${field}` });
            }
        }
        const newRecord = await DatabaseConfiguration.create(req.body);
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ message: 'Error creating database configuration record' });
    }
};

// Get all database configuration records
exports.getAllDatabaseConfiguration = async (req, res) => {
    try {
        const records = await DatabaseConfiguration.findAll();
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching database configuration records' });
    }
};

// Get database configuration by ID
exports.getDatabaseConfigurationById = async (req, res) => {
    try {
        const record = await DatabaseConfiguration.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Database configuration record not found' }); }
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching database configuration record' });
    }
};

// Update database configuration by ID
exports.updateDatabaseConfigurationById = async (req, res) => {
    try {
        const record = await DatabaseConfiguration.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Database configuration record not found' }); }
        await record.update(req.body);
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error updating database configuration record' });
    }
};

// Delete database configuration by ID
exports.deleteDatabaseConfigurationById = async (req, res) => {
    try {
        const record = await DatabaseConfiguration.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Database configuration record not found' }); }
        await record.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting database configuration record' });
    }
};
