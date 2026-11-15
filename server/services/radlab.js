// server/services/radlab.js
// REAL NASA DATA: radiation measured on the International Space Station, from NASA's Open Science
// Data Repository (OSDR) RadLab API: https://visualization.osdr.nasa.gov/radlab/gui/data-api
// We ask for the absorbed dose rate (microGray per hour) of the DosTel detectors on the ISS for one
// documented day (1 March 2022) and compute the mean. The result is cached for 24 hours.
// If NASA's service cannot be reached, the app keeps working and shows "unavailable".
const BASE = 'https://visualization.osdr.nasa.gov/radlab/api/';
const DAY_FROM = '2022-03-01';
const DAY_TO = '2022-03-02';
const TTL_MS = 24 * 60 * 60 * 1000;

let cache = null;

function parseCsv(text) {
  const rows = String(text).trim().split(/\r?\n/).map((l) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
  if (rows.length < 2) return [];
  const head = rows[0].map((h) => h.toLowerCase());
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

// Pure function (easy to test): rows from the API -> summary.
function summarize(rows) {
  const values = rows.map((r) => Number(r.absorbed_dose_rate)).filter((v) => Number.isFinite(v) && v >= 0);
  if (!values.length) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length; // microGray per hour
  const instruments = [...new Set(rows.map((r) => r.instrument_id).filter(Boolean))];
  return {
    samples: values.length,
    meanMicroGrayPerHour: Number(mean.toFixed(2)),
    meanMilliGrayPerDay: Number(((mean * 24) / 1000).toFixed(3)),
    maxMicroGrayPerHour: Number(Math.max(...values).toFixed(2)),
    instruments
  };
}

async function getIssRadiation() {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  const url = `${BASE}?spacecraft=ISS&instrument=DosTel&timestamp%3E=${DAY_FROM}&timestamp%3C${DAY_TO}&absorbed_dose_rate&format=csv`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`RadLab answered ${res.status}`);
    const summary = summarize(parseCsv(await res.text()));
    if (!summary) throw new Error('RadLab returned no usable rows');
    const data = {
      available: true,
      source: 'NASA OSDR RadLab',
      sourceUrl: 'https://visualization.osdr.nasa.gov/radlab/',
      detector: 'DosTel (ISS)',
      day: DAY_FROM,
      ...summary
    };
    cache = { at: Date.now(), data };
    return data;
  } catch (err) {
    console.warn(`[radlab] could not load NASA data: ${err.message}`);
    return { available: false, source: 'NASA OSDR RadLab', sourceUrl: 'https://visualization.osdr.nasa.gov/radlab/' };
  }
}

module.exports = { getIssRadiation, summarize, parseCsv };
