const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const Ownership = sequelize.define('Ownership', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    ownershipType: {
        type: DataTypes.ENUM('Self', 'Company'),
        allowNull: false
    },
    contact_firstName: DataTypes.STRING,
    contact_lastName: DataTypes.STRING,
    contact_address: DataTypes.STRING,
    contact_telephone: DataTypes.STRING,
    contact_email: DataTypes.STRING,
    companyDetails_companyName: DataTypes.STRING,
    companyDetails_companyAddress: DataTypes.STRING,
    companyDetails_companyTelephone: DataTypes.STRING,
    companyDetails_companyEmail: DataTypes.STRING,
    companyDetails_assignedContact_firstName: DataTypes.STRING,
    companyDetails_assignedContact_lastName: DataTypes.STRING,
    companyDetails_assignedContact_telephone: DataTypes.STRING,
    companyDetails_assignedContact_email: DataTypes.STRING
});

module.exports = Ownership;