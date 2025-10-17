const pool = require('../config/database');

// Obtenir les statistiques
exports.getStatistics = async (req, res) => {
  const { period = 'day', startDate, endDate } = req.query;
  // Viewer multi-tenant peut choisir, viewer avec tenant_id ne peut voir que son tenant
  const tenantId = (req.user.role === 'global_admin' || (req.user.role === 'viewer' && !req.user.tenantId)) 
    ? req.query.tenantId 
    : req.user.tenantId;

  try {
    let dateFilter = '';
    const params = [tenantId];

    if (startDate && endDate) {
      // Utiliser >= et < pour inclure toute la journée de fin
      dateFilter = "AND created_at >= $2::date AND created_at < ($3::date + INTERVAL '1 day')";
      params.push(startDate, endDate);
    } else if (startDate) {
      // Seulement date de début
      dateFilter = "AND created_at >= $2::date";
      params.push(startDate);
    } else if (endDate) {
      // Seulement date de fin
      dateFilter = "AND created_at < ($2::date + INTERVAL '1 day')";
      params.push(endDate);
    } else {
      // Calculer la date de début selon la période
      switch (period) {
        case 'day':
          dateFilter = "AND created_at >= CURRENT_DATE";
          break;
        case 'week':
          dateFilter = "AND created_at >= DATE_TRUNC('week', CURRENT_DATE)";
          break;
        case 'month':
          dateFilter = "AND created_at >= DATE_TRUNC('month', CURRENT_DATE)";
          break;
        case 'year':
          dateFilter = "AND created_at >= DATE_TRUNC('year', CURRENT_DATE)";
          break;
      }
    }

    // Total d'appels (incluant les archivés)
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total FROM calls WHERE tenant_id = $1 ${dateFilter}`,
      params
    );

    // Appels bloquants (incluant les archivés)
    const blockingResult = await pool.query(
      `SELECT COUNT(*) as total FROM calls WHERE tenant_id = $1 ${dateFilter} AND is_blocking = true`,
      params
    );

    // Tickets GLPI (incluant les archivés)
    const glpiResult = await pool.query(
      `SELECT COUNT(*) as total FROM calls WHERE tenant_id = $1 ${dateFilter} AND is_glpi = true`,
      params
    );

    // Top appelants (incluant les archivés)
    const topCallersResult = await pool.query(
      `SELECT caller_name, COUNT(*) as count
       FROM calls
       WHERE tenant_id = $1 ${dateFilter}
       GROUP BY caller_name
       ORDER BY count DESC
       LIMIT 10`,
      params
    );

    // Top raisons (incluant les archivés)
    const topReasonsResult = await pool.query(
      `SELECT reason_name, COUNT(*) as count
       FROM calls
       WHERE tenant_id = $1 ${dateFilter} AND reason_name IS NOT NULL
       GROUP BY reason_name
       ORDER BY count DESC
       LIMIT 10`,
      params
    );

    // Top tags (incluant les archivés)
    const topTagsResult = await pool.query(
      `SELECT t.name, COUNT(*) as count
       FROM call_tags ct
       JOIN tags t ON ct.tag_id = t.id
       JOIN calls c ON ct.call_id = c.id
       WHERE c.tenant_id = $1 AND t.tenant_id = $1 ${dateFilter.replace(/created_at/g, 'c.created_at')}
       GROUP BY t.name
       ORDER BY count DESC
       LIMIT 10`,
      params
    );

    // Appels par jour OU par mois (pour les graphiques, incluant les archivés)
    let callsByDayResult;
    if (period === 'year' && !startDate) {
      // Pour l'année, grouper par mois
      callsByDayResult = await pool.query(
        `SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as date,
          COUNT(*) as count
         FROM calls
         WHERE tenant_id = $1 ${dateFilter}
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY date ASC`,
        params
      );
    } else {
      // Pour les autres périodes, grouper par jour
      callsByDayResult = await pool.query(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM calls
         WHERE tenant_id = $1 ${dateFilter}
         GROUP BY DATE(created_at)
         ORDER BY date DESC
         LIMIT 30`,
        params
      );
    }

    // Appels par heure (pour aujourd'hui ou pour un jour spécifique)
    // Note: created_at est déjà en heure locale, pas besoin de conversion de fuseau horaire
    let callsByHourResult = null;
    if (period === 'day' && !startDate && !endDate) {
      // Aujourd'hui - afficher de la première heure avec appels jusqu'à l'heure actuelle
      callsByHourResult = await pool.query(
        `WITH hour_range AS (
          SELECT 
            COALESCE(MIN(EXTRACT(HOUR FROM created_at)::integer), EXTRACT(HOUR FROM NOW())::integer) as min_hour,
            EXTRACT(HOUR FROM NOW())::integer as max_hour
          FROM calls
          WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE
        ),
        hours AS (
          SELECT generate_series(
            (SELECT min_hour FROM hour_range),
            (SELECT max_hour FROM hour_range)
          ) as hour
        )
        SELECT 
          h.hour,
          COALESCE(COUNT(c.id), 0) as count
        FROM hours h
        LEFT JOIN calls c ON EXTRACT(HOUR FROM c.created_at) = h.hour 
          AND c.tenant_id = $1 
          AND DATE(c.created_at) = CURRENT_DATE
        GROUP BY h.hour
        ORDER BY h.hour`,
        [tenantId]
      );
    } else if (startDate && endDate && startDate === endDate) {
      // Un jour spécifique (comme Hier) - afficher de la première à la dernière heure avec appels
      callsByHourResult = await pool.query(
        `WITH hour_range AS (
          SELECT 
            COALESCE(MIN(EXTRACT(HOUR FROM created_at)::integer), 0) as min_hour,
            COALESCE(MAX(EXTRACT(HOUR FROM created_at)::integer), 23) as max_hour
          FROM calls
          WHERE tenant_id = $1 AND DATE(created_at) = $2::date
        ),
        hours AS (
          SELECT generate_series(
            (SELECT min_hour FROM hour_range),
            (SELECT max_hour FROM hour_range)
          ) as hour
        )
        SELECT 
          h.hour,
          COALESCE(COUNT(c.id), 0) as count
        FROM hours h
        LEFT JOIN calls c ON EXTRACT(HOUR FROM c.created_at) = h.hour 
          AND c.tenant_id = $1 
          AND DATE(c.created_at) = $2::date
        GROUP BY h.hour
        ORDER BY h.hour`,
        [tenantId, startDate]
      );
    }

    res.json({
      summary: {
        total: parseInt(totalResult.rows[0].total),
        blocking: parseInt(blockingResult.rows[0].total),
        glpi: parseInt(glpiResult.rows[0].total)
      },
      topCallers: topCallersResult.rows,
      topReasons: topReasonsResult.rows,
      topTags: topTagsResult.rows,
      callsByDay: callsByDayResult.rows,
      callsByHour: callsByHourResult ? callsByHourResult.rows : null
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Exporter les données
exports.exportData = async (req, res) => {
  const { startDate, endDate } = req.query;
  // Viewer multi-tenant peut choisir, viewer avec tenant_id ne peut voir que son tenant
  const tenantId = (req.user.role === 'global_admin' || (req.user.role === 'viewer' && !req.user.tenantId)) 
    ? req.query.tenantId 
    : req.user.tenantId;

  try {
    let query = `
      SELECT 
        c.id,
        c.caller_name as caller,
        c.reason_name as reason,
        json_agg(
          json_build_object('id', t.id, 'name', t.name)
        ) FILTER (WHERE t.id IS NOT NULL) as tags,
        c.is_blocking as "isBlocking",
        c.is_glpi as "isGLPI",
        c.glpi_number as "glpiNumber",
        c.is_archived as "isArchived",
        c.archived_at as "archivedAt",
        au.username as "archivedBy",
        c.created_at as "createdAt",
        cu.username as "createdBy",
        c.last_modified_at as "lastModifiedAt",
        mu.username as "lastModifiedBy",
        c.updated_at as "updatedAt"
      FROM calls c
      LEFT JOIN call_tags ct ON c.id = ct.call_id
      LEFT JOIN tags t ON ct.tag_id = t.id
      LEFT JOIN users cu ON c.created_by = cu.id
      LEFT JOIN users mu ON c.last_modified_by = mu.id
      LEFT JOIN users au ON c.archived_by = au.id
      WHERE c.tenant_id = $1
    `;

    const params = [tenantId];
    let paramCount = 2;

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

    query += ` GROUP BY c.id, cu.username, mu.username, au.username ORDER BY c.created_at DESC`;

    const result = await pool.query(query, params);

    // Nettoyer les données pour l'export
    const exportData = result.rows.map(row => ({
      ...row,
      tags: row.tags || []
    }));

    res.json(exportData);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
