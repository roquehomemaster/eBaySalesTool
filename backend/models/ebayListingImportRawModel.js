// ebayListingImportRawModel.js
// Sequelize model for raw staging import table.
const { DataTypes } = require('sequelize');

function initModel(sequelize) {
  return sequelize.define('ebay_listing_import_raw', {
    import_id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    item_id: { type: DataTypes.TEXT, allowNull: false },
    sku: { type: DataTypes.TEXT },
    source_api: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'trading' },
    raw_json: { type: DataTypes.JSONB, allowNull: false },
    content_hash: { type: DataTypes.STRING(64), allowNull: false },
    fetched_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    processed_at: { type: DataTypes.DATE, allowNull: true },
    process_status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'pending' },
    process_error: { type: DataTypes.TEXT },
    attempt_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  }, {
    tableName: 'ebay_listing_import_raw',
    timestamps: false
  });
}

module.exports.initModel = initModel;

// Backwards-compatible default when shared sequelize is available at require-time
try {
  const db = require('../src/utils/database');
  if (db && db.sequelize) {
    module.exports = initModel(db.sequelize);
    module.exports.initModel = initModel;
  }
} catch (e) {
  // noop
}
