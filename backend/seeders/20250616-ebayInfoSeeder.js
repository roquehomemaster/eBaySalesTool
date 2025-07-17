module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('ebayinfo', [
      {
        account_id: 'acc123',
        store_name: 'Test Store',
        feedback_score: 100,
        positive_feedback_percent: 99.5,
        seller_level: 'Top Rated',
        defect_rate: 0.1,
        late_shipment_rate: 0.05,
        transaction_defect_rate: 0.02,
        policy_compliance_status: 'Compliant',
        selling_limits: JSON.stringify({ limit: 100 }),
        api_status: 'Healthy',
        last_sync: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('ebayinfo', null, {});
  }
};
