const pool = require('../config/database');

// Obtenir tous les appels du tenant
exports.getCalls = async (req, res) => {
  const { startDate, endDate, limit = 100, offset = 0, archived } = req.query;
  const tenantId = req.user.role === 'global_admin' ? req.query.tenantId : req.user.tenantId;

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
        mu.full_name as modified_by_name
      FROM calls c
      LEFT JOIN call_tags ct ON c.id = ct.call_id
      LEFT JOIN tags t ON ct.tag_id = t.id
      LEFT JOIN users cu ON c.created_by = cu.id
      LEFT JOIN users mu ON c.last_modified_by = mu.id
      WHERE 1=1
    `;

    // Filtre selon le paramètre archived
    if (archived === 'true') {
      // Archives : tous les appels AVANT aujourd'hui
      query += ' AND DATE(c.created_at) < CURRENT_DATE';
    } else {
      // Application : uniquement les appels d'AUJOURD'HUI
      query += ' AND DATE(c.created_at) = CURRENT_DATE';
    }

    const params = [];
    let paramCount = 1;

    if (tenantId) {
      query += ` AND c.tenant_id = $${paramCount}`;
      params.push(tenantId);
      paramCount++;
    }

    if (startDate) {
      query += ` AND c.created_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND c.created_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ` GROUP BY c.id, cu.username, cu.full_name, mu.username, mu.full_name`;
    query += ` ORDER BY c.created_at DESC`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get calls error:', error);
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

    // Créer ou récupérer l'appelant
    let callerResult = await client.query(
      'SELECT id FROM callers WHERE name = $1 AND tenant_id = $2',
      [caller, tenantId]
    );

    let callerId;
    if (callerResult.rows.length === 0) {
      const newCaller = await client.query(
        'INSERT INTO callers (name, tenant_id) VALUES ($1, $2) RETURNING id',
        [caller, tenantId]
      );
      callerId = newCaller.rows[0].id;
    } else {
      callerId = callerResult.rows[0].id;
    }

    // Créer ou récupérer la raison (si pas GLPI)
    let reasonId = null;
    if (!isGlpi && reason) {
      let reasonResult = await client.query(
        'SELECT id FROM reasons WHERE name = $1 AND tenant_id = $2',
        [reason, tenantId]
      );

      if (reasonResult.rows.length === 0) {
        const newReason = await client.query(
          'INSERT INTO reasons (name, tenant_id) VALUES ($1, $2) RETURNING id',
          [reason, tenantId]
        );
        reasonId = newReason.rows[0].id;
      } else {
        reasonId = reasonResult.rows[0].id;
      }
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

    // Gérer les tags
    const tagIds = [];
    if (!isGlpi && tags.length > 0) {
      for (const tagName of tags) {
        let tagResult = await client.query(
          'SELECT id FROM tags WHERE name = $1 AND tenant_id = $2',
          [tagName, tenantId]
        );

        let tagId;
        if (tagResult.rows.length === 0) {
          const newTag = await client.query(
            'INSERT INTO tags (name, tenant_id) VALUES ($1, $2) RETURNING id',
            [tagName, tenantId]
          );
          tagId = newTag.rows[0].id;
        } else {
          tagId = tagResult.rows[0].id;
        }

        tagIds.push(tagId);

        // Lier le tag à l'appel
        await client.query(
          'INSERT INTO call_tags (call_id, tag_id) VALUES ($1, $2)',
          [callId, tagId]
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
    console.error('Create call error:', error);
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
    
    // Si ce n'est pas un admin global, vérifier le tenant
    if (!isGlobalAdmin) {
      checkQuery += ' AND tenant_id = $2';
      checkParams.push(req.user.tenantId);
    }

    const checkCall = await client.query(checkQuery, checkParams);

    if (checkCall.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Call not found' });
    }

    // Utiliser le tenant_id de l'appel pour les opérations suivantes
    const tenantId = checkCall.rows[0].tenant_id;

    // Mettre à jour l'appelant si nécessaire
    let callerId = null;
    if (caller) {
      let callerResult = await client.query(
        'SELECT id FROM callers WHERE name = $1 AND tenant_id = $2',
        [caller, tenantId]
      );

      if (callerResult.rows.length === 0) {
        const newCaller = await client.query(
          'INSERT INTO callers (name, tenant_id) VALUES ($1, $2) RETURNING id',
          [caller, tenantId]
        );
        callerId = newCaller.rows[0].id;
      } else {
        callerId = callerResult.rows[0].id;
      }
    }

    // Mettre à jour la raison si nécessaire
    let reasonId = null;
    if (reason && !isGlpi) {
      let reasonResult = await client.query(
        'SELECT id FROM reasons WHERE name = $1 AND tenant_id = $2',
        [reason, tenantId]
      );

      if (reasonResult.rows.length === 0) {
        const newReason = await client.query(
          'INSERT INTO reasons (name, tenant_id) VALUES ($1, $2) RETURNING id',
          [reason, tenantId]
        );
        reasonId = newReason.rows[0].id;
      } else {
        reasonId = reasonResult.rows[0].id;
      }
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

    const result = await client.query(updateQuery, [
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
    if (tags !== undefined && !isGlpi) {
      // Supprimer les anciens tags
      await client.query('DELETE FROM call_tags WHERE call_id = $1', [id]);

      // Ajouter les nouveaux tags
      for (const tagName of tags) {
        let tagResult = await client.query(
          'SELECT id FROM tags WHERE name = $1 AND tenant_id = $2',
          [tagName, tenantId]
        );

        let tagId;
        if (tagResult.rows.length === 0) {
          const newTag = await client.query(
            'INSERT INTO tags (name, tenant_id) VALUES ($1, $2) RETURNING id',
            [tagName, tenantId]
          );
          tagId = newTag.rows[0].id;
        } else {
          tagId = tagResult.rows[0].id;
        }

        await client.query(
          'INSERT INTO call_tags (call_id, tag_id) VALUES ($1, $2)',
          [id, tagId]
        );
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
    console.error('Update call error:', error);
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
    console.error('Delete call error:', error);
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
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
