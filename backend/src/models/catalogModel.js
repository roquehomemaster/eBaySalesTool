// catalogModel.js
// Sequelize model for the Catalog table, using camelCase in code and snake_case in DB

const { DataTypes } = require('sequelize');
// Backwards-compatible default: import will continue to work, but tests and the
// appFactory should call `initModel(sequelize)` to bind to an injected instance.
function initModel(sequelizeInstance) {
  const Catalog = sequelizeInstance.define('catalog', {
    item_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    description: { type: DataTypes.STRING },
    manufacturer: { type: DataTypes.STRING },
    model: { type: DataTypes.STRING },
    sku: { type: DataTypes.STRING, unique: true },
    barcode: { type: DataTypes.STRING, unique: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'catalog',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Catalog;
}

// Maintain legacy default export by attempting to attach to the shared sequelize
try {
  const { sequelize } = require('../utils/database');
  module.exports = initModel(sequelize);
} catch (_) {
  // If database util isn't available at require-time, export the initModel function
  module.exports = initModel;
}

module.exports.initModel = initModel;
