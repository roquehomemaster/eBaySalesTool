const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Sales = sequelize.define('Sales', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    item: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    soldDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    owner: {
        type: DataTypes.STRING,
        allowNull: false
    },
    negotiatedTerms: DataTypes.STRING
});

module.exports = Sales;