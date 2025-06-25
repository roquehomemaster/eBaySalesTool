module.exports = {
  up: async (queryInterface, Sequelize) => {
    // This migration is now a no-op because Catalog is managed by raw SQL migrations
    return Promise.resolve();
  },

  down: async (queryInterface) => {
    // No-op
    return Promise.resolve();
  }
};
