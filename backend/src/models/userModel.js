
const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');


const ApplicationAccount = sequelize.define('application_account', {
  user_account_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  role_id: { type: DataTypes.INTEGER },
  first_name: { type: DataTypes.STRING },
  last_name: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'application_account',
  timestamps: false
});

// For backward compatibility, export as both names for now
module.exports = ApplicationAccount;
module.exports.ApplicationAccount = ApplicationAccount;
