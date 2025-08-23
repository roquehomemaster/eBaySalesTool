// appconfigModel.js
// Sequelize model for appconfig table (config_key PK, value and type only)

const { DataTypes } = require('sequelize');
const db = require('../utils/database');

  function initModel(sequelize) {
    return sequelize.define('app_config', {
      key: { type: DataTypes.STRING, primaryKey: true },
      value: { type: DataTypes.TEXT }
    }, {
      tableName: 'app_config',
      timestamps: false
    });
  }

  try {
    const db = require('../utils/database');
    if (db && db.sequelize) {
      module.exports = initModel(db.sequelize);
      module.exports.initModel = initModel;
    }
  } catch (e) { /* noop */ }

module.exports.initModel = initModel;
module.exports.initModel = initModel;
