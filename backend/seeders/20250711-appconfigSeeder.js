module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('appconfig', [
      { config_key: 'site_name', config_value: 'eBay Sales Tool', data_type: 'string' },
      { config_key: 'listings.page_size', config_value: '12', data_type: 'integer' },
      { config_key: 'catalog.page_size', config_value: '15', data_type: 'integer' },
      { config_key: 'sales.page_size', config_value: '10', data_type: 'integer' }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('appconfig', null, {});
  }
};
