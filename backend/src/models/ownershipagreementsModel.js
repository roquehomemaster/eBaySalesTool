const { DataTypes } = require('sequelize');

function initModel(sequelizeInstance) {
  return sequelizeInstance.define('ownershipagreements', {
    ownershipagreement_id: {
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
        key: 'ownership_id'
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
}

try {
  const { sequelize } = require('../utils/database');
  module.exports = initModel(sequelize);
} catch (e) {
  module.exports = initModel;
}

module.exports.initModel = initModel;
