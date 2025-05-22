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
    let userId, roleId;
    beforeAll(async () => {
      const role = await Role.create({ name: 'UserRole' });
      roleId = role.id;
    });
    it('should create a new user', async () => {
      const res = await request(app).post('/api/auth/users').send({ username: 'testuser', password_hash: 'hash', email: 'test@example.com', role_id: roleId });
      expect(res.statusCode).toBe(201);
      expect(res.body.username).toBe('testuser');
      userId = res.body.id;
    });
    it('should get all users', async () => {
      const res = await request(app).get('/api/auth/users');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
    it('should update a user', async () => {
      const res = await request(app).put(`/api/auth/users/${userId}`).send({ email: 'new@example.com' });
      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe('new@example.com');
    });
    it('should delete a user', async () => {
      const res = await request(app).delete(`/api/auth/users/${userId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('User deleted');
    });
  });
});
