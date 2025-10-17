const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const { authenticateToken, ensureTenantAccess, blockViewerModifications } = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification
router.use(authenticateToken);
router.use(ensureTenantAccess);

// Routes de lecture (accessibles aux viewers)
router.get('/', callController.getCalls);
router.get('/suggestions/:type', callController.getSuggestions);

// Routes de modification (bloquées pour les viewers)
router.post('/', blockViewerModifications, callController.createCall);
router.put('/:id', blockViewerModifications, callController.updateCall);
router.delete('/:id', blockViewerModifications, callController.deleteCall);
router.post('/:id/archive', blockViewerModifications, callController.archiveCall);
router.post('/:id/unarchive', blockViewerModifications, callController.unarchiveCall);

module.exports = router;
