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
    can_view: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    can_edit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

module.exports = RolePageAccess;
