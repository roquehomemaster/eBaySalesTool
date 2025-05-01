const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Item = sequelize.define('Item', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    manufacturer_info: DataTypes.STRING,
    manufacturer: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Unknown'
    },
    model: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Unknown'
    },
    serial_number: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Unknown'
    },
    product_page_link: DataTypes.STRING,
    dimension_x: DataTypes.FLOAT,
    dimension_y: DataTypes.FLOAT,
    dimension_z: DataTypes.FLOAT,
    weight: DataTypes.FLOAT,
    condition: DataTypes.STRING,
    category: DataTypes.STRING,
    sku_barcode: {
        type: DataTypes.STRING,
        unique: true
    },
    images: DataTypes.ARRAY(DataTypes.STRING),
    specifications: DataTypes.STRING,
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Item;