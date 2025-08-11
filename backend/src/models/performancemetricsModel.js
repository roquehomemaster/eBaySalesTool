// performancemetricsModel.js
// Sequelize model for PerformanceMetrics table (matches new schema)

const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const PerformanceMetrics = sequelize.define('performancemetrics', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_account_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'application_account', key: 'user_account_id' } },
  metric_date: { type: DataTypes.DATE, allowNull: false },
  metric_type: { type: DataTypes.STRING },
  metric_value: { type: DataTypes.DECIMAL },
  notes: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'performancemetrics',
  timestamps: false
});

// For backward compatibility, export as both names for now
module.exports = PerformanceMetrics;
module.exports.PerformanceMetrics = PerformanceMetrics;
