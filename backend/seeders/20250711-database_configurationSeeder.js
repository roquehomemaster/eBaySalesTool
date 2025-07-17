module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('database_configuration', [
      {
        config_name: 'max_connections',
        config_value: '100',
        description: 'Maximum allowed DB connections',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('database_configuration', null, {});
  }
};
