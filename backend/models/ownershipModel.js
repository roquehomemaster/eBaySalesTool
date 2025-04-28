const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    contactInfo: {
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: false
        },
        address: {
            type: String,
            required: false
        }
    },
    negotiatedTerms: {
        commissionPercentage: {
            type: Number,
            required: true
        },
        minimumSalePrice: {
            type: Number,
            required: false
        },
        durationOfAgreement: {
            type: String,
            required: false
        },
        renewalTerms: {
            type: String,
            required: false
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Owner', ownerSchema);