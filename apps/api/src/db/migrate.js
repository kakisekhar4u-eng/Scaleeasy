// apps/api/src/db/migrate.js
// Migration runner to execute SQL files sequentially against Supabase.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./client');

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} SQL migrations.`);

  for (const file of files) {
    console.log(`Running migration: ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      // Execute the SQL statements
      await db.raw(sql);
      console.log(`Successfully completed migration: ${file}`);
    } catch (err) {
      console.error(`Failed migration: ${file}`);
      console.error(err);
      process.exit(1);
    }
  }

  console.log('All migrations completed successfully.');
  await db.destroy(); // close database pool connection
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
