// server/server.js
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const store = require('./db/store');
const { nasaReferences, missionInfo } = require('./data/nasaHealthData');
const { getIssRadiation } = require('./services/radlab');
const { startScheduler } = require('./services/healthMonitor');
const authRoutes = require('./routes/authRoutes');
const astronautRoutes = require('./routes/astronautRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1); // correct client IP behind Render / Railway / Nginx
app.use(cors({ origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : true }));
app.use(express.json({ limit: '50kb' }));

// ---------- API ----------
app.get('/api/status', (req, res) => {
  res.json({ success: true, service: 'astronaut-health-monitor', mission: missionInfo.missionId, time: new Date().toISOString() });
});
app.get('/api/nasa-references', (req, res) => {
  res.json({ success: true, nasaDatasets: nasaReferences });
});
app.get('/api/nasa-radlab', async (req, res) => {
  res.json({ success: true, radlab: await getIssRadiation() });
});
app.use('/api/auth', authRoutes);
app.use('/api/astronaut', astronautRoutes);

app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'Unknown API route.' }));

// ---------- Serve the React build (one URL for the whole app) ----------
// After `npm run build` in /client, this server also hosts the website, so you
// only need to deploy ONE service and share ONE public link.
const clientBuild = path.join(__dirname, '..', 'client', 'build');
if (fs.existsSync(path.join(clientBuild, 'index.html'))) {
  app.use(express.static(clientBuild));
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(clientBuild, 'index.html')));
}

// ---------- Error handler (bad JSON, etc.) ----------
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'Invalid JSON body.' });
  console.error(err);
  res.status(500).json({ success: false, message: 'Server error.' });
});

store.init()
  .then(() => {
    startScheduler();
    app.listen(PORT, () => {
      console.log('==================================================');
      console.log(`Astronaut Health Monitor running on port ${PORT}`);
      console.log(process.env.EMAIL_USER && process.env.EMAIL_PASS ? `Emails are sent from ${process.env.EMAIL_USER} (Gmail).` : 'Gmail not configured (EMAIL_PASS empty): emails are printed in THIS terminal.');
      console.log('==================================================');
    });
  })
  .catch((err) => {
    console.error('\nCould not connect to MySQL:', err.message);
    console.error('Start MySQL (XAMPP -> Start MySQL) and check DB_HOST / DB_USER / DB_PASSWORD / DB_NAME in server/.env\n');
    process.exit(1);
  });
