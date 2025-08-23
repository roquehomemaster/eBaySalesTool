const { DataTypes } = require('sequelize');

function initModel(sequelizeInstance) {
  return sequelizeInstance.define('customer', {
    customer_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    first_name: { type: DataTypes.STRING },
    last_name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, unique: true },
    phone: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'customer',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
}

try {
  const { sequelize } = require('../utils/database');
  module.exports = initModel(sequelize);
} catch (_) {
  module.exports = initModel;
}

module.exports.initModel = initModel;
