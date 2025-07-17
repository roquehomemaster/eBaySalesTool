module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('orderdetails', [
      {
        sales_id: 1,
        item_id: 1,
        quantity: 2,
        unit_price: 50.00,
        discount: 5.00,
        tax: 4.50,
        total: 99.50,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('orderdetails', null, {});
  }
};
