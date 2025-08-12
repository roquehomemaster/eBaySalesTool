const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const ListingOwnershipHistory = sequelize.define('listing_ownership_history', {
  listing_ownership_history_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  listing_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'listing', key: 'listing_id' } },
  ownership_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'ownership', key: 'ownership_id' } },
  started_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  ended_at: { type: DataTypes.DATE, allowNull: true },
  change_reason: { type: DataTypes.TEXT, allowNull: true },
  changed_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'application_account', key: 'user_account_id' } }
}, {
  tableName: 'listing_ownership_history',
  freezeTableName: true,
  timestamps: false
});

module.exports = ListingOwnershipHistory;
