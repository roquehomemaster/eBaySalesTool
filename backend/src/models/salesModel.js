const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
    item: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    soldDate: {
        type: Date,
        default: Date.now
    },
    owner: {
        type: String,
        required: true
    },
    negotiatedTerms: {
        type: String,
        required: false
    }
});

const Sales = mongoose.model('Sales', salesSchema);

module.exports = Sales;