// catalogModel.js
// Sequelize model for the Catalog table, using camelCase in code and snake_case in DB

const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const Catalog = sequelize.define('catalog', {
  item_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  description: { type: DataTypes.STRING },
  manufacturer: { type: DataTypes.STRING },
  model: { type: DataTypes.STRING },
  sku: { type: DataTypes.STRING, unique: true },
  barcode: { type: DataTypes.STRING, unique: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'catalog',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Catalog;
