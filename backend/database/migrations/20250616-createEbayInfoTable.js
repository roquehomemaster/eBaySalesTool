module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('EbayInfo', {
      accountId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      storeName: Sequelize.STRING,
      feedbackScore: Sequelize.INTEGER,
      positiveFeedbackPercent: Sequelize.FLOAT,
      sellerLevel: Sequelize.STRING,
      defectRate: Sequelize.FLOAT,
      lateShipmentRate: Sequelize.FLOAT,
      transactionDefectRate: Sequelize.FLOAT,
      policyComplianceStatus: Sequelize.STRING,
      sellingLimits: Sequelize.JSONB,
      apiStatus: Sequelize.STRING,
      lastSync: Sequelize.DATE
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('EbayInfo');
  }
};
