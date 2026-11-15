// server/routes/astronautRoutes.js  (mounted at /api/astronaut)
// PRIVACY: every route works ONLY on the signed-in astronaut. The id always comes from the
// login token, never from the request, so nobody can read or change another astronaut's data.
const express = require('express');
const store = require('../db/store');
const { requireAuth } = require('../middleware/auth');
const { evaluateHealthStatus } = require('../services/evaluationEngine');
const { buildGamification } = require('../services/gamification');
const { buildReminders } = require('../services/reminders');
const { buildPdf } = require('../services/pdfReport');
const { INPUT_LIMITS, FATIGUE_LEVELS, BASELINES } = require('../data/nasaBaselines');
const { ROLES, missionInfo, scenarios, symptomGuide } = require('../data/nasaHealthData');
const { environments } = require('../data/environments');
const { guides } = require('../data/guides');

const router = express.Router();
router.use(requireAuth);

const GROUPS = ['vitals', 'environment', 'wellbeing'];

// Loads the signed-in astronaut (or sends 401) and attaches it to req.me
router.use(async (req, res, next) => {
  const me = await store.findById(req.auth.id);
  if (!me) return res.status(401).json({ success: false, message: 'Session no longer valid. Please sign in again.' });
  req.me = me;
  next();
});

const envOf = (me) => environments[me.mission_env] || environments.station;

async function snapshot(me) {
  const latest = await store.latestReading(me.id);
  const evaluation = evaluateHealthStatus(latest.telemetry);
  const activity = await store.getActivity(me.id);
  const symptomCount = await store.countSymptoms(me.id);
  return {
    crew: { id: me.id, name: me.name, role: me.role },
    telemetry: latest.telemetry,
    evaluation,
    lastUpdated: latest.at,
    reminders: buildReminders(activity),
    gamification: buildGamification({ activity, symptomCount, latestScore: evaluation.score })
  };
}

// Validates only the numbers that were sent. Returns { values, errors }.
function readGroup(group, input) {
  const values = {};
  const errors = [];
  Object.entries(input || {}).forEach(([key, raw]) => {
    const def = BASELINES[key];
    if (key === 'fatigueLevel') {
      const v = String(raw).toUpperCase();
      if (!FATIGUE_LEVELS.includes(v)) errors.push(`fatigueLevel must be one of ${FATIGUE_LEVELS.join(', ')}.`);
      else values.fatigueLevel = v;
      return;
    }
    if (!def || def.group !== group) return;
    if (raw === '' || raw === null || raw === undefined) return;
    const n = Number(raw);
    const [min, max] = INPUT_LIMITS[key];
    if (!Number.isFinite(n)) errors.push(`${def.label} must be a number.`);
    else if (n < min || n > max) errors.push(`${def.label} must be between ${min} and ${max} ${def.unit}.`);
    else values[key] = n;
  });
  return { values, errors };
}

// ---------- GET /health ----------
router.get('/health', async (req, res) => {
  const env = envOf(req.me);
  res.json({
    success: true,
    mission: missionInfo,
    ...(await snapshot(req.me)),
    environment: { key: req.me.mission_env, ...env },
    environments: Object.entries(environments).map(([key, v]) => ({ key, label: v.label })),
    guides,
    canEdit: true,
    symptomGuide: Object.entries(symptomGuide).map(([key, v]) => ({ key, label: v.label })),
    scenarios: Object.entries(scenarios).map(([key, v]) => ({ key, label: v.label, description: v.description }))
  });
});

// ---------- GET /history ----------
router.get('/history', async (req, res) => {
  res.json({ success: true, history: await store.getHistory(req.me.id, 60) });
});

// ---------- POST /readings ----------
router.post('/readings', async (req, res) => {
  const latest = await store.latestReading(req.me.id);
  const telemetry = store.clone(latest.telemetry);

  const updates = {};
  const errors = [];
  GROUPS.forEach((group) => {
    const { values, errors: e } = readGroup(group, req.body[group]);
    updates[group] = values;
    errors.push(...e);
  });

  const vit = { ...telemetry.vitals, ...updates.vitals };
  if (vit.bloodPressureSys <= vit.bloodPressureDia) errors.push('Systolic pressure must be higher than diastolic pressure.');
  if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });

  const touched = GROUPS.filter((g) => Object.keys(updates[g]).length);
  if (!touched.length) return res.status(400).json({ success: false, message: 'Enter at least one reading to save.' });

  touched.forEach((g) => Object.assign(telemetry[g], updates[g]));
  await store.addReading(req.me.id, telemetry, evaluateHealthStatus(telemetry), touched.join(','));
  res.json({ success: true, message: 'Readings saved. Your health report is ready to download.', reportReady: true, ...(await snapshot(req.me)) });
});

// ---------- POST /symptom ----------
router.post('/symptom', async (req, res) => {
  const key = symptomGuide[req.body.symptom] ? req.body.symptom : null;
  if (!key) return res.status(400).json({ success: false, message: 'Please choose a symptom from the list.' });

  const severity = Math.min(5, Math.max(1, parseInt(req.body.severity, 10) || 1));
  const note = String(req.body.note || '').trim().slice(0, 300);
  const guide = symptomGuide[key];
  const entry = await store.addSymptom(req.me.id, { symptom: key, label: guide.label, severity, note });

  const urgent = Boolean(guide.urgent) || severity >= 4;
  res.json({
    success: true,
    message: 'Symptom logged in your medical record.',
    entry,
    advice: urgent && !guide.urgent
      ? `${guide.advice} Because the severity is ${severity}/5, contact the Flight Surgeon today.`
      : guide.advice,
    urgent,
    gamification: (await snapshot(req.me)).gamification
  });
});

router.get('/symptoms', async (req, res) => {
  res.json({ success: true, symptoms: await store.getSymptoms(req.me.id, 20) });
});

// ---------- POST /scenario ----------
router.post('/scenario', async (req, res) => {
  const scenario = scenarios[req.body.scenario];
  if (!scenario) return res.status(400).json({ success: false, message: 'Unknown scenario.' });
  const latest = await store.latestReading(req.me.id);
  const telemetry = store.clone(latest.telemetry);
  GROUPS.forEach((g) => Object.assign(telemetry[g], scenario.patch[g] || {}));
  await store.addReading(req.me.id, telemetry, evaluateHealthStatus(telemetry), 'scenario');
  res.json({ success: true, message: `Scenario applied: ${scenario.label}.`, reportReady: true, ...(await snapshot(req.me)) });
});

// ---------- PUT /environment ----------
router.put('/environment', async (req, res) => {
  const key = String(req.body.environment || '');
  if (!environments[key]) return res.status(400).json({ success: false, message: 'Unknown mission environment.' });
  await store.setEnvironment(req.me.id, key);
  res.json({ success: true, message: `Environment set: ${environments[key].label}.`, environment: { key, ...environments[key] } });
});

// ---------- GET /report.pdf : the downloadable health report ----------
router.get('/report.pdf', async (req, res) => {
  const snap = await snapshot(req.me);
  const symptoms = await store.getSymptoms(req.me.id, 8);
  const safeName = req.me.name.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'astronaut';
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="health_report_${safeName}_${stamp}.pdf"`);
  res.setHeader('Cache-Control', 'no-store');
  buildPdf({
    crew: { id: req.me.id, name: req.me.name, role: req.me.role },
    evaluation: snap.evaluation, environment: envOf(req.me), symptoms,
    gamification: snap.gamification, guides
  }).pipe(res);
});

// ---------- profile ----------
const profileView = (a) => ({
  id: a.id, name: a.name, email: a.email, role: a.role,
  age: a.age ?? '', heightCm: a.height_cm ?? '', weightKg: a.weight_kg ?? '',
  emergencyName: a.emergency_name || '', emergencyPhone: a.emergency_phone || '', notes: a.notes || ''
});

router.get('/profile', (req, res) => {
  res.json({ success: true, profile: profileView(req.me), roles: ROLES });
});

function optionalNumber(raw, label, min, max, errors) {
  if (raw === '' || raw === null || raw === undefined) return '';
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) {
    errors.push(`${label} must be a number between ${min} and ${max}.`);
    return '';
  }
  return Math.round(n);
}

router.put('/profile', async (req, res) => {
  const b = req.body || {};
  const errors = [];
  const name = String(b.name ?? req.me.name).trim();
  if (name.length < 2 || name.length > 60) errors.push('Name must be between 2 and 60 characters.');
  const role = b.role === undefined ? req.me.role : b.role;
  if (!ROLES.includes(role)) errors.push('Please choose a role from the list.');
  const age = optionalNumber(b.age, 'Age', 18, 90, errors);
  const heightCm = optionalNumber(b.heightCm, 'Height', 120, 230, errors);
  const weightKg = optionalNumber(b.weightKg, 'Weight', 35, 200, errors);
  const emergencyName = String(b.emergencyName || '').trim().slice(0, 60);
  const emergencyPhone = String(b.emergencyPhone || '').trim();
  if (emergencyPhone && !/^[+\d\s()-]{5,25}$/.test(emergencyPhone)) errors.push('Emergency phone may only contain digits, spaces, + ( ) and -.');
  const notes = String(b.notes || '').trim().slice(0, 300);
  if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });

  await store.updateProfile(req.me.id, { name, role, age, heightCm, weightKg, emergencyName, emergencyPhone, notes });
  res.json({ success: true, message: 'Profile saved.', profile: profileView(await store.findById(req.me.id)) });
});

module.exports = router;
