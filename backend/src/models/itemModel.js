const { DataTypes } = require('sequelize');
const db = require('../utils/database');

function initModel(sequelizeInstance) {
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

// Backward compatibility: try to instantiate using shared sequelize, otherwise export the init function
module.exports = (function () {
  try {
    return initModel(db.sequelize);
  } catch (e) {
    return initModel;
  }
})();

module.exports.initModel = initModel;