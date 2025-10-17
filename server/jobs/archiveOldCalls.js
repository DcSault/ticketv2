const pool = require('../config/database');

/**
 * Archiver automatiquement les appels de plus de 24 heures
 */
async function archiveOldCalls() {
  try {
    const result = await pool.query(`
      UPDATE calls 
      SET 
        is_archived = true,
        archived_at = NOW(),
        archived_by = NULL
      WHERE 
        is_archived = false 
        AND created_at < NOW() - INTERVAL '24 hours'
      RETURNING id
    `);

    const count = result.rowCount;
    if (count > 0) {
      console.log(`✅ ${count} appels archivés automatiquement (> 24h)`);
    }
    
    return count;
  } catch (error) {
    console.error('❌ Erreur lors de l\'archivage automatique:', error);
    throw error;
  }
}

/**
 * Démarrer le job d'archivage automatique
 * S'exécute toutes les heures
 */
function startArchiveJob() {
  // Exécuter immédiatement au démarrage
  archiveOldCalls().catch(console.error);

  // Puis toutes les heures
  setInterval(() => {
    archiveOldCalls().catch(console.error);
  }, 60 * 60 * 1000); // 1 heure

  console.log('🕐 Job d\'archivage automatique démarré (toutes les heures)');
}

module.exports = {
  archiveOldCalls,
  startArchiveJob
};
