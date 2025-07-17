// orderdetailsModel.js
// Sequelize model for OrderDetails table (matches new schema)

const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const OrderDetails = sequelize.define('orderdetails', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  sales_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'sales', key: 'id' } },
  item_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'catalog', key: 'id' } },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  unit_price: { type: DataTypes.DECIMAL, allowNull: false },
  discount: { type: DataTypes.DECIMAL },
  tax: { type: DataTypes.DECIMAL },
  total: { type: DataTypes.DECIMAL },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'orderdetails',
  timestamps: false
});

module.exports = OrderDetails;
