/**
 * models/index.js
 * Central model initializer. Call `initModels(sequelize)` to register all models
 * on the provided Sequelize instance and return a models map.
 */
const path = require('path');

const modelFiles = [
  'itemModel',
  'listingModel',
  'listingOwnershipHistoryModel',
  'salesModel',
  'financialtrackingModel',
  'shippinglogModel',
  'communicationlogsModel',
  'returnhistoryModel',
  'orderdetailsModel',
  'ownershipModel',
  'ownershipagreementsModel',
  'customerModel',
  'catalogModel',
  'performancemetricsModel',
  'appconfigModel',
  'database_configurationModel',
  'ebayInfoModel',
  'ebayListingImportRawModel',
  'ebayIntegrationModels',
  'roleModel',
  'pageModel',
  'rolePageAccessModel',
  'userModel',
  'authModels'
];

function initModels(sequelize) {
  if (!sequelize) throw new Error('initModels requires a Sequelize instance');
  const models = {};
  for (const file of modelFiles) {
    const modulePath = path.join(__dirname, file + '.js');
    // Require each module fresh to avoid stale cache with previous sequelize
    delete require.cache[require.resolve(modulePath)];
    const mod = require(modulePath);
    if (typeof mod.initModel === 'function') {
      models[file] = mod.initModel(sequelize);
    } else if (mod && mod.name && mod.sequelize) {
      // Already instantiated model; attempt to reattach to provided sequelize by copying
      models[file] = mod;
    } else {
      // Fallback: use the exported value as-is
      models[file] = mod;
    }
  }

  // Example of associations if models expose associate functions
  for (const key of Object.keys(models)) {
    const m = models[key];
    if (m && typeof m.associate === 'function') {
      try { m.associate(models); } catch (e) { /* ignore association errors for now */ }
    }
  }

  return models;
}

module.exports = { initModels };
