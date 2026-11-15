// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// A missing JWT_SECRET must never fall back to a secret that is written in the
// source code. In production we refuse to start; in development we generate a
// random one (all tokens simply become invalid after a restart).
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET is not set. Add it to your environment variables.');
    process.exit(1);
  }
  JWT_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('[auth] JWT_SECRET not set - using a temporary random secret for this run.');
}

const signToken = (payload, expiresIn = '24h') => jwt.sign(payload, JWT_SECRET, { expiresIn });

// Requires "Authorization: Bearer <token>"
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Please sign in first.' });
  try {
    req.auth = jwt.verify(token, JWT_SECRET); // { id, email, demo }
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
  }
}

module.exports = { signToken, requireAuth };
