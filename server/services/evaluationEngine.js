// server/services/evaluationEngine.js
//
// Turns raw telemetry into:
//   - metrics : every indicator with its value, normal range and status
//   - alerts  : what is wrong, why, and the action the astronaut should take
//   - score   : 0-100 overall health score
//   - overallStatus : NOMINAL | ADVISORY | WARNING | CRITICAL

const { BASELINES, CAREER_RADIATION_LIMIT_MSV } = require('../data/nasaBaselines');

const RANK = { NOMINAL: 0, ADVISORY: 1, WARNING: 2, CRITICAL: 3 };
// Penalty points per finding. They are turned into a score with a smooth curve
// (see below) so many problems never just clamp the score to 0.
const PENALTY = { ADVISORY: 4, WARNING: 12, CRITICAL: 40 };

// Plain-language title, category and action for each metric and level.
// Actions are demo guidance for a student prototype, not real medical orders.
const TEXT = {
  heartRateBpm: {
    category: 'Cardiovascular',
    high: {
      ADVISORY: ['Heart rate slightly high', 'Rest for 10 minutes, hydrate, and re-measure.'],
      WARNING: ['Elevated heart rate', 'Stop strenuous activity, sit or float at rest, re-measure in 10 minutes and log any symptoms.'],
      CRITICAL: ['Dangerously high heart rate', 'Stop all activity and contact the Flight Surgeon now. Prepare the medical kit.']
    },
    low: {
      ADVISORY: ['Heart rate slightly low', 'Re-measure after light movement. Athletes often run low - compare with your personal baseline.'],
      WARNING: ['Low heart rate', 'Rest, hydrate, report any dizziness, and re-measure in 10 minutes.'],
      CRITICAL: ['Dangerously low heart rate', 'Contact the Flight Surgeon now and stay still.']
    }
  },
  bloodPressureSys: {
    category: 'Cardiovascular',
    high: {
      ADVISORY: ['Systolic pressure slightly high', 'Reduce salt and stimulants, rest, and re-measure later today.'],
      WARNING: ['High systolic blood pressure', 'Rest for 15 minutes, re-measure, and report if it stays above 140.'],
      CRITICAL: ['Hypertensive crisis range', 'Contact the Flight Surgeon immediately.']
    },
    low: {
      ADVISORY: ['Systolic pressure slightly low', 'Hydrate and avoid standing up or moving suddenly.'],
      WARNING: ['Low blood pressure', 'Lie down or secure yourself at rest, hydrate, and re-measure in 10 minutes.'],
      CRITICAL: ['Dangerously low blood pressure', 'Contact the Flight Surgeon now.']
    }
  },
  bloodPressureDia: {
    category: 'Cardiovascular',
    high: {
      ADVISORY: ['Diastolic pressure slightly high', 'Rest and re-measure later today.'],
      WARNING: ['High diastolic blood pressure', 'Rest for 15 minutes, re-measure, and report if it stays above 90.'],
      CRITICAL: ['Dangerously high diastolic pressure', 'Contact the Flight Surgeon immediately.']
    },
    low: {
      ADVISORY: ['Diastolic pressure slightly low', 'Hydrate and move slowly.'],
      WARNING: ['Low diastolic pressure', 'Rest, hydrate, and re-measure in 10 minutes.'],
      CRITICAL: ['Dangerously low diastolic pressure', 'Contact the Flight Surgeon now.']
    }
  },
  spO2Percent: {
    category: 'Respiratory',
    low: {
      ADVISORY: ['Blood oxygen slightly low', 'Breathe slowly, check cabin O2 and CO2, and re-measure in 10 minutes.'],
      WARNING: ['Low blood oxygen', 'Stop activity, check cabin O2/CO2 and suit or mask flow, and re-measure in 5 minutes.'],
      CRITICAL: ['Hypoxia risk', 'Switch to supplemental oxygen, stop all activity, and contact the Flight Surgeon now.']
    }
  },
  coreBodyTempC: {
    category: 'Thermal',
    high: {
      ADVISORY: ['Body temperature slightly high', 'Reduce activity, lower cabin temperature, and hydrate.'],
      WARNING: ['Possible fever', 'Rest, hydrate, log other symptoms, and report to the Flight Surgeon.'],
      CRITICAL: ['Very high body temperature', 'Cool down actively and contact the Flight Surgeon immediately.']
    },
    low: {
      ADVISORY: ['Body temperature slightly low', 'Add a layer and warm up.'],
      WARNING: ['Low body temperature', 'Warm up, check the suit or cabin thermal control, and re-measure in 15 minutes.'],
      CRITICAL: ['Hypothermia risk', 'Warm up immediately and contact the Flight Surgeon.']
    }
  },
  cabinCo2Ppm: {
    category: 'Cabin life support',
    high: {
      ADVISORY: ['Cabin CO2 rising', 'Increase cabin air circulation and check the CO2 scrubber. Watch for headaches.'],
      WARNING: ['Cabin CO2 above ISS operating limit', 'Inspect the CO2 scrubber, set cabin fans to high, and reduce exercise until levels drop.'],
      CRITICAL: ['Hypercapnia risk (CO2 at maximum allowable level)', 'Move to a well-ventilated module, use backup scrubbing, and contact Mission Control now.']
    }
  },
  cabinPressureKPa: {
    category: 'Cabin life support',
    high: {
      ADVISORY: ['Cabin pressure slightly high', 'Check the pressure control valve and re-read in 15 minutes.'],
      WARNING: ['High cabin pressure', 'Inspect pressure control and report to Mission Control.'],
      CRITICAL: ['Dangerous cabin overpressure', 'Report to Mission Control now and prepare to isolate the module.']
    },
    low: {
      ADVISORY: ['Cabin pressure slightly low', 'Check hatches and seals and re-read in 15 minutes.'],
      WARNING: ['Falling cabin pressure', 'Check for a leak, close hatches between modules, and report to Mission Control.'],
      CRITICAL: ['Possible depressurisation', 'Don suits, seal the module and follow the depressurisation procedure.']
    }
  },
  dailyRadiationRateMSv: {
    category: 'Space radiation',
    high: {
      ADVISORY: ['Radiation dose rate above typical level', 'Check the personal dosimeter and avoid unnecessary time near thin-shielded walls.'],
      WARNING: ['Radiation dose rate above the NASA GCR limit', 'Limit extravehicular activity and spend rest periods in the best-shielded area.'],
      CRITICAL: ['Possible solar particle event', 'Move to the storm shelter now, stay there until Mission Control gives the all-clear, and skip EVA.']
    }
  },
  accumulatedRadiationMSv: {
    category: 'Space radiation',
    high: {
      ADVISORY: ['Half of the career radiation limit used', 'Plan remaining exposure with the Flight Surgeon.'],
      WARNING: ['80% of the career radiation limit used', 'Mission planning must review further exposure. Avoid EVA where possible.'],
      CRITICAL: ['Career radiation limit reached', 'Stop planned exposure and contact Mission Control. Crew rotation must be reviewed.']
    }
  },
  sleepHoursLast24h: {
    category: 'Sleep & fatigue',
    low: {
      ADVISORY: ['Sleep slightly short', 'Aim for 8 hours tonight: dim cabin lights early and keep a fixed schedule.'],
      WARNING: ['Short sleep', 'Postpone complex tasks such as EVA and robotics. Protect a full sleep period tonight.'],
      CRITICAL: ['Severe sleep loss', 'Stand down from safety-critical tasks and report to the Flight Surgeon.']
    }
  },
  sleepQualityPercent: {
    category: 'Sleep & fatigue',
    low: {
      ADVISORY: ['Sleep quality below normal', 'Check noise, light and temperature around your sleep station.'],
      WARNING: ['Poor sleep quality', 'Review the sleep environment and discuss with the Flight Surgeon.'],
      CRITICAL: ['Very poor sleep quality', 'Report to the Flight Surgeon at the next opportunity.']
    }
  },
  isolationStressScore: {
    category: 'Behavioural health',
    high: {
      ADVISORY: ['Stress is building', 'Take a break, schedule a call with family, and keep exercise on the plan.'],
      WARNING: ['High isolation stress', 'Book a private call with the behavioural health team and talk with a crewmate.'],
      CRITICAL: ['Severe stress', 'Contact the behavioural health team now. Do not wait for the weekly conference.']
    }
  }
};

// Which crew field each metric reads from.
const GROUP_KEY = { vitals: 'vitals', environment: 'environment', wellbeing: 'wellbeing' };

function gradeNumber(value, def) {
  const { low = {}, high = {} } = def;
  if (low.critical != null && value < low.critical) return { status: 'CRITICAL', side: 'low' };
  if (low.warning != null && value < low.warning) return { status: 'WARNING', side: 'low' };
  if (low.advisory != null && value < low.advisory) return { status: 'ADVISORY', side: 'low' };
  if (high.critical != null && value > high.critical) return { status: 'CRITICAL', side: 'high' };
  if (high.warning != null && value > high.warning) return { status: 'WARNING', side: 'high' };
  if (high.advisory != null && value > high.advisory) return { status: 'ADVISORY', side: 'high' };
  return { status: 'NOMINAL', side: null };
}

const fmt = (v) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100));

function evaluateHealthStatus(telemetry) {
  const metrics = [];
  const alerts = [];

  Object.entries(BASELINES).forEach(([key, def]) => {
    const block = telemetry[GROUP_KEY[def.group]] || {};
    const value = Number(block[key]);
    if (!Number.isFinite(value)) return; // missing value: skip instead of crashing

    const { status, side } = gradeNumber(value, def);
    metrics.push({
      key, group: def.group, label: def.label, unit: def.unit, value,
      normal: def.normal, status, basis: def.basis, source: def.source
    });

    if (status !== 'NOMINAL') {
      const entry = TEXT[key]?.[side]?.[status];
      const [title, action] = entry || [`${def.label} out of range`, 'Re-measure and report to the Flight Surgeon.'];
      let finding = `${def.label} is ${fmt(value)} ${def.unit} (normal: ${def.normal}).`;
      if (key === 'accumulatedRadiationMSv') {
        const pct = Math.round((value / CAREER_RADIATION_LIMIT_MSV) * 100);
        finding = `Accumulated mission dose is ${fmt(value)} mSv, ${pct}% of the ${CAREER_RADIATION_LIMIT_MSV} mSv NASA career limit.`;
      }
      alerts.push({
        id: `ALERT-${key}`,
        metric: key,
        category: TEXT[key]?.category || def.group,
        severity: status,
        title,
        finding,
        actionProtocol: action,
        escalate: status === 'CRITICAL',
        basis: def.basis,
        source: def.source
      });
    }
  });

  // Fatigue is a category rather than a number.
  const fatigue = telemetry.wellbeing?.fatigueLevel;
  const fatigueStatus = fatigue === 'HIGH' ? 'WARNING' : fatigue === 'MODERATE' ? 'ADVISORY' : 'NOMINAL';
  if (fatigue) {
    metrics.push({
      key: 'fatigueLevel', group: 'wellbeing', label: 'Fatigue level', unit: '', value: fatigue,
      normal: 'LOW', status: fatigueStatus, basis: 'PROTOTYPE',
      source: 'Prototype self-reported fatigue scale'
    });
    if (fatigueStatus !== 'NOMINAL') {
      alerts.push({
        id: 'ALERT-fatigueLevel', metric: 'fatigueLevel', category: 'Sleep & fatigue', severity: fatigueStatus,
        title: fatigueStatus === 'WARNING' ? 'High cognitive fatigue' : 'Moderate fatigue',
        finding: `Self-reported fatigue is ${fatigue}.`,
        actionProtocol: fatigueStatus === 'WARNING'
          ? 'Postpone complex EVA and robotics tasks. Take a rest period and a 30-minute low-light wind-down before sleep.'
          : 'Plan lighter tasks and keep the sleep schedule fixed.',
        escalate: false, basis: 'PROTOTYPE', source: 'Prototype self-reported fatigue scale'
      });
    }
  }

  alerts.sort((a, b) => RANK[b.severity] - RANK[a.severity]);

  const overallStatus = alerts.length ? alerts[0].severity : 'NOMINAL';
  const penalty = alerts.reduce((sum, a) => sum + PENALTY[a.severity], 0);
  // 0 points -> 100, 50 points -> 50, 150 points -> 25 ... always between 0 and 100
  const score = Math.round(100 / (1 + penalty / 50));

  if (alerts.length === 0) {
    alerts.push({
      id: 'STATUS-OK', metric: null, category: 'System overview', severity: 'NOMINAL',
      title: 'All indicators within baseline',
      finding: 'Every measured indicator is inside its normal range.',
      actionProtocol: 'Keep to the daily countermeasure plan: resistance exercise (ARED), aerobic exercise, hydration and a full sleep period.',
      escalate: false, basis: 'NASA', source: 'NASA HRP countermeasures'
    });
  }

  return { overallStatus, score, alerts, metrics };
}

module.exports = { evaluateHealthStatus, RANK };
