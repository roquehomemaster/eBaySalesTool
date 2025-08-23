// financialtrackingModel.js
// Sequelize model for FinancialTracking table (matches new schema)

const { DataTypes } = require('sequelize');
const db = require('../utils/database');

function initModel(sequelizeInstance) {
  return sequelizeInstance.define('financialtracking', {
    financialtracking_id: { type: DataTypes.INTEGER, primaryKey: true },
    listing_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'listing', key: 'listing_id' } },
    sale_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'sales', key: 'sale_id' } },
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
}

try {
  const FinancialTracking = initModel(db.sequelize);
  module.exports = FinancialTracking;
} catch (e) {
  module.exports = initModel;
}

module.exports.initModel = initModel;
