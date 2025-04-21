const mongoose = require('mongoose');

const ownershipSchema = new mongoose.Schema({
    ownershipType: {
        type: String,
        enum: ['Self', 'Company'],
        required: true
    },
    contact: {
        firstName: String,
        lastName: String,
        address: String,
        telephone: String,
        email: String
    },
    companyDetails: {
        companyName: String,
        companyAddress: String,
        companyTelephone: String,
        companyEmail: String,
        assignedContact: {
            firstName: String,
            lastName: String,
            telephone: String,
            email: String
        }
    }
});

const Ownership = mongoose.model('Ownership', ownershipSchema);

module.exports = Ownership;