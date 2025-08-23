const { DataTypes } = require('sequelize');
const db = require('../utils/database');

function defineCatalog(sequelizeInstance) {
  return sequelizeInstance.define('catalog', {
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
}

// Initialize using the currently exported sequelize for backwards compatibility
const Catalog = defineCatalog(db.sequelize);

// Attach init helper so DI code can re-create models on a provided sequelize
Catalog.initModel = defineCatalog;

module.exports = Catalog;