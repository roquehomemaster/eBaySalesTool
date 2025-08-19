"use strict";
/**
 * Create listing_description_history table for description versioning
 */
module.exports = {
  async up(queryInterface, Sequelize){
    await queryInterface.createTable('listing_description_history', {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      listing_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'listing', key: 'listing_id' }, onDelete: 'CASCADE' },
      ebay_listing_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'ebay_listing', key: 'ebay_listing_id' }, onDelete: 'SET NULL' },
      revision_hash: { type: Sequelize.STRING(64), allowNull: false },
      raw_html: { type: Sequelize.TEXT, allowNull: false },
      captured_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      source: { type: Sequelize.TEXT, allowNull: false, defaultValue: 'import' },
      is_current: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
    });
    await queryInterface.addIndex('listing_description_history', ['listing_id','captured_at'], { name: 'ix_ldh_listing_captured' });
    await queryInterface.addConstraint('listing_description_history', { fields: ['listing_id','revision_hash'], type: 'unique', name: 'uq_ldh_listing_revision' });
  },
  async down(queryInterface){
    await queryInterface.dropTable('listing_description_history');
  }
};
