const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authenticateToken, ensureTenantAccess } = require('../middleware/auth');

router.use(authenticateToken);
router.use(ensureTenantAccess);

router.get('/', statisticsController.getStatistics);
router.get('/export', statisticsController.exportData);

module.exports = router;
