// ebayInfoModel.js
// Data model for eBay Info & Performance

const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const EbayInfo = sequelize.define('EbayInfo', {
  accountId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  storeName: DataTypes.STRING,
  feedbackScore: DataTypes.INTEGER,
  positiveFeedbackPercent: DataTypes.FLOAT,
  sellerLevel: DataTypes.STRING,
  defectRate: DataTypes.FLOAT,
  lateShipmentRate: DataTypes.FLOAT,
  transactionDefectRate: DataTypes.FLOAT,
  policyComplianceStatus: DataTypes.STRING,
  sellingLimits: DataTypes.JSONB,
  apiStatus: DataTypes.STRING,
  lastSync: DataTypes.DATE
});

module.exports = EbayInfo;
