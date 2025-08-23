const { DataTypes } = require('sequelize');

function initModel(sequelizeInstance) {
    return sequelizeInstance.define('page', {
        page_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        url: { type: DataTypes.STRING },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        tableName: 'pages',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
}

try {
    const { sequelize } = require('../utils/database');
    module.exports = initModel(sequelize);
} catch (e) {
    module.exports = initModel;
}

module.exports.initModel = initModel;
