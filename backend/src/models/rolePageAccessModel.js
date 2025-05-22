const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const RolePageAccess = sequelize.define('RolePageAccess', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    role_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    page_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    access: {
        type: DataTypes.ENUM('none', 'read', 'read_write', 'read_write_create', 'full'),
        allowNull: false,
        defaultValue: 'none'
    }
});

module.exports = RolePageAccess;
