// server/services/pdfReport.js
// Builds the downloadable health report (PDF, A4) with pdfkit. Returns a PDFDocument stream.
const PDFDocument = require('pdfkit');

const COLORS = { NOMINAL: '#1f9d6b', ADVISORY: '#c99a00', WARNING: '#d9780f', CRITICAL: '#d1344b' };
const LABEL = { NOMINAL: 'Nominal', ADVISORY: 'Advisory', WARNING: 'Warning', CRITICAL: 'Critical' };
const GROUP_TITLE = { vitals: 'Body vitals', environment: 'Habitat and radiation', wellbeing: 'Sleep and wellbeing' };
const INK = '#14203f', MUTED = '#5b6788', LINE = '#d5dbec', BRAND = '#1b6fb5';

function buildPdf({ crew, evaluation, environment, symptoms, gamification, guides }) {
  const doc = new PDFDocument({ size: 'A4', margin: 44, bufferPages: true, info: { Title: `Health report - ${crew.name}`, Author: 'Astronaut Health Monitor' } });
  const W = doc.page.width - 88; // usable width
  const left = 44;
  const ensure = (h) => { if (doc.y + h > doc.page.height - 60) doc.addPage(); };
  const fmt = (v) => (typeof v === 'number' ? (Number.isInteger(v) ? v.toLocaleString('en-US') : v.toFixed(1)) : String(v));

  // ---- header band ----
  doc.rect(0, 0, doc.page.width, 92).fill('#0d1530');
  doc.fillColor('#e8edff').font('Helvetica-Bold').fontSize(20).text('Astronaut Health Report', left, 28);
  doc.font('Helvetica').fontSize(10).fillColor('#9aa8d4')
    .text('NASA Space Apps Challenge - Tripoli 2026 - simulated data', left, 56)
    .text(`Generated ${new Date().toLocaleString('en-GB')}`, left, 70);
  doc.y = 110;

  // ---- identity ----
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(16).text(crew.name, left, doc.y);
  doc.font('Helvetica').fontSize(10).fillColor(MUTED)
    .text(`${crew.role}  |  ID ${crew.id}  |  ${environment.label} (${environment.gravity})`, left, doc.y + 2);
  doc.moveDown(0.8);

  // ---- overall status box ----
  const sc = COLORS[evaluation.overallStatus];
  const top = doc.y;
  doc.roundedRect(left, top, W, 62, 8).lineWidth(1).stroke(LINE);
  doc.rect(left, top, 7, 62).fill(sc);
  doc.fillColor(sc).font('Helvetica-Bold').fontSize(24).text(`${evaluation.score}`, left + 24, top + 14, { continued: true })
    .fontSize(11).fillColor(MUTED).text(' / 100');
  doc.fillColor(sc).font('Helvetica-Bold').fontSize(18).text(LABEL[evaluation.overallStatus], left + 150, top + 12);
  const counts = { CRITICAL: 0, WARNING: 0, ADVISORY: 0 };
  evaluation.alerts.forEach((a) => { if (counts[a.severity] !== undefined) counts[a.severity] += 1; });
  doc.fillColor(MUTED).font('Helvetica').fontSize(10)
    .text(`${counts.CRITICAL} critical, ${counts.WARNING} warning, ${counts.ADVISORY} advisory`, left + 150, top + 38);
  if (gamification) doc.text(`Level ${gamification.level}  |  ${gamification.streak}-day streak`, left + 330, top + 38, { width: W - 340, align: 'right' });
  doc.y = top + 76;

  // ---- readings by group ----
  ['vitals', 'environment', 'wellbeing'].forEach((g) => {
    ensure(40);
    doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(12).text(GROUP_TITLE[g], left, doc.y);
    doc.moveDown(0.3);
    const cols = [left, left + 210, left + 310, left + 420];
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8.5);
    const hy = doc.y;
    ['INDICATOR', 'VALUE', 'NORMAL', 'STATUS'].forEach((t, i) => doc.text(t, cols[i], hy, { width: 120, lineBreak: false }));
    doc.moveTo(left, hy + 12).lineTo(left + W, hy + 12).lineWidth(0.6).stroke(LINE);
    doc.y = hy + 17;
    evaluation.metrics.filter((m) => m.group === g).forEach((m) => {
      ensure(18);
      const y = doc.y;
      doc.fillColor(INK).font('Helvetica').fontSize(10).text(m.label, cols[0], y, { width: 200, lineBreak: false });
      doc.font('Helvetica-Bold').text(`${fmt(m.value)} ${m.unit}`.trim(), cols[1], y, { width: 95, lineBreak: false });
      doc.font('Helvetica').fillColor(MUTED).text(String(m.normal), cols[2], y, { width: 105, lineBreak: false });
      doc.circle(cols[3] + 4, y + 5, 4).fill(COLORS[m.status]);
      doc.fillColor(COLORS[m.status]).font('Helvetica-Bold').text(LABEL[m.status], cols[3] + 14, y, { width: 90, lineBreak: false });
      doc.y = y + 17;
    });
    doc.moveDown(0.5);
  });

  // ---- findings and actions ----
  ensure(50);
  doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(12).text('Findings and what to do', left, doc.y);
  doc.moveDown(0.4);
  evaluation.alerts.forEach((a) => {
    const text = `${a.finding}\nWhat to do: ${a.actionProtocol}`;
    doc.font('Helvetica').fontSize(9.5);
    const h = doc.heightOfString(text, { width: W - 20 }) + 26;
    ensure(h + 6);
    const y = doc.y;
    doc.rect(left, y, 4, h).fill(COLORS[a.severity]);
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(10.5).text(`${a.title}`, left + 12, y + 2, { continued: true })
      .font('Helvetica').fillColor(COLORS[a.severity]).text(`   ${LABEL[a.severity]}`);
    doc.fillColor(MUTED).font('Helvetica').fontSize(9.5).text(text, left + 12, doc.y + 2, { width: W - 20 });
    if (a.escalate) doc.fillColor(COLORS.CRITICAL).font('Helvetica-Bold').text('Contact the Flight Surgeon / Mission Control now.', left + 12, doc.y + 2);
    doc.y = y + h + 6;
  });

  // ---- environment tips ----
  ensure(80);
  doc.moveDown(0.3);
  doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(12).text(`Tips for your environment: ${environment.label}`, left, doc.y);
  doc.moveDown(0.3);
  environment.tips.forEach((t) => {
    ensure(26);
    doc.fillColor(INK).font('Helvetica').fontSize(9.5).text(`-  ${t}`, left + 6, doc.y, { width: W - 10 });
  });

  // ---- symptoms ----
  if (symptoms && symptoms.length) {
    ensure(60);
    doc.moveDown(0.8);
    doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(12).text('Recent symptoms you reported', left, doc.y);
    doc.moveDown(0.3);
    symptoms.slice(0, 8).forEach((s) => {
      ensure(18);
      doc.fillColor(INK).font('Helvetica').fontSize(9.5)
        .text(`${new Date(s.at).toLocaleString('en-GB')}  -  ${s.label} (${s.severity}/5)${s.note ? ' - ' + s.note : ''}`, left + 6, doc.y, { width: W - 10 });
    });
  }

  // ---- how to measure (educational) ----
  const flagged = evaluation.metrics.filter((m) => m.status !== 'NOMINAL' && guides[m.key]);
  if (flagged.length) {
    ensure(70);
    doc.moveDown(0.8);
    doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(12).text('How to re-measure the flagged indicators', left, doc.y);
    doc.moveDown(0.3);
    flagged.forEach((m) => {
      const g = guides[m.key];
      const body = g.how.map((s, i) => `${i + 1}. ${s}`).join('\n');
      doc.font('Helvetica').fontSize(9.5);
      ensure(doc.heightOfString(body, { width: W - 12 }) + 36);
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text(m.label, left, doc.y);
      doc.fillColor(MUTED).font('Helvetica').fontSize(9.5).text(body, left + 8, doc.y + 1, { width: W - 12 });
      doc.text(`Risk: ${g.risk}`, left + 8, doc.y + 1, { width: W - 12 });
      doc.moveDown(0.5);
    });
  }

  // ---- footer on every page ----
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0; // allow writing in the footer area without adding a page
    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
      .text('Educational prototype with simulated data. Not medical advice. In real operations the Flight Surgeon decides.',
        left, doc.page.height - 40, { width: W, align: 'left', lineBreak: false })
      .text(`Page ${i + 1} of ${range.count}`, left, doc.page.height - 40, { width: W, align: 'right', lineBreak: false });
  }
  doc.end();
  return doc;
}
module.exports = { buildPdf };
