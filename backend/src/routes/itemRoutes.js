const express = require('express');
const Item = require('../models/itemModel');

const router = express.Router();

// Create a new item
router.post('/items', async (req, res) => {
    try {
        const newItem = new Item(req.body);
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        res.status(500).json({ message: 'Error creating item', error });
    }
});

module.exports = router;