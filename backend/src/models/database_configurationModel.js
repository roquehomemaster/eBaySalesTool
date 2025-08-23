// database_configurationModel.js
// Sequelize model for Database_Configuration table (matches new schema)

const { DataTypes } = require('sequelize');

function initModel(sequelize) {
  return sequelize.define('database_configuration', {
    config_key: { type: DataTypes.STRING, primaryKey: true },
    config_value: { type: DataTypes.TEXT }
  }, {
    tableName: 'database_configuration',
    timestamps: false
  });
}

try {
  const db = require('../utils/database');
  if (db && db.sequelize) {
    module.exports = initModel(db.sequelize);
    module.exports.initModel = initModel;
  }
} catch (e) {
  module.exports = initModel;
}

module.exports.initModel = initModel;
