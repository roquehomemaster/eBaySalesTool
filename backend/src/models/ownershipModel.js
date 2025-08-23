const { DataTypes } = require('sequelize');
const db = require('../utils/database');

function initModel(sequelizeInstance) {
  return sequelizeInstance.define('ownership', {
  ownership_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ownership_type: { type: DataTypes.STRING },
  first_name: { type: DataTypes.STRING },
  last_name: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  telephone: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, unique: true },
  user_account_id: { type: DataTypes.INTEGER, unique: true, references: { model: 'application_account', key: 'user_account_id' } },
  company_name: { type: DataTypes.STRING },
  company_address: { type: DataTypes.TEXT },
  company_telephone: { type: DataTypes.STRING },
  company_email: { type: DataTypes.STRING },
  assigned_contact_first_name: { type: DataTypes.STRING },
  assigned_contact_last_name: { type: DataTypes.STRING },
  assigned_contact_telephone: { type: DataTypes.STRING },
  assigned_contact_email: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'ownership',
    freezeTableName: true,
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