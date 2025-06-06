const { Op } = require('sequelize');
const Ownership = require('../models/ownershipModel');

// Create a new ownership/agreement
exports.createOwnership = async (req, res) => {
    try {
        // Map incoming request to match model fields
        const {
            ownership_type,
            first_name,
            last_name,
            address,
            telephone,
            email,
            company_name,
            company_address,
            company_telephone,
            company_email,
            assigned_contact_first_name,
            assigned_contact_last_name,
            assigned_contact_telephone,
            assigned_contact_email
        } = req.body;
        if (!ownership_type) {
            return res.status(400).json({ message: 'Missing required field: ownership_type' });
        }
        const newOwnership = await Ownership.create({
            ownership_type,
            first_name,
            last_name,
            address,
            telephone,
            email,
            company_name,
            company_address,
            company_telephone,
            company_email,
            assigned_contact_first_name,
            assigned_contact_last_name,
            assigned_contact_telephone,
            assigned_contact_email
        });
        res.status(201).json(newOwnership);
    } catch (error) {
        res.status(500).json({ message: 'Error creating ownership/agreement', error });
    }
};

// Get all ownerships/agreements (with optional filters and pagination)
exports.getAllOwnerships = async (req, res) => {
    try {
        const where = {};
        if (req.query.status) { where.status = req.query.status; }
        if (req.query.ownership_type) { where.ownership_type = req.query.ownership_type; }
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        const { count, rows } = await Ownership.findAndCountAll({ where, offset, limit });
        res.json({
            ownerships: rows,
            total: count,
            page,
            pageSize: limit
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching ownerships/agreements' });
    }
};

// Get ownership/agreement by ID
exports.getOwnershipById = async (req, res) => {
    try {
        const ownership = await Ownership.findByPk(req.params.id);
        if (!ownership) { return res.status(404).json({ message: 'Ownership/Agreement not found' }); }
        res.json(ownership);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching ownership/agreement' });
    }
};

// Update ownership/agreement by ID
exports.updateOwnershipById = async (req, res) => {
    try {
        const ownership = await Ownership.findByPk(req.params.id);
        if (!ownership) { return res.status(404).json({ message: 'Ownership/Agreement not found' }); }
        await ownership.update(req.body);
        res.json(ownership);
    } catch (error) {
        res.status(500).json({ message: 'Error updating ownership/agreement' });
    }
};

// Delete ownership/agreement by ID
exports.deleteOwnershipById = async (req, res) => {
    try {
        const ownership = await Ownership.findByPk(req.params.id);
        if (!ownership) { return res.status(404).json({ message: 'Ownership/Agreement not found' }); }
        await ownership.destroy();
        res.json({ message: 'Ownership/Agreement deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting ownership/agreement' });
    }
};

// Bulk update ownerships/agreements (optional)
exports.bulkUpdateOwnerships = async (req, res) => {
    try {
        const { ids, ...updateFields } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided for bulk update.' });
        }
        const [updated] = await Ownership.update(updateFields, { where: { id: ids } });
        res.json({ updated });
    } catch (error) {
        res.status(500).json({ message: 'Error bulk updating ownerships/agreements' });
    }
};

// Bulk delete ownerships/agreements (optional)
exports.bulkDeleteOwnerships = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided for bulk delete.' });
        }
        const deleted = await Ownership.destroy({ where: { id: ids } });
        res.json({ deleted });
    } catch (error) {
        res.status(500).json({ message: 'Error bulk deleting ownerships/agreements' });
    }
};

// Search/filter ownerships/agreements
exports.searchOwnerships = async (req, res) => {
    try {
        const { status, ownership_type } = req.query;
        const where = {};
        if (status) { where.status = status; }
        if (ownership_type) { where.ownership_type = ownership_type; }
        const ownerships = await Ownership.findAll({ where });
        res.json(ownerships);
    } catch (error) {
        res.status(500).json({ message: 'Error searching ownerships/agreements' });
    }
};
