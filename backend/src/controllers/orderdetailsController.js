// orderdetailsController.js
// Controller for OrderDetails endpoints

const OrderDetails = require('../models/orderdetailsModel');
const audit = require('../utils/auditLogger');
const { ENTITY } = require('../constants/entities');

// Create a new order details record
exports.createOrderDetails = async (req, res) => {
    try {
        const requiredFields = ['sales_id', 'item_id', 'quantity', 'unit_price'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ message: `Missing required field: ${field}` });
            }
        }
    const newRecord = await OrderDetails.create(req.body);
    try { const afterObj = newRecord.toJSON ? newRecord.toJSON() : newRecord; await audit.logCreate(ENTITY.ORDER_DETAILS, afterObj.orderdetails_id, afterObj, req.user_account_id); } catch (e) { console.error('Audit (create orderdetails) failed:', e?.message || e); }
    res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ message: 'Error creating order details record' });
    }
};

// Get all order details records
exports.getAllOrderDetails = async (req, res) => {
    try {
        const records = await OrderDetails.findAll();
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order details records' });
    }
};

// Get order details by ID
exports.getOrderDetailsById = async (req, res) => {
    try {
        const record = await OrderDetails.findByPk(req.params.id);
        if (!record) { return res.status(404).json({ message: 'Order details record not found' }); }
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order details record' });
    }
};

// Update order details by ID
exports.updateOrderDetailsById = async (req, res) => {
    try {
    const record = await OrderDetails.findByPk(req.params.id);
    if (!record) { return res.status(404).json({ message: 'Order details record not found' }); }
    const beforeObj = record.toJSON ? record.toJSON() : { ...record };
    await record.update(req.body);
    try { const afterObj = record.toJSON ? record.toJSON() : record; await audit.logUpdate(ENTITY.ORDER_DETAILS, record.orderdetails_id, beforeObj, afterObj, req.user_account_id); } catch (e) { console.error('Audit (update orderdetails) failed:', e?.message || e); }
    res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error updating order details record' });
    }
};

// Delete order details by ID
exports.deleteOrderDetailsById = async (req, res) => {
    try {
    const record = await OrderDetails.findByPk(req.params.id);
    if (!record) { return res.status(404).json({ message: 'Order details record not found' }); }
    const beforeObj = record.toJSON ? record.toJSON() : { ...record };
    await record.destroy();
    try { await audit.logDelete(ENTITY.ORDER_DETAILS, beforeObj.orderdetails_id, beforeObj, req.user_account_id); } catch (e) { console.error('Audit (delete orderdetails) failed:', e?.message || e); }
    res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting order details record' });
    }
};
