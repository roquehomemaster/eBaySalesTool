
// ebayinfoModel.js
// Sequelize model for EbayInfo table (matches new schema)

const { DataTypes } = require('sequelize');
const db = require('../utils/database');

function initModel(sequelize) {
  return sequelize.define('ebayinfo', {
    account_id: { type: DataTypes.STRING, allowNull: false, unique: true, primaryKey: true },
    store_name: DataTypes.STRING,
    feedback_score: DataTypes.INTEGER,
    positive_feedback_percent: DataTypes.FLOAT,
    seller_level: DataTypes.STRING,
    defect_rate: DataTypes.FLOAT,
    late_shipment_rate: DataTypes.FLOAT,
    transaction_defect_rate: DataTypes.FLOAT,
    policy_compliance_status: DataTypes.STRING,
    selling_limits: DataTypes.JSONB,
    api_status: DataTypes.STRING,
    last_sync: DataTypes.DATE
  }, {
    tableName: 'ebayinfo',
    timestamps: false
  });
}

try {
  const EbayInfo = initModel(db.sequelize);
  module.exports = EbayInfo;
} catch (e) {
  module.exports = initModel;
}

module.exports.initModel = initModel;
