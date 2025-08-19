/**
 * Migration: create ebay_listing_import_raw staging table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ebay_listing_import_raw', {
      import_id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      item_id: { type: Sequelize.TEXT, allowNull: false },
      sku: { type: Sequelize.TEXT, allowNull: true },
      source_api: { type: Sequelize.TEXT, allowNull: false, defaultValue: 'trading' },
      raw_json: { type: Sequelize.JSONB, allowNull: false },
      content_hash: { type: Sequelize.STRING(64), allowNull: false },
      fetched_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      processed_at: { type: Sequelize.DATE, allowNull: true },
      process_status: { type: Sequelize.TEXT, allowNull: false, defaultValue: 'pending' },
      process_error: { type: Sequelize.TEXT, allowNull: true },
      attempt_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }
    });
    await queryInterface.addIndex('ebay_listing_import_raw', ['item_id'], { name: 'ix_ebay_listing_import_raw_item' });
    await queryInterface.addIndex('ebay_listing_import_raw', ['content_hash'], { name: 'ix_ebay_listing_import_raw_hash' });
    await queryInterface.addIndex('ebay_listing_import_raw', ['process_status'], { name: 'ix_ebay_listing_import_raw_status' });
    // Optional uniqueness to avoid duplicates on same payload
    await queryInterface.addConstraint('ebay_listing_import_raw', {
      fields: ['item_id', 'content_hash'],
      type: 'unique',
      name: 'uq_ebay_listing_import_raw_item_hash'
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('ebay_listing_import_raw');
  }
};
