/**
 * 20250818-add-drift-event-created-at-index.js
 * Adds index on created_at for efficient time-range queries on ebay_drift_event.
 */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex('ebay_drift_event', ['created_at'], { name: 'ebay_drift_event_created_at_idx' });
  },
  down: async (queryInterface) => {
    await queryInterface.removeIndex('ebay_drift_event', 'ebay_drift_event_created_at_idx');
  }
};
