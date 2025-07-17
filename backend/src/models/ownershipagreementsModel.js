const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const OwnershipAgreements = sequelize.define('ownershipagreements', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  ownership_id: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false,
    references: {
      model: 'ownership',
      key: 'id'
    }
  },
  commission_percentage: DataTypes.DECIMAL,
  minimum_sale_price: DataTypes.DECIMAL,
  duration_of_agreement: DataTypes.INTEGER,
  renewal_terms: DataTypes.TEXT
}, {
  tableName: 'ownershipagreements',
  timestamps: false
});

module.exports = OwnershipAgreements;
