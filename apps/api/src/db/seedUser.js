// apps/api/src/db/seedUser.js
require('dotenv').config();
const db = require('./client');
const supabaseAdmin = require('../core/supabaseAdmin');

async function seed() {
  const email = process.argv[2];
  const password = process.argv[3];
  const fullName = process.argv[4] || 'Store Owner';
  const storeName = process.argv[5] || 'My First Store';

  if (!email || !password) {
    console.log('Usage: node src/db/seedUser.js <email> <password> [fullName] [storeName]');
    process.exit(1);
  }

  try {
    console.log(`Creating user in Supabase Auth: ${email}...`);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });

    if (authError) {
      throw authError;
    }

    const authUserId = authData.user.id;
    console.log(`Created Auth User with ID: ${authUserId}`);

    console.log(`Creating default store: ${storeName}...`);
    const [store] = await db('stores').insert({
      name: storeName,
      mode: 'retail'
    }).returning('*');

    console.log(`Created Store with ID: ${store.id}`);

    console.log(`Creating public user mapping...`);
    const [user] = await db('users').insert({
      id: authUserId,
      store_id: store.id,
      full_name: fullName,
      experience_mode: 'owner'
    }).returning('*');

    console.log('Seeding completed successfully!');
    console.log('\n----------------------------------------');
    console.log(`You can now log in using:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('----------------------------------------');

  } catch (err) {
    console.error('Error seeding user:', err);
  } finally {
    await db.destroy();
  }
}

seed();
