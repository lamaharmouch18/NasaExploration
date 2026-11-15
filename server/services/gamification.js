// server/services/gamification.js
// Points, daily streak, level and badges. Built only from readings the astronaut really entered.
const dayKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`; };

function currentStreak(activity) {
  const days = new Set(activity.map((a) => dayKey(a.at)));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1); // today may not be logged yet
  while (days.has(dayKey(cursor))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

function buildGamification({ activity, symptomCount, latestScore }) {
  const entries = activity.length;
  const streak = currentStreak(activity);
  const fullCheckups = new Set(
    activity.filter((a) => ['vitals', 'environment', 'wellbeing'].every((g) => a.groups.includes(g))).map((a) => dayKey(a.at))
  ).size;
  const bestScore = activity.reduce((m, a) => Math.max(m, a.score), 0);

  const xp = entries * 10 + fullCheckups * 20 + symptomCount * 5 + streak * 15;
  const level = Math.floor(xp / 100) + 1;
  const badges = [
    { id: 'first', label: 'First check', description: 'Save your first readings.', earned: entries >= 1 },
    { id: 'streak3', label: '3-day streak', description: 'Log readings 3 days in a row.', earned: streak >= 3 },
    { id: 'streak7', label: '7-day streak', description: 'Log readings 7 days in a row.', earned: streak >= 7 },
    { id: 'full', label: 'Full check-up', description: 'Fill body, habitat and wellbeing in one day.', earned: fullCheckups >= 1 },
    { id: 'peak', label: 'Peak condition', description: 'Reach a health score of 90 or more.', earned: bestScore >= 90 },
    { id: 'honest', label: 'Honest reporter', description: 'Log a symptom.', earned: symptomCount >= 1 },
    { id: 'ten', label: 'Mission regular', description: 'Save 10 sets of readings.', earned: entries >= 10 }
  ];
  return { xp, level, levelProgress: xp % 100, streak, entries, fullCheckups, latestScore, badges };
}

module.exports = { buildGamification };
