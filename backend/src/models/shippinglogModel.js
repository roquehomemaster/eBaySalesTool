const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const ShippingLog = sequelize.define('shippinglog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  listing_id: { type: DataTypes.INTEGER, references: { model: 'listing', key: 'id' } },
  // Removed invalid foreign key reference to sales.sold_shipping_collected
  shipping_collected: { type: DataTypes.DECIMAL },
  shipping_label_costs: { type: DataTypes.DECIMAL },
  additional_shipping_costs_material: { type: DataTypes.DECIMAL },
  shipping_total: { type: DataTypes.DECIMAL }
}, {
  tableName: 'shippinglog',
  timestamps: false
});

module.exports = ShippingLog;
