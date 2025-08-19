const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const EbayListingImportRaw = sequelize.define('ebay_listing_import_raw', {
  import_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  item_id: { type: DataTypes.TEXT, allowNull: false },
  sku: { type: DataTypes.TEXT },
  source_api: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'trading' },
  raw_json: { type: DataTypes.JSONB, allowNull: false },
  content_hash: { type: DataTypes.STRING(64), allowNull: false },
  fetched_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  processed_at: { type: DataTypes.DATE },
  process_status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'pending' },
  process_error: { type: DataTypes.TEXT },
  attempt_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  tableName: 'ebay_listing_import_raw',
  timestamps: false
});

module.exports = EbayListingImportRaw;
