/**
 * listingModel.js
 * -----------------------------------------------------------------------------
 * Sequelize model definition for the Listing table.
 * Maps JS camelCase fields to DB snake_case/column names.
 *
 * Author: eBay Sales Tool Team
 * Last updated: 2025-07-10
 * -----------------------------------------------------------------------------
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database').sequelize;

// Listing model definition
const Listing = sequelize.define('Listing', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'id'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'title'
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    field: 'price'
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'itemid'
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active',
    field: 'status'
  },
  watchers: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'watchers'
  },
  item_condition_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'item_condition_description'
  },
  payment_method: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'payment_method'
  },
  shipping_method: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'shipping_method'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'createdat'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updatedat'
  }
}, {
  freezeTableName: true // Prevent Sequelize from pluralizing table name
});

module.exports = Listing;
