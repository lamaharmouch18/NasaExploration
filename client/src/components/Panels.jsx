// client/src/components/Panels.jsx
import { useState } from 'react';
import { api } from '../api';
import { Sparkline } from './Charts';
import { ExternalLink, Save, Send, TriangleAlert } from '../icons';
import {
  BASIS_CLS, STATUS, Spinner, btnGhost, btnPrimary, fieldsetCls, inputCls, labelCls, legendCls
} from '../ui';

function StatusChip({ status }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-px text-xs font-bold ${s.border} ${s.text}`}>
      <s.Icon className="h-3.5 w-3.5" aria-hidden="true" />{s.label}
    </span>
  );
}

// ---------- one indicator ----------
export function MetricCard({ metric, history, guide }) {
  const s = STATUS[metric.status];
  const values = (history || []).map((h) => h.telemetry?.[metric.group]?.[metric.key]);
  const isNum = typeof metric.value === 'number';
  const shown = isNum ? (Number.isInteger(metric.value) ? metric.value.toLocaleString() : metric.value.toFixed(1)) : metric.value;
  return (
    <article className={`grid gap-1.5 rounded-xl border border-t-[3px] border-line bg-bg2 p-3 ${s.borderT}`}>
      <header className="flex items-start justify-between gap-1.5">
        <h4 className="text-[13px] font-semibold text-muted">{metric.label}</h4>
        <StatusChip status={metric.status} />
      </header>
      <p className="text-[1.7rem] font-bold leading-tight">
        {shown}
        <span className="text-sm font-medium text-muted"> {metric.unit}</span>
      </p>
      <Sparkline values={values} color={s.hex} />
      <footer className="flex items-center justify-between gap-1.5 text-xs text-muted">
        <span>Normal: {metric.normal}</span>
        <span className={`cursor-help rounded border px-1.5 text-[10px] font-bold tracking-wide ${BASIS_CLS[metric.basis]}`} title={metric.source}>
          {metric.basis}
        </span>
      </footer>
      {guide && (
        <details className="mt-1 text-sm">
          <summary className="cursor-pointer text-accent">How to measure and why it matters</summary>
          <ol className="mt-1.5 list-decimal pl-5 text-muted">{guide.how.map((h) => <li key={h}>{h}</li>)}</ol>
          <p className="mt-1.5 text-muted"><b className="text-ink">Why:</b> {guide.why}</p>
          <p className="mt-1 text-muted"><b className="text-ink">Risk:</b> {guide.risk}</p>
        </details>
      )}
    </article>
  );
}

// ---------- action center ----------
export function AlertList({ alerts }) {
  return (
    <ul className="m-0 grid list-none gap-2.5 p-0">
      {alerts.map((a) => (
        <li key={a.id} className={`grid gap-1.5 rounded-xl border border-l-[5px] border-line bg-bg2 px-4 py-3 ${STATUS[a.severity].borderL}`}>
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusChip status={a.severity} />
            <strong>{a.title}</strong>
            <span className="text-sm text-muted sm:ml-auto">{a.category}</span>
          </div>
          <p className="text-[15px] text-muted">{a.finding}</p>
          <p><b>What to do:</b> {a.actionProtocol}</p>
          {a.escalate && <p className="flex items-center gap-1.5 text-sm font-bold text-critical"><TriangleAlert className="h-4 w-4" aria-hidden="true" />Contact the Flight Surgeon / Mission Control now.</p>}
          {a.source && a.metric && <p className="text-xs text-muted">Basis ({a.basis}): {a.source}</p>}
        </li>
      ))}
    </ul>
  );
}

// ---------- scenarios ----------
export function ScenarioBar({ scenarios, disabled, onApplied, onError }) {
  const [busy, setBusy] = useState('');
  async function apply(key) {
    setBusy(key);
    try {
      onApplied(await api('/astronaut/scenario', { method: 'POST', body: { scenario: key } }));
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy('');
    }
  }
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {scenarios.map((s) => (
        <button key={s.key} className={btnGhost} disabled={disabled || Boolean(busy)} onClick={() => apply(s.key)} title={s.description}>
          {busy === s.key && <Spinner />}{busy === s.key ? 'Applying…' : s.label}
        </button>
      ))}
    </div>
  );
}

// ---------- log readings ----------
const FIELDS = {
  vitals: [
    ['heartRateBpm', 'Heart rate', 'bpm'],
    ['bloodPressureSys', 'Systolic BP', 'mmHg'],
    ['bloodPressureDia', 'Diastolic BP', 'mmHg'],
    ['spO2Percent', 'Blood oxygen (SpO2)', '%'],
    ['coreBodyTempC', 'Core temperature', '°C']
  ],
  environment: [
    ['cabinCo2Ppm', 'Cabin CO2', 'ppm'],
    ['cabinPressureKPa', 'Cabin pressure', 'kPa'],
    ['dailyRadiationRateMSv', 'Radiation rate', 'mSv/day'],
    ['accumulatedRadiationMSv', 'Mission dose', 'mSv']
  ],
  wellbeing: [
    ['sleepHoursLast24h', 'Sleep last 24 h', 'h'],
    ['sleepQualityPercent', 'Sleep quality', '%'],
    ['isolationStressScore', 'Isolation / stress (1-10)', '']
  ]
};
const GROUP_TITLES = { vitals: 'Body vitals', environment: 'Habitat sensors', wellbeing: 'Sleep & wellbeing' };
const FIELD_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-3.5';

export function ReadingsForm({ telemetry, disabled, onSaved, onError }) {
  const [form, setForm] = useState({});
  const [fatigue, setFatigue] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (group, key, value) => setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));

  async function submit(e) {
    e.preventDefault();
    const body = {};
    Object.entries(form).forEach(([group, values]) => {
      const filled = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ''));
      if (Object.keys(filled).length) body[group] = filled;
    });
    if (fatigue) body.wellbeing = { ...(body.wellbeing || {}), fatigueLevel: fatigue };

    setSaving(true);
    try {
      const res = await api('/astronaut/readings', { method: 'POST', body });
      setForm({});
      setFatigue('');
      onSaved(res);
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <p className="mb-3 text-sm text-muted">Fill in only what you measured (each box has a how-to under its indicator card). Empty boxes keep the previous value. A downloadable report is created when you save.</p>
      {Object.entries(FIELDS).map(([group, fields]) => (
        <fieldset key={group} className={fieldsetCls} disabled={disabled || saving}>
          <legend className={legendCls}>{GROUP_TITLES[group]}</legend>
          <div className={FIELD_GRID}>
            {fields.map(([key, label, unit]) => (
              <label key={key} className={labelCls}>
                <span>{label}{unit && <em className="text-xs not-italic text-muted"> ({unit})</em>}</span>
                <input
                  className={inputCls} type="number" step="any" inputMode="decimal"
                  placeholder={String(telemetry?.[group]?.[key] ?? '')}
                  value={form[group]?.[key] ?? ''}
                  onChange={(e) => set(group, key, e.target.value)}
                />
              </label>
            ))}
            {group === 'wellbeing' && (
              <label className={labelCls}>
                <span>Fatigue level</span>
                <select className={inputCls} value={fatigue} onChange={(e) => setFatigue(e.target.value)}>
                  <option value="">Keep ({telemetry?.wellbeing?.fatigueLevel})</option>
                  <option value="LOW">Low</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="HIGH">High</option>
                </select>
              </label>
            )}
          </div>
        </fieldset>
      ))}
      <button className={btnPrimary} type="submit" disabled={disabled || saving}>
        {saving ? <Spinner /> : <Save className="h-4 w-4" aria-hidden="true" />}{saving ? 'Saving…' : 'Save & evaluate'}
      </button>
    </form>
  );
}

// ---------- symptoms ----------
export function SymptomLogger({ options, symptoms, disabled, onLogged, onError }) {
  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState(2);
  const [note, setNote] = useState('');
  const [advice, setAdvice] = useState(null);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!symptom) return onError('Please choose a symptom first.');
    setSaving(true);
    try {
      const res = await api('/astronaut/symptom', { method: 'POST', body: { symptom, severity, note } });
      setAdvice({ text: res.advice, urgent: res.urgent });
      setNote('');
      onLogged();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <form onSubmit={submit}>
        <fieldset className={fieldsetCls} disabled={disabled || saving}>
          <legend className={legendCls}>Report how you feel</legend>
          <label className={labelCls}>
            <span>Symptom</span>
            <select className={inputCls} value={symptom} onChange={(e) => setSymptom(e.target.value)}>
              <option value="">Choose…</option>
              {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </label>
          <label className={labelCls}>
            <span>Severity: {severity} / 5</span>
            <input className="w-full accent-accent" type="range" min="1" max="5" value={severity} onChange={(e) => setSeverity(Number(e.target.value))} />
          </label>
          <label className={labelCls}>
            <span>Note (optional)</span>
            <input className={inputCls} type="text" maxLength="300" value={note} onChange={(e) => setNote(e.target.value)} placeholder="When did it start?" />
          </label>
          <button className={`${btnPrimary} mb-3`} type="submit">
            {saving ? <Spinner /> : <Send className="h-4 w-4" aria-hidden="true" />}{saving ? 'Logging…' : 'Log symptom'}
          </button>
        </fieldset>
      </form>

      {advice && (
        <div role="status" className={`mt-3 rounded-lg border px-3 py-2.5 text-[15px] ${advice.urgent ? 'border-critical bg-critical/10' : 'border-nominal/40 bg-nominal/10'}`}>
          <b>{advice.urgent ? 'Urgent guidance' : 'Guidance'}:</b> {advice.text}
        </div>
      )}

      {symptoms.length > 0 && (
        <ul className="mt-3.5 grid list-none gap-1.5 p-0 text-sm">
          {symptoms.map((s) => (
            <li key={s.id} className="flex justify-between gap-2.5 border-b border-line pb-1.5">
              <span>{s.label} <em className="not-italic text-muted">({s.severity}/5)</em>{s.note ? ` - ${s.note}` : ''}</span>
              <time className="text-xs text-muted">{new Date(s.at).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- NASA sources ----------
export function SourcesPanel({ references }) {
  return (
    <div>
      <ul className="mb-3.5 grid list-none gap-2.5 p-0">
        {references.map((r) => (
          <li key={r.url}>
            <a className="inline-flex items-start gap-1.5 text-accent hover:underline" href={r.url} target="_blank" rel="noopener noreferrer">{r.name}<ExternalLink className="mt-1 h-3.5 w-3.5 flex-none" aria-hidden="true" /></a>
            <p className="text-xs text-muted">{r.usage}</p>
          </li>
        ))}
      </ul>
      <p className="border-t border-line pt-3 text-xs text-muted">
        Educational prototype built for the NASA Space Apps Challenge. All data is simulated and the
        recommendations are demonstration guidance, not medical advice. Tags on each indicator show where
        its range comes from: <b>NASA</b> = NASA standard or technical report, <b>CLINICAL</b> = standard adult
        reference range, <b>PROTOTYPE</b> = value chosen by this project.
      </p>
    </div>
  );
}
