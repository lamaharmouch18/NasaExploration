// client/src/components/Extras.jsx
// NASA-recommended features: body map, routine reminders, gamification, mission environment,
// indicator trends and the report download card.
import { useMemo, useState } from 'react';
import { api, downloadFile } from '../api';
import { downloadReportImage } from '../reportImage';
import { Award, BellRing, Clock, Download, Flame, Image, Star, Trophy } from '../icons';
import { STATUS, Spinner, btnGhost, btnPrimary, inputCls } from '../ui';

const RANK = { NOMINAL: 0, ADVISORY: 1, WARNING: 2, CRITICAL: 3 };
const worst = (list) => list.reduce((w, s) => (RANK[s] > RANK[w] ? s : w), 'NOMINAL');

// ---------- interactive body map ----------
const REGIONS = {
  head: {
    label: 'Head and brain', metrics: ['isolationStressScore', 'sleepHoursLast24h', 'sleepQualityPercent', 'fatigueLevel'],
    functions: 'Controls thinking, mood, reaction time and sleep. It is where fatigue, stress and CO2 headaches show up first.',
    insight: 'Protect your sleep and talk about stress early. Headaches can be a sign of high cabin CO2.'
  },
  lungs: {
    label: 'Lungs', metrics: ['spO2Percent', 'cabinCo2Ppm', 'cabinPressureKPa'],
    functions: 'Bring oxygen into the blood and remove CO2. They depend on the cabin air being at the right pressure and clean.',
    insight: 'Low SpO2 or rising CO2 means check the cabin air, scrubbers and your breathing first.'
  },
  heart: {
    label: 'Heart and blood vessels', metrics: ['heartRateBpm', 'bloodPressureSys', 'bloodPressureDia'],
    functions: 'Pump blood to the whole body. In microgravity body fluids move toward the head and the heart works differently.',
    insight: 'Measure at rest and compare with your own baseline. Long periods without gravity can weaken the heart muscle.'
  },
  body: {
    label: 'Whole body (temperature and radiation)', metrics: ['coreBodyTempC', 'dailyRadiationRateMSv', 'accumulatedRadiationMSv'],
    functions: 'Temperature shows infection or heat stress. Space radiation passes through the whole body and damages cells.',
    insight: 'Spend rest time in the best-shielded area and follow the radiation limits (600 mSv career dose).'
  },
  legs: {
    label: 'Muscles and bones', metrics: [],
    functions: 'Without gravity, bones lose about 1% of density per month and muscles shrink if you do not train.',
    insight: 'Do your daily resistance and aerobic exercise. Log back, muscle or bone pain in the symptoms panel.'
  }
};

export function BodyMap({ metrics }) {
  const [sel, setSel] = useState('heart');
  const byKey = useMemo(() => Object.fromEntries(metrics.map((m) => [m.key, m])), [metrics]);
  const statusOf = (id) => worst(REGIONS[id].metrics.map((k) => byKey[k]?.status || 'NOMINAL'));
  const region = REGIONS[sel];
  const regionMetrics = region.metrics.map((k) => byKey[k]).filter(Boolean);
  const st = STATUS[statusOf(sel)];

  const fill = (id) => STATUS[statusOf(id)].hex;
  const shape = (id) => ({
    fill: fill(id), fillOpacity: sel === id ? 0.95 : 0.55, stroke: sel === id ? '#ffffff' : fill(id), strokeWidth: sel === id ? 2.5 : 1.2,
    className: 'cursor-pointer transition-all', onClick: () => setSel(id), tabIndex: 0,
    onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(id); } },
    role: 'button', 'aria-label': `${REGIONS[id].label}: ${STATUS[statusOf(id)].label}`
  });

  return (
    <div className="grid gap-4 sm:grid-cols-[210px_minmax(0,1fr)]">
      <div className="mx-auto w-[210px]">
        <svg viewBox="0 0 200 400" className="h-auto w-full" aria-label="Clickable human body map">
          {/* base silhouette */}
          <g fill="#18234a" stroke="#26335f" strokeWidth="1.5">
            <rect x="88" y="62" width="24" height="22" rx="8" />
            <path d="M62 86 Q100 74 138 86 L148 190 Q100 205 52 190 Z" />
            <path d="M58 90 L30 190 L44 196 L68 120 Z" />
            <path d="M142 90 L170 190 L156 196 L132 120 Z" />
          </g>
          {/* legs: muscles and bones */}
          <g {...shape('legs')}>
            <path d="M58 196 L96 200 L92 380 L66 380 Z" />
            <path d="M142 196 L104 200 L108 380 L134 380 Z" />
          </g>
          {/* whole body outline strip (torso sides) */}
          <path d="M62 86 Q100 74 138 86 L148 190 Q100 205 52 190 Z" fill="none" {...shape('body')} fillOpacity={0} />
          <g {...shape('head')}><ellipse cx="100" cy="38" rx="27" ry="31" /></g>
          <g {...shape('lungs')}>
            <path d="M66 100 Q88 94 94 108 L94 150 Q70 156 62 140 Z" />
            <path d="M134 100 Q112 94 106 108 L106 150 Q130 156 138 140 Z" />
          </g>
          <g {...shape('heart')}><path d="M100 128 C86 114 80 134 100 158 C120 134 114 114 100 128 Z" transform="translate(0,6)" /></g>
        </svg>
        <p className="mt-1 text-center text-xs text-muted">Tap a body part</p>
      </div>

      <div className="grid content-start gap-3">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(REGIONS).map(([id, r]) => {
            const s = STATUS[statusOf(id)];
            return (
              <button key={id} type="button" onClick={() => setSel(id)} aria-pressed={sel === id}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition hover:border-accent ${sel === id ? 'border-accent bg-panel2' : 'border-line bg-bg2'}`}>
                <s.Icon className={`h-3.5 w-3.5 ${s.text}`} aria-hidden="true" />{r.label.split(' (')[0]}
              </button>
            );
          })}
        </div>
        <div className={`rounded-xl border border-l-[5px] border-line bg-bg2 p-4 ${st.borderL}`}>
          <h4 className="flex flex-wrap items-center gap-2 text-lg font-bold">
            {region.label}
            <span className={`inline-flex items-center gap-1 text-sm ${st.text}`}><st.Icon className="h-4 w-4" aria-hidden="true" />{st.label}</span>
          </h4>
          <p className="mt-1 text-sm text-muted"><b className="text-ink">What it does:</b> {region.functions}</p>
          {regionMetrics.length > 0 ? (
            <ul className="mt-3 grid gap-1.5 text-sm">
              {regionMetrics.map((m) => {
                const ms = STATUS[m.status];
                return (
                  <li key={m.key} className="flex items-center justify-between gap-2 border-b border-line pb-1">
                    <span>{m.label}</span>
                    <span className={`inline-flex items-center gap-1.5 font-semibold ${ms.text}`}>
                      {typeof m.value === 'number' ? m.value.toLocaleString() : m.value} {m.unit}<ms.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No sensor value for this area. Watch the symptoms panel and keep to your exercise plan.</p>
          )}
          <p className="mt-3 text-sm"><b>Insight:</b> {region.insight}</p>
        </div>
      </div>
    </div>
  );
}

// ---------- routine reminders ----------
function ago(hours) {
  if (hours === null) return 'never measured';
  if (hours < 1) return 'less than 1 hour ago';
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

export function RemindersPanel({ reminders }) {
  return (
    <ul className="grid list-none gap-2.5 p-0">
      {reminders.map((r) => {
        const s = STATUS[r.due ? (r.overdue || r.lastAt === null ? 'WARNING' : 'ADVISORY') : 'NOMINAL'];
        return (
          <li key={r.group} className={`flex items-start gap-3 rounded-xl border border-l-[5px] border-line bg-bg2 px-3.5 py-2.5 ${s.borderL}`}>
            {r.due ? <BellRing className={`mt-0.5 h-5 w-5 flex-none ${s.text}`} aria-hidden="true" /> : <Clock className="mt-0.5 h-5 w-5 flex-none text-nominal" aria-hidden="true" />}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{r.title}<span className={`ml-2 text-xs font-bold ${s.text}`}>{r.due ? 'DUE NOW' : 'Done'}</span></p>
              <p className="text-sm text-muted">{r.what} Every {r.everyHours} h. Last: {ago(r.ageHours)}.</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ---------- gamification ----------
export function GamificationPanel({ game }) {
  return (
    <div className="grid gap-3.5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid h-16 w-16 flex-none place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent2 text-[#06101f]">
          <span className="text-center leading-none"><span className="block text-[10px] font-bold uppercase">Level</span><span className="text-2xl font-extrabold">{game.level}</span></span>
        </div>
        <div className="min-w-[160px] flex-1">
          <p className="flex items-center gap-2 text-sm"><Star className="h-4 w-4 text-advisory" aria-hidden="true" /><b>{game.xp} XP</b><span className="text-muted">· {100 - game.levelProgress} XP to level {game.level + 1}</span></p>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-bg2" role="progressbar" aria-valuenow={game.levelProgress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-all" style={{ width: `${game.levelProgress}%` }} />
          </div>
        </div>
        <p className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${game.streak ? 'border-warning text-warning' : 'border-line text-muted'}`}>
          <Flame className="h-4 w-4" aria-hidden="true" />{game.streak}-day streak
        </p>
      </div>
      <ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2 p-0">
        {game.badges.map((b) => (
          <li key={b.id} title={b.description} className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm ${b.earned ? 'border-nominal/60 bg-nominal/10' : 'border-line bg-bg2 opacity-60'}`}>
            {b.earned ? <Trophy className="h-4 w-4 flex-none text-advisory" aria-hidden="true" /> : <Award className="h-4 w-4 flex-none text-muted" aria-hidden="true" />}
            <span><span className="block font-semibold leading-tight">{b.label}</span><span className="text-[11px] leading-tight text-muted">{b.description}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- mission environment ----------
export function EnvironmentPanel({ environment, environments, onChanged, onError }) {
  const [busy, setBusy] = useState('');
  async function pick(key) {
    if (key === environment.key) return;
    setBusy(key);
    try {
      const res = await api('/astronaut/environment', { method: 'PUT', body: { environment: key } });
      onChanged(res.environment, res.message);
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy('');
    }
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Mission environment">
        {environments.map((e) => (
          <button key={e.key} type="button" aria-pressed={e.key === environment.key} disabled={Boolean(busy)} onClick={() => pick(e.key)}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition hover:border-accent disabled:opacity-60 ${e.key === environment.key ? 'border-accent bg-panel2 font-semibold' : 'border-line bg-bg2'}`}>
            {busy === e.key && <Spinner className="h-3.5 w-3.5" />}{e.label}
          </button>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-line bg-bg2 p-4 text-sm">
        <p className="font-semibold">{environment.vessel}</p>
        <p className="text-muted">{environment.gravity}. {environment.summary}</p>
        <ul className="mt-2 grid list-disc gap-1 pl-5">{environment.tips.map((t) => <li key={t}>{t}</li>)}</ul>
        <p className="mt-2 text-xs text-muted">Health limits stay the same in every environment (NASA-STD-3001). What changes is the context and your tips.</p>
      </div>
    </div>
  );
}

// ---------- trend chart for one indicator ----------
export function IndicatorTrend({ metrics, history }) {
  const numeric = metrics.filter((m) => typeof m.value === 'number');
  const [key, setKey] = useState(numeric[0]?.key || '');
  const metric = numeric.find((m) => m.key === key) || numeric[0];
  if (!metric) return null;
  const pts = history.map((h) => ({ at: h.at, v: h.telemetry?.[metric.group]?.[metric.key] })).filter((p) => typeof p.v === 'number');

  const w = 700, h = 200, left = 46, right = 12, top = 12, bottom = 26;
  let body;
  if (pts.length < 2) {
    body = <p className="py-8 text-center text-muted">The trend appears after at least two saved readings.</p>;
  } else {
    const min = Math.min(...pts.map((p) => p.v)), max = Math.max(...pts.map((p) => p.v));
    const span = max - min || 1;
    const x = (i) => left + (i / (pts.length - 1)) * (w - left - right);
    const y = (v) => top + (1 - (v - min) / span) * (h - top - bottom);
    const line = pts.map((p, i) => `${x(i)},${y(p.v)}`).join(' ');
    const color = STATUS[metric.status].hex;
    body = (
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label={`${metric.label} over time`}>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={left} x2={w - right} y1={top + t * (h - top - bottom)} y2={top + t * (h - top - bottom)} stroke="#26335f" strokeDasharray="3 4" />
            <text x={left - 6} y={top + t * (h - top - bottom) + 4} textAnchor="end" className="fill-muted text-[10px]">{(max - t * span).toFixed(span < 10 ? 1 : 0)}</text>
          </g>
        ))}
        <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={p.at + i} cx={x(i)} cy={y(p.v)} r="4.5" fill={color} stroke="#131c3a" strokeWidth="1.5">
            <title>{`${new Date(p.at).toLocaleString()}: ${p.v} ${metric.unit}`}</title>
          </circle>
        ))}
        <text x={left} y={h - 6} className="fill-muted text-[10px]">{new Date(pts[0].at).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</text>
        <text x={w - right} y={h - 6} textAnchor="end" className="fill-muted text-[10px]">{new Date(pts[pts.length - 1].at).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</text>
      </svg>
    );
  }
  return (
    <div>
      <label className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Indicator</span>
        <select className={`${inputCls} !w-auto`} value={metric.key} onChange={(e) => setKey(e.target.value)}>
          {numeric.map((m) => <option key={m.key} value={m.key}>{m.label} ({m.unit})</option>)}
        </select>
        <span className="text-muted">Normal: {metric.normal}</span>
      </label>
      {body}
    </div>
  );
}

// ---------- report download ----------
export function ReportButtons({ data, onError, highlight = false }) {
  const [busy, setBusy] = useState(false);
  async function pdf() {
    setBusy(true);
    try { await downloadFile('/astronaut/report.pdf', 'health_report.pdf'); } catch (err) { onError(err.message); } finally { setBusy(false); }
  }
  const image = () => {
    try { downloadReportImage({ crew: data.crew, evaluation: data.evaluation, environment: data.environment }); } catch (err) { onError('Could not create the image.'); }
  };
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className={highlight ? btnPrimary : btnGhost} onClick={pdf} disabled={busy}>
        {busy ? <Spinner /> : <Download className="h-4 w-4" aria-hidden="true" />}Report (PDF)
      </button>
      <button type="button" className={btnGhost} onClick={image}><Image className="h-4 w-4" aria-hidden="true" />Report (image)</button>
    </div>
  );
}

// ---------- real NASA data: ISS radiation from OSDR RadLab ----------
export function RadlabPanel({ radlab, dailyRadiation }) {
  if (!radlab) return <p className="text-sm text-muted">Loading NASA RadLab data…</p>;
  if (!radlab.available) {
    return (
      <p className="text-sm text-muted">
        NASA RadLab is not reachable right now, so the live ISS radiation data cannot be shown.{' '}
        <a className="text-accent underline" href={radlab.sourceUrl} target="_blank" rel="noopener noreferrer">Open RadLab</a>
      </p>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-line bg-bg2 p-4">
        <p className="text-xs uppercase tracking-wider text-muted">Measured on the ISS</p>
        <p className="mt-1 text-2xl font-bold">{radlab.meanMicroGrayPerHour} <span className="text-sm font-normal text-muted">µGy/hour</span></p>
        <p className="text-xs text-muted">mean absorbed dose rate, {radlab.detector}, {radlab.day} ({radlab.samples} readings)</p>
      </div>
      <div className="rounded-xl border border-line bg-bg2 p-4">
        <p className="text-xs uppercase tracking-wider text-muted">Same value per day</p>
        <p className="mt-1 text-2xl font-bold">{radlab.meanMilliGrayPerDay} <span className="text-sm font-normal text-muted">mGy/day</span></p>
        <p className="text-xs text-muted">highest single reading: {radlab.maxMicroGrayPerHour} µGy/hour</p>
      </div>
      <div className="rounded-xl border border-line bg-bg2 p-4">
        <p className="text-xs uppercase tracking-wider text-muted">Your simulated reading</p>
        <p className="mt-1 text-2xl font-bold">{dailyRadiation} <span className="text-sm font-normal text-muted">mSv/day</span></p>
        <p className="text-xs text-muted">Different units (dose equivalent vs absorbed dose), shown for context only.</p>
      </div>
      <p className="text-xs text-muted sm:col-span-3">
        Source: <a className="text-accent underline" href={radlab.sourceUrl} target="_blank" rel="noopener noreferrer">NASA Open Science Data Repository, RadLab</a>, real measurements loaded live through its data API.
      </p>
    </div>
  );
}
