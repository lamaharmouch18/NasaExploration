// server/data/nasaBaselines.js
//
// Health baselines and alert thresholds used by the evaluation engine.
//
// Every band follows the same convention (all comparisons are strict):
//   value < low.critical  -> CRITICAL      value > high.critical -> CRITICAL
//   value < low.warning   -> WARNING       value > high.warning  -> WARNING
//   value < low.advisory  -> ADVISORY      value > high.advisory -> ADVISORY
//
// `basis` says where a number comes from, so judges (and you) can tell the
// difference between a NASA published limit and a prototype threshold:
//   "NASA"      = taken from a NASA standard / NASA technical report
//   "CLINICAL"  = standard adult clinical reference range
//   "PROTOTYPE" = chosen by this project for demonstration purposes
//
// IMPORTANT: this is an educational prototype. In real operations the limits
// come from the NASA Flight Surgeon / Medical Operations and are personalised
// per crew member (individual in-flight baselines from NASA LSDA).

const BASELINES = {
  heartRateBpm: {
    label: 'Heart rate (resting)', unit: 'bpm', group: 'vitals', normal: '60 – 100',
    low: { advisory: 50, warning: 45, critical: 40 },
    high: { advisory: 100, warning: 120, critical: 150 },
    basis: 'CLINICAL',
    source: 'Adult resting heart rate reference; replace with individual baseline from NASA LSDA'
  },
  bloodPressureSys: {
    label: 'Systolic blood pressure', unit: 'mmHg', group: 'vitals', normal: '100 – 130',
    low: { advisory: 100, warning: 90, critical: 80 },
    high: { advisory: 130, warning: 140, critical: 180 },
    basis: 'CLINICAL',
    source: 'Adult blood pressure reference ranges'
  },
  bloodPressureDia: {
    label: 'Diastolic blood pressure', unit: 'mmHg', group: 'vitals', normal: '60 – 85',
    low: { advisory: 60, warning: 50, critical: 40 },
    high: { advisory: 85, warning: 90, critical: 120 },
    basis: 'CLINICAL',
    source: 'Adult blood pressure reference ranges'
  },
  spO2Percent: {
    label: 'Blood oxygen (SpO2)', unit: '%', group: 'vitals', normal: '95 – 100',
    low: { advisory: 95, warning: 92, critical: 90 },
    high: {},
    basis: 'CLINICAL',
    source: 'Pulse oximetry reference ranges (cabin is kept near 21% O2 at 101.3 kPa)'
  },
  coreBodyTempC: {
    label: 'Core body temperature', unit: '°C', group: 'vitals', normal: '36.0 – 37.5',
    low: { advisory: 36.0, warning: 35.5, critical: 35.0 },
    high: { advisory: 37.5, warning: 38.0, critical: 39.5 },
    basis: 'CLINICAL',
    source: 'Adult body temperature reference ranges'
  },

  cabinCo2Ppm: {
    label: 'Cabin CO2', unit: 'ppm', group: 'environment', normal: 'below 3,000',
    low: {},
    // 1 mmHg of ppCO2 is about 1,316 ppm at 760 mmHg.
    // advisory : ~2.3 mmHg - crew on ISS began reporting CO2 symptoms around here
    // warning  : ~3.0 mmHg - ISS operational (flight rule) limit
    // critical : ~5.3 mmHg - NASA 180-day Spacecraft Maximum Allowable Concentration
    high: { advisory: 3000, warning: 3900, critical: 7000 },
    basis: 'NASA',
    source: 'NASA NTRS 20150019624 (symptoms from 2.3 mmHg, ISS operational limit 3.0 mmHg); NTRS 20100036637 (180-day SMAC 5.3 mmHg)'
  },
  cabinPressureKPa: {
    label: 'Cabin pressure', unit: 'kPa', group: 'environment', normal: '98 – 104',
    low: { advisory: 98, warning: 94, critical: 85 },
    high: { advisory: 104, warning: 106, critical: 110 },
    basis: 'PROTOTYPE',
    source: 'Prototype band around the ISS nominal cabin pressure of 14.7 psia (101.3 kPa)'
  },
  dailyRadiationRateMSv: {
    label: 'Radiation dose rate', unit: 'mSv/day', group: 'environment', normal: 'below 0.7',
    low: {},
    // 1.3 mSv/day is the NASA-STD-3001 GCR design limit for free space
    // (about 0.8 - 0.9 on a planetary surface). 5+ mSv/day is used here as a
    // prototype trigger for a solar-particle-event style spike.
    high: { advisory: 0.7, warning: 1.3, critical: 5 },
    basis: 'NASA',
    source: 'NASA-STD-3001 Vol. 1 Rev B: GCR limit 1.3 mSv/day in free space; SPE trigger is a prototype value'
  },
  accumulatedRadiationMSv: {
    label: 'Accumulated mission dose', unit: 'mSv', group: 'environment', normal: 'below 300 (50% of career limit)',
    low: {},
    // NASA-STD-3001 [V1 4030]: career effective dose shall be less than 600 mSv.
    // This prototype tracks the dose of this mission only (assumes a first flight).
    high: { advisory: 300, warning: 480, critical: 600 },
    basis: 'NASA',
    source: 'NASA-STD-3001 Vol. 1 Rev B [V1 4030]: career effective dose limit 600 mSv (advisory at 50%, warning at 80%)'
  },

  sleepHoursLast24h: {
    label: 'Sleep (last 24 h)', unit: 'h', group: 'wellbeing', normal: '7 – 9',
    low: { advisory: 7, warning: 6, critical: 4 },
    high: {},
    basis: 'PROTOTYPE',
    source: 'Prototype bands informed by the NASA HRP risk "Sleep Loss, Circadian Desynchronization and Work Overload"'
  },
  sleepQualityPercent: {
    label: 'Sleep quality', unit: '%', group: 'wellbeing', normal: '70 – 100',
    low: { advisory: 70, warning: 50, critical: 30 },
    high: {},
    basis: 'PROTOTYPE',
    source: 'Prototype self-reported / wearable sleep quality score'
  },
  isolationStressScore: {
    label: 'Isolation & stress', unit: '/10', group: 'wellbeing', normal: '1 – 4',
    low: {},
    high: { advisory: 4, warning: 6, critical: 8 },
    basis: 'PROTOTYPE',
    source: 'Prototype self-report scale (1 = calm, 10 = severe); NASA HRP Behavioral Health & Performance risks'
  }
};

// Fatigue is a category, not a number.
const FATIGUE_LEVELS = ['LOW', 'MODERATE', 'HIGH'];

// Plausible input ranges. Anything outside is rejected as a sensor / typing error
// (these are NOT alert thresholds).
const INPUT_LIMITS = {
  heartRateBpm: [20, 250],
  bloodPressureSys: [50, 260],
  bloodPressureDia: [30, 160],
  spO2Percent: [50, 100],
  coreBodyTempC: [30, 43],
  accumulatedRadiationMSv: [0, 2000],
  dailyRadiationRateMSv: [0, 500],
  cabinCo2Ppm: [200, 30000],
  cabinPressureKPa: [40, 130],
  sleepHoursLast24h: [0, 24],
  sleepQualityPercent: [0, 100],
  isolationStressScore: [1, 10]
};

const CAREER_RADIATION_LIMIT_MSV = 600;

module.exports = { BASELINES, FATIGUE_LEVELS, INPUT_LIMITS, CAREER_RADIATION_LIMIT_MSV };
