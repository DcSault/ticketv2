const { Pool } = require('pg');
// dotenv is already loaded in index.js

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ticketv2',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

let connectionLogged = false;

pool.on('connect', () => {
  if (!connectionLogged) {
    console.log('✅ Connected to PostgreSQL database');
    connectionLogged = true;
  }
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
