const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const Ownership = sequelize.define('Ownership', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    ownership_type: {
        type: DataTypes.ENUM('Full', 'Partial', 'Consignment'),
        allowNull: false
    },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    address: DataTypes.TEXT,
    telephone: DataTypes.STRING,
    email: DataTypes.STRING,
    company_name: DataTypes.STRING,
    company_address: DataTypes.TEXT,
    company_telephone: DataTypes.STRING,
    company_email: DataTypes.STRING,
    assigned_contact_first_name: DataTypes.STRING,
    assigned_contact_last_name: DataTypes.STRING,
    assigned_contact_telephone: DataTypes.STRING,
    assigned_contact_email: DataTypes.STRING
});

module.exports = Ownership;