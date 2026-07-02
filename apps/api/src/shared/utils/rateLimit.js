// apps/api/src/shared/utils/rateLimit.js
// Simple in-memory per-IP rate limiter, shared by every public (no-login)
// route (Ch.7A requires SOME rate limit on public endpoints). Fine for a
// single server; swap for a shared store (e.g. Redis) once you're running
// more than one instance.
function createRateLimiter({ windowMs = 60000, maxRequests = 60 } = {}) {
  const requestLog = new Map(); // ip -> [timestamps]

  return function rateLimit(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const timestamps = (requestLog.get(ip) || []).filter(t => now - t < windowMs);
    if (timestamps.length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
    }
    timestamps.push(now);
    requestLog.set(ip, timestamps);
    next();
  };
}

module.exports = { createRateLimiter };
