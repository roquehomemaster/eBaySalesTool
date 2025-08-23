/**
 * listingModel.js
 * -----------------------------------------------------------------------------
 * Sequelize model definition for the Listing table.
 * Maps JS camelCase fields to DB snake_case/column names.
 *
 * Author: ListFlowHQ Team (formerly eBay Sales Tool Team)
 * Last updated: 2025-07-10
 * -----------------------------------------------------------------------------
 */

const { DataTypes } = require('sequelize');
const db = require('../utils/database');

function initModel(sequelizeInstance) {
  return sequelizeInstance.define('listing', {
    listing_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    listing_price: { type: DataTypes.DECIMAL },
    item_id: { type: DataTypes.INTEGER, references: { model: 'catalog', key: 'item_id' } },
    ownership_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'ownership', key: 'ownership_id' } },
    status: { type: DataTypes.STRING, defaultValue: 'draft' },
    watchers: { type: DataTypes.INTEGER },
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
    serial_number: { type: DataTypes.STRING },
    manufacture_date: { type: DataTypes.DATEONLY },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    freezeTableName: true, // Prevent Sequelize from pluralizing table name
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
}

module.exports = (function () {
  try {
    return initModel(db.sequelize);
  } catch (e) {
    return initModel;
  }
})();

module.exports.initModel = initModel;
