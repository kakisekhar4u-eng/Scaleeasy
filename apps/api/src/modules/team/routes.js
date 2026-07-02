// apps/api/src/modules/team/routes.js
const express = require('express');
const router = express.Router();
const { requireRole } = require('../../core/permissions');
const { listTeam, addTeamMember, updateTeamMemberRole, removeTeamMember } = require('./service');

require('./events');

// GET /team — everyone can see who they work with; only owners can change it
router.get('/team', async (req, res) => {
  const team = await listTeam(req.user.storeId);
  res.json(team);
});

router.post('/team', requireRole('owner'), async (req, res) => {
  const { authUserId, fullName, role } = req.body;
  if (!['owner', 'manager', 'associate', 'consultant'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  const result = await addTeamMember(req.user.storeId, { authUserId, fullName, role });
  res.status(201).json(result);
});

router.patch('/team/:userId/role', requireRole('owner'), async (req, res) => {
  if (!['owner', 'manager', 'associate', 'consultant'].includes(req.body.role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  const result = await updateTeamMemberRole(req.user.storeId, req.params.userId, req.body.role);
  res.json(result);
});

router.delete('/team/:userId', requireRole('owner'), async (req, res) => {
  const result = await removeTeamMember(req.user.storeId, req.params.userId);
  res.json(result);
});

module.exports = router;
