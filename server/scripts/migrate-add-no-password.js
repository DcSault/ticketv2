const pool = require('../config/database');

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding no_password_login column to users table...');
    
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS no_password_login BOOLEAN DEFAULT false;
    `);

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
