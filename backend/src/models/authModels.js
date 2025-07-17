const { ApplicationAccount } = require('./userModel');
const Role = require('./roleModel');
const Page = require('./pageModel');
const RolePageAccess = require('./rolePageAccessModel');

// Associations
Role.hasMany(ApplicationAccount, { foreignKey: 'role_id' });
ApplicationAccount.belongsTo(Role, { foreignKey: 'role_id' });

Role.belongsToMany(Page, { through: RolePageAccess, foreignKey: 'role_id', otherKey: 'page_id' });
Page.belongsToMany(Role, { through: RolePageAccess, foreignKey: 'page_id', otherKey: 'role_id' });

// Add direct associations for eager loading
RolePageAccess.belongsTo(Role, { foreignKey: 'role_id' });
RolePageAccess.belongsTo(Page, { foreignKey: 'page_id' });

module.exports = {
  ApplicationAccount,
  Role,
  Page,
  RolePageAccess
};
