const { DataTypes } = require('sequelize');
const db = require('../utils/database');

function initModel(sequelizeInstance) {
  return sequelizeInstance.define('sales', {
  sale_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  listing_id: { type: DataTypes.INTEGER, references: { model: 'listing', key: 'listing_id' } },
  sold_price: { type: DataTypes.DECIMAL },
  sold_date: { type: DataTypes.DATE },
  sold_shipping_collected: { type: DataTypes.DECIMAL },
  taxes: { type: DataTypes.DECIMAL },
  ownership_id: { type: DataTypes.INTEGER, references: { model: 'ownership', key: 'ownership_id' } },
  negotiated_terms: { type: DataTypes.TEXT },
  negotiated_terms_calculation: { type: DataTypes.DECIMAL },
  sales_channel: { type: DataTypes.STRING },
  customer_feedback: { type: DataTypes.TEXT }
  }, {
    tableName: 'sales',
    timestamps: false
  });
}

// Attempt to initialize using the shared sequelize for backward compatibility
module.exports = (function () {
  try {
    return initModel(db.sequelize);
  } catch (e) {
    return initModel;
  }
})();

module.exports.initModel = initModel;