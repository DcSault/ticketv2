const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const callRoutes = require('./routes/calls');
const statisticsRoutes = require('./routes/statistics');
const adminRoutes = require('./routes/admin');
const dataManagementRoutes = require('./routes/dataManagement');
const { startArchiveJob } = require('./jobs/archiveOldCalls');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route de test (AVANT les autres routes)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/data-management', dataManagementRoutes);

// Servir le frontend en production
if (process.env.NODE_ENV === 'production') {
  const fs = require('fs');
  const distPath = path.join(__dirname, '../client/dist');
  
  // Vérifier si le dossier dist existe
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.warn('⚠️  Frontend build not found. Please run: cd client && npm run build');
    // Retourner une erreur 503 (Service Unavailable) au lieu de 200
    app.get('*', (req, res) => {
      res.status(503).json({ 
        error: 'Frontend not built', 
        message: 'The frontend application is not available. Please build the frontend or access the API directly.',
        api: '/api/health'
      });
    });
  }
}

// Gestion des erreurs 404 pour les routes API uniquement
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const logger = require('./utils/logger');

// ...

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Démarrer le serveur
const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
  
  // Démarrer le job d'archivage automatique
  startArchiveJob();
});

module.exports = app;
