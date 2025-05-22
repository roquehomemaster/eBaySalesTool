const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const Page = sequelize.define('Page', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});

module.exports = Page;
