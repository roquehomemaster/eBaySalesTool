const { Op } = require('sequelize');
const Sales = require('../models/salesModel');

// Create a new sale
exports.createSale = async (req, res) => {
    try {
        // Input validation for required fields
        const requiredFields = ['item', 'price', 'sold_date', 'owner'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ message: `Missing required field: ${field}` });
            }
        }
        const newSale = await Sales.create(req.body);
        res.status(201).json(newSale);
    } catch (error) {
        res.status(500).json({ message: 'Error creating sale' });
    }
};

// Get all sales (with optional filters)
exports.getAllSales = async (req, res) => {
    try {
        const where = {};
        if (req.query.status) { where.status = req.query.status; }
        if (req.query.itemId) { where.itemId = req.query.itemId; }
        if (req.query.customerId) { where.customerId = req.query.customerId; }
        if (req.query.startDate || req.query.endDate) {
            where.sold_date = {};
            if (req.query.startDate) { where.sold_date[Op.gte] = new Date(req.query.startDate); }
            if (req.query.endDate) { where.sold_date[Op.lte] = new Date(req.query.endDate); }
        }
        const sales = await Sales.findAll({ where });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sales' });
    }
};

// Get sale by ID
exports.getSaleById = async (req, res) => {
    try {
        const sale = await Sales.findByPk(req.params.id);
        if (!sale) { return res.status(404).json({ message: 'Sale not found' }); }
        res.json(sale);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sale' });
    }
};

// Update sale by ID
exports.updateSaleById = async (req, res) => {
    try {
        const sale = await Sales.findByPk(req.params.id);
        if (!sale) { return res.status(404).json({ message: 'Sale not found' }); }
        await sale.update(req.body);
        res.json(sale);
    } catch (error) {
        res.status(500).json({ message: 'Error updating sale' });
    }
};

// Delete sale by ID
exports.deleteSaleById = async (req, res) => {
    try {
        const sale = await Sales.findByPk(req.params.id);
        if (!sale) { return res.status(404).json({ message: 'Sale not found' }); }
        await sale.destroy();
        res.json({ message: 'Sale deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting sale' });
    }
};

// Bulk update sales (optional)
exports.bulkUpdateSales = async (req, res) => {
    try {
        const { ids, ...updateFields } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided for bulk update.' });
        }
        const [updated] = await Sales.update(updateFields, { where: { id: ids } });
        res.json({ updated });
    } catch (error) {
        res.status(500).json({ message: 'Error bulk updating sales' });
    }
};

// Bulk delete sales (optional)
exports.bulkDeleteSales = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided for bulk delete.' });
        }
        const deleted = await Sales.destroy({ where: { id: ids } });
        res.json({ deleted });
    } catch (error) {
        res.status(500).json({ message: 'Error bulk deleting sales' });
    }
};

// Search/filter sales (optional)
exports.searchSales = async (req, res) => {
    try {
        const { item, owner, minPrice, maxPrice, status, startDate, endDate } = req.query;
        const where = {};
        if (item) { where.item = { [Op.like]: `%${item}%` }; }
        if (owner) { where.owner = { [Op.like]: `%${owner}%` }; }
        if (status) { where.status = status; }
        if (minPrice || maxPrice) { where.price = {}; }
        if (minPrice) { where.price[Op.gte] = parseFloat(minPrice); }
        if (maxPrice) { where.price[Op.lte] = parseFloat(maxPrice); }
        if (startDate || endDate) { where.soldDate = {}; }
        if (startDate) { where.soldDate[Op.gte] = new Date(startDate); }
        if (endDate) { where.soldDate[Op.lte] = new Date(endDate); }
        const sales = await Sales.findAll({ where });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Error searching sales' });
    }
};