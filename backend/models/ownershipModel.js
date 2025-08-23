/**
 * ownershipModel.js
 * -----------------------------------------------------------------------------
 * Sequelize model definition for the Ownership table.
 *
 * Author: ListFlowHQ Team (formerly eBay Sales Tool Team)
 * Last updated: 2025-07-10
 * -----------------------------------------------------------------------------
 */

const { DataTypes } = require('sequelize');

function initModel(sequelize) {
  // Ownership model definition
  return sequelize.define('Ownership', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    agreementType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ownershipType: {
      type: DataTypes.ENUM('Full', 'Partial', 'Consignment'),
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });
}

module.exports.initModel = initModel;

// Backwards-compatible default when shared sequelize is available at require-time
try {
  const db = require('../src/utils/database');
  if (db && db.sequelize) {
    module.exports = initModel(db.sequelize);
    module.exports.initModel = initModel;
  }
} catch (e) {
  // noop
}