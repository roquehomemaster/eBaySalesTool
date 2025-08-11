// appconfigModel.js
// Sequelize model for AppConfig table (matches new schema)

const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const AppConfig = sequelize.define('appconfig', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  config_key: { type: DataTypes.STRING, allowNull: false, unique: true },
  config_value: { type: DataTypes.STRING },
  description: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'appconfig',
  timestamps: false
});

module.exports = AppConfig;
