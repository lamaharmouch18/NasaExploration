// server/data/guides.js
// Step-by-step help for people who are NOT doctors: how to take the measurement,
// why it matters, and what the risk is. Shown on every indicator card and in the report.
const guides = {
  heartRateBpm: {
    how: ['Sit or float still for 5 minutes.', 'Place two fingers on the inside of your wrist (or use your wearable).', 'Count the beats for 30 seconds and multiply by 2.'],
    why: 'Shows how hard your heart works. It rises with stress, dehydration, fever or low oxygen.',
    risk: 'Very high or very low rates can mean heart rhythm problems.'
  },
  bloodPressureSys: {
    how: ['Rest 5 minutes, sit upright (or secure yourself) with the cuff at heart height.', 'Start the cuff and stay still and silent.', 'Write the TOP number here (systolic).'],
    why: 'The pressure when the heart pumps. Fluids shift upward in microgravity, so it can change.',
    risk: 'High pressure strains the heart and vessels; very low pressure causes fainting.'
  },
  bloodPressureDia: {
    how: ['Use the same measurement as above.', 'Write the BOTTOM number here (diastolic).'],
    why: 'The pressure while the heart relaxes between beats.',
    risk: 'Stays high when vessels are stiff or stressed.'
  },
  spO2Percent: {
    how: ['Warm your hands, remove nail polish.', 'Clip the pulse oximeter on a finger and keep the hand still.', 'Read the value after it is stable for 10 seconds.'],
    why: 'Tells you how much oxygen your blood carries.',
    risk: 'Below 92% means your body is short of oxygen (hypoxia): check cabin air and suit flow.'
  },
  coreBodyTempC: {
    how: ['Use the ear or forehead thermometer from the medical kit.', 'Measure at rest, not right after exercise.', 'Record the value in degrees Celsius.'],
    why: 'Fever can mean infection; the closed cabin helps germs spread.',
    risk: 'High temperature can mean infection or heat stress; low temperature means a thermal control problem.'
  },
  cabinCo2Ppm: {
    how: ['Read the cabin CO2 sensor closest to where you work or sleep.', 'Enter the value in parts per million (ppm).'],
    why: 'In microgravity exhaled CO2 forms a bubble around your head if air does not move.',
    risk: 'Headache and tiredness start around 3,000 ppm; higher levels affect thinking and breathing.'
  },
  cabinPressureKPa: {
    how: ['Read the cabin pressure gauge.', 'Enter it in kilopascals (kPa). Normal sea-level pressure is 101.3 kPa.'],
    why: 'Your lungs need the right pressure to take up oxygen.',
    risk: 'A falling value may mean a leak: act early.'
  },
  dailyRadiationRateMSv: {
    how: ['Read your personal dosimeter or the habitat radiation monitor.', 'Enter the dose of the last 24 hours in mSv.'],
    why: 'Space radiation damages cells and raises the lifetime risk of cancer.',
    risk: 'Sudden spikes may be a solar particle event: go to the shelter.'
  },
  accumulatedRadiationMSv: {
    how: ['Read the total dose on your dosimeter since mission start.', 'Enter it in mSv.'],
    why: 'NASA limits a career dose to 600 mSv.',
    risk: 'As you get close to the limit, future missions and spacewalks must be restricted.'
  },
  sleepHoursLast24h: {
    how: ['Check your sleep tracker or estimate honestly how long you slept in the last 24 hours.'],
    why: 'Sleep protects attention, mood and the immune system.',
    risk: 'Under 6 hours makes mistakes more likely during complex tasks such as spacewalks.'
  },
  sleepQualityPercent: {
    how: ['Use your wearable score, or rate how rested you feel from 0 (awful) to 100 (perfect).'],
    why: 'Noise, light and CO2 can spoil sleep even when hours look fine.',
    risk: 'Low quality over several days is an early sign of stress or a habitat problem.'
  },
  fatigueLevel: {
    how: ['Pick LOW if you feel alert, MODERATE if you need effort to concentrate, HIGH if you struggle to stay focused.'],
    why: 'Fatigue slows reactions and reasoning.',
    risk: 'High fatigue means postponing risky tasks.'
  },
  isolationStressScore: {
    how: ['Rate your stress from 1 (calm) to 10 (severe).', 'Think about mood, irritability, and how well you can talk to the crew.'],
    why: 'Isolation and confinement are the main behavioural risks of long missions.',
    risk: 'Scores of 7 or more should be shared with the behavioural health team.'
  }
};
module.exports = { guides };
