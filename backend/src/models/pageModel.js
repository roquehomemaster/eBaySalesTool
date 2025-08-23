const { DataTypes } = require('sequelize');
const db = require('../utils/database');

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
    const Page = initModel(db.sequelize);
    module.exports = Page;
} catch (e) {
    module.exports = initModel;
}

module.exports.initModel = initModel;
