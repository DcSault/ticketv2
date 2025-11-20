const pool = require('../config/database');
const logger = require('../utils/logger');

// Obtenir tous les appels du tenant
exports.getCalls = async (req, res) => {
  const { startDate, endDate, limit = 100, offset = 0, archived } = req.query;
  // Viewer multi-tenant peut choisir, viewer avec tenant_id ne peut voir que son tenant
  const tenantId = (req.user.role === 'global_admin' || (req.user.role === 'viewer' && !req.user.tenantId)) 
    ? req.query.tenantId 
    : req.user.tenantId;

  try {
    let query = `
      SELECT 
        c.*,
        json_agg(
          json_build_object('id', t.id, 'name', t.name)
        ) FILTER (WHERE t.id IS NOT NULL AND t.tenant_id = c.tenant_id) as tags,
        cu.username as created_by_username,
        cu.full_name as created_by_name,
        mu.username as modified_by_username,
        mu.full_name as modified_by_name,
        au.username as archived_by_username,
        au.full_name as archived_by_name
      FROM calls c
      LEFT JOIN call_tags ct ON c.id = ct.call_id
      LEFT JOIN tags t ON ct.tag_id = t.id
      LEFT JOIN users cu ON c.created_by = cu.id
      LEFT JOIN users mu ON c.last_modified_by = mu.id
      LEFT JOIN users au ON c.archived_by = au.id
      WHERE 1=1
    `;

    const params = [];

    if (tenantId) {
      params.push(tenantId);
      query += ` AND c.tenant_id = $${params.length}`;
    }

    // Filtre selon le statut d'archivage
    if (archived === 'true') {
      query += ' AND c.is_archived = true';
    } else if (archived === 'false') {
      query += ' AND c.is_archived = false';
    }

    // Filtre de dates personnalisées
    if (startDate) {
      params.push(startDate);
      query += ` AND c.created_at >= $${params.length}::timestamp`;
    }
    
    if (endDate) {
      params.push(endDate);
      // Si c'est une date simple (YYYY-MM-DD), on ajoute 1 jour pour inclure la journée
      if (endDate.length === 10) {
         query += ` AND c.created_at < ($${params.length}::date + INTERVAL '1 day')`;
      } else {
         query += ` AND c.created_at <= $${params.length}::timestamp`;
      }
    }

    query += ` GROUP BY c.id, cu.username, cu.full_name, mu.username, mu.full_name, au.username, au.full_name`;
    query += ` ORDER BY c.created_at DESC`;
    
    // Gestion de la limite
    if (limit === 'all') {
      query += ` LIMIT 5000`; // Protection mémoire
    } else {
      params.push(limit, offset);
      query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get calls error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Créer un appel
exports.createCall = async (req, res) => {
  const {
    caller,
    reason,
    tags = [],
    isGlpi = false,
    glpiNumber = null,
    isBlocking = false
  } = req.body;

  const tenantId = req.user.tenantId;
  const userId = req.user.id;

  if (!caller) {
    return res.status(400).json({ error: 'Caller is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Créer ou récupérer l'appelant (Upsert)
    const callerResult = await client.query(
      `INSERT INTO callers (name, tenant_id) VALUES ($1, $2) 
       ON CONFLICT (name, tenant_id) DO UPDATE SET name = EXCLUDED.name 
       RETURNING id`,
      [caller, tenantId]
    );
    const callerId = callerResult.rows[0].id;

    // Créer ou récupérer la raison (si pas GLPI)
    let reasonId = null;
    if (!isGlpi && reason) {
      const reasonResult = await client.query(
        `INSERT INTO reasons (name, tenant_id) VALUES ($1, $2) 
         ON CONFLICT (name, tenant_id) DO UPDATE SET name = EXCLUDED.name 
         RETURNING id`,
        [reason, tenantId]
      );
      reasonId = reasonResult.rows[0].id;
    }

    // Créer l'appel
    const callResult = await client.query(
      `INSERT INTO calls 
        (caller_id, caller_name, reason_id, reason_name, is_glpi, glpi_number, 
         is_blocking, tenant_id, created_by, last_modified_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
       RETURNING *`,
      [callerId, caller, reasonId, reason, isGlpi, glpiNumber, isBlocking, tenantId, userId]
    );

    const callId = callResult.rows[0].id;

    // Gérer les tags (Batch)
    if (!isGlpi && Array.isArray(tags) && tags.length > 0) {
      const uniqueTags = [...new Set(tags)];
      
      // Insérer les nouveaux tags
      await client.query(`
        INSERT INTO tags (name, tenant_id)
        SELECT t, $1 FROM unnest($2::text[]) t
        ON CONFLICT (name, tenant_id) DO NOTHING
      `, [tenantId, uniqueTags]);
      
      // Récupérer les IDs
      const tagsResult = await client.query(`
        SELECT id FROM tags WHERE tenant_id = $1 AND name = ANY($2::text[])
      `, [tenantId, uniqueTags]);
      
      const tagIds = tagsResult.rows.map(r => r.id);
      
      // Lier les tags à l'appel
      if (tagIds.length > 0) {
        const values = tagIds.map((_, i) => `($1, $${i + 2})`).join(',');
        await client.query(
          `INSERT INTO call_tags (call_id, tag_id) VALUES ${values} ON CONFLICT DO NOTHING`,
          [callId, ...tagIds]
        );
      }
    }

    await client.query('COMMIT');

    // Récupérer l'appel complet avec les tags
    const fullCall = await pool.query(
      `SELECT 
        c.*,
        json_agg(
          json_build_object('id', t.id, 'name', t.name)
        ) FILTER (WHERE t.id IS NOT NULL AND t.tenant_id = c.tenant_id) as tags
       FROM calls c
       LEFT JOIN call_tags ct ON c.id = ct.call_id
       LEFT JOIN tags t ON ct.tag_id = t.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [callId]
    );

    res.status(201).json(fullCall.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Create call error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// Mettre à jour un appel
exports.updateCall = async (req, res) => {
  const { id } = req.params;
  const {
    caller,
    reason,
    tags = [],
    isGlpi,
    glpiNumber,
    isBlocking,
    createdAt
  } = req.body;

  const userId = req.user.id;
  const isGlobalAdmin = req.user.role === 'global_admin';

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Récupérer l'appel et son tenant_id
    let checkQuery = 'SELECT id, tenant_id FROM calls WHERE id = $1';
    const checkParams = [id];
    
    if (!isGlobalAdmin) {
      checkQuery += ' AND tenant_id = $2';
      checkParams.push(req.user.tenantId);
    }

    const checkCall = await client.query(checkQuery, checkParams);

    if (checkCall.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Call not found' });
    }

    const tenantId = checkCall.rows[0].tenant_id;

    // Mettre à jour l'appelant
    let callerId = null;
    if (caller) {
      const callerResult = await client.query(
        `INSERT INTO callers (name, tenant_id) VALUES ($1, $2) 
         ON CONFLICT (name, tenant_id) DO UPDATE SET name = EXCLUDED.name 
         RETURNING id`,
        [caller, tenantId]
      );
      callerId = callerResult.rows[0].id;
    }

    // Mettre à jour la raison
    let reasonId = null;
    if (reason && !isGlpi) {
      const reasonResult = await client.query(
        `INSERT INTO reasons (name, tenant_id) VALUES ($1, $2) 
         ON CONFLICT (name, tenant_id) DO UPDATE SET name = EXCLUDED.name 
         RETURNING id`,
        [reason, tenantId]
      );
      reasonId = reasonResult.rows[0].id;
    }

    // Mettre à jour l'appel
    const updateQuery = `
      UPDATE calls SET
        caller_id = COALESCE($1, caller_id),
        caller_name = COALESCE($2, caller_name),
        reason_id = $3,
        reason_name = $4,
        is_glpi = COALESCE($5, is_glpi),
        glpi_number = $6,
        is_blocking = COALESCE($7, is_blocking),
        created_at = COALESCE($8, created_at),
        last_modified_by = $9,
        last_modified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 AND tenant_id = $11
      RETURNING *
    `;

    await client.query(updateQuery, [
      callerId,
      caller,
      reasonId,
      reason,
      isGlpi,
      glpiNumber,
      isBlocking,
      createdAt,
      userId,
      id,
      tenantId
    ]);

    // Mettre à jour les tags
    if (tags !== undefined && !isGlpi && Array.isArray(tags)) {
      // Supprimer les anciens tags
      await client.query('DELETE FROM call_tags WHERE call_id = $1', [id]);

      if (tags.length > 0) {
        const uniqueTags = [...new Set(tags)];
        
        // Insérer les nouveaux tags
        await client.query(`
          INSERT INTO tags (name, tenant_id)
          SELECT t, $1 FROM unnest($2::text[]) t
          ON CONFLICT (name, tenant_id) DO NOTHING
        `, [tenantId, uniqueTags]);
        
        // Récupérer les IDs
        const tagsResult = await client.query(`
          SELECT id FROM tags WHERE tenant_id = $1 AND name = ANY($2::text[])
        `, [tenantId, uniqueTags]);
        
        const tagIds = tagsResult.rows.map(r => r.id);
        
        // Lier les tags
        if (tagIds.length > 0) {
          const values = tagIds.map((_, i) => `($1, $${i + 2})`).join(',');
          await client.query(
            `INSERT INTO call_tags (call_id, tag_id) VALUES ${values} ON CONFLICT DO NOTHING`,
            [id, ...tagIds]
          );
        }
      }
    }

    await client.query('COMMIT');

    // Récupérer l'appel complet
    const fullCall = await pool.query(
      `SELECT 
        c.*,
        json_agg(
          json_build_object('id', t.id, 'name', t.name)
        ) FILTER (WHERE t.id IS NOT NULL AND t.tenant_id = c.tenant_id) as tags
       FROM calls c
       LEFT JOIN call_tags ct ON c.id = ct.call_id
       LEFT JOIN tags t ON ct.tag_id = t.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );

    res.json(fullCall.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Update call error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// Supprimer un appel
exports.deleteCall = async (req, res) => {
  const { id } = req.params;
  const isGlobalAdmin = req.user.role === 'global_admin';

  try {
    let query = 'DELETE FROM calls WHERE id = $1';
    const params = [id];

    // Si ce n'est pas un admin global, vérifier le tenant
    if (!isGlobalAdmin) {
      query += ' AND tenant_id = $2';
      params.push(req.user.tenantId);
    }

    query += ' RETURNING id';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json({ message: 'Call deleted successfully' });
  } catch (error) {
    logger.error('Delete call error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Archiver un appel
exports.archiveCall = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const isGlobalAdmin = req.user.role === 'global_admin';

  try {
    let query = 'UPDATE calls SET is_archived = true, archived_at = CURRENT_TIMESTAMP, archived_by = $1 WHERE id = $2';
    const params = [userId, id];

    if (!isGlobalAdmin) {
      query += ' AND tenant_id = $3';
      params.push(req.user.tenantId);
    }

    query += ' RETURNING *';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json({ message: 'Call archived successfully', call: result.rows[0] });
  } catch (error) {
    logger.error('Archive call error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Désarchiver un appel
exports.unarchiveCall = async (req, res) => {
  const { id } = req.params;
  const isGlobalAdmin = req.user.role === 'global_admin';

  try {
    let query = 'UPDATE calls SET is_archived = false, archived_at = NULL, archived_by = NULL WHERE id = $1';
    const params = [id];

    if (!isGlobalAdmin) {
      query += ' AND tenant_id = $2';
      params.push(req.user.tenantId);
    }

    query += ' RETURNING *';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json({ message: 'Call unarchived successfully', call: result.rows[0] });
  } catch (error) {
    logger.error('Unarchive call error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Obtenir les suggestions (appelants, raisons, tags)
exports.getSuggestions = async (req, res) => {
  const { type } = req.params;
  const tenantId = req.user.tenantId;

  try {
    let query;
    let tableName;

    switch (type) {
      case 'callers':
        tableName = 'callers';
        break;
      case 'reasons':
        tableName = 'reasons';
        break;
      case 'tags':
        tableName = 'tags';
        break;
      default:
        return res.status(400).json({ error: 'Invalid type' });
    }

    query = `SELECT DISTINCT name FROM ${tableName} WHERE tenant_id = $1 ORDER BY name`;
    const result = await pool.query(query, [tenantId]);

    res.json(result.rows.map(row => row.name));
  } catch (error) {
    logger.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Obtenir les suggestions rapides (triées par fréquence d'utilisation)
exports.getQuickSuggestions = async (req, res) => {
  const tenantId = req.user.tenantId;

  try {
    // Top 5 appelants les plus fréquents des 30 derniers jours
    const callersResult = await pool.query(
      `SELECT caller_name as name, COUNT(*) as count
       FROM calls
       WHERE tenant_id = $1 
       AND caller_name IS NOT NULL
       AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY caller_name
       ORDER BY count DESC
       LIMIT 5`,
      [tenantId]
    );

    // Top 5 raisons les plus fréquentes des 30 derniers jours (hors GLPI)
    const reasonsResult = await pool.query(
      `SELECT reason_name as name, COUNT(*) as count
       FROM calls
       WHERE tenant_id = $1 
       AND reason_name IS NOT NULL
       AND is_glpi = false
       AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY reason_name
       ORDER BY count DESC
       LIMIT 5`,
      [tenantId]
    );

    // Top 10 tags les plus fréquents des 30 derniers jours
    const tagsResult = await pool.query(
      `SELECT t.name, COUNT(*) as count
       FROM call_tags ct
       JOIN tags t ON ct.tag_id = t.id
       JOIN calls c ON ct.call_id = c.id
       WHERE c.tenant_id = $1
       AND c.created_at >= NOW() - INTERVAL '30 days'
       GROUP BY t.name
       ORDER BY count DESC
       LIMIT 10`,
      [tenantId]
    );

    res.json({
      callers: callersResult.rows.map(row => ({ name: row.name, count: parseInt(row.count) })),
      reasons: reasonsResult.rows.map(row => ({ name: row.name, count: parseInt(row.count) })),
      tags: tagsResult.rows.map(row => ({ name: row.name, count: parseInt(row.count) }))
    });
  } catch (error) {
    logger.error('Get quick suggestions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};;
