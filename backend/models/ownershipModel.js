const { DataTypes } = require('sequelize');
const { sequelize } = require('../src/utils/database');

const Ownership = sequelize.define('Ownership', {
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

module.exports = Ownership;