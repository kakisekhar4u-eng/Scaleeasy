// apps/api/src/core/permissions.js
// Role-based access control. Roles rank from least to most privileged:
//   consultant (0) — read-only by default, no explicit grant needed
//   associate  (1) — daily work: selling, customer notes, taking orders
//   manager    (2) — money-adjacent actions: inventory, marketing spend,
//                    shipping cost, business numbers
//   owner      (3) — staff management, integrations/connectors, deletions
//
// Any route with no requireRole() call is readable by every logged-in
// role, including consultant — reads are open by default. But every
// route that MUTATES data (POST/PATCH/DELETE) must have an explicit
// requireRole() call, even if the minimum is just 'associate' — there
// is no such thing as an unguarded write in this app. This is an
// explicit-deny-by-default model for writes, not implicit-allow.
const ROLE_RANK = { consultant: 0, associate: 1, manager: 2, owner: 3 };

function requireRole(minRole) {
  const requiredRank = ROLE_RANK[minRole];
  if (requiredRank === undefined) throw new Error(`Unknown role in requireRole(): ${minRole}`);

  return (req, res, next) => {
    const userRank = ROLE_RANK[req.user?.role];
    if (userRank === undefined) return res.status(403).json({ error: 'No role assigned to this account.' });
    if (userRank < requiredRank) {
      return res.status(403).json({ error: `This action requires ${minRole} access or higher.` });
    }
    next();
  };
}

module.exports = { requireRole, ROLE_RANK };
