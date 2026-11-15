// server/services/reminders.js
// Routine prompts: which health checks are due, based on when each group was last really measured.
const HOUR = 3600 * 1000;
const ROUTINES = [
  { group: 'vitals', title: 'Body vitals check', everyHours: 24, what: 'Heart rate, blood pressure, SpO2 and temperature.' },
  { group: 'environment', title: 'Habitat sensor check', everyHours: 12, what: 'Cabin CO2, pressure and radiation dose.' },
  { group: 'wellbeing', title: 'Sleep and mood check-in', everyHours: 24, what: 'Sleep hours, quality, fatigue and stress.' }
];

function buildReminders(activity) {
  const now = Date.now();
  return ROUTINES.map((r) => {
    const last = activity.find((a) => a.groups.includes(r.group)); // activity is newest first
    const lastAt = last ? last.at : null;
    const ageH = lastAt ? (now - new Date(lastAt).getTime()) / HOUR : null;
    const due = ageH === null || ageH >= r.everyHours;
    return { ...r, lastAt, due, overdue: ageH !== null && ageH >= r.everyHours * 2, ageHours: ageH === null ? null : Math.floor(ageH) };
  });
}
module.exports = { buildReminders };
