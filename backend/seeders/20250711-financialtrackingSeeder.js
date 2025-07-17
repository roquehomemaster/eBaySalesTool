module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('financialtracking', [
      {
        sales_id: 1,
        payment_received: 100.00,
        payment_date: new Date(),
        payout_status: 'Paid',
        payout_date: new Date(),
        fees: 10.00,
        net_amount: 90.00,
        notes: 'Initial payout',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('financialtracking', null, {});
  }
};
