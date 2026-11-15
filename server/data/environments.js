// server/data/environments.js
// Mission environments the astronaut can switch between. The health limits stay the same
// (they come from NASA-STD-3001); what changes is the context, the gravity and the tips.
const environments = {
  station: {
    label: 'Space station', vessel: 'Orbital station (ISS-like)', gravity: 'Microgravity (about 0 g)',
    summary: 'Low Earth orbit, ordered resupply, Earth is a few hours away in an emergency.',
    tips: [
      'Exercise about 2 hours a day (treadmill, bike and resistance device) to protect bones and muscles.',
      'Check cabin CO2 near your sleep station: air does not circulate by itself without gravity.',
      'Fluids shift towards the head: report blurred vision early.'
    ]
  },
  spacecraft: {
    label: 'Spacecraft (transit)', vessel: 'Crew capsule on the way to the Moon or Mars', gravity: 'Microgravity (about 0 g)',
    summary: 'Small volume, no quick return. Radiation exposure is highest outside Earth\'s magnetic field.',
    tips: [
      'Know where your best-shielded area is before a solar storm starts.',
      'Small cabin: watch CO2 and humidity more often than on a large station.',
      'Keep a strict sleep schedule; the daylight cycle is artificial.'
    ]
  },
  rover: {
    label: 'Planetary rover', vessel: 'Pressurised surface rover', gravity: 'Partial gravity (Moon 0.17 g, Mars 0.38 g)',
    summary: 'Short trips away from the base with a very small cabin and limited consumables.',
    tips: [
      'Cabin air volume is tiny: CO2 can rise within minutes, check it every hour.',
      'Plan every trip so you can return to base before a radiation storm arrives.',
      'Drink on schedule; heavy suits and dust hide thirst.'
    ]
  },
  moon: {
    label: 'Moon base', vessel: 'Lunar surface habitat', gravity: 'Partial gravity (0.17 g)',
    summary: 'Communication delay is only about 1.3 seconds, so doctors on Earth can still support you in real time.',
    tips: [
      'Lunar dust irritates eyes and lungs: clean suits in the airlock and report coughing.',
      'Radiation: surface habitats should be covered by regolith; limit time outside.',
      'Keep exercising: 0.17 g is not enough to protect your bones.'
    ]
  },
  mars: {
    label: 'Mars base', vessel: 'Martian surface habitat', gravity: 'Partial gravity (0.38 g)',
    summary: 'One-way messages take 4 to 24 minutes, so you must act on your own first, then report.',
    tips: [
      'You are the first doctor: re-measure and follow the action protocol before waiting for Earth.',
      'Isolation is long (months): plan regular calls, hobbies and crew time to protect your mood.',
      'Dust storms can cut power and light for weeks: watch sleep and stress closely.'
    ]
  }
};
module.exports = { environments };
