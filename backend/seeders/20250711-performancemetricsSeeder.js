module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('performancemetrics', [
      {
        user_id: 1,
        metric_date: new Date(),
        metric_type: 'Sales',
        metric_value: 1000.00,
        notes: 'Monthly sales total',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('performancemetrics', null, {});
  }
};
