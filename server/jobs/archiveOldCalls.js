const pool = require('../config/database');

/**
 * Archiver automatiquement les appels du jour précédent (avant aujourd'hui)
 */
async function archiveOldCalls() {
  try {
    // Méthode simplifiée : archive tout ce qui a plus de 24h
    // Évite les problèmes de timezone
    const result = await pool.query(`
      UPDATE calls 
      SET 
        is_archived = true,
        archived_at = NOW(),
        archived_by = NULL
      WHERE 
        is_archived = false 
        AND created_at < (NOW() - INTERVAL '24 hours')
      RETURNING id, caller_name, created_at
    `);

    const count = result.rowCount;
    if (count > 0) {
      console.log(`✅ ${count} appels archivés automatiquement (plus de 24h)`);
      // Log quelques exemples
      if (result.rows.length > 0) {
        console.log('  Exemples:', result.rows.slice(0, 3).map(r => 
          `${r.caller_name} (${new Date(r.created_at).toLocaleString('fr-FR')})`
        ).join(', '));
      }
    } else {
      console.log('ℹ️  Aucun appel à archiver (tous récents ou déjà archivés)');
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
