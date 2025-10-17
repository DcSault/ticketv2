const jwt = require('jsonwebtoken');

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware pour vérifier le rôle global admin
const requireGlobalAdmin = (req, res, next) => {
  if (req.user.role !== 'global_admin') {
    return res.status(403).json({ error: 'Global admin access required' });
  }
  next();
};

// Middleware pour vérifier le rôle tenant admin ou global admin
const requireTenantAdmin = (req, res, next) => {
  if (req.user.role !== 'tenant_admin' && req.user.role !== 'global_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware pour s'assurer que l'utilisateur accède uniquement à ses données tenant
const ensureTenantAccess = (req, res, next) => {
  // Les admins globaux peuvent accéder à tout
  if (req.user.role === 'global_admin') {
    return next();
  }

  // Les autres utilisateurs ne peuvent accéder qu'à leur tenant
  if (!req.user.tenantId) {
    return res.status(403).json({ error: 'No tenant assigned' });
  }

  // Stocker le tenant ID pour les requêtes ultérieures
  req.tenantId = req.user.tenantId;
  next();
};

module.exports = {
  authenticateToken,
  requireGlobalAdmin,
  requireTenantAdmin,
  ensureTenantAccess
};
