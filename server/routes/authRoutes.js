// server/routes/authRoutes.js  (mounted at /api/auth)
// Sign up -> account is ready immediately and a welcome "email" is printed in the terminal.
// Forgot password -> a 6-digit code is printed in the terminal.
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const store = require('../db/store');
const { defaultTelemetry, ROLES } = require('../data/nasaHealthData');
const { evaluateHealthStatus } = require('../services/evaluationEngine');
const { sendEmail } = require('../services/mailer');
const { signToken, requireAuth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

const RESET_TTL_MS = 10 * 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40 });

const sha = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });
const cleanEmail = (v) => String(v || '').trim().toLowerCase();

// ---------- POST /signup ----------
router.post('/signup', authLimiter, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || '');
  const role = ROLES.includes(req.body.role) ? req.body.role : 'Flight Specialist';

  if (name.length < 2) return res.status(400).json({ success: false, message: 'Please enter your full name.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  if (await store.findByEmail(email)) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists. Please sign in.' });
  }

  const user = {
    id: `ASTRO-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    name, email, role, passwordHash: await bcrypt.hash(password, 10)
  };
  const telemetry = defaultTelemetry();
  await store.createAstronaut(user, telemetry, evaluateHealthStatus(telemetry));

  await sendEmail(email, 'Welcome to Astronaut Health Monitor',
    `Welcome aboard, ${name}!\n\nYour astronaut account (${role}) is ready. You can now:\n` +
    '  - log your body, habitat and sleep readings,\n  - follow your health score and body map,\n  - download your personal health report as a PDF or image.\n\n' +
    'Your health data is private: only you can see it.\n\nSafe travels,\nThe Astronaut Health Monitor team');

  res.json({
    success: true,
    message: 'Account created. Welcome to Mission Control! A welcome email was sent.',
    token: signToken({ id: user.id, email }),
    user: publicUser(user)
  });
});

// ---------- POST /demo ----------
// One-click private demo account (no email, no password) so judges and visitors can try the app
// without registering. Each click makes a fresh, separate astronaut: demo users never see each other.
router.post('/demo', authLimiter, async (req, res) => {
  const id = `ASTRO-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const user = {
    id, name: 'Demo Astronaut', email: `demo-${id.toLowerCase()}@demo.invalid`, role: 'Flight Specialist',
    passwordHash: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 8)
  };
  const telemetry = defaultTelemetry();
  await store.createAstronaut(user, telemetry, evaluateHealthStatus(telemetry));
  res.json({ success: true, message: 'Demo session started. Your data is private to this demo account.', token: signToken({ id, email: user.email }), user: publicUser(user) });
});

// ---------- POST /login ----------
router.post('/login', authLimiter, async (req, res) => {
  const user = await store.findByEmail(req.body.email);
  const ok = user && (await bcrypt.compare(String(req.body.password || ''), user.password_hash));
  if (!ok) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  res.json({
    success: true,
    message: 'Signed in. Welcome to Mission Control.',
    token: signToken({ id: user.id, email: user.email }),
    user: publicUser(user)
  });
});

// ---------- POST /forgot-password ----------
router.post('/forgot-password', authLimiter, async (req, res) => {
  const user = await store.findByEmail(req.body.email);
  const generic = { success: true, message: 'If an account exists for this email, a 6-digit reset code has been sent.' };
  if (!user) return res.json(generic);

  const code = String(crypto.randomInt(100000, 1000000));
  await store.setResetCode(user.id, sha(code), Date.now() + RESET_TTL_MS);
  await sendEmail(user.email, 'Astronaut Health Monitor - password reset code',
    `Hello ${user.name},\n\nYour 6-digit password reset code is: ${code}\n\nIt expires in 10 minutes. If you did not ask for this, ignore this email.`);
  res.json(generic);
});

// ---------- POST /reset-password ----------
router.post('/reset-password', authLimiter, async (req, res) => {
  const newPassword = String(req.body.newPassword || '');
  if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });

  const user = await store.findByEmail(req.body.email);
  const bad = { success: false, message: 'Incorrect code or email.' };
  if (!user || !user.reset_code_hash) return res.status(400).json(bad);
  if (Date.now() > Number(user.reset_expires_at)) {
    await store.clearResetCode(user.id);
    return res.status(400).json({ success: false, message: 'This code has expired. Please request a new one.' });
  }
  if (user.reset_attempts >= MAX_RESET_ATTEMPTS) {
    await store.clearResetCode(user.id);
    return res.status(400).json({ success: false, message: 'Too many wrong attempts. Please request a new code.' });
  }
  if (sha(String(req.body.otp || '').trim()) !== user.reset_code_hash) {
    await store.bumpResetAttempts(user.id);
    return res.status(400).json({ success: false, message: 'Incorrect 6-digit code.' });
  }

  await store.setPassword(user.id, await bcrypt.hash(newPassword, 10));
  await store.clearResetCode(user.id);
  res.json({ success: true, message: 'Password updated. You can now sign in.' });
});

// ---------- GET /me ----------
router.get('/me', requireAuth, async (req, res) => {
  const user = await store.findById(req.auth.id);
  if (!user) return res.status(401).json({ success: false, message: 'Session no longer valid. Please sign in again.' });
  res.json({ success: true, user: publicUser(user) });
});

// ---------- POST /change-password ----------
router.post('/change-password', requireAuth, authLimiter, async (req, res) => {
  const user = await store.findById(req.auth.id);
  if (!user) return res.status(401).json({ success: false, message: 'Session no longer valid. Please sign in again.' });
  const newPassword = String(req.body.newPassword || '');
  if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
  if (!(await bcrypt.compare(String(req.body.currentPassword || ''), user.password_hash))) {
    return res.status(400).json({ success: false, message: 'Your current password is incorrect.' });
  }
  await store.setPassword(user.id, await bcrypt.hash(newPassword, 10));
  res.json({ success: true, message: 'Password changed.' });
});

module.exports = router;
