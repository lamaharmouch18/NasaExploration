// server/services/healthMonitor.js
// Background audit: every few minutes check all astronauts and print an alert
// "email" (in the terminal) when something is WARNING or CRITICAL.
// At most one alert per astronaut per hour.
const store = require('../db/store');
const { evaluateHealthStatus, RANK } = require('./evaluationEngine');
const { sendEmail } = require('./mailer');
const { buildReport } = require('./report');
const { buildReminders } = require('./reminders');
const { buildGamification } = require('./gamification');

const ALERT_COOLDOWN_MS = 60 * 60 * 1000;

async function runAutomatedHealthCheck() {
  const now = Date.now();
  const list = await store.listForAudit();
  for (const crew of list) {
    const evaluation = evaluateHealthStatus(crew.telemetry);
    if (RANK[evaluation.overallStatus] < RANK.WARNING) continue;
    if (now - crew.lastAlertEmailAt < ALERT_COOLDOWN_MS) continue;
    await store.setLastAlertEmailAt(crew.id, now);
    await sendEmail(crew.email, `Health alert (${evaluation.overallStatus}): ${crew.name}`, buildReport(crew, evaluation));
  }
}

// ---------- weekly reminder email (default: every Friday from 09:00 server time) ----------
// Tells each astronaut their current status and which checks are due, with a link to the app,
// so they do not have to open the app just to find out. Demo accounts get no email.
const WEEK_MS = 6 * 24 * 60 * 60 * 1000;

async function runWeeklyReminders({ force = false } = {}) {
  const now = new Date();
  const day = Number(process.env.REMINDER_DAY ?? 5);   // 0=Sunday ... 5=Friday
  const hour = Number(process.env.REMINDER_HOUR ?? 9);
  if (!force && (now.getDay() !== day || now.getHours() < hour)) return 0;

  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  let sent = 0;
  for (const crew of await store.listForAudit()) {
    if (crew.email.endsWith('@demo.invalid')) continue;
    if (!force && Date.now() - crew.lastWeeklyEmailAt < WEEK_MS) continue;
    await store.setLastWeeklyEmailAt(crew.id, Date.now()); // mark first so a slow send is never repeated
    const evaluation = evaluateHealthStatus(crew.telemetry);
    const activity = await store.getActivity(crew.id);
    const due = buildReminders(activity).filter((r) => r.due);
    const game = buildGamification({ activity, symptomCount: await store.countSymptoms(crew.id), latestScore: evaluation.score });

    const lines = [
      `Hello ${crew.name},`, '',
      'Your weekly health check-in from Astronaut Health Monitor.', '',
      `Current status: ${evaluation.overallStatus}   Health score: ${evaluation.score}/100`
    ];
    evaluation.alerts.slice(0, 3).forEach((a) => lines.push(`  - [${a.severity}] ${a.title}: ${a.actionProtocol}`));
    lines.push('');
    if (due.length) {
      lines.push('Checks due now:');
      due.forEach((r) => lines.push(`  - ${r.title} (${r.what})`));
    } else {
      lines.push('All routine checks are up to date. Well done!');
    }
    lines.push('', `Streak: ${game.streak} day(s)   Level ${game.level}`, '',
      `Open Mission Control to log your readings and download your report: ${appUrl}`, '',
      'This is an educational prototype with simulated data. Not medical advice.');
    await sendEmail(crew.email, `Weekly health check-in: status ${evaluation.overallStatus}`, lines.join('\n'));
    sent += 1;
  }
  return sent;
}

function startScheduler(intervalMs = 14 * 60 * 1000) {
  const timer = setInterval(() => {
    runAutomatedHealthCheck().catch((err) => console.error('[AUDIT] failed:', err.message));
    runWeeklyReminders().catch((err) => console.error('[WEEKLY] failed:', err.message));
  }, intervalMs);
  runWeeklyReminders().catch((err) => console.error('[WEEKLY] failed:', err.message)); // also right at startup
  timer.unref();
  return timer;
}

module.exports = { runAutomatedHealthCheck, runWeeklyReminders, startScheduler };
