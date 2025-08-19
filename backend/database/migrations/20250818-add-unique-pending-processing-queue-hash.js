/**
 * 20250818-add-unique-pending-processing-queue-hash.js
 * Adds a partial (filtered) unique index to enforce idempotent enqueue of identical payload_hash
 * for the same listing while status is pending or processing.
 * Postgres only syntax; if unsupported environment, migration degrades gracefully.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Use raw SQL for partial unique index
    const sql = `CREATE UNIQUE INDEX IF NOT EXISTS ux_ebay_change_queue_listing_hash_active
      ON ebay_change_queue(ebay_listing_id, payload_hash)
      WHERE status IN ('pending','processing')`;
    try { await queryInterface.sequelize.query(sql); } catch (e) { /* ignore if not Postgres */ }
  },
  down: async (queryInterface, Sequelize) => {
    try { await queryInterface.sequelize.query('DROP INDEX IF EXISTS ux_ebay_change_queue_listing_hash_active'); } catch (e) { /* ignore */ }
  }
};
