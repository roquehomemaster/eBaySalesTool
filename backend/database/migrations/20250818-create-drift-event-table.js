/**
 * 20250818-create-drift-event-table.js
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ebay_drift_event', {
      drift_event_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      ebay_listing_id: { type: Sequelize.INTEGER, allowNull: false },
      classification: { type: Sequelize.TEXT, allowNull: false },
      local_hash: { type: Sequelize.TEXT },
      remote_hash: { type: Sequelize.TEXT },
      snapshot_hash: { type: Sequelize.TEXT },
      details_json: { type: Sequelize.JSONB },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('ebay_drift_event', ['ebay_listing_id']);
    await queryInterface.addIndex('ebay_drift_event', ['classification']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('ebay_drift_event');
  }
};
