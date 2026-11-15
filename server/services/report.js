// server/services/report.js
// Plain-text health report used for the automatic alert "emails" (terminal).
function buildReport(crew, evaluation) {
  const lines = [
    `Health report for ${crew.name} (${crew.role})`,
    `Generated: ${new Date().toISOString()}`,
    `Overall status: ${evaluation.overallStatus}   Health score: ${evaluation.score}/100`,
    '',
    'Findings and recommended actions:'
  ];
  evaluation.alerts.forEach((a) => {
    lines.push(`- [${a.severity}] ${a.title}`);
    lines.push(`    ${a.finding}`);
    lines.push(`    Action: ${a.actionProtocol}`);
  });
  lines.push('', 'Educational prototype with simulated data. Not medical advice.');
  return lines.join('\n');
}
module.exports = { buildReport };
