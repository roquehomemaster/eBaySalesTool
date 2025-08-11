module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('appconfig', [
      {
        config_key: 'site_name',
        config_value: 'eBay Sales Tool',
        description: 'Name of the application',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('appconfig', null, {});
  }
};
