// server/services/mailer.js
// Sends REAL emails through Gmail (SMTP) when EMAIL_USER and EMAIL_PASS are set in .env.
// If they are missing, or Gmail refuses, the email is printed in the terminal instead,
// so the app never breaks (and reset codes can still be read there).
const nodemailer = require('nodemailer');

let transporter = null;
const configured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: String(process.env.EMAIL_PASS).replace(/\s+/g, '') }
    });
  }
  return transporter;
}

function printToTerminal(to, subject, text, why) {
  const line = '='.repeat(64);
  console.log(`\n${line}\n  EMAIL printed here (${why})\n  To:      ${to}\n  Subject: ${subject}\n${line}\n${text}\n${line}\n`);
}

async function sendEmail(to, subject, text) {
  if (!configured()) {
    printToTerminal(to, subject, text, 'Gmail not configured: set EMAIL_USER and EMAIL_PASS in .env');
    return { delivered: false, mode: 'terminal' };
  }
  try {
    await getTransporter().sendMail({
      from: `"Astronaut Health Monitor" <${process.env.EMAIL_USER}>`,
      to, subject, text
    });
    console.log(`[EMAIL] sent to ${to}: ${subject}`);
    return { delivered: true, mode: 'smtp' };
  } catch (err) {
    printToTerminal(to, subject, text, `Gmail error: ${err.message}`);
    return { delivered: false, mode: 'smtp-error' };
  }
}

module.exports = { sendEmail, smtpConfigured: configured };
