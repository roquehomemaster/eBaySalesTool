module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('EbayInfo', [
      {
        accountId: 'acc123',
        storeName: 'Test Store',
        feedbackScore: 100,
        positiveFeedbackPercent: 99.5,
        sellerLevel: 'Top Rated',
        defectRate: 0.1,
        lateShipmentRate: 0.05,
        transactionDefectRate: 0.02,
        policyComplianceStatus: 'Compliant',
        sellingLimits: JSON.stringify({ limit: 100 }),
        apiStatus: 'Healthy',
        lastSync: new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('EbayInfo', null, {});
  }
};
