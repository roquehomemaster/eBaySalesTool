
// ebayinfoModel.js
// Sequelize model for EbayInfo table (matches new schema)

const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const EbayInfo = sequelize.define('ebayinfo', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  accountId: { type: DataTypes.STRING, allowNull: false, unique: true, field: 'account_id' },
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
  last_sync: DataTypes.DATE,
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'ebayinfo',
  timestamps: false
});

module.exports = EbayInfo;
