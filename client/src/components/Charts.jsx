// client/src/components/Charts.jsx
// Small dependency-free SVG charts.
import { STATUS } from '../ui';

export function ScoreRing({ score, status }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  return (
    <svg className="h-[118px] w-[118px] flex-none" viewBox="0 0 130 130" role="img" aria-label={`Health score ${score} out of 100, status ${STATUS[status].label}`}>
      <circle cx="65" cy="65" r={r} fill="none" stroke="#26335f" strokeWidth="11" />
      <circle
        cx="65" cy="65" r={r} fill="none" stroke={STATUS[status].hex} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 65 65)"
        style={{ transition: 'stroke-dasharray .6s ease' }}
      />
      <text x="65" y="63" textAnchor="middle" className="fill-ink text-[30px] font-bold">{score}</text>
      <text x="65" y="82" textAnchor="middle" className="fill-muted text-[10px]">of 100</text>
    </svg>
  );
}

export function Sparkline({ values, color = '#4cc9f0' }) {
  const nums = (values || []).filter((v) => typeof v === 'number');
  if (nums.length < 2) return <div className="flex h-[34px] items-center text-[11px] text-muted">Trend appears after 2 readings</div>;
  const w = 120, h = 34, pad = 3;
  const min = Math.min(...nums), max = Math.max(...nums);
  const span = max - min || 1;
  const pts = nums.map((v, i) => [pad + (i / (nums.length - 1)) * (w - pad * 2), h - pad - ((v - min) / span) * (h - pad * 2)]);
  const last = pts[pts.length - 1];
  return (
    <svg className="h-[34px] w-full" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}

export function HistoryChart({ history }) {
  if (!history || history.length < 2) {
    return <p className="text-muted">The health-score trend appears after at least two saved readings. Try a scenario below.</p>;
  }
  const w = 640, h = 190, left = 34, right = 10, top = 10, bottom = 24;
  const x = (i) => left + (i / (history.length - 1)) * (w - left - right);
  const y = (s) => top + (1 - s / 100) * (h - top - bottom);
  const line = history.map((p, i) => `${x(i)},${y(p.score)}`).join(' ');
  const area = `${left},${y(0)} ${line} ${x(history.length - 1)},${y(0)}`;
  const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full min-w-[420px]" role="img" aria-label="Health score over time">
        {[0, 25, 50, 75, 100].map((t) => (
          <g key={t}>
            <line x1={left} x2={w - right} y1={y(t)} y2={y(t)} stroke="#26335f" strokeDasharray="3 4" />
            <text x={left - 6} y={y(t) + 4} textAnchor="end" className="fill-muted text-[10px]">{t}</text>
          </g>
        ))}
        <polygon points={area} fill="#4cc9f0" opacity="0.12" />
        <polyline points={line} fill="none" stroke="#4cc9f0" strokeWidth="2.5" strokeLinejoin="round" />
        {history.map((p, i) => (
          <circle key={p.at + i} cx={x(i)} cy={y(p.score)} r="4.5" fill={STATUS[p.overallStatus].hex} stroke="#131c3a" strokeWidth="1.5">
            <title>{`${new Date(p.at).toLocaleString()} - score ${p.score} (${STATUS[p.overallStatus].label})`}</title>
          </circle>
        ))}
        <text x={left} y={h - 6} className="fill-muted text-[10px]">{time(history[0].at)}</text>
        <text x={w - right} y={h - 6} textAnchor="end" className="fill-muted text-[10px]">{time(history[history.length - 1].at)}</text>
      </svg>
    </div>
  );
}
