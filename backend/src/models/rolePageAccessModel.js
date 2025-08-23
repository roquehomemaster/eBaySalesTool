const { DataTypes } = require('sequelize');
const db = require('../utils/database');

function initModel(sequelizeInstance) {
    return sequelizeInstance.define('role_page_access', {
        access_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        role_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'roles', key: 'role_id' }
        },
        page_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'pages', key: 'page_id' }
        },
        access: {
            type: DataTypes.ENUM('none', 'read', 'read_write', 'read_write_create', 'full'),
            allowNull: false,
            defaultValue: 'none'
        },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        tableName: 'role_page_access',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
}

try {
    const RolePageAccess = initModel(db.sequelize);
    module.exports = RolePageAccess;
} catch (e) {
    module.exports = initModel;
}

module.exports.initModel = initModel;
