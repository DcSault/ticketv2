const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminController = require('../controllers/adminController');
const { authenticateToken, requireGlobalAdmin, requireTenantAdmin } = require('../middleware/auth');

// Configuration multer pour upload fichier JSON
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Toutes les routes nécessitent l'authentification
router.use(authenticateToken);

// Gestion des tenants (seulement global_admin)
router.get('/tenants', requireTenantAdmin, adminController.getTenants);
router.post('/tenants', requireGlobalAdmin, adminController.createTenant);
router.put('/tenants/:id', requireGlobalAdmin, adminController.updateTenant);
router.delete('/tenants/:id', requireGlobalAdmin, adminController.deleteTenant);

// Gestion des utilisateurs (tenant_admin peut gérer les users de son tenant)
router.get('/users', requireTenantAdmin, adminController.getUsers);
router.post('/users', requireTenantAdmin, adminController.createUser);
router.put('/users/:id', requireTenantAdmin, adminController.updateUser);
router.delete('/users/:id', requireTenantAdmin, adminController.deleteUser);

// Import d'appels (seulement global_admin)
router.post('/import-calls', requireGlobalAdmin, upload.single('file'), adminController.importCalls);

// Statistiques globales (seulement global_admin)
router.get('/statistics', requireGlobalAdmin, adminController.getGlobalStatistics);

// Forcer l'archivage manuel (tenant_admin peut forcer pour son tenant)
router.post('/force-archive', requireTenantAdmin, adminController.forceArchive);

// Dashboard stats (tenant_admin peut voir ses stats)
router.get('/stats', requireTenantAdmin, adminController.getStats);

// CLI SQL (tenant_admin uniquement - requêtes filtrées par tenant)
router.post('/execute-sql', requireTenantAdmin, adminController.executeSQL);

module.exports = router;
