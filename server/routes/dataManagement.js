const express = require('express');
const router = express.Router();
const dataManagementController = require('../controllers/dataManagementController');
const { authenticateToken, requireTenantAdmin } = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification et un rôle admin
router.use(authenticateToken);
router.use(requireTenantAdmin);

// Routes pour les appelants
router.get('/callers', dataManagementController.getCallers);
router.put('/callers/:id', dataManagementController.updateCaller);
router.delete('/callers/:id', dataManagementController.deleteCaller);

// Routes pour les raisons
router.get('/reasons', dataManagementController.getReasons);
router.put('/reasons/:id', dataManagementController.updateReason);
router.delete('/reasons/:id', dataManagementController.deleteReason);

// Routes pour les tags
router.get('/tags', dataManagementController.getTags);
router.put('/tags/:id', dataManagementController.updateTag);
router.delete('/tags/:id', dataManagementController.deleteTag);

module.exports = router;
