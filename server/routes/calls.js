const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const { authenticateToken, ensureTenantAccess } = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification
router.use(authenticateToken);
router.use(ensureTenantAccess);

router.get('/', callController.getCalls);
router.post('/', callController.createCall);
router.put('/:id', callController.updateCall);
router.delete('/:id', callController.deleteCall);
router.get('/suggestions/:type', callController.getSuggestions);

module.exports = router;
