# Astronaut Health Monitor
NASA Space Apps Challenge · Tripoli 2026 · *Create Health Monitoring Software for Astronauts on Space Missions*

An astronaut **collects** health indicators (body, habitat, sleep/wellbeing), the app **evaluates** them against
NASA-referenced limits, and shows prioritised, plain-language actions. All data is simulated.
Every astronaut sees **only their own data** (private).

## Features (NASA recommended list)
| NASA feature | Where |
|---|---|
| Interactive body map | Dashboard > Body map (tap head, lungs, heart, whole body, muscles/bones) |
| Colour-coded status | Green / yellow / orange / red everywhere |
| Time-series charts | Health score over time + Indicator trends (pick any indicator) |
| Multi-environment | Mission environment: space station, spacecraft, rover, Moon base, Mars base |
| Routine prompts | Routine checks: vitals 24 h, habitat 12 h, wellbeing 24 h, shows "DUE NOW" |
| Gamification | Daily health challenge: XP, levels, streak, 7 badges |
| Step-by-step guidance | "How to measure and why it matters" on all 13 indicators |
| Health report | After saving readings: download PDF or image |

## Run it on your computer
1. Start **MySQL** (XAMPP > Start *MySQL*; open phpMyAdmin at http://localhost/phpmyadmin).
2. Backend:
```bash
cd server
npm install
cp .env.example .env        # set JWT_SECRET (and DB_* if your MySQL has a password)
npm run dev                 # http://localhost:5000
```
3. Frontend (second terminal):
```bash
cd client
npm install
npm start                   # http://localhost:3000
```

## Database (MySQL + phpMyAdmin)
The server creates the database `astronaut_health` and its 3 tables automatically on first start.
To do it by hand in phpMyAdmin: **New** > name `astronaut_health`, collation `utf8mb4_unicode_ci` > Create >
select it > **Import** tab > choose `server/database/schema.sql` > Go.
Tables: `astronauts` (accounts + profile), `health_readings` (every saved reading = the history), `symptoms`.
For a hosted database, set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` in the environment variables.

## Emails
Real emails are sent from nasaexploration26@gmail.com when EMAIL_PASS (a Gmail App password) is set in server/.env; otherwise they are printed in the terminal.
- Sign up: a *welcome email* (no activation code).
- Forgot password: a 6-digit reset code by email.
- Health alerts (WARNING/CRITICAL) are printed there too.


## One public link for the submission
```bash
cd client && npm install && npm run build      # creates client/build
cd ../server && npm install && npm start       # the server also hosts the website
```
Deploy the project on a host that runs Node and has MySQL. Settings:
- Build command: `npm install --prefix client && npm run build --prefix client && npm install --prefix server`
- Start command: `npm start --prefix server`
- Environment variables: `NODE_ENV=production`, `JWT_SECRET=<long random string>`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
Judges create an account (no code needed). Test the link in a private window.

## Privacy
Every API route uses the astronaut id from the login token, never from the request, so nobody can read or change
another astronaut's data. Passwords and reset codes are stored hashed.

## NASA sources
- NASA-STD-3001 Vol. 1 Rev B / OCHMO-TB-020: 600 mSv career radiation limit, GCR limit 1.3 mSv/day
- NASA NTRS 20150019624 and 20100036637: ISS CO2 levels, 3.0 mmHg operational limit, 5.3 mmHg SMAC
- NASA LSDA, NASA HRP Human Research Roadmap, NASA GeneLab

## Use of AI
Disclose where AI helped (code review/rewrite, frontend generation, research of NASA limits) in the project description.
Parts of this code were written with the help of AI (Claude by Anthropic).