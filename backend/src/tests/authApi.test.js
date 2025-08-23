// Auth API contract tests: enforce snake_case PKs and robust error logging
const request = require('supertest');
let app, sequelize, Role, Page, User, RolePageAccess;
const { pool } = require('../../src/utils/database');

// Utility to check PK presence in all objects of a list
function checkPK(list, pkName, entity) {
  list.forEach(obj => {
    if (!(pkName in obj)) {
      throw new Error(`API must return ${pkName} for all ${entity} (snake_case)`);
    }
  });
}

describe('Auth API Endpoints', () => {
  // Ensure DB is ready before tests
  beforeAll(async () => {
    jest.setTimeout(60000);
  // Use the app exported by src/app and the shared sequelize instance so models are registered on the same instance
  app = require('../../src/app');
  const { sequelize: sharedSequelize } = require('../../src/utils/database');
  sequelize = sharedSequelize;
    ({ Role, Page, User, RolePageAccess } = require('../../src/models/authModels'));
    // Use API endpoint to seed and reset the database inside the container
    const res = await request(app).post('/api/populate-database');
    if (res.statusCode !== 200) {
      throw new Error(`Database seeding failed: ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
    if (process.env.VERBOSE_TESTS === '1') {
      console.log('Registered models:', Object.keys(sequelize.models));
    }
    // Log all tables in public schema (robust via pg_tables)
    const [pgTables] = await sequelize.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    const tableNames = pgTables.map(r => r.tablename);
    if (process.env.VERBOSE_TESTS === '1') {
      console.log('Tables in public schema (pg_tables):', tableNames);
    }
    // Check for required tables
    const requiredTables = ['ownership', 'listing', 'ebayinfo', 'application_account', 'roles', 'customer', 'catalog'];
    requiredTables.forEach(tbl => {
      if (!tableNames.includes(tbl)) {
        throw new Error(`Missing required table: ${tbl}`);
      }
    });
  });

  // Close DB connection after tests
  afterAll(async () => {
  await sequelize.close();
  try { await pool.end(); } catch(_) { /* ignore */ }
  });

  describe('Role CRUD', () => {
    let roleId;
    it('should create a new role', async () => {
      const res = await request(app).post('/api/auth/roles').send({ name: 'TestRole' });
      if (res.statusCode !== 201) {
        // eslint-disable-next-line no-console
        console.error('Role creation failed:', res.statusCode, res.body);
      }
      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('TestRole');
      // Use snake_case PK from API response
      if (!('role_id' in res.body)) {
        throw new Error('API must return role_id as PK (snake_case)');
      }
      roleId = res.body.role_id;
    });
    it('should get all roles', async () => {
      const res = await request(app).get('/api/auth/roles');
      if (res.statusCode !== 200) {
        // eslint-disable-next-line no-console
        console.error('Get roles failed:', res.statusCode, res.body);
      }
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // All returned roles must have role_id as PK
      checkPK(res.body, 'role_id', 'roles');
    });
    it('should update a role', async () => {
      const res = await request(app).put(`/api/auth/roles/${roleId}`).send({ name: 'UpdatedRole' });
      if (res.statusCode !== 200) {
        // eslint-disable-next-line no-console
        console.error('Role update failed:', res.statusCode, res.body);
      }
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('UpdatedRole');
    });
    it('should delete a role', async () => {
      const res = await request(app).delete(`/api/auth/roles/${roleId}`);
      if (res.statusCode !== 200) {
        // eslint-disable-next-line no-console
        console.error('Role delete failed:', res.statusCode, res.body);
      }
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Role deleted');
    });
  });

  describe('Page CRUD', () => {
    let pageId;
    it('should create a new page', async () => {
      const res = await request(app).post('/api/auth/pages').send({ name: 'TestPage' });
      if (res.statusCode !== 201) {
        // eslint-disable-next-line no-console
        console.error('Page creation failed:', res.statusCode, res.body);
      }
      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('TestPage');
      if (!('page_id' in res.body)) {
        throw new Error('API must return page_id as PK (snake_case)');
      }
      pageId = res.body.page_id;
    });
    it('should get all pages', async () => {
      const res = await request(app).get('/api/auth/pages');
      if (res.statusCode !== 200) {
        // eslint-disable-next-line no-console
        console.error('Get pages failed:', res.statusCode, res.body);
      }
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // All returned pages must have page_id as PK
      checkPK(res.body, 'page_id', 'pages');
    });
  });

  describe('RolePageAccess CRUD', () => {
    let accessId, roleId, pageId;
    beforeAll(async () => {
      // Clean up to avoid unique constraint issues
      await RolePageAccess.destroy({ where: {} });
      await Role.destroy({ where: {} });
      await Page.destroy({ where: {} });
      const role = await Role.create({ name: 'MatrixRole' });
      const page = await Page.create({ name: 'MatrixPage' });
      roleId = role.role_id;
      pageId = page.page_id;
    });
    it('should create a new role-page access entry', async () => {
      const res = await request(app).post('/api/auth/role-page-access').send({ role_id: roleId, page_id: pageId, access: 'read' });
      if (res.statusCode !== 201) {
        // eslint-disable-next-line no-console
        console.error('RolePageAccess creation failed:', res.statusCode, res.body);
      }
      expect(res.statusCode).toBe(201);
      expect(res.body.role_id).toBe(roleId);
      expect(res.body.page_id).toBe(pageId);
      expect(res.body.access).toBe('read');
      if (!('access_id' in res.body)) {
        throw new Error('API must return access_id as PK (snake_case)');
      }
      accessId = res.body.access_id;
    });
    it('should get the access matrix', async () => {
      const res = await request(app).get('/api/auth/role-page-access');
      if (res.statusCode !== 200) {
        // eslint-disable-next-line no-console
        console.error('Get access matrix failed:', res.statusCode, res.body);
      }
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // All returned access entries must have access_id as PK
      checkPK(res.body, 'access_id', 'access entries');
    });
    it('should update a role-page access entry', async () => {
      const res = await request(app).put(`/api/auth/role-page-access/${accessId}`).send({ access: 'read_write' });
      if (res.statusCode !== 200) {
        // eslint-disable-next-line no-console
        console.error('RolePageAccess update failed:', res.statusCode, res.body);
      }
      expect(res.statusCode).toBe(200);
      expect(res.body.access).toBe('read_write');
    });
    it('should delete a role-page access entry', async () => {
      const res = await request(app).delete(`/api/auth/role-page-access/${accessId}`);
      if (res.statusCode !== 200) {
        // eslint-disable-next-line no-console
        console.error('RolePageAccess delete failed:', res.statusCode, res.body);
      }
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Access entry deleted');
    });
  });

  describe('User CRUD', () => {
    let user_account_id, role_id;
    let uniqueUser, uniqueEmail;
    beforeAll(async () => {
      // Use unique role name per test run to avoid unique constraint errors
      const rand = Math.floor(Math.random() * 1000000);
      const uniqueRoleName = `user_role_${rand}`;
      let role;
      try {
        role = await Role.create({ name: uniqueRoleName });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Role creation failed:', err);
        throw err;
      }
      // Enforce snake_case PK only
      if (!('role_id' in role)) {
        throw new Error('Role model must return role_id as PK (snake_case)');
      }
      role_id = role.role_id;
      // Debug: log the created role and PK
      // eslint-disable-next-line no-console
      console.log('DEBUG: Created role for user test:', role.toJSON ? role.toJSON() : role, 'role_id:', role_id);
      // Use unique username/email for each test run
      uniqueUser = `testuser_${rand}`;
      uniqueEmail = `test_${rand}@example.com`;
    });

    it('should create a new user', async () => {
      // Do NOT send user_account_id in payload, it should be auto-generated
      const payload = { username: uniqueUser, password_hash: 'hash', email: uniqueEmail, role_id };
      const res = await request(app).post('/api/auth/users').send(payload);
      if (res.statusCode !== 201) {
        // Log the error response for debugging
        // eslint-disable-next-line no-console
        console.error('User creation failed:', res.statusCode, res.body);
      }
      expect(res.statusCode).toBe(201);
      expect(res.body.username).toBe(uniqueUser);
      // Should return user_account_id as PK (snake_case)
      if (!('user_account_id' in res.body)) {
        throw new Error('API must return user_account_id as PK (snake_case)');
      }
      user_account_id = res.body.user_account_id;
      expect(user_account_id).toBeDefined();
    });

    it('should get all users', async () => {
      const res = await request(app).get('/api/auth/users');
      if (res.statusCode !== 200) {
        // eslint-disable-next-line no-console
        console.error('User get failed:', res.statusCode, res.body);
      }
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // All returned users must have user_account_id as PK
      checkPK(res.body, 'user_account_id', 'users');
    });

    it('should update a user', async () => {
      // Update user with new unique email, all required fields
      const updatePayload = {
        username: uniqueUser,
        password_hash: 'hash',
        email: 'new_' + uniqueEmail,
        role_id
      };
      const res = await request(app).put(`/api/auth/users/${user_account_id}`).send(updatePayload);
      if (res.statusCode !== 200) {
        // eslint-disable-next-line no-console
        console.error('User update failed:', res.statusCode, res.body);
      }
      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe('new_' + uniqueEmail);
      if (!('user_account_id' in res.body)) {
        throw new Error('API must return user_account_id on update (snake_case)');
      }
      expect(res.body.user_account_id).toBe(user_account_id);
    });

    it('should delete a user', async () => {
      const res = await request(app).delete(`/api/auth/users/${user_account_id}`);
      if (res.statusCode !== 200) {
        // eslint-disable-next-line no-console
        console.error('User delete failed:', res.statusCode, res.body);
      }
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('User deleted');
    });
  });
});
