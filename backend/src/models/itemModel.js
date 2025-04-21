const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    manufacturer_info: String,
    manufacturer: {
        type: String,
        required: true,
        default: 'Unknown'
    },
    model: {
        type: String,
        required: true,
        default: 'Unknown'
    },
    serial_number: {
        type: String,
        required: true,
        default: 'Unknown'
    },
    product_page_link: {
        type: String
    },
    dimension: {
        x: Number,
        y: Number,
        z: Number
    },
    weight: Number,
    condition: String,
    category: String,
    sku_barcode: {
        type: String,
        unique: true
    },
    images: [String],
    specifications: String,
    created_at: {
        type: Date,
        default: Date.now
    }
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;