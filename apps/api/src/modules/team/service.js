// apps/api/src/modules/team/service.js
// Not one of the handbook's original 10 modules — added when real role
// enforcement made it obvious this was missing: there was no way for an
// owner to actually add staff, assign roles, or remove access, even
// though "associates can't touch staff" only makes sense if staff
// management exists somewhere for owners to use.
const db = require('../../db/client');

async function listTeam(storeId) {
  const homeUsers = await db('users').where({ store_id: storeId });
  const memberships = await db('store_memberships')
    .join('users', 'users.id', 'store_memberships.user_id')
    .where('store_memberships.store_id', storeId)
    .select('users.id', 'users.full_name', 'store_memberships.role as role');

  // Merge, since someone could be a home-store user AND appear via
  // store_memberships (e.g. their own store_id row) — de-dupe by id.
  const byId = new Map();
  for (const u of homeUsers) byId.set(u.id, { id: u.id, fullName: u.full_name, role: u.experience_mode });
  for (const m of memberships) if (!byId.has(m.id)) byId.set(m.id, { id: m.id, fullName: m.full_name, role: m.role });
  return Array.from(byId.values());
}

// NOTE: this only assigns a role to an existing Supabase Auth user (by
// their auth user id) — it does not create the login itself. Creating
// the actual account (email/password) still happens in the Supabase
// dashboard for now (see Ch.7A's login note) — this just grants that
// person access to this store once their account exists.
async function addTeamMember(storeId, { authUserId, fullName, role }) {
  const existingUser = await db('users').where({ id: authUserId }).first();

  if (!existingUser) {
    // First store this person is being added to — becomes their home store.
    const [user] = await db('users').insert({
      id: authUserId, store_id: storeId, full_name: fullName, experience_mode: role
    }).returning('*');
    return user;
  }

  // Already has a home store elsewhere — add as a membership instead of
  // overwriting their home store_id.
  const [membership] = await db('store_memberships')
    .insert({ user_id: authUserId, store_id: storeId, role })
    .onConflict(['user_id', 'store_id'])
    .merge({ role })
    .returning('*');
  return membership;
}

async function updateTeamMemberRole(storeId, userId, role) {
  const homeUser = await db('users').where({ id: userId, store_id: storeId }).first();
  if (homeUser) {
    await db('users').where({ id: userId }).update({ experience_mode: role });
    return { userId, role };
  }
  await db('store_memberships').where({ user_id: userId, store_id: storeId }).update({ role });
  return { userId, role };
}

async function removeTeamMember(storeId, userId) {
  // Only removes membership-based access, never the home-store user row
  // itself — removing someone's home store is a bigger, separate action
  // (deactivating an account) that deserves its own deliberate flow, not
  // a side effect of this endpoint.
  await db('store_memberships').where({ user_id: userId, store_id: storeId }).del();
  return { userId, removed: true };
}

module.exports = { listTeam, addTeamMember, updateTeamMemberRole, removeTeamMember };
