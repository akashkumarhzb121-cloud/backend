/**
 * Simple in-memory rate limiter.
 * For production at scale, replace with express-rate-limit + Redis.
 */
const store = new Map();

const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => (req, res, next) => {
  const key = req.ip;
  const now = Date.now();

  if (!store.has(key)) {
    store.set(key, { count: 1, start: now });
    return next();
  }

  const entry = store.get(key);

  if (now - entry.start > windowMs) {
    // Reset window
    store.set(key, { count: 1, start: now });
    return next();
  }

  if (entry.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  }

  entry.count++;
  next();
};

// Tighter limiter for auth routes
const authRateLimiter = rateLimiter(10, 15 * 60 * 1000); // 10 per 15 min
const generalRateLimiter = rateLimiter(100, 15 * 60 * 1000);

module.exports = { authRateLimiter, generalRateLimiter };
