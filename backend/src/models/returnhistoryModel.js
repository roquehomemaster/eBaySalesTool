// returnhistoryModel.js
// Sequelize model for ReturnHistory table (matches new schema)

const { DataTypes } = require('sequelize');
const db = require('../utils/database');

function initModel(sequelizeInstance) {
  return sequelizeInstance.define('returnhistory', {
    returnhistory_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    sale_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'sales', key: 'sale_id' } },
    return_date: { type: DataTypes.DATE, allowNull: false },
    reason: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING },
    refund_amount: { type: DataTypes.DECIMAL },
    notes: { type: DataTypes.TEXT },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'returnhistory',
    timestamps: false
  });
}

try {
  const ReturnHistory = initModel(db.sequelize);
  module.exports = ReturnHistory;
} catch (e) {
  module.exports = initModel;
}

module.exports.initModel = initModel;
