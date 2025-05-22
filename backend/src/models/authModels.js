const User = require('./userModel');
const Role = require('./roleModel');
const Page = require('./pageModel');
const RolePageAccess = require('./rolePageAccessModel');

// Associations
Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

Role.belongsToMany(Page, { through: RolePageAccess, foreignKey: 'role_id', otherKey: 'page_id' });
Page.belongsToMany(Role, { through: RolePageAccess, foreignKey: 'page_id', otherKey: 'role_id' });

module.exports = {
  User,
  Role,
  Page,
  RolePageAccess
};
