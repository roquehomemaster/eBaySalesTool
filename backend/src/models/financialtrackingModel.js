// financialtrackingModel.js
// Sequelize model for FinancialTracking table (matches new schema)

const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const FinancialTracking = sequelize.define('financialtracking', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  item_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'listing', key: 'id' } },
  sales_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'sales', key: 'id' } },
  sold_total: { type: DataTypes.DECIMAL },
  taxes_collected: { type: DataTypes.DECIMAL },
  actual_shipping_costs: { type: DataTypes.DECIMAL },
  net_proceeds_calculation: { type: DataTypes.DECIMAL },
  final_evaluation_calculation_used: { type: DataTypes.DECIMAL },
  terms_calculation: { type: DataTypes.DECIMAL },
  customer_payout: { type: DataTypes.DECIMAL },
  our_profit: { type: DataTypes.DECIMAL }
}, {
  tableName: 'financialtracking',
  timestamps: false
});

module.exports = FinancialTracking;
