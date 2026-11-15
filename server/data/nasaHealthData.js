// server/data/nasaHealthData.js
// Static data. Runtime data (astronauts, readings, symptoms) lives in MySQL (db/store.js).

const ROLES = ['Flight Specialist', 'Commander', 'Pilot', 'Flight Engineer', 'Mission Specialist'];

const missionInfo = {
  missionId: 'LUNAR-GATEWAY-DEMO',
  vessel: 'Orion Crew Module / Lunar Gateway (simulated)',
  daysInSpace: 114,
  status: 'Simulated telemetry stream',
  note: 'All data in this prototype is simulated. No real astronaut data is used.'
};

// Starting values for a newly created account (simulated).
const defaultTelemetry = () => ({
  vitals: { heartRateBpm: 72, bloodPressureSys: 118, bloodPressureDia: 76, spO2Percent: 98, coreBodyTempC: 36.8 },
  environment: { accumulatedRadiationMSv: 5.2, dailyRadiationRateMSv: 0.45, cabinCo2Ppm: 2200, cabinPressureKPa: 101.3 },
  wellbeing: { sleepHoursLast24h: 7.8, sleepQualityPercent: 88, fatigueLevel: 'LOW', isolationStressScore: 2 }
});

// One-click scenarios so the demo can show every alert level.
const scenarios = {
  nominal: {
    label: 'All nominal',
    description: 'Everything inside the baseline.',
    patch: defaultTelemetry()
  },
  hypoxia: {
    label: 'Low blood oxygen',
    description: 'SpO2 drops and heart rate climbs.',
    patch: { vitals: { spO2Percent: 89, heartRateBpm: 112 } }
  },
  highCo2: {
    label: 'High cabin CO2',
    description: 'Scrubber problem raises CO2 in the cabin.',
    patch: { environment: { cabinCo2Ppm: 4600 }, wellbeing: { fatigueLevel: 'MODERATE' } }
  },
  solarStorm: {
    label: 'Solar particle event',
    description: 'Radiation dose rate spikes.',
    patch: { environment: { dailyRadiationRateMSv: 6.5, accumulatedRadiationMSv: 92.0 } }
  },
  sleepLoss: {
    label: 'Sleep loss & stress',
    description: 'Two short nights and rising isolation stress.',
    patch: { wellbeing: { sleepHoursLast24h: 4.5, sleepQualityPercent: 45, fatigueLevel: 'HIGH', isolationStressScore: 7 } }
  }
};

// Symptom self-report guide. `advice` is what the astronaut should do next.
const symptomGuide = {
  headache: {
    label: 'Headache',
    advice: 'Check the cabin CO2 reading first - headaches are the classic CO2 symptom on the ISS. Hydrate, rest, and report if it lasts more than 24 hours.'
  },
  vision_change: {
    label: 'Blurred or changing vision',
    advice: 'Report to the Flight Surgeon at the next private medical conference. Vision changes in long-duration flight can be linked to spaceflight-associated neuro-ocular syndrome (SANS).'
  },
  nausea: {
    label: 'Nausea / dizziness',
    advice: 'Common in the first days of microgravity. Limit sudden head movements, hydrate, and report if it persists beyond 72 hours.'
  },
  muscle_bone_pain: {
    label: 'Back, muscle or bone pain',
    advice: 'Review your resistance-exercise countermeasure schedule (ARED) and posture. Report persistent pain so bone and muscle loss can be monitored.'
  },
  skin_rash: {
    label: 'Skin irritation / rash',
    advice: 'Keep the area clean and dry, photograph it for the medical log, and report it - the closed cabin environment can aggravate skin problems.'
  },
  insomnia: {
    label: 'Trouble sleeping',
    advice: 'Keep a fixed sleep schedule, dim cabin lights before rest, and log hours in the wellbeing panel. Report if you sleep under 6 hours on two nights in a row.'
  },
  low_mood: {
    label: 'Low mood / irritability',
    advice: 'Schedule a private call with family or the behavioural health team. Isolation and confinement are expected stressors - reaching out early helps.'
  },
  chest_pain: {
    label: 'Chest pain / shortness of breath',
    advice: 'URGENT: stop activity, check SpO2 and cabin CO2, and contact the Flight Surgeon immediately.',
    urgent: true
  },
  other: {
    label: 'Other symptom',
    advice: 'Describe it in the note and report it to the Flight Surgeon at your next medical conference.'
  }
};

// Official NASA resources used as the basis for baselines and context.
const nasaReferences = [
  {
    name: 'NASA Open Science Data Repository (OSDR) - RadLab ISS radiation data',
    url: 'https://visualization.osdr.nasa.gov/radlab/',
    usage: 'LIVE DATA: real absorbed dose rate measured by the DosTel detectors on the ISS (1 March 2022), loaded through the RadLab API and shown next to the astronaut\'s radiation readings.'
  },
  {
    name: 'NASA-STD-3001 Technical Brief: Design for Ionizing Radiation Protection (OCHMO-TB-020)',
    url: 'https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf',
    usage: 'Career radiation limit (600 mSv), short-term SPE limit and GCR dose-rate limits used for the radiation alerts.'
  },
  {
    name: 'NASA NTRS: Effects of CO2 on ISS crew (Law & Alexander)',
    url: 'https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20150019624.pdf',
    usage: 'Crew symptoms from 2.3 mmHg CO2 and the 3.0 mmHg ISS operational limit used for the CO2 alerts.'
  },
  {
    name: 'NASA NTRS: Spacecraft Maximum Allowable Concentration for CO2',
    url: 'https://ntrs.nasa.gov/citations/20100036637',
    usage: '180-day CO2 SMAC (5.3 mmHg, about 0.7%) used for the critical CO2 level.'
  },
  {
    name: 'NASA Life Sciences Data Archive (LSDA)',
    url: 'https://lsda.jsc.nasa.gov',
    usage: 'Listed only: historical astronaut data, a possible source of individual baselines. No LSDA data is loaded yet.'
  },
  {
    name: 'NASA Human Research Program (HRP) - Human Research Roadmap',
    url: 'https://humanresearchroadmap.nasa.gov',
    usage: 'Spaceflight risks: radiation, altered gravity, isolation and confinement, hostile/closed environment, sleep and behavioural health.'
  },
  {
    name: 'NASA GeneLab Open Data',
    url: 'https://genelab.nasa.gov',
    usage: 'Listed only: microgravity biology data, a planned input for immune and bone/muscle indicators. No GeneLab data is loaded yet.'
  }
];

module.exports = { ROLES, missionInfo, defaultTelemetry, scenarios, symptomGuide, nasaReferences };
