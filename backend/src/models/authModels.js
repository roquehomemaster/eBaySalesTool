const db = require('../utils/database');

// Helper to load either a model or an initModel function from a file
function loadModel(modulePath, sequelize) {
  const mod = require(modulePath);
  if (sequelize && mod && typeof mod.initModel === 'function') {
    return mod.initModel(sequelize);
  }
  if (typeof mod === 'function') {
    // either an initModel function or a model constructor; try to call with shared sequelize
    try {
      return mod(db.sequelize);
    } catch (_) {
      return mod;
    }
  }
  if (mod && typeof mod.initModel === 'function') {
    return mod.initModel(db.sequelize);
  }
  return mod;
}

function wireAssociations(models) {
  const { ApplicationAccount, Role, Page, RolePageAccess } = models;
  if (!Role || !ApplicationAccount || !Page || !RolePageAccess) return;

  // Associations
  Role.hasMany(ApplicationAccount, { foreignKey: 'role_id' });
  ApplicationAccount.belongsTo(Role, { foreignKey: 'role_id' });

  Role.belongsToMany(Page, { through: RolePageAccess, foreignKey: 'role_id', otherKey: 'page_id' });
  Page.belongsToMany(Role, { through: RolePageAccess, foreignKey: 'page_id', otherKey: 'role_id' });

  // Add direct associations for eager loading
  RolePageAccess.belongsTo(Role, { foreignKey: 'role_id' });
  RolePageAccess.belongsTo(Page, { foreignKey: 'page_id' });
}

function initModel(sequelizeInstance) {
  const ApplicationAccount = loadModel('./userModel', sequelizeInstance).ApplicationAccount || loadModel('./userModel', sequelizeInstance);
  const Role = loadModel('./roleModel', sequelizeInstance);
  const Page = loadModel('./pageModel', sequelizeInstance);
  const RolePageAccess = loadModel('./rolePageAccessModel', sequelizeInstance);

  const models = { ApplicationAccount, Role, Page, RolePageAccess };
  wireAssociations(models);
  return models;
}

// Default export: try to initialize with shared sequelize for backwards compatibility
const exported = (function () {
  try {
    return initModel(db.sequelize);
  } catch (e) {
    // Fall back to lazy-loading behaviour
    const ApplicationAccount = loadModel('./userModel');
    const Role = loadModel('./roleModel');
    const Page = loadModel('./pageModel');
    const RolePageAccess = loadModel('./rolePageAccessModel');
    const models = { ApplicationAccount, Role, Page, RolePageAccess };
    try { wireAssociations(models); } catch (err) { /* ignore */ }
    return models;
  }
})();

module.exports = exported;
module.exports.initModel = initModel;
