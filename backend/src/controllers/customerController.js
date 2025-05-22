const { Op, Sequelize } = require('sequelize');
const Customer = require('../models/customerModel');

// Create a new customer
exports.createCustomer = async (req, res) => {
    try {
        // Input validation for required fields
        const requiredFields = ['firstName', 'lastName', 'email'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ message: `Missing required field: ${field}` });
            }
        }
        const newCustomer = await Customer.create(req.body);
        res.status(201).json(newCustomer);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(409).json({ message: 'Duplicate email' });
        } else {
            res.status(500).json({ message: 'Error creating customer' });
        }
    }
};

// Get all customers (with optional filters and pagination)
exports.getAllCustomers = async (req, res) => {
    try {
        const where = {};
        if (req.query.status) { where.status = req.query.status; }
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        const { count, rows } = await Customer.findAndCountAll({ where, offset, limit });
        res.json({
            customers: rows,
            total: count,
            page,
            pageSize: limit
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching customers' });
    }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        if (!customer) { return res.status(404).json({ message: 'Customer not found' }); }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching customer' });
    }
};

// Update customer by ID
exports.updateCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        if (!customer) { return res.status(404).json({ message: 'Customer not found' }); }
        await customer.update(req.body);
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: 'Error updating customer' });
    }
};

// Delete customer by ID
exports.deleteCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        if (!customer) { return res.status(404).json({ message: 'Customer not found' }); }
        await customer.destroy();
        res.json({ message: 'Customer deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting customer' });
    }
};

// Bulk update customers (optional)
exports.bulkUpdateCustomers = async (req, res) => {
    try {
        const { ids, ...updateFields } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided for bulk update.' });
        }
        const [updated] = await Customer.update(updateFields, { where: { id: ids } });
        res.json({ updated });
    } catch (error) {
        res.status(500).json({ message: 'Error bulk updating customers' });
    }
};

// Bulk delete customers (optional)
exports.bulkDeleteCustomers = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided for bulk delete.' });
        }
        const deleted = await Customer.destroy({ where: { id: ids } });
        res.json({ deleted });
    } catch (error) {
        res.status(500).json({ message: 'Error bulk deleting customers' });
    }
};

// Search/filter customers
exports.searchCustomers = async (req, res) => {
    try {
        const { firstName, lastName, email } = req.query;
        const where = {};
        // Use iLike for Postgres, like for others (e.g., SQLite)
        const likeOperator = Customer.sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
        if (firstName) { where.firstName = { [likeOperator]: `%${firstName}%` }; }
        if (lastName) { where.lastName = { [likeOperator]: `%${lastName}%` }; }
        if (email) { where.email = { [likeOperator]: `%${email}%` }; }
        let customers = [];
        try {
            customers = await Customer.findAll({ where });
        } catch (err) {
            console.error('Customer search query error:', err.message, err.stack);
            return res.status(500).json({ message: 'Database error during customer search', error: err.message });
        }
        res.json({ customers });
    } catch (error) {
        // Log and return the full error for diagnostics
        console.error('Error searching customers:', error);
        res.status(500).json({ message: 'Error searching customers', error: error.message, stack: error.stack });
    }
};
