// database_configurationModel.js
// Sequelize model for Database_Configuration table (matches new schema)

const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const DatabaseConfiguration = sequelize.define('database_configuration', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  config_name: { type: DataTypes.STRING, allowNull: false, unique: true },
  config_value: { type: DataTypes.STRING },
  description: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'database_configuration',
  timestamps: false
});

module.exports = DatabaseConfiguration;
