// communicationlogsModel.js
// Sequelize model for CommunicationLogs table (matches new schema)

const { DataTypes } = require('sequelize');

function initModel(sequelizeInstance) {
  return sequelizeInstance.define('communicationlogs', {
    communicationlog_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    customer_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'customer', key: 'customer_id' } },
    sale_id: { type: DataTypes.INTEGER, references: { model: 'sales', key: 'sale_id' } },
    communication_date: { type: DataTypes.DATE, allowNull: false },
    channel: { type: DataTypes.STRING },
    subject: { type: DataTypes.STRING },
    message: { type: DataTypes.TEXT },
    response: { type: DataTypes.TEXT },
    status: { type: DataTypes.STRING },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'communicationlogs',
    timestamps: false
  });
}

try {
  const { sequelize } = require('../utils/database');
  module.exports = initModel(sequelize);
} catch (_) {
  module.exports = initModel;
}

module.exports.initModel = initModel;
