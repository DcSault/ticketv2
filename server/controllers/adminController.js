const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Obtenir tous les tenants
exports.getTenants = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.*,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT c.id) as call_count
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      LEFT JOIN calls c ON t.id = c.tenant_id
      GROUP BY t.id
      ORDER BY t.name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Créer un tenant
exports.createTenant = async (req, res) => {
  const { name, displayName } = req.body;

  if (!name || !displayName) {
    return res.status(400).json({ error: 'Name and display name are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tenants (name, display_name) VALUES ($1, $2) RETURNING *',
      [name.toLowerCase(), displayName]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Tenant already exists' });
    }
    console.error('Create tenant error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Mettre à jour un tenant
exports.updateTenant = async (req, res) => {
  const { id } = req.params;
  const { displayName } = req.body;

  try {
    const result = await pool.query(
      'UPDATE tenants SET display_name = $1 WHERE id = $2 RETURNING *',
      [displayName, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Supprimer un tenant
exports.deleteTenant = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM tenants WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Obtenir tous les utilisateurs
exports.getUsers = async (req, res) => {
  const { tenantId } = req.query;

  try {
    let query = `
      SELECT 
        u.id,
        u.username,
        u.full_name,
        u.role,
        u.tenant_id,
        t.name as tenant_name,
        t.display_name as tenant_display_name,
        u.created_at
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
    `;

    const params = [];
    if (tenantId) {
      query += ' WHERE u.tenant_id = $1';
      params.push(tenantId);
    }

    query += ' ORDER BY u.username';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Créer un utilisateur
exports.createUser = async (req, res) => {
  const { username, password, fullName, role, tenantId } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (!['user', 'tenant_admin', 'global_admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password, full_name, role, tenant_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, full_name, role, tenant_id, created_at`,
      [username, hashedPassword, fullName, role, tenantId || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { fullName, role, tenantId, password } = req.body;

  try {
    let query = 'UPDATE users SET';
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (fullName !== undefined) {
      updates.push(`full_name = $${paramCount}`);
      params.push(fullName);
      paramCount++;
    }

    if (role !== undefined) {
      if (!['user', 'tenant_admin', 'global_admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      updates.push(`role = $${paramCount}`);
      params.push(role);
      paramCount++;
    }

    if (tenantId !== undefined) {
      updates.push(`tenant_id = $${paramCount}`);
      params.push(tenantId || null);
      paramCount++;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramCount}`);
      params.push(hashedPassword);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    query += ' ' + updates.join(', ');
    query += ` WHERE id = $${paramCount} RETURNING id, username, full_name, role, tenant_id, created_at`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  // Empêcher la suppression de l'admin par défaut
  if (parseInt(id) === 1) {
    return res.status(403).json({ error: 'Cannot delete default admin user' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Obtenir les statistiques globales
exports.getGlobalStatistics = async (req, res) => {
  try {
    // Total d'appels par tenant
    const callsByTenant = await pool.query(`
      SELECT 
        t.name,
        t.display_name,
        COUNT(c.id) as call_count
      FROM tenants t
      LEFT JOIN calls c ON t.id = c.tenant_id
      GROUP BY t.id, t.name, t.display_name
      ORDER BY call_count DESC
    `);

    // Total général
    const totalCalls = await pool.query('SELECT COUNT(*) as total FROM calls WHERE is_archived = false');
    const totalUsers = await pool.query('SELECT COUNT(*) as total FROM users');
    const totalTenants = await pool.query('SELECT COUNT(*) as total FROM tenants');

    // Appels récents tous tenants
    const recentCalls = await pool.query(`
      SELECT 
        c.*,
        t.display_name as tenant_display_name,
        u.username as created_by_username
      FROM calls c
      JOIN tenants t ON c.tenant_id = t.id
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.is_archived = false
      ORDER BY c.created_at DESC
      LIMIT 20
    `);

    res.json({
      summary: {
        totalCalls: parseInt(totalCalls.rows[0].total),
        totalUsers: parseInt(totalUsers.rows[0].total),
        totalTenants: parseInt(totalTenants.rows[0].total)
      },
      callsByTenant: callsByTenant.rows,
      recentCalls: recentCalls.rows
    });
  } catch (error) {
    console.error('Get global statistics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Importer des appels depuis un fichier JSON
exports.importCalls = async (req, res) => {
  const { tenantId } = req.body;
  const userId = req.user.id;

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'JSON file is required' });
  }

  try {
    // Vérifier que le tenant existe
    const tenantCheck = await pool.query('SELECT id FROM tenants WHERE id = $1', [tenantId]);
    if (tenantCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Lire et parser le fichier JSON
    const fileContent = req.file.buffer.toString('utf-8');
    const calls = JSON.parse(fileContent);

    if (!Array.isArray(calls)) {
      return res.status(400).json({ error: 'JSON must contain an array of calls' });
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];

    // Importer chaque appel
    for (const call of calls) {
      try {
        const {
          caller,
          reason,
          tags = [],
          isBlocking = false,
          isGLPI = false,
          glpiNumber = '',
          createdAt
        } = call;

        if (!caller) {
          errors.push(`Appel ignoré : caller manquant`);
          skipped++;
          continue;
        }

        // Créer l'appel
        const callResult = await pool.query(
          `INSERT INTO calls (
            tenant_id, caller_name, reason_name, is_blocking, is_glpi, glpi_number,
            created_by, last_modified_by, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
          [
            tenantId,
            caller,
            reason || null,
            isBlocking,
            isGLPI,
            glpiNumber || null,
            userId,
            userId,
            createdAt || new Date()
          ]
        );

        const callId = callResult.rows[0].id;

        // Ajouter les tags si présents
        if (Array.isArray(tags) && tags.length > 0) {
          for (const tag of tags) {
            if (tag.name) {
              // Créer ou récupérer le tag
              let tagId;
              const existingTag = await pool.query(
                'SELECT id FROM tags WHERE tenant_id = $1 AND name = $2',
                [tenantId, tag.name]
              );

              if (existingTag.rows.length > 0) {
                tagId = existingTag.rows[0].id;
              } else {
                const newTag = await pool.query(
                  'INSERT INTO tags (tenant_id, name) VALUES ($1, $2) RETURNING id',
                  [tenantId, tag.name]
                );
                tagId = newTag.rows[0].id;
              }

              // Associer le tag à l'appel
              await pool.query(
                'INSERT INTO call_tags (call_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [callId, tagId]
              );
            }
          }
        }

        // Ajouter aux tables d'autocomplétion si nécessaire
        if (caller) {
          await pool.query(
            'INSERT INTO callers (tenant_id, name) VALUES ($1, $2) ON CONFLICT (tenant_id, name) DO NOTHING',
            [tenantId, caller]
          );
        }

        if (reason) {
          await pool.query(
            'INSERT INTO reasons (tenant_id, name) VALUES ($1, $2) ON CONFLICT (tenant_id, name) DO NOTHING',
            [tenantId, reason]
          );
        }

        imported++;
      } catch (error) {
        console.error('Import call error:', error);
        errors.push(`Erreur pour l'appel "${call.caller || 'unknown'}": ${error.message}`);
        skipped++;
      }
    }

    res.json({
      message: 'Import completed',
      imported,
      skipped,
      total: calls.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Limiter à 10 erreurs
    });
  } catch (error) {
    console.error('Import calls error:', error);
    if (error instanceof SyntaxError) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};
