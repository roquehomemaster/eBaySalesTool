
const { DataTypes } = require('sequelize');
const db = require('../utils/database');

function initModel(sequelizeInstance) {
  return sequelizeInstance.define('application_account', {
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
}

// Backward compatibility: try to instantiate using shared sequelize
module.exports = (function () {
  try {
    return initModel(db.sequelize);
  } catch (e) {
    return initModel;
  }
})();

module.exports.initModel = initModel;
module.exports.ApplicationAccount = module.exports;
