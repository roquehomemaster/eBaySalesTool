const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/utils/database');
const { Role, Page, User, RolePageAccess } = require('../../src/models/authModels');

describe('Auth API Endpoints', () => {
  beforeAll(async () => {
    await sequelize.sync();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Role CRUD', () => {
    let roleId;
    it('should create a new role', async () => {
      const res = await request(app).post('/api/auth/roles').send({ name: 'TestRole' });
      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('TestRole');
      roleId = res.body.id;
    });
    it('should get all roles', async () => {
      const res = await request(app).get('/api/auth/roles');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
    it('should update a role', async () => {
      const res = await request(app).put(`/api/auth/roles/${roleId}`).send({ name: 'UpdatedRole' });
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('UpdatedRole');
    });
    it('should delete a role', async () => {
      const res = await request(app).delete(`/api/auth/roles/${roleId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Role deleted');
    });
  });

  describe('Page CRUD', () => {
    let pageId;
    it('should create a new page', async () => {
      const res = await request(app).post('/api/auth/pages').send({ name: 'TestPage' });
      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('TestPage');
      pageId = res.body.id;
    });
    it('should get all pages', async () => {
      const res = await request(app).get('/api/auth/pages');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
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
      roleId = role.id;
      pageId = page.id;
    });
    it('should create a new role-page access entry', async () => {
      const res = await request(app).post('/api/auth/role-page-access').send({ role_id: roleId, page_id: pageId, access: 'read' });
      expect(res.statusCode).toBe(201);
      expect(res.body.role_id).toBe(roleId);
      expect(res.body.page_id).toBe(pageId);
      expect(res.body.access).toBe('read');
      accessId = res.body.id;
    });
    it('should get the access matrix', async () => {
      const res = await request(app).get('/api/auth/role-page-access');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
    it('should update a role-page access entry', async () => {
      const res = await request(app).put(`/api/auth/role-page-access/${accessId}`).send({ access: 'read_write' });
      expect(res.statusCode).toBe(200);
      expect(res.body.access).toBe('read_write');
    });
    it('should delete a role-page access entry', async () => {
      const res = await request(app).delete(`/api/auth/role-page-access/${accessId}`);
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
      // Accept snake_case or fallback to id
      role_id = role.role_id ?? role.id;
      if (!role_id) {
        throw new Error('Role model must return role_id or id as PK');
      }
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
      if ('user_account_id' in res.body) {
        user_account_id = res.body.user_account_id;
      } else if ('id' in res.body) {
        user_account_id = res.body.id;
      } else {
        throw new Error('API must return user_account_id or id as PK');
      }
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
      res.body.forEach(user => {
        if (!('user_account_id' in user) && !('id' in user)) {
          throw new Error('API must return user_account_id or id for all users');
        }
      });
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
      if ('user_account_id' in res.body) {
        expect(res.body.user_account_id).toBe(user_account_id);
      } else if ('id' in res.body) {
        expect(res.body.id).toBe(user_account_id);
      } else {
        throw new Error('API must return user_account_id or id on update');
      }
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
