const pool = require('../config/database');

// Obtenir tous les appelants avec leur usage
exports.getCallers = async (req, res) => {
  const tenantId = req.user.role === 'global_admin' ? req.query.tenantId : req.user.tenantId;

  try {
    const result = await pool.query(
      `SELECT 
        c.id,
        c.name,
        COUNT(calls.id) as usage_count
       FROM callers c
       LEFT JOIN calls ON calls.caller_id = c.id
       WHERE c.tenant_id = $1
       GROUP BY c.id, c.name
       ORDER BY c.name ASC`,
      [tenantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get callers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Obtenir toutes les raisons avec leur usage
exports.getReasons = async (req, res) => {
  const tenantId = req.user.role === 'global_admin' ? req.query.tenantId : req.user.tenantId;

  try {
    const result = await pool.query(
      `SELECT 
        r.id,
        r.name,
        COUNT(calls.id) as usage_count
       FROM reasons r
       LEFT JOIN calls ON calls.reason_id = r.id
       WHERE r.tenant_id = $1
       GROUP BY r.id, r.name
       ORDER BY r.name ASC`,
      [tenantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get reasons error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Obtenir tous les tags avec leur usage
exports.getTags = async (req, res) => {
  const tenantId = req.user.role === 'global_admin' ? req.query.tenantId : req.user.tenantId;

  try {
    const result = await pool.query(
      `SELECT 
        t.id,
        t.name,
        COUNT(ct.call_id) as usage_count
       FROM tags t
       LEFT JOIN call_tags ct ON ct.tag_id = t.id
       LEFT JOIN calls c ON ct.call_id = c.id
       WHERE t.tenant_id = $1
       GROUP BY t.id, t.name
       ORDER BY t.name ASC`,
      [tenantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Modifier un appelant
exports.updateCaller = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const tenantId = req.user.role === 'global_admin' ? req.query.tenantId : req.user.tenantId;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Le nom est requis' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Vérifier que l'appelant appartient au tenant
    const checkResult = await client.query(
      'SELECT id FROM callers WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('Appelant non trouvé');
    }

    // Vérifier si le nouveau nom existe déjà
    const existingResult = await client.query(
      'SELECT id FROM callers WHERE name = $1 AND tenant_id = $2 AND id != $3',
      [name.trim(), tenantId, id]
    );

    if (existingResult.rows.length > 0) {
      throw new Error('Ce nom existe déjà');
    }

    // Mettre à jour l'appelant
    await client.query(
      'UPDATE callers SET name = $1 WHERE id = $2 AND tenant_id = $3',
      [name.trim(), id, tenantId]
    );

    // Mettre à jour le nom dénormalisé dans les appels
    await client.query(
      'UPDATE calls SET caller_name = $1 WHERE caller_id = $2 AND tenant_id = $3',
      [name.trim(), id, tenantId]
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update caller error:', error);
    res.status(400).json({ error: error.message || 'Erreur lors de la mise à jour' });
  } finally {
    client.release();
  }
};

// Modifier une raison
exports.updateReason = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const tenantId = req.user.role === 'global_admin' ? req.query.tenantId : req.user.tenantId;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Le nom est requis' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Vérifier que la raison appartient au tenant
    const checkResult = await client.query(
      'SELECT id FROM reasons WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('Raison non trouvée');
    }

    // Vérifier si le nouveau nom existe déjà
    const existingResult = await client.query(
      'SELECT id FROM reasons WHERE name = $1 AND tenant_id = $2 AND id != $3',
      [name.trim(), tenantId, id]
    );

    if (existingResult.rows.length > 0) {
      throw new Error('Ce nom existe déjà');
    }

    // Mettre à jour la raison
    await client.query(
      'UPDATE reasons SET name = $1 WHERE id = $2 AND tenant_id = $3',
      [name.trim(), id, tenantId]
    );

    // Mettre à jour le nom dénormalisé dans les appels
    await client.query(
      'UPDATE calls SET reason_name = $1 WHERE reason_id = $2 AND tenant_id = $3',
      [name.trim(), id, tenantId]
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update reason error:', error);
    res.status(400).json({ error: error.message || 'Erreur lors de la mise à jour' });
  } finally {
    client.release();
  }
};

// Modifier un tag
exports.updateTag = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const tenantId = req.user.role === 'global_admin' ? req.query.tenantId : req.user.tenantId;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Le nom est requis' });
  }

  try {
    // Vérifier que le tag appartient au tenant
    const checkResult = await pool.query(
      'SELECT id FROM tags WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tag non trouvé' });
    }

    // Vérifier si le nouveau nom existe déjà
    const existingResult = await pool.query(
      'SELECT id FROM tags WHERE name = $1 AND tenant_id = $2 AND id != $3',
      [name.trim(), tenantId, id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Ce nom existe déjà' });
    }

    // Mettre à jour le tag
    await pool.query(
      'UPDATE tags SET name = $1 WHERE id = $2 AND tenant_id = $3',
      [name.trim(), id, tenantId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};

// Supprimer un appelant
exports.deleteCaller = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.role === 'global_admin' ? req.query.tenantId : req.user.tenantId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Vérifier que l'appelant appartient au tenant
    const checkResult = await client.query(
      'SELECT id FROM callers WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('Appelant non trouvé');
    }

    // Mettre à jour les appels pour supprimer la référence
    await client.query(
      'UPDATE calls SET caller_id = NULL WHERE caller_id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    // Supprimer l'appelant
    await client.query(
      'DELETE FROM callers WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete caller error:', error);
    res.status(400).json({ error: error.message || 'Erreur lors de la suppression' });
  } finally {
    client.release();
  }
};

// Supprimer une raison
exports.deleteReason = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.role === 'global_admin' ? req.query.tenantId : req.user.tenantId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Vérifier que la raison appartient au tenant
    const checkResult = await client.query(
      'SELECT id FROM reasons WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('Raison non trouvée');
    }

    // Mettre à jour les appels pour supprimer la référence
    await client.query(
      'UPDATE calls SET reason_id = NULL WHERE reason_id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    // Supprimer la raison
    await client.query(
      'DELETE FROM reasons WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete reason error:', error);
    res.status(400).json({ error: error.message || 'Erreur lors de la suppression' });
  } finally {
    client.release();
  }
};

// Supprimer un tag
exports.deleteTag = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.role === 'global_admin' ? req.query.tenantId : req.user.tenantId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Vérifier que le tag appartient au tenant
    const checkResult = await client.query(
      'SELECT id FROM tags WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('Tag non trouvé');
    }

    // Supprimer les associations dans call_tags
    await client.query(
      `DELETE FROM call_tags 
       WHERE tag_id = $1 
       AND call_id IN (SELECT id FROM calls WHERE tenant_id = $2)`,
      [id, tenantId]
    );

    // Supprimer le tag
    await client.query(
      'DELETE FROM tags WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete tag error:', error);
    res.status(400).json({ error: error.message || 'Erreur lors de la suppression' });
  } finally {
    client.release();
  }
};
