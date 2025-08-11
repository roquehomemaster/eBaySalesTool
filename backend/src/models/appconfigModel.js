// appconfigModel.js
// Sequelize model for appconfig table (config_key PK, value and type only)

const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const AppConfig = sequelize.define('appconfig', {
  config_key: { type: DataTypes.STRING, primaryKey: true },
  config_value: { type: DataTypes.TEXT, allowNull: false },
  data_type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'string' }
}, {
  tableName: 'appconfig',
  timestamps: false
});

module.exports = AppConfig;
