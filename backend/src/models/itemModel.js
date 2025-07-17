const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const Catalog = sequelize.define('catalog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  description: { type: DataTypes.STRING },
  manufacturer: { type: DataTypes.STRING },
  model: { type: DataTypes.STRING },
  serial_number: { type: DataTypes.STRING },
  sku_barcode: { type: DataTypes.STRING, unique: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'catalog',
  timestamps: false
});

module.exports = Catalog;