const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminController = require('../controllers/adminController');
const { authenticateToken, requireGlobalAdmin } = require('../middleware/auth');

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

// Import d'appels
router.post('/import-calls', upload.single('file'), adminController.importCalls);

// Statistiques globales
router.get('/statistics', adminController.getGlobalStatistics);

module.exports = router;
