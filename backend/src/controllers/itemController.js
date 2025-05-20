const Item = require('../models/itemModel');
const { Op } = require('sequelize');

// Create a new item
exports.createItem = async (req, res) => {
    try {
        // Basic validation for required fields
        const requiredFields = ['description', 'manufacturer', 'model', 'serial_number', 'sku_barcode'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ message: `Missing required field: ${field}` });
            }
        }
        const newItem = await Item.create(req.body);
        res.status(201).json(newItem);
    } catch (error) {
        // Hide raw error details from client
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Duplicate SKU/Barcode' });
        }
        res.status(500).json({ message: 'Error creating item' });
    }
};

// Get all items (with optional filters)
exports.getAllItems = async (req, res) => {
    try {
        const where = {};
        if (req.query.status) { where.status = req.query.status; }
        if (req.query.category) { where.category = req.query.category; }
        const items = await Item.findAll({ where });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching items' });
    }
};

// Get item by ID
exports.getItemById = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);
        if (!item) { return res.status(404).json({ message: 'Item not found' }); }
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching item' });
    }
};

// Update item by ID
exports.updateItemById = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);
        if (!item) { return res.status(404).json({ message: 'Item not found' }); }
        await item.update(req.body);
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: 'Error updating item' });
    }
};

// Delete item by ID
exports.deleteItemById = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);
        if (!item) { return res.status(404).json({ message: 'Item not found' }); }
        await item.destroy();
        res.json({ message: 'Item deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting item' });
    }
};

// Bulk update items (optional)
exports.bulkUpdateItems = async (req, res) => {
    try {
        const { ids, ...updateFields } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided for bulk update.' });
        }
        const [updated] = await Item.update(updateFields, { where: { id: ids } });
        res.json({ updated });
    } catch (error) {
        res.status(500).json({ message: 'Error bulk updating items' });
    }
};

// Bulk delete items (optional)
exports.bulkDeleteItems = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided for bulk delete.' });
        }
        const deleted = await Item.destroy({ where: { id: ids } });
        res.json({ deleted });
    } catch (error) {
        res.status(500).json({ message: 'Error bulk deleting items' });
    }
};

// Search/filter items (optional)
exports.searchItems = async (req, res) => {
    try {
        const { name, sku, minPrice, maxPrice, category } = req.query;
        const where = {};
        if (name) { where.description = { [Op.iLike]: `%${name}%` }; }
        if (sku) { where.sku_barcode = sku; }
        if (category) { where.category = category; }
        if (minPrice || maxPrice) { where.price = {}; }
        if (minPrice) { where.price = { ...where.price, [Op.gte]: parseFloat(minPrice) }; }
        if (maxPrice) { where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) }; }
        const items = await Item.findAll({ where });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error searching items' });
    }
};
