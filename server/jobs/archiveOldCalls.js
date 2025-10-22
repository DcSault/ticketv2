const pool = require('../config/database');

/**
 * Archiver automatiquement les appels du jour précédent (avant aujourd'hui)
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
        AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') < DATE(NOW() AT TIME ZONE 'Europe/Paris')
      RETURNING id
    `);

    const count = result.rowCount;
    if (count > 0) {
      console.log(`✅ ${count} appels archivés automatiquement (jours précédents)`);
    }
    
    return count;
  } catch (error) {
    console.error('❌ Erreur lors de l\'archivage automatique:', error);
    throw error;
  }
}

/**
 * Démarrer le job d'archivage automatique
 * S'exécute toutes les 30 minutes
 */
function startArchiveJob() {
  // Exécuter immédiatement au démarrage
  archiveOldCalls().catch(console.error);

  // Puis toutes les 30 minutes
  setInterval(() => {
    archiveOldCalls().catch(console.error);
  }, 30 * 60 * 1000); // 30 minutes

  console.log('🕐 Job d\'archivage automatique démarré (toutes les 30 minutes)');
}

module.exports = {
  archiveOldCalls,
  startArchiveJob
};
