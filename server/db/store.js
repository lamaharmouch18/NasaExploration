// server/db/store.js
// MySQL / MariaDB storage (works with XAMPP + phpMyAdmin, and with any hosted MySQL).
// Tables are defined in server/database/schema.sql. Every function is async.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

let pool = null;

const cfg = () => ({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'astronaut_health'
});

const clone = (o) => JSON.parse(JSON.stringify(o));

// telemetry key -> [group, column]
const COLS = {
  heartRateBpm: ['vitals', 'heart_rate_bpm'],
  bloodPressureSys: ['vitals', 'blood_pressure_sys'],
  bloodPressureDia: ['vitals', 'blood_pressure_dia'],
  spO2Percent: ['vitals', 'spo2_percent'],
  coreBodyTempC: ['vitals', 'core_body_temp_c'],
  cabinCo2Ppm: ['environment', 'cabin_co2_ppm'],
  cabinPressureKPa: ['environment', 'cabin_pressure_kpa'],
  dailyRadiationRateMSv: ['environment', 'daily_radiation_msv'],
  accumulatedRadiationMSv: ['environment', 'accumulated_radiation_msv'],
  sleepHoursLast24h: ['wellbeing', 'sleep_hours_last_24h'],
  sleepQualityPercent: ['wellbeing', 'sleep_quality_percent'],
  fatigueLevel: ['wellbeing', 'fatigue_level'],
  isolationStressScore: ['wellbeing', 'isolation_stress_score']
};

function rowToTelemetry(r) {
  const t = { vitals: {}, environment: {}, wellbeing: {} };
  Object.entries(COLS).forEach(([key, [group, col]]) => { t[group][key] = r[col]; });
  return t;
}

const iso = (d) => new Date(d).toISOString();

async function init() {
  const c = cfg();
  try {
    const boot = await mysql.createConnection({ host: c.host, port: c.port, user: c.user, password: c.password });
    await boot.query(`CREATE DATABASE IF NOT EXISTS \`${c.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await boot.end();
  } catch (err) {
    console.warn(`[db] could not create database automatically (${err.message}). Assuming it already exists.`);
  }
  pool = mysql.createPool({ ...c, waitForConnections: true, connectionLimit: 10, timezone: 'Z', charset: 'utf8mb4' });
  await pool.query('SELECT 1'); // fail fast with a clear error

  const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8')
    .split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  for (const stmt of sql.split(';').map((s) => s.trim()).filter(Boolean)) await pool.query(stmt);
  // upgrade older databases created before the weekly reminder existed
  const [col] = await pool.query(
    "SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = ? AND table_name = 'astronauts' AND column_name = 'last_weekly_email_at'", [c.database]);
  if (!col[0].n) await pool.query('ALTER TABLE astronauts ADD COLUMN last_weekly_email_at BIGINT NOT NULL DEFAULT 0');
  console.log(`[db] connected to MySQL database "${c.database}" on ${c.host}:${c.port}`);
}

const q = async (sql, params) => (await pool.query(sql, params))[0];

// ---------- astronauts ----------
const findByEmail = async (email) =>
  (await q('SELECT * FROM astronauts WHERE email = ? LIMIT 1', [String(email || '').trim().toLowerCase()]))[0] || null;
const findById = async (id) =>
  (await q('SELECT * FROM astronauts WHERE id = ? LIMIT 1', [id]))[0] || null;

const insertReadingSql = `INSERT INTO health_readings
  (astronaut_id, recorded_at, groups_updated, heart_rate_bpm, blood_pressure_sys, blood_pressure_dia, spo2_percent,
   core_body_temp_c, cabin_co2_ppm, cabin_pressure_kpa, daily_radiation_msv, accumulated_radiation_msv,
   sleep_hours_last_24h, sleep_quality_percent, fatigue_level, isolation_stress_score, health_score, overall_status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

function readingParams(id, telemetry, evaluation, groups) {
  const v = telemetry.vitals, e = telemetry.environment, w = telemetry.wellbeing;
  return [id, new Date(), groups, v.heartRateBpm, v.bloodPressureSys, v.bloodPressureDia, v.spO2Percent, v.coreBodyTempC,
    e.cabinCo2Ppm, e.cabinPressureKPa, e.dailyRadiationRateMSv, e.accumulatedRadiationMSv,
    w.sleepHoursLast24h, w.sleepQualityPercent, w.fatigueLevel, w.isolationStressScore,
    evaluation.score, evaluation.overallStatus];
}

async function createAstronaut(a, telemetry, evaluation) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('INSERT INTO astronauts (id, name, email, role, password_hash) VALUES (?, ?, ?, ?, ?)',
      [a.id, a.name, a.email, a.role, a.passwordHash]);
    await conn.query(insertReadingSql, readingParams(a.id, telemetry, evaluation, ''));
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function updateProfile(id, f) {
  await q(`UPDATE astronauts SET name = ?, role = ?, age = ?, height_cm = ?, weight_kg = ?,
           emergency_name = ?, emergency_phone = ?, notes = ? WHERE id = ?`,
  [f.name, f.role, f.age === '' ? null : f.age, f.heightCm === '' ? null : f.heightCm,
    f.weightKg === '' ? null : f.weightKg, f.emergencyName, f.emergencyPhone, f.notes, id]);
}
const setEnvironment = (id, env) => q('UPDATE astronauts SET mission_env = ? WHERE id = ?', [env, id]);
const setPassword = (id, hash) => q('UPDATE astronauts SET password_hash = ? WHERE id = ?', [hash, id]);

// password reset code (stored hashed)
const setResetCode = (id, hash, expiresAt) =>
  q('UPDATE astronauts SET reset_code_hash = ?, reset_expires_at = ?, reset_attempts = 0 WHERE id = ?', [hash, expiresAt, id]);
const clearResetCode = (id) =>
  q('UPDATE astronauts SET reset_code_hash = NULL, reset_expires_at = NULL, reset_attempts = 0 WHERE id = ?', [id]);
const bumpResetAttempts = (id) => q('UPDATE astronauts SET reset_attempts = reset_attempts + 1 WHERE id = ?', [id]);

// ---------- readings ----------
async function addReading(id, telemetry, evaluation, groups) {
  await q(insertReadingSql, readingParams(id, telemetry, evaluation, groups));
}

async function latestReading(id) {
  const r = (await q('SELECT * FROM health_readings WHERE astronaut_id = ? ORDER BY id DESC LIMIT 1', [id]))[0];
  if (!r) return null;
  return { at: iso(r.recorded_at), telemetry: rowToTelemetry(r), score: r.health_score, overallStatus: r.overall_status };
}

async function getHistory(id, limit = 60) {
  const rows = await q('SELECT * FROM health_readings WHERE astronaut_id = ? ORDER BY id DESC LIMIT ?', [id, limit]);
  return rows.reverse().map((r) => ({
    at: iso(r.recorded_at), score: r.health_score, overallStatus: r.overall_status, telemetry: rowToTelemetry(r)
  }));
}

// Only readings the astronaut really entered (not starting values, not scenarios).
async function getActivity(id) {
  const rows = await q(
    `SELECT recorded_at, groups_updated, health_score FROM health_readings
     WHERE astronaut_id = ? AND groups_updated NOT IN ('', 'scenario') ORDER BY id DESC LIMIT 2000`, [id]);
  return rows.map((r) => ({ at: iso(r.recorded_at), groups: r.groups_updated.split(','), score: r.health_score }));
}

// ---------- symptoms ----------
async function addSymptom(id, s) {
  const [res] = await pool.query('INSERT INTO symptoms (astronaut_id, symptom, label, severity, note) VALUES (?, ?, ?, ?, ?)',
    [id, s.symptom, s.label, s.severity, s.note]);
  return { id: res.insertId, at: new Date().toISOString(), symptom: s.symptom, label: s.label, severity: s.severity, note: s.note };
}
async function getSymptoms(id, limit = 20) {
  const rows = await q('SELECT * FROM symptoms WHERE astronaut_id = ? ORDER BY id DESC LIMIT ?', [id, limit]);
  return rows.map((r) => ({ id: r.id, at: iso(r.logged_at), symptom: r.symptom, label: r.label, severity: r.severity, note: r.note }));
}
const countSymptoms = async (id) => (await q('SELECT COUNT(*) AS n FROM symptoms WHERE astronaut_id = ?', [id]))[0].n;

// ---------- background audit ----------
async function listForAudit() {
  const rows = await q(`SELECT a.id, a.name, a.email, a.role, a.last_alert_email_at, a.last_weekly_email_at, a.mission_env, r.*
    FROM astronauts a JOIN health_readings r ON r.id = (SELECT MAX(id) FROM health_readings WHERE astronaut_id = a.id)`);
  return rows.map((r) => ({
    id: r.astronaut_id, name: r.name, email: r.email, role: r.role,
    lastAlertEmailAt: Number(r.last_alert_email_at), lastWeeklyEmailAt: Number(r.last_weekly_email_at), telemetry: rowToTelemetry(r)
  }));
}
const setLastAlertEmailAt = (id, ts) => q('UPDATE astronauts SET last_alert_email_at = ? WHERE id = ?', [ts, id]);

const setLastWeeklyEmailAt = (id, ts) => q('UPDATE astronauts SET last_weekly_email_at = ? WHERE id = ?', [ts, id]);

module.exports = {
  init, clone, setLastWeeklyEmailAt,
  findByEmail, findById, createAstronaut, updateProfile, setEnvironment, setPassword,
  setResetCode, clearResetCode, bumpResetAttempts,
  addReading, latestReading, getHistory, getActivity,
  addSymptom, getSymptoms, countSymptoms,
  listForAudit, setLastAlertEmailAt
};
