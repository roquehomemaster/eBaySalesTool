module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('communicationlogs', [
      {
        customer_id: 1,
        sales_id: 1,
        communication_date: new Date(),
        channel: 'Email',
        subject: 'Order Inquiry',
        message: 'Customer asked about shipping status.',
        response: 'Provided tracking number.',
        status: 'Resolved',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('communicationlogs', null, {});
  }
};
