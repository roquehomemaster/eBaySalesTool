const express = require('express');
const { ApplicationAccount, Role, Page, RolePageAccess } = require('../models/authModels');
const router = express.Router();

// --- Role CRUD ---
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/roles', async (req, res) => {
  try {
    const role = await Role.create({ name: req.body.name });
    res.status(201).json(role);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/roles/:id', async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    role.name = req.body.name;
    await role.save();
    res.json(role);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/roles/:id', async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    await role.destroy();
    res.json({ message: 'Role deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Page CRUD ---
router.get('/pages', async (req, res) => {
  try {
    const pages = await Page.findAll();
    res.json(pages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pages', async (req, res) => {
  try {
    const page = await Page.create({ name: req.body.name });
    res.status(201).json(page);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- RolePageAccess CRUD & Matrix Retrieval ---
router.get('/role-page-access', async (req, res) => {
  try {
    const matrix = await RolePageAccess.findAll({ include: [Role, Page] });
    res.json(matrix);
  } catch (err) {
    console.error('Error in GET /role-page-access:', err);
    res.status(500).json({ error: err.message, details: err });
  }
});

router.post('/role-page-access', async (req, res) => {
  try {
    const access = await RolePageAccess.create({
      role_id: req.body.role_id,
      page_id: req.body.page_id,
      access: req.body.access
    });
    res.status(201).json(access);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/role-page-access/:id', async (req, res) => {
  try {
    const access = await RolePageAccess.findByPk(req.params.id);
    if (!access) {
      return res.status(404).json({ error: 'Access entry not found' });
    }
    await access.update({ access: req.body.access });
    res.json(access);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/role-page-access/:id', async (req, res) => {
  try {
    const access = await RolePageAccess.findByPk(req.params.id);
    if (!access) {
      return res.status(404).json({ error: 'Access entry not found' });
    }
    await access.destroy();
    res.json({ message: 'Access entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- User CRUD (basic, for admin use) ---

// Use ApplicationAccount for user CRUD
router.get('/users', async (req, res) => {
  try {
    const users = await ApplicationAccount.findAll({ include: [Role] });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const user = await ApplicationAccount.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const user = await ApplicationAccount.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await user.update(req.body);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await ApplicationAccount.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
