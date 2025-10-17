const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Script de setup de la base de données
async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up database...');
    
    // Créer les tables
    await client.query(`
      -- Table des tenants (départements)
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(200) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Table des utilisateurs
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(200),
        role VARCHAR(20) DEFAULT 'user', -- user, tenant_admin, global_admin
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Table des appelants
      CREATE TABLE IF NOT EXISTS callers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, tenant_id)
      );

      -- Table des raisons
      CREATE TABLE IF NOT EXISTS reasons (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, tenant_id)
      );

      -- Table des tags
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, tenant_id)
      );

      -- Table des appels
      CREATE TABLE IF NOT EXISTS calls (
        id SERIAL PRIMARY KEY,
        caller_id INTEGER REFERENCES callers(id),
        caller_name VARCHAR(200) NOT NULL,
        reason_id INTEGER REFERENCES reasons(id),
        reason_name VARCHAR(200),
        is_glpi BOOLEAN DEFAULT false,
        glpi_number VARCHAR(50),
        is_blocking BOOLEAN DEFAULT false,
        is_archived BOOLEAN DEFAULT false,
        archived_at TIMESTAMP,
        archived_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_modified_by INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE
      );

      -- Table de liaison appels-tags (many-to-many)
      CREATE TABLE IF NOT EXISTS call_tags (
        call_id INTEGER REFERENCES calls(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (call_id, tag_id)
      );

      -- Créer des index pour les performances
      CREATE INDEX IF NOT EXISTS idx_calls_tenant ON calls(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at);
      CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_callers_tenant ON callers(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_reasons_tenant ON reasons(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_tags_tenant ON tags(tenant_id);
    `);

    console.log('✅ Tables created successfully');

    // Créer les tenants par défaut
    const tenantResult = await client.query(`
      INSERT INTO tenants (name, display_name)
      VALUES 
        ('infra', 'Infrastructure'),
        ('dev', 'Développement')
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name;
    `);

    console.log('✅ Default tenants created');

    // Récupérer les IDs des tenants
    const infraTenant = await client.query(
      "SELECT id FROM tenants WHERE name = 'infra'"
    );
    const devTenant = await client.query(
      "SELECT id FROM tenants WHERE name = 'dev'"
    );

    // Créer l'admin global
    const hashedPassword = await bcrypt.hash(
      process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
      10
    );

    await client.query(`
      INSERT INTO users (username, password, full_name, role, tenant_id)
      VALUES 
        ($1, $2, 'Administrateur Global', 'global_admin', NULL),
        ('infra_admin', $3, 'Admin Infrastructure', 'tenant_admin', $4),
        ('dev_admin', $3, 'Admin Développement', 'tenant_admin', $5)
      ON CONFLICT (username) DO NOTHING;
    `, [
      process.env.DEFAULT_ADMIN_USERNAME || 'admin',
      hashedPassword,
      hashedPassword,
      infraTenant.rows[0]?.id,
      devTenant.rows[0]?.id
    ]);

    console.log('✅ Default users created');
    console.log('\n📝 Credentials:');
    console.log(`   Global Admin: ${process.env.DEFAULT_ADMIN_USERNAME || 'admin'} / ${process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'}`);
    console.log('   Infra Admin:  infra_admin / admin123');
    console.log('   Dev Admin:    dev_admin / admin123');
    console.log('\n🎉 Database setup complete!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Exécuter le setup
if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = setupDatabase;
