// apps/api/src/db/verifyPrisma.js
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// Initialize pg Pool and the Prisma PG driver adapter
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Testing Prisma connection and querying stores...');
  const stores = await prisma.stores.findMany();
  console.log('Successfully queried stores! Total count:', stores.length);
  console.log('Stores data:', stores);
}

main()
  .catch(e => {
    console.error('Connection test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
