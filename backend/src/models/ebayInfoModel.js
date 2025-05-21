// ebayInfoModel.js
// Data model for eBay Info & Performance

const ebayInfo = {
  accountId: String,
  storeName: String,
  feedbackScore: Number,
  positiveFeedbackPercent: Number,
  sellerLevel: String,
  defectRate: Number,
  lateShipmentRate: Number,
  transactionDefectRate: Number,
  policyComplianceStatus: String,
  sellingLimits: Object,
  apiStatus: String,
  lastSync: Date
};

module.exports = ebayInfo;
