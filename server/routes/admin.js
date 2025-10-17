const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireGlobalAdmin } = require('../middleware/auth');

// Toutes les routes admin nécessitent le rôle global_admin
router.use(authenticateToken);
router.use(requireGlobalAdmin);

// Gestion des tenants
router.get('/tenants', adminController.getTenants);
router.post('/tenants', adminController.createTenant);
router.put('/tenants/:id', adminController.updateTenant);
router.delete('/tenants/:id', adminController.deleteTenant);

// Gestion des utilisateurs
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Statistiques globales
router.get('/statistics', adminController.getGlobalStatistics);

module.exports = router;
