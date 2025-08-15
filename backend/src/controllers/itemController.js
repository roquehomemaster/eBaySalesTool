// Use the canonical catalog model (either file defines same table/shape). Prefer catalogModel.
const Catalog = require('../models/catalogModel');
const { Op } = require('sequelize');
const audit = require('../utils/auditLogger');
const { ENTITY } = require('../constants/entities');

// Create a new catalog entry
exports.createCatalog = async (req, res) => {
    try {
        // Basic validation for required fields
    const requiredFields = ['description', 'manufacturer', 'model', 'sku'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ message: `Missing required field: ${field}` });
            }
        }
        const newCatalog = await Catalog.create(req.body);
        try {
            const afterObj = newCatalog.toJSON ? newCatalog.toJSON() : newCatalog;
            await audit.logCreate(ENTITY.CATALOG, afterObj.item_id, afterObj, req.user_account_id);
        } catch (e) {
            console.error('Audit (create catalog) failed:', e?.message || e);
        }
        res.status(201).json(newCatalog);
    } catch (error) {
        // Hide raw error details from client and log server-side
        console.error('Error in createCatalog:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Duplicate SKU or Barcode' });
        }
        res.status(500).json({ message: 'Error creating catalog entry', error: error.message, details: error.errors || undefined });
    }
};

// Get all catalog entries (with optional filters and pagination)
exports.getAllCatalog = async (req, res) => {
    try {
        const where = {};
        if (req.query.status) { where.status = req.query.status; }
        if (req.query.category) { where.category = req.query.category; }
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        const { count, rows } = await Catalog.findAndCountAll({ where, offset, limit });
        res.json({
            catalog: rows,
            total: count,
            page,
            pageSize: limit
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching catalog', error: error.message });
    }
};

// Get catalog entry by ID
exports.getCatalogById = async (req, res) => {
    try {
        const catalog = await Catalog.findByPk(req.params.item_id);
        if (!catalog) { return res.status(404).json({ message: 'Catalog entry not found' }); }
        res.json(catalog);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching catalog entry', error: error.message });
    }
};

// Update catalog entry by ID
exports.updateCatalogById = async (req, res) => {
    try {
        const catalog = await Catalog.findByPk(req.params.item_id);
        if (!catalog) { return res.status(404).json({ message: 'Catalog entry not found' }); }
        const beforeObj = catalog.toJSON ? catalog.toJSON() : { ...catalog };
        await catalog.update(req.body);
        try {
            const afterObj = catalog.toJSON ? catalog.toJSON() : catalog;
            await audit.logUpdate(ENTITY.CATALOG, catalog.item_id, beforeObj, afterObj, req.user_account_id);
        } catch (e) {
            console.error('Audit (update catalog) failed:', e?.message || e);
        }
        res.json(catalog);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Duplicate SKU/Barcode' });
        }
        res.status(500).json({ message: 'Error updating catalog entry', error: error.message, details: error.errors || undefined });
    }
};

// Delete catalog entry by ID
exports.deleteCatalogById = async (req, res) => {
    try {
        const catalog = await Catalog.findByPk(req.params.item_id);
        if (!catalog) { return res.status(404).json({ message: 'Catalog entry not found' }); }
        const beforeObj = catalog.toJSON ? catalog.toJSON() : { ...catalog };
        await catalog.destroy();
        try {
            await audit.logDelete(ENTITY.CATALOG, beforeObj.item_id, beforeObj, req.user_account_id);
        } catch (e) {
            console.error('Audit (delete catalog) failed:', e?.message || e);
        }
        res.json({ message: 'Catalog entry deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting catalog entry', error: error.message });
    }
};

// Bulk update catalog entries (optional)
exports.bulkUpdateCatalog = async (req, res) => {
    try {
        const { item_ids, ...updateFields } = req.body;
        if (!Array.isArray(item_ids) || item_ids.length === 0) {
            return res.status(400).json({ message: 'No item_ids provided for bulk update.' });
        }
        const [updated] = await Catalog.update(updateFields, { where: { item_id: item_ids } });
        res.json({ updated });
    } catch (error) {
        res.status(500).json({ message: 'Error bulk updating catalog', error: error.message });
    }
};

// Bulk delete catalog entries (optional)
exports.bulkDeleteCatalog = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided for bulk delete.' });
        }
        const deleted = await Catalog.destroy({ where: { id: ids } });
        res.json({ deleted });
    } catch (error) {
        res.status(500).json({ message: 'Error bulk deleting catalog', error: error.message });
    }
};

// Search/filter catalog (optional)
exports.searchCatalog = async (req, res) => {
    try {
        const { name, sku, minPrice, maxPrice, category } = req.query;
        const where = {};
        if (name) { where.description = { [Op.iLike]: `%${name}%` }; }
    if (sku) { where.sku = sku; }
        if (category) { where.category = category; }
        if (minPrice || maxPrice) { where.price = {}; }
        if (minPrice) { where.price = { ...where.price, [Op.gte]: parseFloat(minPrice) }; }
        if (maxPrice) { where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) }; }
        const catalog = await Catalog.findAll({ where });
        res.json(catalog);
    } catch (error) {
        res.status(500).json({ message: 'Error searching catalog', error: error.message });
    }
};
