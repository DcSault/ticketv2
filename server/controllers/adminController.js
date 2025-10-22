const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Obtenir tous les tenants
exports.getTenants = async (req, res) => {
  const userRole = req.user.role;
  const userTenantId = req.user.tenantId;

  try {
    let query = `
      SELECT 
        t.*,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT c.id) as call_count
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      LEFT JOIN calls c ON t.id = c.tenant_id
    `;
    
    const params = [];
    
    // Seuls les tenant_admin sont restreints à leur tenant
    if (userRole === 'tenant_admin') {
      query += ' WHERE t.id = $1';
      params.push(userTenantId);
    }
    // global_admin et tous les viewers voient tous les tenants
    
    query += ' GROUP BY t.id ORDER BY t.name';

    const result = await pool.query(query, params);
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
  const userRole = req.user.role;
  const userTenantId = req.user.tenantId;

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
        u.no_password_login,
        u.created_at
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
    `;

    const params = [];
    
    // Si tenant_admin, voir seulement les users de son tenant
    if (userRole === 'tenant_admin') {
      query += ' WHERE u.tenant_id = $1';
      params.push(userTenantId);
    } else if (tenantId) {
      // Si global_admin avec filtre tenant
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
  const { username, password, fullName, role, tenantId, noPasswordLogin } = req.body;
  const userRole = req.user.role;
  const userTenantId = req.user.tenantId;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  if (!noPasswordLogin && !password) {
    return res.status(400).json({ error: 'Password is required when noPasswordLogin is false' });
  }

  if (!['user', 'tenant_admin', 'global_admin', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  // tenant_admin ne peut pas créer de global_admin
  if (userRole === 'tenant_admin' && role === 'global_admin') {
    return res.status(403).json({ error: 'Tenant admin cannot create global admin' });
  }

  // Déterminer le tenant_id selon le rôle créé
  let finalTenantId;
  if (role === 'global_admin') {
    // global_admin est toujours multi-tenant (tenant_id = NULL)
    finalTenantId = null;
  } else if (role === 'viewer') {
    // viewer peut être multi-tenant (NULL) ou restreint à un tenant
    if (userRole === 'tenant_admin') {
      // tenant_admin peut créer des viewers pour leur propre tenant
      finalTenantId = userTenantId;
    } else {
      // global_admin peut choisir : NULL (tous) ou un tenant spécifique
      finalTenantId = tenantId || null;
    }
  } else if (userRole === 'tenant_admin') {
    // tenant_admin crée dans son propre tenant
    finalTenantId = userTenantId;
  } else {
    // global_admin peut spécifier le tenant
    finalTenantId = tenantId || null;
  }

  try {
    // Si noPasswordLogin est true, utiliser un mot de passe vide haché
    const hashedPassword = noPasswordLogin 
      ? await bcrypt.hash('', 10) 
      : await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password, full_name, role, tenant_id, no_password_login)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, full_name, role, tenant_id, no_password_login, created_at`,
      [username, hashedPassword, fullName, role, finalTenantId, noPasswordLogin || false]
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
  const userRole = req.user.role;
  const userTenantId = req.user.tenantId;

  try {
    // Vérifier que tenant_admin modifie seulement les users de son tenant
    if (userRole === 'tenant_admin') {
      const checkUser = await pool.query('SELECT tenant_id, role FROM users WHERE id = $1', [id]);
      if (checkUser.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (checkUser.rows[0].tenant_id !== userTenantId) {
        return res.status(403).json({ error: 'Cannot modify users from other tenants' });
      }
      // tenant_admin ne peut pas modifier un global_admin ou un viewer d'un autre tenant
      if (checkUser.rows[0].role === 'global_admin') {
        return res.status(403).json({ error: 'Cannot modify global admin' });
      }
      // tenant_admin ne peut modifier que les viewers de son propre tenant
      if (checkUser.rows[0].role === 'viewer' && checkUser.rows[0].tenant_id !== userTenantId) {
        return res.status(403).json({ error: 'Cannot modify viewers from other tenants' });
      }
    }

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
      if (!['user', 'tenant_admin', 'global_admin', 'viewer'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      // tenant_admin ne peut pas promouvoir en global_admin
      if (userRole === 'tenant_admin' && role === 'global_admin') {
        return res.status(403).json({ error: 'Cannot assign global admin role' });
      }
      updates.push(`role = $${paramCount}`);
      params.push(role);
      paramCount++;
      
      // Si on change le rôle vers global_admin, mettre tenant_id à NULL
      if (role === 'global_admin') {
        updates.push(`tenant_id = $${paramCount}`);
        params.push(null);
        paramCount++;
      }
    }

    // Gérer le tenant_id (sauf pour global_admin qui est toujours NULL)
    if (tenantId !== undefined && userRole === 'global_admin' && role !== 'global_admin') {
      updates.push(`tenant_id = $${paramCount}`);
      params.push(tenantId || null);
      paramCount++;
    }

    if (req.body.noPasswordLogin !== undefined) {
      updates.push(`no_password_login = $${paramCount}`);
      params.push(req.body.noPasswordLogin);
      paramCount++;
      
      // Si on active no_password_login, mettre un mot de passe vide
      if (req.body.noPasswordLogin) {
        const hashedPassword = await bcrypt.hash('', 10);
        updates.push(`password = $${paramCount}`);
        params.push(hashedPassword);
        paramCount++;
      }
    }

    if (password && !req.body.noPasswordLogin) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramCount}`);
      params.push(hashedPassword);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    query += ' ' + updates.join(', ');
    query += ` WHERE id = $${paramCount} RETURNING id, username, full_name, role, tenant_id, no_password_login, created_at`;
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
  const userRole = req.user.role;
  const userTenantId = req.user.tenantId;

  // Empêcher la suppression de l'admin par défaut
  if (parseInt(id) === 1) {
    return res.status(403).json({ error: 'Cannot delete default admin user' });
  }

  // Vérifier que tenant_admin supprime seulement les users de son tenant
  if (userRole === 'tenant_admin') {
    const checkUser = await pool.query('SELECT tenant_id, role FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (checkUser.rows[0].tenant_id !== userTenantId) {
      return res.status(403).json({ error: 'Cannot delete users from other tenants' });
    }
    // tenant_admin ne peut pas supprimer un global_admin
    if (checkUser.rows[0].role === 'global_admin') {
      return res.status(403).json({ error: 'Cannot delete global admin' });
    }
    // tenant_admin ne peut supprimer que les viewers de son propre tenant
    if (checkUser.rows[0].role === 'viewer' && checkUser.rows[0].tenant_id !== userTenantId) {
      return res.status(403).json({ error: 'Cannot delete viewers from other tenants' });
    }
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
    let jsonData = JSON.parse(fileContent);

    // Détecter et convertir l'ancien format (v2.0.7)
    let calls = [];
    if (jsonData.metadata && jsonData.data && jsonData.data.tickets) {
      // Format ancien: {metadata: {...}, data: {tickets: [...], users: [...], ...}}
      console.log(`Ancien format détecté (v${jsonData.metadata.version || 'inconnue'})`);
      console.log(`${jsonData.data.tickets.length} tickets à convertir`);
      
      // Convertir les tickets en calls (on garde les archivés aussi)
      calls = jsonData.data.tickets.map(ticket => ({
        caller: ticket.caller,
        reason: ticket.reason || '',
        tags: (ticket.tags || []).map(tag => 
          typeof tag === 'string' ? { name: tag } : tag
        ),
        isBlocking: ticket.isBlocking || false,
        isGLPI: ticket.isGLPI || false,
        glpiNumber: ticket.glpiNumber || '',
        isArchived: ticket.isArchived || false,
        archivedAt: ticket.archivedAt || null,
        archivedBy: ticket.archivedBy || null,
        createdAt: ticket.createdAt
      }));
      
      console.log(`✅ ${calls.length} appels à importer (dont ${calls.filter(c => c.isArchived).length} archivés)`);
    } else if (Array.isArray(jsonData)) {
      // Format nouveau: [{caller: ..., reason: ..., ...}]
      calls = jsonData;
    } else {
      return res.status(400).json({ 
        error: 'Format JSON invalide. Attendu: tableau d\'appels ou export v2.0.7' 
      });
    }

    let imported = 0;
    let skipped = 0;
    let duplicates = 0;
    const errors = [];

    console.log(`📥 Début de l'import : ${calls.length} appels à traiter`);

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
          isArchived = false,
          archivedAt = null,
          archivedBy = null,
          createdAt
        } = call;

        if (!caller) {
          errors.push(`Appel ignoré : caller manquant`);
          skipped++;
          continue;
        }

        // Résoudre caller : soit un nom, soit un ID à résoudre
        let callerName = caller;
        let callerId = null;
        
        if (typeof caller === 'number' || !isNaN(caller)) {
          // C'est un ID numérique - le résoudre
          const callerResult = await pool.query(
            'SELECT id, name FROM callers WHERE id = $1 AND tenant_id = $2',
            [caller, tenantId]
          );
          if (callerResult.rows.length > 0) {
            callerId = callerResult.rows[0].id;
            callerName = callerResult.rows[0].name;
          } else {
            errors.push(`Appel ignoré : caller_id ${caller} introuvable`);
            skipped++;
            continue;
          }
        } else {
          // C'est un nom - créer ou récupérer l'ID
          const callerResult = await pool.query(
            'SELECT id FROM callers WHERE name = $1 AND tenant_id = $2',
            [caller, tenantId]
          );
          if (callerResult.rows.length > 0) {
            callerId = callerResult.rows[0].id;
          } else {
            const newCaller = await pool.query(
              'INSERT INTO callers (name, tenant_id) VALUES ($1, $2) RETURNING id',
              [caller, tenantId]
            );
            callerId = newCaller.rows[0].id;
          }
        }

        // Résoudre reason : soit un nom, soit un ID à résoudre
        let reasonName = reason || null;
        let reasonId = null;
        
        if (reason) {
          if (typeof reason === 'number' || !isNaN(reason)) {
            // C'est un ID numérique - le résoudre
            const reasonResult = await pool.query(
              'SELECT id, name FROM reasons WHERE id = $1 AND tenant_id = $2',
              [reason, tenantId]
            );
            if (reasonResult.rows.length > 0) {
              reasonId = reasonResult.rows[0].id;
              reasonName = reasonResult.rows[0].name;
            }
          } else {
            // C'est un nom - créer ou récupérer l'ID
            const reasonResult = await pool.query(
              'SELECT id FROM reasons WHERE name = $1 AND tenant_id = $2',
              [reason, tenantId]
            );
            if (reasonResult.rows.length > 0) {
              reasonId = reasonResult.rows[0].id;
            } else {
              const newReason = await pool.query(
                'INSERT INTO reasons (name, tenant_id) VALUES ($1, $2) RETURNING id',
                [reason, tenantId]
              );
              reasonId = newReason.rows[0].id;
            }
          }
        }

        // Vérifier si l'appel existe déjà (doublon)
        // Un doublon = même appelant + même date de création (à la seconde près)
        const duplicateCheck = await pool.query(
          `SELECT id FROM calls 
           WHERE tenant_id = $1 
           AND caller_name = $2 
           AND created_at = $3`,
          [tenantId, callerName, createdAt || new Date()]
        );

        if (duplicateCheck.rows.length > 0) {
          // Doublon détecté, on le saute
          duplicates++;
          skipped++;
          continue;
        }

        // Créer l'appel (avec les champs d'archivage + IDs)
        const callResult = await pool.query(
          `INSERT INTO calls (
            tenant_id, caller_id, caller_name, reason_id, reason_name, 
            is_blocking, is_glpi, glpi_number,
            is_archived, archived_at, created_by, last_modified_by, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
          [
            tenantId,
            callerId,
            callerName,
            reasonId,
            reasonName,
            isBlocking,
            isGLPI,
            glpiNumber || null,
            isArchived,
            archivedAt,
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

        // Note: Plus besoin d'ajouter aux tables d'autocomplétion
        // car c'est déjà fait dans la logique de résolution ci-dessus

        imported++;
      } catch (error) {
        console.error('Import call error:', error);
        errors.push(`Erreur pour l'appel "${call.caller || 'unknown'}": ${error.message}`);
        skipped++;
      }
    }

    console.log(`✅ Import terminé : ${imported} importés, ${duplicates} doublons ignorés, ${skipped - duplicates} erreurs`);

    res.json({
      message: 'Import completed',
      imported,
      skipped,
      duplicates,
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

// Forcer l'archivage manuel des appels précédents
exports.forceArchive = async (req, res) => {
  const userRole = req.user.role;
  const userTenantId = req.user.tenantId;

  try {
    // Méthode simplifiée : archive tout ce qui a plus de 24h
    let query = `
      UPDATE calls 
      SET 
        is_archived = true,
        archived_at = NOW(),
        archived_by = $1
      WHERE 
        is_archived = false 
        AND created_at < (NOW() - INTERVAL '24 hours')
    `;
    
    const params = [req.user.userId];
    
    // tenant_admin ne peut archiver que les appels de son tenant
    if (userRole === 'tenant_admin') {
      query += ' AND tenant_id = $2';
      params.push(userTenantId);
    }
    
    query += ' RETURNING id, caller_name, created_at';

    const result = await pool.query(query, params);
    const count = result.rowCount;

    console.log(`✅ Archivage manuel : ${count} appels archivés par ${req.user.username}`);
    
    // Log des exemples
    if (result.rows.length > 0) {
      console.log('  Exemples:', result.rows.slice(0, 3).map(r => 
        `${r.caller_name} (${new Date(r.created_at).toLocaleString('fr-FR')})`
      ).join(', '));
    }

    res.json({
      message: count > 0 
        ? `${count} appel(s) archivé(s) avec succès` 
        : 'Aucun appel à archiver (tous récents ou déjà archivés)',
      count,
      examples: result.rows.slice(0, 5).map(r => ({
        id: r.id,
        caller: r.caller_name,
        date: r.created_at
      }))
    });
  } catch (error) {
    console.error('Force archive error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
