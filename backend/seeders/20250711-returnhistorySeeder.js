module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('returnhistory', [
      {
        sales_id: 1,
        return_date: new Date(),
        reason: 'Damaged item',
        status: 'Pending',
        refund_amount: 25.00,
        notes: 'Customer reported damage on arrival.',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('returnhistory', null, {});
  }
};
