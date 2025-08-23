const { DataTypes } = require('sequelize');
const db = require('../utils/database');

function initModel(sequelizeInstance) {
    return sequelizeInstance.define('role', {
        role_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        description: { type: DataTypes.STRING },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        tableName: 'roles',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
}

// Backwards-compatible default export when the shared sequelize exists
try {
    const Role = initModel(db.sequelize);
    module.exports = Role;
} catch (e) {
    // If db isn't ready at require-time, export the init helper instead
    module.exports = initModel;
}

module.exports.initModel = initModel;
