// client/src/reportImage.js
// Draws the health report on a canvas and saves it as a PNG photo (same content as the PDF).
import { saveBlob } from './api';

const COLORS = { NOMINAL: '#1f9d6b', ADVISORY: '#c99a00', WARNING: '#d9780f', CRITICAL: '#d1344b' };
const LABEL = { NOMINAL: 'Nominal', ADVISORY: 'Advisory', WARNING: 'Warning', CRITICAL: 'Critical' };
const GROUPS = [['vitals', 'Body vitals'], ['environment', 'Habitat and radiation'], ['wellbeing', 'Sleep and wellbeing']];

function wrap(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  String(text).split(' ').forEach((w) => {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
  });
  if (line) lines.push(line);
  return lines;
}

export function downloadReportImage({ crew, evaluation, environment }) {
  const W = 1000;
  const pad = 40;
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = '15px Arial';
  const alertLines = evaluation.alerts.map((a) => wrap(measure, `What to do: ${a.actionProtocol}`, W - pad * 2 - 24));
  const H = 330 + evaluation.metrics.length * 30 + GROUPS.length * 50 + 60 +
    evaluation.alerts.reduce((h, a, i) => h + 78 + alertLines[i].length * 20, 0) + 70;

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#0d1530'; ctx.fillRect(0, 0, W, 100);
  ctx.fillStyle = '#e8edff'; ctx.font = 'bold 30px Arial'; ctx.fillText('Astronaut Health Report', pad, 48);
  ctx.fillStyle = '#9aa8d4'; ctx.font = '14px Arial';
  ctx.fillText(`NASA Space Apps Challenge - Tripoli 2026 - simulated data  |  ${new Date().toLocaleString('en-GB')}`, pad, 76);

  let y = 150;
  ctx.fillStyle = '#14203f'; ctx.font = 'bold 26px Arial'; ctx.fillText(crew.name, pad, y);
  ctx.fillStyle = '#5b6788'; ctx.font = '15px Arial';
  ctx.fillText(`${crew.role}  |  ID ${crew.id}  |  ${environment.label}`, pad, y + 26);

  y += 56;
  const sc = COLORS[evaluation.overallStatus];
  ctx.strokeStyle = '#d5dbec'; ctx.lineWidth = 1.5; ctx.strokeRect(pad, y, W - pad * 2, 80);
  ctx.fillStyle = sc; ctx.fillRect(pad, y, 9, 80);
  ctx.font = 'bold 44px Arial'; ctx.fillText(String(evaluation.score), pad + 30, y + 54);
  ctx.fillStyle = '#5b6788'; ctx.font = '16px Arial'; ctx.fillText('/ 100', pad + 100, y + 54);
  ctx.fillStyle = sc; ctx.font = 'bold 30px Arial'; ctx.fillText(LABEL[evaluation.overallStatus], pad + 230, y + 52);
  y += 120;

  GROUPS.forEach(([g, title]) => {
    ctx.fillStyle = '#1b6fb5'; ctx.font = 'bold 18px Arial'; ctx.fillText(title, pad, y);
    y += 12;
    evaluation.metrics.filter((m) => m.group === g).forEach((m) => {
      y += 28;
      ctx.fillStyle = '#14203f'; ctx.font = '15px Arial'; ctx.fillText(m.label, pad, y);
      ctx.font = 'bold 15px Arial';
      const val = typeof m.value === 'number' ? (Number.isInteger(m.value) ? m.value.toLocaleString('en-US') : m.value.toFixed(1)) : m.value;
      ctx.fillText(`${val} ${m.unit}`.trim(), pad + 300, y);
      ctx.fillStyle = COLORS[m.status]; ctx.beginPath(); ctx.arc(pad + 610, y - 5, 6, 0, Math.PI * 2); ctx.fill();
      ctx.font = 'bold 15px Arial'; ctx.fillText(LABEL[m.status], pad + 624, y);
    });
    y += 36;
  });

  ctx.fillStyle = '#1b6fb5'; ctx.font = 'bold 18px Arial'; ctx.fillText('Findings and what to do', pad, y);
  y += 14;
  evaluation.alerts.forEach((a, i) => {
    const h = 58 + alertLines[i].length * 20;
    ctx.fillStyle = COLORS[a.severity]; ctx.fillRect(pad, y, 5, h);
    ctx.fillStyle = '#14203f'; ctx.font = 'bold 16px Arial'; ctx.fillText(`${a.title}  (${LABEL[a.severity]})`, pad + 16, y + 20);
    ctx.fillStyle = '#5b6788'; ctx.font = '15px Arial'; ctx.fillText(a.finding, pad + 16, y + 42);
    alertLines[i].forEach((l, k) => ctx.fillText(l, pad + 16, y + 64 + k * 20));
    y += h + 20;
  });

  ctx.fillStyle = '#5b6788'; ctx.font = '13px Arial';
  ctx.fillText('Educational prototype with simulated data. Not medical advice.', pad, H - 28);

  c.toBlob((blob) => saveBlob(blob, `health_report_${crew.name.replace(/[^a-z0-9]+/gi, '_')}_${new Date().toISOString().slice(0, 10)}.png`), 'image/png');
}
