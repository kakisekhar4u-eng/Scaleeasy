// apps/api/src/db/client.js
// Single shared Knex instance, connected to Supabase Postgres.
// SUPABASE_SERVICE_ROLE_KEY bypasses RLS — backend-only, never sent to frontend.
require('dotenv').config();
const knex = require('knex');

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL is required — copy .env.example to .env and fill it in');
}

const db = knex({
  client: 'pg',
  connection: {
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL, // Supabase project's Postgres connection string
    ssl: { rejectUnauthorized: false }
  },
  pool: { min: 0, max: 10 }
});

module.exports = db;
