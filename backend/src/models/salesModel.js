const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const Sales = sequelize.define('sales', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  listing_id: { type: DataTypes.INTEGER, references: { model: 'listing', key: 'id' } },
  sold_price: { type: DataTypes.DECIMAL },
  sold_date: { type: DataTypes.DATE },
  sold_shipping_collected: { type: DataTypes.DECIMAL },
  taxes: { type: DataTypes.DECIMAL },
  owner_id: { type: DataTypes.INTEGER, references: { model: 'ownership', key: 'id' } },
  negotiated_terms: { type: DataTypes.TEXT },
  negotiated_terms_calculation: { type: DataTypes.DECIMAL },
  sales_channel: { type: DataTypes.STRING },
  customer_feedback: { type: DataTypes.TEXT }
}, {
  tableName: 'sales',
  timestamps: false
});

module.exports = Sales;