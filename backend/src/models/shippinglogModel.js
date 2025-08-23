const { DataTypes } = require('sequelize');

function initModel(sequelizeInstance) {
  return sequelizeInstance.define('shippinglog', {
    shippinglog_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    listing_id: { type: DataTypes.INTEGER, references: { model: 'listing', key: 'listing_id' } },
    // Removed invalid foreign key reference to sales.sold_shipping_collected
    shipping_collected: { type: DataTypes.DECIMAL },
    shipping_label_costs: { type: DataTypes.DECIMAL },
    additional_shipping_costs_material: { type: DataTypes.DECIMAL },
    shipping_total: { type: DataTypes.DECIMAL }
  }, {
    tableName: 'shippinglog',
    timestamps: false
  });
}

try {
  const { sequelize } = require('../utils/database');
  module.exports = initModel(sequelize);
} catch (_) {
  module.exports = initModel;
}

module.exports.initModel = initModel;
